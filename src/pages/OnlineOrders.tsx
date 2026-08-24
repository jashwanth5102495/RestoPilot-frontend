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
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  
  const publicUrl = slug ? `${window.location.origin}/order/${slug}` : ''

  useEffect(() => {
    fetchSettings()
    fetchOrders()

    const handleNewOrder = () => {
      fetchOrders()
    }
    window.addEventListener('new-online-order', handleNewOrder)
    return () => window.removeEventListener('new-online-order', handleNewOrder)
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/auth/me') 
      const restaurant = res.data?.data?.user?.restaurant
      if (restaurant) {
        setIsEnabled(restaurant.isOnlineOrderingEnabled || false)
        setSlug(restaurant.onlineSlug || '')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders?source=ONLINE')
      setOrders(res.data?.data || [])
    } catch (err) {
      console.error(err)
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
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
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
                <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => handleToggle(e.target.checked)} disabled={loading} />
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
                <code className="flex-1 bg-white p-2 rounded border border-slate-200 text-sm font-mono text-slate-600 truncate">
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
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-slate-300 animate-spin mb-4" />
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No online orders yet</h3>
              <p className="text-gray-500 mt-1 max-w-sm">When customers place orders through your online link, their history will appear here permanently.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <div key={order._id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-gray-900">{order.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {order.orderStatus}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">₹{order.total?.toFixed(2)}</p>
                      <p className="text-sm font-medium text-gray-500">{order.paymentStatus}</p>
                    </div>
                  </div>
                  
                  {order.customerInfo && (
                    <div className="mb-4 bg-orange-50 p-3 rounded-md border border-orange-100">
                      <p className="text-sm font-medium text-gray-900">Customer Details</p>
                      <p className="text-sm text-gray-700">{order.customerInfo.name} • {order.customerInfo.phone}</p>
                      {order.customerInfo.email && <p className="text-sm text-gray-700">{order.customerInfo.email}</p>}
                      {order.customerInfo.address && (
                        <p className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                          <span className="font-semibold text-gray-700">Address:</span> 
                          {order.customerInfo.address}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Items</p>
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          <span className="font-medium mr-2">{item.quantity}x</span>
                          {item.dishName}
                        </span>
                        <span className="text-gray-600">₹{item.lineTotal?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* orderStatus action buttons removed as requested */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
