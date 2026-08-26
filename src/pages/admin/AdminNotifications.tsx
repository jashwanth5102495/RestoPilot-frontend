import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MessageSquare, CheckCircle2, Smartphone } from "lucide-react"

export default function AdminNotifications() {
  const [status, setStatus] = useState<string>("LOADING")
  const [qrCode, setQrCode] = useState<string | null>(null)
  
  const [phoneNumber, setPhoneNumber] = useState("")
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const res = await api.get('/admin/whatsapp/status')
        const data = res.data.data
        setStatus(data.status)
        if (data.status === 'AWAITING_LOGIN' && data.qrCodeUrl) {
          setQrCode(data.qrCodeUrl)
        }
      } catch (error) {
        console.error('Failed to fetch whatsapp status', error)
      }
    }

    checkStatus()
    interval = setInterval(checkStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber) return

    setIsRequesting(true)
    setError(null)

    try {
      const res = await api.post('/admin/whatsapp/pair', { phoneNumber })
      setPairingCode(res.data.data.code)
    } catch (err: any) {
      console.error('Failed to request pairing code:', err)
      setError(err.response?.data?.message || 'Failed to request code. Ensure number is correct.')
    } finally {
      setIsRequesting(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to completely reset and disconnect the WhatsApp service? You will need to link a device again.")) {
      return;
    }
    
    setIsRequesting(true)
    try {
      await api.post('/admin/whatsapp/reset')
      setStatus('INITIALIZING')
      setQrCode(null)
      setPairingCode(null)
    } catch (err: any) {
      console.error('Failed to reset whatsapp:', err)
      setError(err.response?.data?.message || 'Failed to reset service.')
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            WhatsApp Setup
            {status === 'CONNECTED' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Active
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Link the system WhatsApp account to send notifications to restaurants.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Link via QR Code
            </CardTitle>
            <CardDescription>Scan the QR code with WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {(status === 'LOADING' || status === 'INITIALIZING') && !qrCode && (
              <div className="flex flex-col items-center text-gray-500">
                <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                <p>Initializing WhatsApp Service...</p>
              </div>
            )}

            {status === 'DISCONNECTED' && (
              <div className="flex flex-col items-center text-red-500">
                <MessageSquare className="w-10 h-10 mb-4 opacity-50" />
                <p className="text-center font-medium">WhatsApp Service Offline</p>
                <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
                  The backend failed to initialize the WhatsApp client. Ensure the server has Chrome installed.
                </p>
              </div>
            )}

            {status === 'AWAITING_LOGIN' && (
              <div className="flex flex-col items-center">
                {qrCode ? (
                  <div className="p-4 bg-white border rounded-xl shadow-sm mb-4">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500 h-64 justify-center">
                    <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                    <p>Generating QR code...</p>
                  </div>
                )}
              </div>
            )}

            {status === 'AUTHENTICATING' && (
              <div className="flex flex-col items-center text-amber-500 text-center px-4 py-8">
                <Loader2 className="w-16 h-16 mb-4 animate-spin" />
                <h3 className="text-xl font-semibold mb-2">Authenticating & Syncing</h3>
                <p className="text-sm text-gray-600 max-w-sm mb-4">
                  Your phone has been successfully linked. WhatsApp is now downloading your chat history to the server.
                </p>
                <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded text-left max-w-sm border border-amber-200 mb-6">
                  <strong>Tip:</strong> If you are linking a personal number with years of chat history, this can take <strong>5-10 minutes</strong>. If it never completes, your server might be running out of memory. We highly recommend using a fresh WhatsApp number with no history for automated systems.
                </div>
                <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleReset} disabled={isRequesting}>
                  {isRequesting ? 'Stopping...' : 'Stop & Reset Sync'}
                </Button>
              </div>
            )}

            {status === 'CONNECTED' && (
              <div className="flex flex-col items-center text-green-600 text-center px-4 py-8">
                <CheckCircle2 className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Active & Connected</h3>
                <p className="text-sm text-gray-600 max-w-sm mb-6">
                  System WhatsApp account has been successfully configured and is ready to send automated daily PDF reports to restaurants.
                </p>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleReset} disabled={isRequesting}>
                  {isRequesting ? 'Disconnecting...' : 'Disconnect WhatsApp Account'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Link via Phone Number
            </CardTitle>
            <CardDescription>Use an 8-character pairing code instead.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === 'CONNECTED' ? (
               <div className="flex flex-col items-center justify-center text-green-600 py-12">
               <CheckCircle2 className="w-16 h-16 mb-4" />
               <h3 className="text-xl font-semibold mb-2">Ready to Send</h3>
             </div>
            ) : pairingCode ? (
              <div className="text-center space-y-4 py-8">
                <h3 className="text-lg font-medium">Your Pairing Code</h3>
                <div className="text-4xl font-mono tracking-widest p-6 bg-slate-100 rounded-lg text-slate-800 border">
                  {pairingCode}
                </div>
                <p className="text-sm text-gray-500">
                  Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link with phone number instead. Enter this code.
                </p>
                <Button variant="outline" onClick={() => setPairingCode(null)}>Cancel</Button>
              </div>
            ) : (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. +91 93475 64390"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">Include your country code.</p>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button 
                  type="submit" 
                  disabled={isRequesting || (status !== 'AWAITING_LOGIN' && status !== 'INITIALIZING')}
                  className="w-full"
                >
                  {isRequesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Get Pairing Code
                </Button>
                
                {status !== 'AWAITING_LOGIN' && status !== 'INITIALIZING' && (
                  <p className="text-xs text-amber-500 text-center">Service disconnected. Cannot pair.</p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
