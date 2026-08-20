import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Copy, ExternalLink, RefreshCw, Clock } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function OnlineOrders() {
  const { toast } = useToast()
  const [isEnabled, setIsEnabled] = useState(false)
  const [slug, setSlug] = useState('')
  const [_loading, setLoading] = useState(true)
  const [orders, _setOrders] = useState<any[]>([])
  
  const publicUrl = slug ? `${window.location.origin}/order/${slug}` : ''

  useEffect(() => {
    fetchSettings()
    // In a real app we'd fetch orders here, but we're focusing on the settings for now.
  }, [])

  const fetchSettings = async () => {
    try {
      await api.get('/auth/me') // Assuming this returns restaurant info, or we can fetch a specific settings endpoint
      // Actually, we don't have a direct GET for restaurant info on frontend easily yet.
      // We will assume the user has to toggle it first if it's new.
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (checked: boolean) => {
    try {
      const res = await api.post('/public/settings/online-ordering', { enabled: checked })
      setIsEnabled(res.data.data.isOnlineOrderingEnabled)
      setSlug(res.data.data.onlineSlug || '')
      toast({
        title: checked ? "Online Ordering Enabled" : "Online Ordering Disabled",
        description: checked ? "Your menu is now public." : "Your menu is now private.",
      })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' })
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    toast({ title: 'Link copied', description: 'URL copied to clipboard' })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Online Orders</h1>
        <p className="text-gray-500">Manage your public menu and incoming online orders.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Online Ordering Portal
              </CardTitle>
              <CardDescription>
                Publish your menu to the web so customers can place orders directly.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{isEnabled ? 'Published' : 'Unpublished'}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => handleToggle(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </CardHeader>
        {isEnabled && slug && (
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-2">Your Public Ordering Link:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white p-2 rounded border border-slate-200 text-sm font-mono text-slate-600">
                  {publicUrl}
                </code>
                <Button variant="outline" size="icon" onClick={copyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="default" className="gap-2" onClick={() => window.open(publicUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex items-center justify-between mt-8">
        <h2 className="text-xl font-bold text-gray-900">Incoming Orders</h2>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No new orders</h3>
              <p className="text-gray-500 mt-1 max-w-sm">When customers place orders through your online link, they will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Order items would map here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
