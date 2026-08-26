import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Bell } from "lucide-react"

export default function Notifications() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState("")

  const [enabled, setEnabled] = useState(false)
  const [chatId, setChatId] = useState("")
  const [scheduledTime, setScheduledTime] = useState("21:00")

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      const user = res.data.data.user
      const rest = user.restaurant || {}

      // Try user.restaurantId from JWT payload first, then fallback to rest._id
      const actualRestId = user.restaurantId || rest._id || "";
      setRestaurantId(actualRestId)
      
      if (rest.notificationSettings) {
        setEnabled(rest.notificationSettings.enabled || false)
        setChatId(rest.notificationSettings.telegramChatId || "")
        setScheduledTime(rest.notificationSettings.scheduledTime || "21:00")
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
          telegramChatId: chatId,
          scheduledTime
        }
      })

      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated successfully.",
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
        <p className="text-gray-500">Configure your daily summary Telegram notifications.</p>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
          <p>Loading settings...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Telegram Notifications
            </CardTitle>
            <CardDescription>Get daily sales and inventory reports sent directly to your Telegram.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enable-notifications"
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <Label htmlFor="enable-notifications" className="text-base font-medium cursor-pointer">
                Enable Daily Telegram Reports
              </Label>
            </div>

            {enabled && (
              <div className="grid gap-4 p-4 bg-gray-50 rounded-lg border">
                <div className="text-sm text-gray-600 bg-white p-4 rounded-md border mb-2">
                  <strong>How to get your Telegram Chat ID:</strong>
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>Open Telegram and search for <strong>@userinfobot</strong> or <strong>@raw_data_bot</strong></li>
                    <li>Send the message <code>/start</code></li>
                    <li>The bot will reply with your Account Info. Copy the <strong>Id</strong> (usually a 9 or 10 digit number)</li>
                    <li>Make sure you have also searched for and started a conversation with your System's main Telegram Bot!</li>
                  </ol>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="chatId">Telegram Chat ID</Label>
                    <Input 
                      id="chatId" 
                      placeholder="e.g. 123456789"
                      value={chatId}
                      onChange={(e: any) => setChatId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Scheduled Time</Label>
                    <Input 
                      id="time" 
                      type="time"
                      value={scheduledTime}
                      onChange={(e: any) => setScheduledTime(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">When should the report be sent?</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
              {enabled && (
                <Button 
                  variant="outline" 
                  disabled={!chatId}
                  onClick={async () => {
                    try {
                      if (!restaurantId) {
                        toast({ title: 'Error', description: 'Restaurant ID is missing. Please refresh the page.', variant: 'destructive' });
                        return;
                      }
                      toast({ title: 'Sending Test Report...' });
                      await api.post(`/restaurants/${restaurantId}/test-telegram-report`);
                      toast({ title: 'Test Report Sent', description: 'Check your Telegram for the report.' });
                    } catch (err: any) {
                      toast({ 
                        title: 'Failed to send test report', 
                        description: err.response?.data?.message || 'Unknown error', 
                        variant: 'destructive' 
                      });
                    }
                  }}
                  title={!chatId ? "Please enter your Telegram Chat ID first" : ""}
                >
                  Send Test Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
