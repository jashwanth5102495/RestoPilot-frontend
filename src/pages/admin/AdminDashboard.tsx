import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building2, 
  UtensilsCrossed, 
  TrendingUp, 
  PackageSearch, 
  Trash2, 
  Eye, 
  Download,
  SlidersHorizontal,
  Receipt,
  ChefHat,
  Utensils,
  Globe,
  Package,
  BookOpen,
  LayoutTemplate,
  BarChart3,
  GitBranch,
  Bell,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface FeatureItem {
  key: string
  label: string
  description: string
  icon: any
}

const FEATURE_LIST: FeatureItem[] = [
  {
    key: 'isBillingEnabled',
    label: 'Billing & POS',
    description: 'Direct sales, table billing, thermal receipt printing, and checkout.',
    icon: Receipt
  },
  {
    key: 'isKdsEnabled',
    label: 'Kitchen Display (KDS)',
    description: 'Live order tracking screen for kitchen chefs and station routing.',
    icon: ChefHat
  },
  {
    key: 'isWaiterOrderingEnabled',
    label: 'Waiter POS & Ordering',
    description: 'Waiter mobile ordering portal, table captain orders, and KOT generation.',
    icon: Utensils
  },
  {
    key: 'isOnlineOrderingEnabled',
    label: 'Online / QR Ordering',
    description: 'Customer table QR code scanning and online self-ordering website.',
    icon: Globe
  },
  {
    key: 'isTableQrEnabled',
    label: 'Table QR Ordering',
    description: 'Customer specific table QR codes for direct-to-kitchen ordering.',
    icon: PackageSearch
  },
  {
    key: 'isInventoryEnabled',
    label: 'Inventory Management',
    description: 'Stock tracking, low-stock warnings, purchase entries, and deduction.',
    icon: Package
  },
  {
    key: 'isRecipesEnabled',
    label: 'Recipes & Formulas',
    description: 'Portion mapping, standard dish recipes, and ingredient calculations.',
    icon: BookOpen
  },
  {
    key: 'isTablesEnabled',
    label: 'Tables Management',
    description: 'Floor layouts, table assignments, and dine-in capacity setups.',
    icon: LayoutTemplate
  },
  {
    key: 'isReportsEnabled',
    label: 'Sales Reports & Analytics',
    description: 'Revenue graphs, daily audit summaries, and financial reports.',
    icon: BarChart3
  },
  {
    key: 'isBranchesEnabled',
    label: 'Multi-Branch Management',
    description: 'Managing multiple outlets, branch switching, and location sync.',
    icon: GitBranch
  },
  {
    key: 'isNotificationsEnabled',
    label: 'Telegram & Alerts',
    description: 'Automated daily sales reports on Telegram and live staff notifications.',
    icon: Bell
  }
]

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Feature Access Modal States
  const [featureRestaurant, setFeatureRestaurant] = useState<any>(null)
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false)
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({})
  const [savingFeatureKey, setSavingFeatureKey] = useState<string | null>(null)

  const { toast } = useToast()

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants')
      setRestaurants(res.data.data)
    } catch (error) {
      console.error("Error fetching restaurants", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const handleDeleteRestaurant = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the restaurant "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(`/admin/restaurants/${id}`)
      toast({
        title: "Restaurant Deleted",
        description: `Successfully deleted ${name} and all its data.`,
      })
      fetchRestaurants()
    } catch (error: any) {
      toast({
        title: "Failed to Delete",
        description: error.response?.data?.message || "An error occurred while deleting the restaurant.",
        variant: "destructive"
      })
    }
  }

  const openRestaurantDetails = (restaurant: any) => {
    setSelectedRestaurant(restaurant)
    setIsModalOpen(true)
  }

  const openFeatureManagement = (restaurant: any) => {
    setFeatureRestaurant(restaurant)
    const initialFeatures: Record<string, boolean> = {
      isBillingEnabled: restaurant.isBillingEnabled !== false,
      isKdsEnabled: restaurant.isKdsEnabled !== false,
      isWaiterOrderingEnabled: restaurant.isWaiterOrderingEnabled !== false,
      isOnlineOrderingEnabled: restaurant.isOnlineOrderingEnabled !== false,
      isInventoryEnabled: restaurant.isInventoryEnabled !== false,
      isRecipesEnabled: restaurant.isRecipesEnabled !== false,
      isTablesEnabled: restaurant.isTablesEnabled !== false,
      isReportsEnabled: restaurant.isReportsEnabled !== false,
      isBranchesEnabled: restaurant.isBranchesEnabled !== false,
      isNotificationsEnabled: restaurant.isNotificationsEnabled !== false,
    }
    setFeatureStates(initialFeatures)
    setIsFeatureModalOpen(true)
  }

  const handleToggleFeature = async (featureKey: string, newValue: boolean) => {
    if (!featureRestaurant) return
    setSavingFeatureKey(featureKey)
    const updatedFeatures = { ...featureStates, [featureKey]: newValue }
    setFeatureStates(updatedFeatures)

    try {
      await api.put(`/admin/restaurants/${featureRestaurant._id}/features`, {
        [featureKey]: newValue
      })

      // Update local restaurant in list
      setRestaurants(prev => prev.map(r => {
        if (r._id === featureRestaurant._id) {
          return { ...r, [featureKey]: newValue }
        }
        return r
      }))

      const featureDef = FEATURE_LIST.find(f => f.key === featureKey)
      toast({
        title: newValue ? "Feature Enabled" : "Feature Disabled",
        description: `${featureDef?.label || featureKey} is now ${newValue ? 'ACTIVE' : 'DISABLED'} for ${featureRestaurant.name}.`,
      })
    } catch (err: any) {
      // Revert on error
      setFeatureStates(prev => ({ ...prev, [featureKey]: !newValue }))
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || "Could not update feature access.",
        variant: "destructive"
      })
    } finally {
      setSavingFeatureKey(null)
    }
  }

  const handleDownloadJson = () => {
    if (!selectedRestaurant) return
    const data = {
      name: selectedRestaurant.name,
      owner: selectedRestaurant.ownerId,
      stats: selectedRestaurant.stats
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedRestaurant.name.replace(/\s+/g, '-').toLowerCase()}-sales.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Platform Overview</h2>
        <p className="text-gray-500">Monitor all registered restaurants, their performance, and configure feature access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Restaurants</CardTitle>
            <Building2 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurants.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 py-4">Loading data...</p>
          ) : restaurants.length === 0 ? (
            <p className="text-gray-500 py-4">No restaurants found on the platform.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Restaurant Details</th>
                    <th className="px-4 py-3 font-semibold text-center">Owner</th>
                    <th className="px-4 py-3 font-semibold text-center">Total Orders</th>
                    <th className="px-4 py-3 font-semibold text-center">Total Sales</th>
                    <th className="px-4 py-3 font-semibold text-center">Inventory</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((r) => (
                    <tr key={r._id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div 
                          className="font-semibold text-gray-900 cursor-pointer hover:underline"
                          onClick={() => openRestaurantDetails(r)}
                        >
                          {r.name}
                        </div>
                        <div className="text-xs text-gray-500">{r.city}, {r.state}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-medium">{r.ownerId?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{r.ownerId?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        <div className="flex items-center justify-center gap-1.5">
                          <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                          {r.stats?.totalOrders || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-600">
                        <div className="flex items-center justify-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          ₹{(r.stats?.totalSales || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        <div className="flex items-center justify-center gap-1.5">
                          <PackageSearch className="w-4 h-4 text-gray-400" />
                          {r.stats?.inventoryItems || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5 text-xs font-medium"
                            onClick={() => openFeatureManagement(r)}
                            title="Manage Feature Access"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" /> Features
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                            onClick={() => openRestaurantDetails(r)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                            onClick={() => handleDeleteRestaurant(r._id, r.name)}
                            title="Delete Restaurant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Access Management Dialog */}
      <Dialog open={isFeatureModalOpen} onOpenChange={setIsFeatureModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Feature Access & Modules</DialogTitle>
                <DialogDescription>
                  Configure active modules for <span className="font-semibold text-gray-900">{featureRestaurant?.name}</span>. Disabled modules will appear locked and unclickable in the owner's portal.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {FEATURE_LIST.map((feature) => {
              const Icon = feature.icon
              const isEnabled = featureStates[feature.key] ?? true
              const isSaving = savingFeatureKey === feature.key

              return (
                <div 
                  key={feature.key}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isEnabled 
                      ? 'bg-white border-gray-200 shadow-sm' 
                      : 'bg-gray-50/80 border-gray-200/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 pr-4">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isEnabled ? 'bg-orange-50 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-gray-900">{feature.label}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 font-medium ${
                            isEnabled 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}
                        >
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    <Switch 
                      checked={isEnabled}
                      disabled={isSaving}
                      onCheckedChange={(checked) => handleToggleFeature(feature.key, checked)}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t pt-4 mt-4 flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-4 px-6 rounded-b-lg">
            <span className="text-xs text-gray-500">Changes take effect instantly on the restaurant portal.</span>
            <Button onClick={() => setIsFeatureModalOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restaurant Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Restaurant Details</DialogTitle>
          </DialogHeader>
          
          {selectedRestaurant && (
            <div className="space-y-6 mt-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedRestaurant.name}</h3>
                <p className="text-sm text-gray-500">{selectedRestaurant.address}</p>
                <p className="text-sm text-gray-500">{selectedRestaurant.city}, {selectedRestaurant.state} {selectedRestaurant.zipCode}</p>
                <div className="mt-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${selectedRestaurant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedRestaurant.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Owner Information</h4>
                <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {selectedRestaurant.ownerId?.name || 'N/A'}</p>
                <p className="text-sm text-gray-700"><span className="font-medium">Email:</span> {selectedRestaurant.ownerId?.email || 'N/A'}</p>
                <p className="text-sm text-gray-700"><span className="font-medium">Phone:</span> {selectedRestaurant.ownerId?.phone || 'N/A'}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">Total Orders</div>
                    <div className="font-bold text-gray-900">{selectedRestaurant.stats?.totalOrders || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">Total Sales</div>
                    <div className="font-bold text-green-600">₹{(selectedRestaurant.stats?.totalSales || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">Inventory Items</div>
                    <div className="font-bold text-gray-900">{selectedRestaurant.stats?.inventoryItems || 0}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-end">
                <Button onClick={handleDownloadJson} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Sales Data (JSON)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
