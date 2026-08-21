import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, UtensilsCrossed, TrendingUp, PackageSearch, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Platform Overview</h2>
        <p className="text-gray-500">Monitor all registered restaurants and their performance.</p>
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
                    <th className="px-4 py-3 font-semibold text-center">Inventory Items</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((r) => (
                    <tr key={r._id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{r.name}</div>
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteRestaurant(r._id, r.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
