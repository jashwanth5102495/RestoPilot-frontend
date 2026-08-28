import { Bell, Search, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [hasNewOrder, setHasNewOrder] = useState(false)
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const restaurantName = user?.restaurant?.name || 'Restaurant'
  
  // Format the path into a readable title
  const path = location.pathname.split('/')[1] || 'Dashboard'
  const title = path.charAt(0).toUpperCase() + path.slice(1)

  useEffect(() => {
    const handleNewOrder = () => {
      setHasNewOrder(true)
      // Stop animation after 10 seconds if not clicked
      setTimeout(() => setHasNewOrder(false), 10000)
    }

    window.addEventListener('new-online-order', handleNewOrder)
    return () => window.removeEventListener('new-online-order', handleNewOrder)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-9 bg-gray-50 border-transparent focus:border-primary focus:bg-white"
          />
        </div>

        <button 
          onClick={() => {
            setHasNewOrder(false)
            navigate('/online-orders')
          }}
          className={`relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors ${hasNewOrder ? 'animate-bounce text-orange-500 bg-orange-50' : ''}`}
        >
          <Bell className="w-5 h-5" />
          {hasNewOrder && (
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        
        <div className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l border-gray-200">
          <span className="text-sm font-medium text-gray-700">{restaurantName}</span>
        </div>
      </div>
    </header>
  )
}
