import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Package, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function PublicInventory() {
  const { slug } = useParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [ingredients, setIngredients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [restockQty, setRestockQty] = useState('')
  const [isRestockOpen, setIsRestockOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const handleRestock = async () => {
    if (!restockQty || Number(restockQty) <= 0) {
      toast({ title: "Invalid Quantity", description: "Please enter a valid amount.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      await axios.post(`${API_URL}/public/inventory/${slug}/restock`, {
        items: [{
          ingredientId: selectedItem._id,
          quantity: Number(restockQty),
          unit: selectedItem.unit,
          unitCost: 0
        }]
      })

      toast({
        title: "Restock Successful",
        description: `Added ${restockQty} ${selectedItem.unit} to ${selectedItem.name}`
      })

      setRestockQty('')
      setIsRestockOpen(false)
      fetchInventory()
    } catch (error: any) {
      toast({
        title: "Restock Failed",
        description: error.response?.data?.message || "Failed to restock item.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
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
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Search ingredients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-lg shadow-sm"
          />
        </div>

        {/* List */}
        <div className="grid gap-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No ingredients found.</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <Card key={item._id} className="overflow-hidden shadow-sm hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-lg">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded">
                        Stock: {item.currentStock} {item.unit}
                      </span>
                    </div>
                  </div>
                  <Button 
                    className="shrink-0 h-10 px-4 rounded-xl gap-2 shadow-sm"
                    onClick={() => {
                      setSelectedItem(item)
                      setRestockQty('')
                      setIsRestockOpen(true)
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Restock
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
        <DialogContent className="max-w-[90vw] w-[400px] rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Restock {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gray-50 rounded-lg border text-sm flex justify-between font-medium">
              <span className="text-gray-500">Current Stock:</span>
              <span className="text-gray-900">{selectedItem?.currentStock} {selectedItem?.unit}</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Quantity ({selectedItem?.unit})</label>
              <Input 
                type="number"
                placeholder="0"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                className="h-12 text-lg text-center"
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setIsRestockOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-12" onClick={handleRestock} disabled={!restockQty || submitting}>
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Restock'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
