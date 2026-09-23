import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Declare Cashfree in the window object since it's loaded via script tag
declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function Subscription() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [status, setStatus] = useState<string>('PENDING')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(5000)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authRes, priceRes, historyRes] = await Promise.allSettled([
          api.get('/auth/me'),
          api.get('/subscription/price'),
          api.get('/subscription/history')
        ])

        if (authRes.status === 'rejected' || priceRes.status === 'rejected') {
          throw authRes.status === 'rejected' ? authRes.reason : priceRes.reason
        }

        const restaurant = authRes.value.data.data.user?.restaurant
        if (restaurant) {
          setStatus(restaurant.subscriptionStatus)
          setExpiresAt(restaurant.subscriptionExpiresAt)
        }
        
        if (priceRes.value.data.data?.amount) {
          setAmount(priceRes.value.data.data.amount)
        }

        if (historyRes.status === 'fulfilled' && historyRes.value.data.data) {
          setHistory(historyRes.value.data.data)
        }
      } catch (err) {
        console.error(err)
        toast({
          title: 'Error',
          description: 'Failed to load subscription details.',
          variant: 'destructive',
        })
      } finally {
        setInitLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const handlePay = async () => {
    setLoading(true)
    try {
      // 1. Create order on backend
      const orderRes = await api.post('/subscription/create-order')
      const { paymentSessionId, orderId } = orderRes.data.data

      // If it's the mock gateway (dev mode), the session ID might be 'mock_session_...'
      if (paymentSessionId.startsWith('mock_session_')) {
        // Dev mode instant verify
        await verifyPayment(orderId)
        return
      }

      // 2. Open Cashfree Drop-in
      // We assume the script is loaded in index.html
      if (!window.Cashfree) {
        throw new Error('Cashfree SDK not loaded')
      }
      
      // IMPORTANT: In a real app, environment should be dynamic based on your config,
      // here we assume sandbox if we have a real session ID but testing.
      const cashfree = window.Cashfree({ mode: "sandbox" }) // Change to "production" in prod

      const result = await cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal",
      })

      if (result.error) {
        // User closed modal or error
        toast({
          title: 'Payment Incomplete',
          description: 'Payment was not completed. Please try again.',
        })
        setLoading(false)
        return
      }

      if (result.redirect) {
        // Handled via redirect
        return
      }

      if (result.paymentDetails) {
        // 3. Verify payment on backend
        await verifyPayment(orderId)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Payment Error',
        description: err.response?.data?.message || err.message || 'Could not initiate payment.',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  const verifyPayment = async (orderId: string) => {
    try {
      const verifyRes = await api.post('/subscription/verify', { orderId })
      const finalStatus = verifyRes.data.data.status
      
      if (finalStatus === 'PAID') {
        toast({
          title: 'Payment Successful',
          description: 'Your subscription is now active!',
        })
        
        // Refresh data
        const [authRes, historyRes] = await Promise.allSettled([
          api.get('/auth/me'),
          api.get('/subscription/history')
        ])
        if (authRes.status === 'fulfilled') {
          const restaurant = authRes.value.data.data.user?.restaurant
          if (restaurant) {
            setStatus(restaurant.subscriptionStatus)
            setExpiresAt(restaurant.subscriptionExpiresAt)
          }
        }
        if (historyRes.status === 'fulfilled' && historyRes.value.data.data) {
          setHistory(historyRes.value.data.data)
        }
      } else {
        toast({
          title: 'Payment Failed',
          description: `Payment status is ${finalStatus}`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Verification Error',
        description: 'Failed to verify payment. If money was deducted, it will be handled shortly.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 mt-2">Manage your RestoPilot billing and access.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are on the Standard Monthly Plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              {status === 'ACTIVE' ? (
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Status: <span className={status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>{status}</span>
                </p>
                {expiresAt && (
                  <p className="text-sm text-gray-500">
                    Expires: {new Date(expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Monthly Cost</span>
                <span className="text-xl font-bold text-gray-900">₹{amount.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-500">Includes all RestoPilot features (Billing, Inventory, Recipes, Online Orders, Analytics)</p>
            </div>

            <Button 
              className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Processing...' : status === 'ACTIVE' ? 'Renew Early' : 'Pay Now'}
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-4">Billing History</h3>
          <Card>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No payment history found.
                </div>
              ) : (
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-sm">Monthly Subscription</p>
                        <p className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleDateString()} - {new Date(h.createdAt).toLocaleTimeString()}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{h.orderId}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block">₹{h.amount.toLocaleString()}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                          h.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                          h.status === 'CREATED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
