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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">WhatsApp Setup</h1>
        <p className="text-gray-500">Link the system WhatsApp account to send notifications to restaurants.</p>
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
            {(status === 'LOADING' || status === 'DISCONNECTED' || status === 'INITIALIZING') && !qrCode && (
              <div className="flex flex-col items-center text-gray-500">
                <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                <p>Initializing WhatsApp Service...</p>
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

            {status === 'CONNECTED' && (
              <div className="flex flex-col items-center text-green-600">
                <CheckCircle2 className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Linked Successfully</h3>
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
                  disabled={isRequesting || status !== 'AWAITING_LOGIN'}
                  className="w-full"
                >
                  {isRequesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Get Pairing Code
                </Button>
                
                {status !== 'AWAITING_LOGIN' && (
                  <p className="text-xs text-amber-500 text-center">Please wait for WhatsApp to fully initialize first...</p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
