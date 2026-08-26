import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Search, Package, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function PublicInventory() {
  const { slug } = useParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [ingredients, setIngredients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  
  // Inline restock states
  const [inlineQuantities, setInlineQuantities] = useState<Record<string, string>>({})
  const [inlineUnits, setInlineUnits] = useState<Record<string, string>>({})
  const [inlineSubmitting, setInlineSubmitting] = useState<string | null>(null)

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/inventory/${slug}/ingredients`)
      setRestaurant(res.data.data.restaurant)
      setIngredients(res.data.data.ingredients || [])
    } catch (error: any) {
      console.error('Failed to load inventory', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load inventory portal.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) {
      fetchInventory()
    }
  }, [slug])

  const filteredItems = ingredients.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatus = (item: any) => {
    if (item.currentStock <= 0) return 'Out of Stock'
    if (item.currentStock <= item.minimumStock) return 'Low Stock'
    return 'Healthy'
  }

  const handleInlineRestock = async (item: any) => {
    const qty = inlineQuantities[item._id]
    if (!qty || Number(qty) <= 0) {
      toast({ title: "Invalid Quantity", description: "Please enter a valid quantity.", variant: "destructive" })
      return
    }
    
    const selectedUnit = inlineUnits[item._id] || item.unit

    setInlineSubmitting(item._id)
    try {
      await axios.post(`${API_URL}/public/inventory/${slug}/restock`, {
        items: [{
          ingredientId: item._id,
          quantity: Number(qty),
          unit: selectedUnit,
          unitCost: 0
        }]
      })

      toast({
        title: "Stock Added",
        description: `Successfully added ${qty} ${selectedUnit} to ${item.name}.`
      })

      setInlineQuantities(prev => ({ ...prev, [item._id]: '' }))
      fetchInventory()
    } catch (error: any) {
      toast({
        title: "Failed to Add Stock",
        description: error.response?.data?.message || "Something went wrong.",
        variant: "destructive"
      })
    } finally {
      setInlineSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p>Loading Inventory Portal...</p>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-4 text-center">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Portal Not Found</h2>
        <p>This inventory portal does not exist or is currently disabled.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {restaurant.name?.charAt(0) || 'R'}
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">{restaurant.name}</h1>
              <p className="text-xs text-gray-500 font-medium">Inventory Portal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-6 mt-4">
        <Card>
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search ingredients..." 
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50 text-gray-500">
                <TableRow>
                  <TableHead className="pl-6 py-4">Ingredient</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Minimum Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const status = getStatus(item)
                  return (
                    <TableRow key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="pl-6 font-medium text-gray-900">{item.name}</TableCell>
                      <TableCell className="font-bold text-gray-900">{item.currentStock} {item.unit}</TableCell>
                      <TableCell className="text-gray-500">{item.minimumStock} {item.unit}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`
                          ${status === 'Healthy' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                          ${status === 'Low Stock' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                          ${status === 'Out of Stock' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        `}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right pr-6 flex justify-end gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number"
                            placeholder="Qty"
                            className="w-20 h-8 text-sm"
                            value={inlineQuantities[item._id] || ''}
                            onChange={(e: any) => setInlineQuantities(prev => ({ ...prev, [item._id]: e.target.value }))}
                          />
                          <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-20"
                            value={inlineUnits[item._id] || item.unit}
                            onChange={(e: any) => setInlineUnits(prev => ({ ...prev, [item._id]: e.target.value }))}
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="pcs">pcs</option>
                            <option value="pkts">pkts</option>
                          </select>
                          <Button 
                            size="sm"
                            variant="secondary"
                            className="h-8"
                            disabled={!inlineQuantities[item._id] || inlineSubmitting === item._id}
                            onClick={() => handleInlineRestock(item)}
                          >
                            {inlineSubmitting === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Restock'}
                          </Button>
                        </div>
                        <Button variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-orange-50" disabled>
                          View Movement
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-gray-300 mb-2" />
                        <p>No ingredients found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
