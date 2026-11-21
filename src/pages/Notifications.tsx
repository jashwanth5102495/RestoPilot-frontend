import { useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Bell,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Smartphone,
  QrCode,
  Unlink,
  MessageSquare,
  Sparkles,
} from "lucide-react"

export default function Notifications() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState("")

  // Master Notification Channel
  const [notificationChannel, setNotificationChannel] = useState<'WHATSAPP' | 'TELEGRAM' | 'BOTH'>('WHATSAPP')
  const [enabled, setEnabled] = useState(true)

  // WhatsApp Settings & State
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState("")
  const [whatsappStatus, setWhatsappStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED'>('DISCONNECTED')
  const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null)
  const [whatsappConnectedNumber, setWhatsappConnectedNumber] = useState<string | null>(null)
  const [isRequestingQr, setIsRequestingQr] = useState(false)
  const [isDisconnectingWA, setIsDisconnectingWA] = useState(false)
  const [testingWAShift1, setTestingWAShift1] = useState(false)
  const [testingWAShift2, setTestingWAShift2] = useState(false)

  // Telegram Settings & State
  const [chatId, setChatId] = useState("")
  const [testingShift1, setTestingShift1] = useState(false)
  const [testingShift2, setTestingShift2] = useState(false)

  // Shift 1 Configuration (10:00 AM - 11:30 PM, sent at 11:30 PM)
  const [shift1Enabled, setShift1Enabled] = useState(true)
  const [shift1StartTime, setShift1StartTime] = useState("10:00")
  const [shift1EndTime, setShift1EndTime] = useState("23:30")
  const [shift1SendTime, setShift1SendTime] = useState("23:30")

  // Shift 2 Configuration (11:31 PM - 09:59 AM, sent at 10:00 AM)
  const [shift2Enabled, setShift2Enabled] = useState(true)
  const [shift2StartTime, setShift2StartTime] = useState("23:31")
  const [shift2EndTime, setShift2EndTime] = useState("09:59")
  const [shift2SendTime, setShift2SendTime] = useState("10:00")

  const pollingTimerRef = useRef<any>(null)

  const fetchProfileAndWhatsAppStatus = async () => {
    try {
      const res = await api.get('/auth/me')
      const user = res.data.data.user
      const rest = user.restaurant || {}

      const actualRestId = user.restaurantId || rest._id || ""
      setRestaurantId(actualRestId)

      if (rest.notificationSettings) {
        const s = rest.notificationSettings
        setEnabled(s.enabled !== false)
        setNotificationChannel(s.notificationChannel || 'WHATSAPP')
        setChatId(s.telegramChatId || "")

        if (s.whatsappEnabled !== undefined) setWhatsappEnabled(s.whatsappEnabled)
        if (s.whatsappPhoneNumber) setWhatsappPhoneNumber(s.whatsappPhoneNumber)

        if (s.shift1Enabled !== undefined) setShift1Enabled(s.shift1Enabled)
        if (s.shift1StartTime) setShift1StartTime(s.shift1StartTime)
        if (s.shift1EndTime) setShift1EndTime(s.shift1EndTime)
        if (s.shift1SendTime) setShift1SendTime(s.shift1SendTime)
        else if (s.scheduledTime) setShift1SendTime(s.scheduledTime)

        if (s.shift2Enabled !== undefined) setShift2Enabled(s.shift2Enabled)
        if (s.shift2StartTime) setShift2StartTime(s.shift2StartTime)
        if (s.shift2EndTime) setShift2EndTime(s.shift2EndTime)
        if (s.shift2SendTime) setShift2SendTime(s.shift2SendTime)
      }

      // Check WhatsApp Status
      if (actualRestId) {
        await checkWAStatus(actualRestId)
      }
    } catch (error) {
      console.error('Failed to fetch restaurant profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkWAStatus = async (restId = restaurantId) => {
    if (!restId) return
    try {
      const res = await api.get(`/restaurants/${restId}/whatsapp/status`)
      const d = res.data.data
      setWhatsappStatus(d.status || 'DISCONNECTED')
      if (d.qrCode) setWhatsappQrCode(d.qrCode)
      else if (d.status === 'CONNECTED') setWhatsappQrCode(null)
      if (d.connectedNumber) setWhatsappConnectedNumber(d.connectedNumber)
    } catch (err) {
      console.error('Failed to check WhatsApp status:', err)
    }
  }

  useEffect(() => {
    fetchProfileAndWhatsAppStatus()

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
    }
  }, [])

  // Auto-poll WhatsApp status when scanning QR code
  useEffect(() => {
    if (whatsappStatus === 'SCAN_QR' || whatsappStatus === 'CONNECTING') {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
      pollingTimerRef.current = setInterval(() => {
        checkWAStatus()
      }, 3000)
    } else {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current)
        pollingTimerRef.current = null
      }
    }

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
    }
  }, [whatsappStatus, restaurantId])

  const handleRequestWhatsAppQr = async () => {
    if (!restaurantId) return
    setIsRequestingQr(true)
    try {
      const res = await api.post(`/restaurants/${restaurantId}/whatsapp/qr`)
      const d = res.data.data
      setWhatsappStatus(d.status)
      if (d.qrCode) setWhatsappQrCode(d.qrCode)
      toast({
        title: "QR Code Ready",
        description: "Open WhatsApp on your phone and scan the QR code to link your device.",
      })
    } catch (err: any) {
      toast({
        title: "Could not generate QR code",
        description: err.response?.data?.message || "Please check server logs.",
        variant: "destructive"
      })
    } finally {
      setIsRequestingQr(false)
    }
  }

  const handleDisconnectWhatsApp = async () => {
    if (!restaurantId) return
    setIsDisconnectingWA(true)
    try {
      await api.post(`/restaurants/${restaurantId}/whatsapp/disconnect`)
      setWhatsappStatus('DISCONNECTED')
      setWhatsappQrCode(null)
      setWhatsappConnectedNumber(null)
      toast({
        title: "WhatsApp Unlinked",
        description: "The WhatsApp session has been removed.",
      })
    } catch (err: any) {
      toast({
        title: "Failed to disconnect",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDisconnectingWA(false)
    }
  }

  const handleSave = async () => {
    if (!restaurantId) return

    setSaving(true)
    try {
      await api.put(`/restaurants/${restaurantId}`, {
        notificationSettings: {
          enabled,
          notificationChannel,
          whatsappEnabled,
          whatsappPhoneNumber: whatsappPhoneNumber.trim(),
          telegramChatId: chatId.trim(),
          scheduledTime: shift1SendTime, // backward compatibility
          shift1Enabled,
          shift1StartTime,
          shift1EndTime,
          shift1SendTime,
          shift2Enabled,
          shift2StartTime,
          shift2EndTime,
          shift2SendTime,
        }
      })

      toast({
        title: "Settings Saved",
        description: "Shift-wise notification schedule and channels updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update notification settings.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestWhatsApp = async (shift: 'SHIFT_1' | 'SHIFT_2') => {
    if (!restaurantId) return
    const phone = whatsappPhoneNumber.trim()
    if (!phone) {
      toast({
        title: "Phone Number Required",
        description: "Please enter the owner WhatsApp phone number and save.",
        variant: "destructive"
      })
      return
    }

    if (shift === 'SHIFT_1') setTestingWAShift1(true)
    else setTestingWAShift2(true)

    try {
      const res = await api.post(`/restaurants/${restaurantId}/test-whatsapp-report`, {
        shift,
        phone,
      })
      toast({
        title: "WhatsApp Report Sent! 🚀",
        description: res.data?.message || `Check WhatsApp on ${phone} for your shift PDF and drinks stock report.`,
      })
    } catch (err: any) {
      toast({
        title: "Failed to Send WhatsApp Report",
        description: err.response?.data?.message || "Ensure WhatsApp is linked via QR code first.",
        variant: "destructive"
      })
    } finally {
      if (shift === 'SHIFT_1') setTestingWAShift1(false)
      else setTestingWAShift2(false)
    }
  }

  const handleSendTestTelegram = async (shift: 'SHIFT_1' | 'SHIFT_2') => {
    if (!restaurantId || !chatId) {
      toast({
        title: "Telegram Chat ID Required",
        description: "Please enter your Telegram Chat ID first.",
        variant: "destructive"
      })
      return
    }

    if (shift === 'SHIFT_1') setTestingShift1(true)
    else setTestingShift2(true)

    try {
      const res = await api.post(`/restaurants/${restaurantId}/test-telegram-report`, { shift })
      toast({
        title: "Telegram Report Sent! 🚀",
        description: res.data?.message || "Check Telegram for your shift report.",
      })
    } catch (err: any) {
      toast({
        title: "Failed to Send Telegram Report",
        description: err.response?.data?.message || "Make sure you tapped /start in @rest_blu_bot.",
        variant: "destructive"
      })
    } finally {
      if (shift === 'SHIFT_1') setTestingShift1(false)
      else setTestingShift2(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Shift-Wise Automated Notifications
        </h1>
        <p className="text-gray-500">
          Automatically deliver shift sales, orders, and live drinks stock reports to WhatsApp and Telegram.
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
          <p>Loading notification preferences...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Channel Selector Header Card */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Delivery Channel
                  </CardTitle>
                  <CardDescription>
                    Choose how the owner or management receives automated shift reports.
                  </CardDescription>
                </div>
                <Badge variant={enabled ? "default" : "secondary"}>
                  {enabled ? "Active" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                <input
                  type="checkbox"
                  id="enable-master-notifications"
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <Label htmlFor="enable-master-notifications" className="text-base font-semibold cursor-pointer text-gray-800">
                  Enable Automated Shift Reports
                </Label>
              </div>

              {enabled && (
                <div className="pt-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                    Select Notification Channel
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setNotificationChannel('WHATSAPP')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        notificationChannel === 'WHATSAPP'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400 font-bold shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">WhatsApp (Free)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase">Recommended</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotificationChannel('TELEGRAM')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        notificationChannel === 'TELEGRAM'
                          ? 'bg-sky-500/10 border-sky-500 text-sky-800 ring-2 ring-sky-400 font-bold shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Send className="w-5 h-5 text-sky-600" />
                      <span className="text-sm">Telegram Bot</span>
                      <span className="text-[10px] text-gray-400">@rest_blu_bot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotificationChannel('BOTH')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        notificationChannel === 'BOTH'
                          ? 'bg-purple-500/10 border-purple-500 text-purple-800 ring-2 ring-purple-400 font-bold shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span className="text-sm">Both Channels</span>
                      <span className="text-[10px] text-purple-600">WhatsApp + Telegram</span>
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WHATSAPP AUTOMATION CARD */}
          {enabled && (notificationChannel === 'WHATSAPP' || notificationChannel === 'BOTH') && (
            <Card className="border-emerald-500/30 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-950">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                      Free WhatsApp Automation (No Meta Fees)
                    </CardTitle>
                    <CardDescription>
                      Uses open-source WhatsApp Web multi-device connection. Link once with QR code to send shift reports directly to the owner.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {whatsappStatus === 'CONNECTED' && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connected {whatsappConnectedNumber ? `(+${whatsappConnectedNumber})` : ''}
                      </Badge>
                    )}
                    {whatsappStatus === 'SCAN_QR' && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 animate-pulse">
                        Scan QR Code
                      </Badge>
                    )}
                    {whatsappStatus === 'CONNECTING' && (
                      <Badge variant="outline" className="border-sky-500 text-sky-700 bg-sky-50">
                        Connecting...
                      </Badge>
                    )}
                    {whatsappStatus === 'DISCONNECTED' && (
                      <Badge variant="secondary">
                        Not Linked
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* QR Code / Connection Box */}
                {whatsappStatus !== 'CONNECTED' ? (
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 space-y-2">
                      <h4 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-emerald-600" />
                        Step 1: Link WhatsApp Device
                      </h4>
                      <ol className="list-decimal pl-5 space-y-1.5 text-xs md:text-sm text-gray-600">
                        <li>Open WhatsApp on your restaurant or manager phone.</li>
                        <li>Tap <strong>Settings (or ⋮ Three Dots)</strong> $\rightarrow$ <strong>Linked Devices</strong>.</li>
                        <li>Tap <strong>Link a Device</strong> and point your camera at the QR code.</li>
                      </ol>

                      <div className="pt-2">
                        <Button
                          type="button"
                          onClick={handleRequestWhatsAppQr}
                          disabled={isRequestingQr}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          {isRequestingQr ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Generating QR...
                            </>
                          ) : (
                            <>
                              <QrCode className="w-4 h-4 mr-2" />
                              {whatsappQrCode ? 'Refresh QR Code' : 'Generate WhatsApp QR Code'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {whatsappQrCode && (
                      <div className="flex flex-col items-center bg-white p-3 rounded-2xl border-2 border-emerald-400 shadow-md shrink-0">
                        <img
                          src={whatsappQrCode}
                          alt="WhatsApp QR Code"
                          className="w-48 h-48 rounded-lg"
                        />
                        <span className="text-[11px] font-semibold text-emerald-800 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          Waiting for scan...
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-950">WhatsApp Linked Successfully</p>
                        <p className="text-xs text-emerald-700">
                          Active session: +{whatsappConnectedNumber || 'Connected'}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isDisconnectingWA}
                      onClick={handleDisconnectWhatsApp}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {isDisconnectingWA ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Unlink className="w-3 h-3 mr-1" />}
                      Unlink Device
                    </Button>
                  </div>
                )}

                {/* Owner Phone Input */}
                <div className="max-w-md space-y-1.5">
                  <Label htmlFor="whatsappPhoneNumber" className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Recipient WhatsApp Number (Owner / Manager)
                  </Label>
                  <Input
                    id="whatsappPhoneNumber"
                    placeholder="e.g. 9876543210 or 919876543210"
                    value={whatsappPhoneNumber}
                    onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                    className="font-mono text-base"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the 10-digit Indian mobile number or with country code. Reports will arrive in this WhatsApp chat.
                  </p>
                </div>

                {/* WhatsApp Test Buttons */}
                <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!whatsappPhoneNumber || testingWAShift1 || whatsappStatus !== 'CONNECTED'}
                    onClick={() => handleSendTestWhatsApp('SHIFT_1')}
                    className="text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    {testingWAShift1 ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending Shift 1 WhatsApp...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Test Shift 1 on WhatsApp
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!whatsappPhoneNumber || testingWAShift2 || whatsappStatus !== 'CONNECTED'}
                    onClick={() => handleSendTestWhatsApp('SHIFT_2')}
                    className="text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    {testingWAShift2 ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending Shift 2 WhatsApp...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Test Shift 2 on WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TELEGRAM CARD (Available if selected) */}
          {enabled && (notificationChannel === 'TELEGRAM' || notificationChannel === 'BOTH') && (
            <Card className="border-sky-500/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 to-blue-500" />
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600" />
                  Telegram Notifications (@rest_blu_bot)
                </CardTitle>
                <CardDescription className="text-xs">
                  Telegram delivery requires starting @rest_blu_bot and entering your numeric Chat ID.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-md space-y-1.5">
                  <Label htmlFor="chatId" className="font-semibold text-gray-800">
                    Telegram Chat ID
                  </Label>
                  <Input
                    id="chatId"
                    placeholder="e.g. 5241839210"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-gray-500">
                    Find your ID via <strong>@userinfobot</strong> on Telegram. Make sure you tap START in <strong>@rest_blu_bot</strong>.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!chatId || testingShift1}
                    onClick={() => handleSendTestTelegram('SHIFT_1')}
                    className="text-xs font-semibold border-sky-200 text-sky-700 hover:bg-sky-50"
                  >
                    {testingShift1 ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                    Test Shift 1 (Telegram)
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!chatId || testingShift2}
                    onClick={() => handleSendTestTelegram('SHIFT_2')}
                    className="text-xs font-semibold border-sky-200 text-sky-700 hover:bg-sky-50"
                  >
                    {testingShift2 ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                    Test Shift 2 (Telegram)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SHIFT TIMINGS CONFIGURATION */}
          {enabled && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* SHIFT 1 CARD */}
              <Card className="border-orange-500/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        1st Shift (Day Shift)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Default: 10:00 AM to 11:30 PM
                      </CardDescription>
                    </div>
                    <Badge variant={shift1Enabled ? "default" : "outline"} className="bg-orange-600">
                      Shift 1
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="shift1-toggle"
                      checked={shift1Enabled}
                      onChange={(e) => setShift1Enabled(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <Label htmlFor="shift1-toggle" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Send Shift 1 Report
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Shift Start Time</Label>
                      <Input
                        type="time"
                        value={shift1StartTime}
                        onChange={(e) => setShift1StartTime(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Shift End Time</Label>
                      <Input
                        type="time"
                        value={shift1EndTime}
                        onChange={(e) => setShift1EndTime(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                      <Send className="w-3.5 h-3.5 text-orange-600" />
                      Report Send Time
                    </Label>
                    <Input
                      type="time"
                      value={shift1SendTime}
                      onChange={(e) => setShift1SendTime(e.target.value)}
                      className="text-sm font-semibold text-orange-950 bg-orange-50/50"
                    />
                    <p className="text-[11px] text-gray-500">
                      Shift 1 sales summary and full drinks stock PDF will be dispatched at this time.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SHIFT 2 CARD */}
              <Card className="border-indigo-500/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        2nd Shift (Overnight Shift)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Default: 11:31 PM to 09:59 AM
                      </CardDescription>
                    </div>
                    <Badge variant={shift2Enabled ? "default" : "outline"} className="bg-indigo-600">
                      Shift 2
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="shift2-toggle"
                      checked={shift2Enabled}
                      onChange={(e) => setShift2Enabled(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <Label htmlFor="shift2-toggle" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Send Shift 2 Report
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Shift Start Time</Label>
                      <Input
                        type="time"
                        value={shift2StartTime}
                        onChange={(e) => setShift2StartTime(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Shift End Time</Label>
                      <Input
                        type="time"
                        value={shift2EndTime}
                        onChange={(e) => setShift2EndTime(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                      <Send className="w-3.5 h-3.5 text-indigo-600" />
                      Report Send Time
                    </Label>
                    <Input
                      type="time"
                      value={shift2SendTime}
                      onChange={(e) => setShift2SendTime(e.target.value)}
                      className="text-sm font-semibold text-indigo-950 bg-indigo-50/50"
                    />
                    <p className="text-[11px] text-gray-500">
                      Dispatched at 10:00 AM covering overnight orders from 11:31 PM until 09:59 AM.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-2.5 font-bold shadow-md bg-primary hover:bg-primary/90 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Notification Preferences"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
