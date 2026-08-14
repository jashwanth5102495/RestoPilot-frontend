import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Receipt, 
  ListOrdered, 
  MenuSquare, 
  ChefHat, 
  Package, 
  Truck, 
  Users, 
  BarChart3, 
  Settings,
  Utensils,
  LogOut,
  Globe,
  CreditCard,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainNav = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Billing', to: '/billing', icon: Receipt },
  { name: 'Orders', to: '/orders', icon: ListOrdered },
  { name: 'Online Orders', to: '/online-orders', icon: Globe },
]

const managementNav = [
  { name: 'Menu', to: '/menu', icon: MenuSquare },
  { name: 'Recipes', to: '/recipes', icon: ChefHat },
  { name: 'Inventory', to: '/inventory', icon: Package },
  { name: 'Purchases', to: '/purchases', icon: Truck },
  { name: 'Suppliers', to: '/suppliers', icon: Users },
]

const analyticsNav = [
  { name: 'Sales Reports', to: '/reports', icon: BarChart3 },
]

const systemNav = [
  { name: 'Settings', to: '/settings', icon: Settings },
  { name: 'Subscription', to: '/subscription', icon: CreditCard },
  { name: 'Data Archive', to: '/archive', icon: Database },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full hidden lg:flex">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-primary p-1.5 rounded-md">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">RestoPilot</h1>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider ml-9">By BluNet IT Services</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Main</h3>
          <nav className="space-y-1">
            {mainNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-orange-50 text-primary" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Management</h3>
          <nav className="space-y-1">
            {managementNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-orange-50 text-primary" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Analytics</h3>
          <nav className="space-y-1">
            {analyticsNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-orange-50 text-primary" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">System</h3>
          <nav className="space-y-1">
            {systemNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-orange-50 text-primary" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            SG
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-medium text-gray-900 truncate">Spice Garden</h4>
            <p className="text-xs text-gray-500 truncate">Restaurant Owner</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
