import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Subscription() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('PENDING')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/auth/me')
        const restaurant = res.data.data.user?.restaurant
        if (restaurant) {
          setStatus(restaurant.subscriptionStatus)
          setExpiresAt(restaurant.subscriptionExpiresAt)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchStatus()
  }, [])

  const handlePay = async () => {
    setLoading(true)
    try {
      const res = await api.post('/billing/subscription/pay')
      setStatus(res.data.data.subscriptionStatus)
      setExpiresAt(res.data.data.subscriptionExpiresAt)
      
      toast({
        title: 'Payment Successful',
        description: 'Your subscription is now active!',
      })
    } catch (err) {
      toast({
        title: 'Payment Failed',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
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
                <span className="text-xl font-bold text-gray-900">₹5,000</span>
              </div>
              <p className="text-sm text-gray-500">Includes all RestoPilot features (Billing, Inventory, Recipes, Online Orders, Analytics)</p>
            </div>

            <Button 
              className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handlePay}
              disabled={loading}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {loading ? 'Processing...' : status === 'ACTIVE' ? 'Renew Early' : 'Pay Now'}
            </Button>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-4">Billing History</h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* Mock History */}
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">Monthly Subscription</p>
                    <p className="text-sm text-gray-500">Paid today</p>
                  </div>
                  <span className="font-bold">₹5,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
