import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SubscriptionOverlay from './SubscriptionOverlay'
import GlobalOrderListener from './GlobalOrderListener'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, ArrowLeft } from 'lucide-react'

// Map path routes to their respective feature toggle keys
const ROUTE_FEATURE_MAP: Record<string, { key: string; name: string }> = {
  '/billing': { key: 'isBillingEnabled', name: 'Billing & POS' },
  '/kitchen': { key: 'isKdsEnabled', name: 'Kitchen Display System' },
  '/online-orders': { key: 'isOnlineOrderingEnabled', name: 'Online Orders' },
  '/tables': { key: 'isTablesEnabled', name: 'Tables Management' },
  '/recipes': { key: 'isRecipesEnabled', name: 'Recipes Management' },
  '/inventory': { key: 'isInventoryEnabled', name: 'Inventory Management' },
  '/inventory/check': { key: 'isInventoryEnabled', name: 'Inventory Management' },
  '/inventory/history': { key: 'isInventoryEnabled', name: 'Inventory Management' },
  '/reports': { key: 'isReportsEnabled', name: 'Sales Reports & Analytics' },
  '/branches': { key: 'isBranchesEnabled', name: 'Branch Management' },
  '/notifications': { key: 'isNotificationsEnabled', name: 'Notifications & Alerts' },
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  const [user, setUser] = useState<any>(() => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  })

  // Sync latest restaurant feature permissions from backend on mount and periodically
  useEffect(() => {
    if (!token) return

    api.get('/auth/me')
      .then(res => {
        if (res.data?.data?.user) {
          const freshUser = res.data.data.user
          setUser(freshUser)
          localStorage.setItem('user', JSON.stringify(freshUser))
        }
      })
      .catch(err => {
        console.error('Error refreshing user permissions:', err)
      })
  }, [token, location.pathname])

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'WAITER' && location.pathname !== '/billing') {
    return <Navigate to="/billing" replace />
  }

  if (user.role === 'KITCHEN' && location.pathname !== '/kitchen') {
    return <Navigate to="/kitchen" replace />
  }

  // Feature gate check for current URL
  const matchedRouteFeature = ROUTE_FEATURE_MAP[location.pathname]
  const isFeatureDisabled = matchedRouteFeature && user.restaurant && user.restaurant[matchedRouteFeature.key] === false

  return (
    <SubscriptionOverlay>
      <GlobalOrderListener />
      <div className="flex h-screen bg-[#F8F8F7] overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {isFeatureDisabled ? (
              <div className="h-full flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-gray-200 shadow-sm text-center p-6">
                  <CardContent className="space-y-4 pt-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Module Access Disabled</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-semibold text-gray-800">{matchedRouteFeature.name}</span> is currently disabled for your restaurant account by your administrator.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button onClick={() => navigate('/dashboard')} className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </SubscriptionOverlay>
  )
}
