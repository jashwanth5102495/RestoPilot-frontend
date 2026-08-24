import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SubscriptionOverlay from './SubscriptionOverlay'
import GlobalOrderListener from './GlobalOrderListener'

export default function AppLayout() {
  return (
    <SubscriptionOverlay>
      <GlobalOrderListener />
      <div className="flex h-screen bg-[#F8F8F7] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SubscriptionOverlay>
  )
}
