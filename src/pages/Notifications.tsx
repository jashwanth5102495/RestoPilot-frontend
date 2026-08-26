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
  const [phoneNumber, setPhoneNumber] = useState("")
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
        setPhoneNumber(rest.notificationSettings.whatsappNumber || "")
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
          whatsappNumber: phoneNumber,
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
        <p className="text-gray-500">Configure your daily summary WhatsApp notifications.</p>
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
              WhatsApp Notifications
            </CardTitle>
            <CardDescription>Get daily sales and inventory reports sent directly to your WhatsApp.</CardDescription>
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
                Enable Daily WhatsApp Reports
              </Label>
            </div>

            {enabled && (
              <div className="grid gap-4 md:grid-cols-2 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number</Label>
                  <Input 
                    id="phone" 
                    placeholder="e.g. 919347564390"
                    value={phoneNumber}
                    onChange={(e: any) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Include country code without + sign</p>
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
            )}

            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
              {enabled && (
                <Button 
                  variant="outline" 
                  disabled={!phoneNumber}
                  onClick={async () => {
                    try {
                      if (!restaurantId) {
                        toast({ title: 'Error', description: 'Restaurant ID is missing. Please refresh the page.', variant: 'destructive' });
                        return;
                      }
                      toast({ title: 'Sending Test Report...' });
                      await api.post(`/restaurants/${restaurantId}/test-whatsapp-report`);
                      toast({ title: 'Test Report Sent', description: 'Check your WhatsApp for the report.' });
                    } catch (err: any) {
                      toast({ 
                        title: 'Failed to send test report', 
                        description: err.response?.data?.message || 'Unknown error', 
                        variant: 'destructive' 
                      });
                    }
                  }}
                  title={!phoneNumber ? "Please enter your WhatsApp number first" : ""}
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
