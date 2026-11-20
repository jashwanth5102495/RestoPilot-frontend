import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Bell, Send, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react"

export default function Notifications() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState("")

  // Telegram Account
  const [enabled, setEnabled] = useState(false)
  const [chatId, setChatId] = useState("")

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

  // Test send state
  const [testingShift1, setTestingShift1] = useState(false)
  const [testingShift2, setTestingShift2] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      const user = res.data.data.user
      const rest = user.restaurant || {}

      const actualRestId = user.restaurantId || rest._id || ""
      setRestaurantId(actualRestId)

      if (rest.notificationSettings) {
        const s = rest.notificationSettings
        setEnabled(s.enabled || false)
        setChatId(s.telegramChatId || "")

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
    } catch (error) {
      console.error('Failed to fetch restaurant profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!restaurantId) return

    setSaving(true)
    try {
      await api.put(`/restaurants/${restaurantId}`, {
        notificationSettings: {
          enabled,
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
        description: "Shift-wise notification schedule updated successfully.",
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

  const handleSendTestReport = async (shift: 'SHIFT_1' | 'SHIFT_2') => {
    if (!restaurantId || !chatId) {
      toast({
        title: "Chat ID Required",
        description: "Please enter your Telegram Chat ID and save preferences first.",
        variant: "destructive"
      })
      return
    }

    if (shift === 'SHIFT_1') setTestingShift1(true)
    else setTestingShift2(true)

    try {
      const res = await api.post(`/restaurants/${restaurantId}/test-telegram-report`, { shift })
      toast({
        title: "Test Report Sent! 🚀",
        description: res.data?.message || `Check Telegram for your ${shift === 'SHIFT_1' ? 'Shift 1' : 'Shift 2'} report PDF.`,
      })
    } catch (err: any) {
      toast({
        title: "Failed to Send Report",
        description: err.response?.data?.message || "Please make sure you have tapped /start in @rest_blu_bot on Telegram.",
        variant: "destructive"
      })
    } finally {
      if (shift === 'SHIFT_1') setTestingShift1(false)
      else setTestingShift2(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Shift-Wise Notifications
        </h1>
        <p className="text-gray-500">
          Automate separate Telegram reports for 1st shift and 2nd shift with sales, orders, and inventory.
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
          <p>Loading notification preferences...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Telegram Connection Card */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Telegram Bot Connection
                  </CardTitle>
                  <CardDescription>
                    Connect your restaurant owner or manager's Telegram account to receive shift reports.
                  </CardDescription>
                </div>
                <Badge variant={enabled && chatId ? "default" : "secondary"}>
                  {enabled && chatId ? "Active" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                <input
                  type="checkbox"
                  id="enable-notifications"
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <Label htmlFor="enable-notifications" className="text-base font-semibold cursor-pointer text-gray-800">
                  Enable Automated Shift Reports via Telegram
                </Label>
              </div>

              {enabled && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-700 bg-slate-50 p-4 rounded-xl border space-y-2">
                    <strong className="text-gray-900 block font-semibold">
                      ⚡ Quick Setup (Required by Telegram):
                    </strong>
                    <ol className="list-decimal pl-5 space-y-1.5 text-xs md:text-sm text-gray-600">
                      <li>
                        Open Telegram and message our bot:{" "}
                        <a
                          href="https://t.me/rest_blu_bot"
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-primary underline"
                        >
                          @rest_blu_bot
                        </a>{" "}
                        and tap <strong>START</strong> (or send <code>/start</code>).
                        <span className="text-amber-700 font-medium block">
                          *(Telegram blocks bots from sending messages until you tap START first).*
                        </span>
                      </li>
                      <li>
                        To find your Chat ID: Message <strong>@userinfobot</strong> on Telegram and send <code>/start</code>. Copy the <strong>Id</strong> number.
                      </li>
                    </ol>
                  </div>

                  <div className="max-w-md space-y-1.5">
                    <Label htmlFor="chatId" className="font-semibold text-gray-800">
                      Telegram Chat ID (Owner / Manager)
                    </Label>
                    <Input
                      id="chatId"
                      placeholder="e.g. 5241839210"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      Both individual Chat IDs and Telegram Group Chat IDs (starting with -100) are supported.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shift Schedule Settings */}
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
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
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
                      Report Send Time (Telegram)
                    </Label>
                    <Input
                      type="time"
                      value={shift1SendTime}
                      onChange={(e) => setShift1SendTime(e.target.value)}
                      className="text-sm font-semibold text-orange-950 bg-orange-50/50"
                    />
                    <p className="text-[11px] text-gray-500">
                      When this time arrives, Shift 1 sales & inventory PDF will be sent to Telegram.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!chatId || testingShift1}
                      onClick={() => handleSendTestReport('SHIFT_1')}
                      className="w-full text-xs font-semibold border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      {testingShift1 ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Sending Shift 1 Test...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Send Shift 1 Test Report
                        </>
                      )}
                    </Button>
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
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
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
                      Report Send Time (Telegram)
                    </Label>
                    <Input
                      type="time"
                      value={shift2SendTime}
                      onChange={(e) => setShift2SendTime(e.target.value)}
                      className="text-sm font-semibold text-indigo-950 bg-indigo-50/50"
                    />
                    <p className="text-[11px] text-gray-500">
                      Sent at 10:00 AM covering overnight orders from 11:31 PM until 09:59 AM.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!chatId || testingShift2}
                      onClick={() => handleSendTestReport('SHIFT_2')}
                      className="w-full text-xs font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      {testingShift2 ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Sending Shift 2 Test...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Send Shift 2 Test Report
                        </>
                      )}
                    </Button>
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
              className="px-8 py-2.5 font-bold shadow-md"
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
