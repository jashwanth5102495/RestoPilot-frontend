import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SubscriptionOverlay from './SubscriptionOverlay'
import GlobalOrderListener from './GlobalOrderListener'

export default function AppLayout() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'WAITER' && location.pathname !== '/waiter') {
    return <Navigate to="/waiter" replace />
  }

  if (user.role === 'KITCHEN' && location.pathname !== '/kitchen') {
    return <Navigate to="/kitchen" replace />
  }

  return (
    <SubscriptionOverlay>
      <GlobalOrderListener />
      <div className="flex h-screen bg-[#F8F8F7] overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SubscriptionOverlay>
  )
}
