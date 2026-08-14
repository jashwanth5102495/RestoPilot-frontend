import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Lock, CreditCard } from 'lucide-react'

export default function SubscriptionOverlay({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('ACTIVE')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/auth/me')
        const currentStatus = res.data.data.user?.restaurant?.subscriptionStatus
        if (currentStatus) {
          setStatus(currentStatus)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [])

  if (loading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>

  const location = useLocation()
  const isSubscriptionPage = location.pathname === '/subscription'
  const isLocked = !isSubscriptionPage && (status === 'EXPIRED' || status === 'PENDING')

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className={`h-full w-full transition-all duration-300 ${isLocked ? 'blur-md pointer-events-none' : ''}`}>
        {children}
      </div>

      {isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl border-orange-200">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Subscription Required</CardTitle>
              <CardDescription className="text-base mt-2">
                Your restaurant's subscription is currently {status.toLowerCase()}. Please complete your payment to continue using RestoPilot.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Monthly Plan</span>
                <span className="text-xl font-bold text-gray-900">₹5,000</span>
              </div>
              <Button 
                className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => navigate('/subscription')}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
