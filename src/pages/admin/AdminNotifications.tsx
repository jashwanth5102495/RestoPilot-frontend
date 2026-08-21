import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MessageSquare, CheckCircle2 } from "lucide-react"

export default function AdminNotifications() {
  const [status, setStatus] = useState<string>("LOADING")
  const [qrCode, setQrCode] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const res = await api.get('/admin/whatsapp/status')
        const data = res.data.data
        setStatus(data.status)
        if (data.status === 'UNAUTHENTICATED' && data.qrCodeUrl) {
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">WhatsApp Setup</h1>
        <p className="text-gray-500">Link the system WhatsApp account to send notifications to restaurants.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            System WhatsApp Link
          </CardTitle>
          <CardDescription>Scan the QR code with WhatsApp to connect the backend service.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          {status === 'LOADING' && (
            <div className="flex flex-col items-center text-gray-500">
              <Loader2 className="w-10 h-10 mb-4 animate-spin" />
              <p>Checking status...</p>
            </div>
          )}

          {status === 'UNAUTHENTICATED' && (
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
              <p className="text-sm text-gray-500 text-center max-w-sm mt-4">
                Open WhatsApp on your phone, go to Settings &gt; Linked Devices &gt; Link a Device, and point your camera at this screen.
              </p>
            </div>
          )}

          {(status === 'READY' || status === 'AUTHENTICATED') && (
            <div className="flex flex-col items-center text-green-600">
              <CheckCircle2 className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">System WhatsApp Linked Successfully</h3>
              <p className="text-gray-500 text-center">
                The backend service is connected and ready to send notifications.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
