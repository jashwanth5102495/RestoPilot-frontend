import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Receipt, 
  ListOrdered, 
  MenuSquare, 
  ChefHat, 
  Package, 
  BarChart3, 
  Settings,
  Utensils,
  LogOut,
  Globe,
  CreditCard,
  Database,
  GitBranch,
  Bell,
  LayoutTemplate,
  Lock,
  QrCode
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface NavItem {
  name: string
  to: string
  icon: any
  featureKey?: string
}

const mainNav: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Billing', to: '/billing', icon: Receipt, featureKey: 'isBillingEnabled' },
  { name: 'Orders', to: '/orders', icon: ListOrdered },
  { name: 'Online Orders', to: '/online-orders', icon: Globe, featureKey: 'isOnlineOrderingEnabled' },
]

const managementNav: NavItem[] = [
  { name: 'Menu', to: '/menu', icon: MenuSquare },
  { name: 'Tables', to: '/tables', icon: LayoutTemplate, featureKey: 'isTablesEnabled' },
  { name: 'Table QR', to: '/table-qr', icon: QrCode, featureKey: 'isTableQrEnabled' },
  { name: 'Recipes', to: '/recipes', icon: ChefHat, featureKey: 'isRecipesEnabled' },
  { name: 'Inventory', to: '/inventory', icon: Package, featureKey: 'isInventoryEnabled' },
  { name: 'Branches', to: '/branches', icon: GitBranch, featureKey: 'isBranchesEnabled' },
  { name: 'Notifications', to: '/notifications', icon: Bell, featureKey: 'isNotificationsEnabled' },
]

const analyticsNav: NavItem[] = [
  { name: 'Sales Reports', to: '/reports', icon: BarChart3, featureKey: 'isReportsEnabled' },
]

const systemNav: NavItem[] = [
  { name: 'Data', to: '/data', icon: Database },
  { name: 'Settings', to: '/settings', icon: Settings },
  { name: 'Subscription', to: '/subscription', icon: CreditCard },
  { name: 'Data Archive', to: '/archive', icon: Database },
]

const staffNav: NavItem[] = [
  { name: 'Kitchen Display', to: '/kitchen', icon: ChefHat, featureKey: 'isKdsEnabled' },
]

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : {}
  const restaurant = user?.restaurant || {}
  const restaurantName = restaurant?.name || 'Restaurant'
  const initials = restaurantName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isFeatureEnabled = (featureKey?: string) => {
    if (!featureKey) return true
    return restaurant[featureKey] !== false
  }

  const renderNavItem = (item: NavItem) => {
    const enabled = isFeatureEnabled(item.featureKey)

    if (!enabled) {
      return (
        <div
          key={item.name}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toast({
              title: "Feature Disabled",
              description: `${item.name} is currently disabled for your restaurant by administrator. Contact support to enable access.`,
              variant: "destructive"
            })
          }}
          className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium opacity-40 cursor-not-allowed bg-gray-50/70 text-gray-400 select-none hover:bg-gray-50/70 transition-all group"
          title={`${item.name} is locked/disabled by administrator`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5 text-gray-400" />
            <span>{item.name}</span>
          </div>
          <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </div>
      )
    }

    return (
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
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-full transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
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
              {mainNav.map(renderNavItem)}
            </nav>
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Management</h3>
            <nav className="space-y-1">
              {managementNav.map(renderNavItem)}
            </nav>
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Analytics</h3>
            <nav className="space-y-1">
              {analyticsNav.map(renderNavItem)}
            </nav>
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">System</h3>
            <nav className="space-y-1">
              {systemNav.map(renderNavItem)}
            </nav>
          </div>

          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Staff Portals</h3>
            <nav className="space-y-1">
              {staffNav.map(renderNavItem)}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-medium text-gray-900 truncate">{restaurantName}</h4>
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
    </>
  )
}
