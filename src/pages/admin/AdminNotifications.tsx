import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MessageSquare, CheckCircle2 } from "lucide-react"

export default function AdminNotifications() {
  const [status, setStatus] = useState<string>("LOADING")
  const [botName, setBotName] = useState<string | null>(null)
  const [token, setToken] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/admin/telegram/status')
        const data = res.data.data
        setStatus(data.status)
        if (data.botName) setBotName(data.botName)
      } catch (error) {
        console.error('Failed to fetch telegram status', error)
        setStatus('DISCONNECTED')
      }
    }

    checkStatus()
  }, [])

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setIsRequesting(true)
    setError(null)

    try {
      const res = await api.post('/admin/telegram/token', { token })
      setStatus('CONNECTED')
      setBotName(res.data.data.botName)
      setToken("")
    } catch (err: any) {
      console.error('Failed to save token:', err)
      setError(err.response?.data?.message || 'Failed to save token. Ensure it is correct.')
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            Telegram Setup
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
          <p className="text-gray-500 mt-1">Configure the Telegram Bot to send notifications to restaurants.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Bot Status
            </CardTitle>
            <CardDescription>Current connection status.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {status === 'LOADING' && (
              <div className="flex flex-col items-center text-gray-500">
                <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                <p>Checking Telegram Service...</p>
              </div>
            )}

            {status === 'DISCONNECTED' && (
              <div className="flex flex-col items-center text-amber-500">
                <MessageSquare className="w-10 h-10 mb-4 opacity-50" />
                <p className="text-center font-medium">Telegram Bot Not Configured</p>
                <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
                  Please enter your Telegram Bot Token to activate the service.
                </p>
              </div>
            )}

            {status === 'CONNECTED' && (
              <div className="flex flex-col items-center text-green-600 text-center px-4 py-8">
                <CheckCircle2 className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Active & Connected</h3>
                <p className="text-sm text-gray-600 max-w-sm mb-6">
                  Connected to Bot: <strong>@{botName}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  The bot is ready to send automated daily PDF reports to restaurants.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Setup Telegram Bot
            </CardTitle>
            <CardDescription>Enter the Bot Token provided by @BotFather.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-gray-600 bg-slate-50 p-4 rounded-md border">
              <strong>How to get a Bot Token:</strong>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>Open Telegram and search for <strong>@BotFather</strong></li>
                <li>Send the message <code>/newbot</code></li>
                <li>Follow the instructions to choose a name and username</li>
                <li>Copy the HTTP API Token provided and paste it below</li>
              </ol>
            </div>

            <form onSubmit={handleSaveToken} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Bot Token</Label>
                <Input
                  id="token"
                  placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button 
                type="submit" 
                disabled={isRequesting}
                className="w-full"
              >
                {isRequesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {status === 'CONNECTED' ? 'Update Bot Token' : 'Save Bot Token'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
