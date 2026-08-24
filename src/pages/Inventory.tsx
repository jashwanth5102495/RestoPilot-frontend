import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Package, AlertTriangle, IndianRupee, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Inventory() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [ingredients, setIngredients] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Quick purchase form states
  const [ingredientNameInput, setIngredientNameInput] = useState('')
  const [unitInput, setUnitInput] = useState('g')
  const [quantity, setQuantity] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')

  const fetchInventoryAndSuppliers = async () => {
    try {
      const [ingRes, supRes] = await Promise.all([
        api.get('/ingredients'),
        api.get('/suppliers')
      ])
      setIngredients(ingRes.data.data || [])
      setSuppliers(supRes.data.data || [])
    } catch (error) {
      console.error('Error fetching inventory details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckStatus = async () => {
    try {
      const res = await api.get('/inventory/checks/status')
      setCheckSummary(res.data.data)
    } catch (err) {
      console.error('Failed to fetch check status', err)
    }
  }

  useEffect(() => {
    fetchInventoryAndSuppliers()
    fetchCheckStatus()
  }, [])

  const filteredInventory = ingredients.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatus = (item: any) => {
    if (item.currentStock <= 0) return 'Out of Stock'
    if (item.currentStock <= item.minimumStock) return 'Low Stock'
    return 'Healthy'
  }

  // Calculated dynamic statistics
  const totalIngredients = ingredients.length
  const lowStockCount = ingredients.filter(i => i.currentStock > 0 && i.currentStock <= i.minimumStock).length
  const outOfStockCount = ingredients.filter(i => i.currentStock <= 0).length
  const totalStockValue = ingredients.reduce((sum, i) => sum + (Math.max(0, i.currentStock) * (i.averageCost || 0)), 0)

  const selectedIngredient = ingredients.find(i => i.name.toLowerCase() === ingredientNameInput.toLowerCase().trim())
  const currentStockText = selectedIngredient ? `${selectedIngredient.currentStock} ${selectedIngredient.unit}` : '--'
  const afterStockText = selectedIngredient && quantity ? `${selectedIngredient.currentStock + Number(quantity)} ${selectedIngredient.unit}` : (quantity ? `${quantity} units` : '--')

  const handleAddStock = async () => {
    if (!ingredientNameInput || !quantity) {
      toast({
        title: "Incomplete Fields",
        description: "Please fill out all the fields to record the purchase.",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      let ingId = selectedIngredient?._id
      let ingUnit = selectedIngredient?.unit || unitInput
      
      // Create ingredient if it doesn't exist
      if (!selectedIngredient) {
        const ingRes = await api.post('/ingredients', {
          name: ingredientNameInput.trim(),
          unit: unitInput,
          currentStock: 0,
          minimumStock: 5,
          averageCost: 0
        })
        ingId = ingRes.data.data._id
      }

      await api.post('/purchases', {
        paymentStatus: 'PAID',
        purchaseDate: new Date(),
        notes: `Inventory quick adjustment receipt`,
        items: [{
          ingredientId: ingId,
          quantity: Number(quantity),
          unitCost: 0,
          unit: ingUnit
        }]
      })

      toast({
        title: "Stock Added Successfully",
        description: `Successfully added ${quantity} ${ingUnit} to ${ingredientNameInput}.`
      })

      // Reset form states
      setIngredientNameInput('')
      setQuantity('')
      setSelectedSupplierId('')
      setIsDialogOpen(false)

      // Refresh data
      fetchInventoryAndSuppliers()
    } catch (error: any) {
      toast({
        title: "Failed to Add Stock",
        description: error.response?.data?.message || "Verify the details and try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory</h1>
          <p className="text-gray-500">Track ingredients, stock levels and movement.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Stock / Purchase</DialogTitle>
              <DialogDescription>
                Record a new stock purchase to update your inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="ingredient">Ingredient</Label>
                  <Input 
                    id="ingredient" 
                    placeholder="e.g. Chicken"
                    value={ingredientNameInput}
                    onChange={(e: any) => setIngredientNameInput(e.target.value)}
                    list="ingredient-suggestions"
                  />
                  <datalist id="ingredient-suggestions">
                    <option value="Chicken" />
                    <option value="Mutton" />
                    <option value="Fish" />
                    <option value="Paneer" />
                    <option value="Tomato" />
                    <option value="Onion" />
                    <option value="Garlic" />
                    <option value="Ginger" />
                    <option value="Butter" />
                    <option value="Cream" />
                    <option value="Milk" />
                    <option value="Cheese" />
                    <option value="Flour" />
                    <option value="Sugar" />
                    <option value="Salt" />
                    <option value="Rice" />
                    <option value="Oil" />
                    <option value="Ghee" />
                    {ingredients.map(i => <option key={i._id} value={i.name} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <select 
                    id="unit"
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="pcs">pcs</option>
                    <option value="pkts">pkts</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input 
                    id="qty" 
                    type="number" 
                    placeholder="0" 
                    value={quantity}
                    onChange={(e: any) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 flex justify-between">
                  <span>Current Stock:</span> <span>{currentStockText}</span>
                </p>
                <p className="text-sm font-medium text-green-600 flex justify-between mt-1">
                  <span>After Purchase:</span> <span>{afterStockText}</span>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStock} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Stock'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {checkSummary && !checkSummary.snoozedUntil && (checkSummary.summary.due > 0 || checkSummary.summary.overdue > 0) && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-900">Inventory Verification Required</h3>
                <p className="text-sm text-orange-800 mt-1">
                  {checkSummary.summary.overdue > 0 
                    ? `${checkSummary.summary.overdue} ingredients are overdue for physical verification.` 
                    : `${checkSummary.summary.due} ingredients are due for physical verification.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto bg-white border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={async () => {
                  try {
                    await api.patch('/inventory/checks/snooze', { snoozeHours: 24 });
                    fetchCheckStatus();
                  } catch (e) {}
                }}
              >
                Remind Me Later
              </Button>
              <Button 
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => window.location.href = '/inventory/check'}
              >
                Review Inventory
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Total Ingredients</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{loading ? '--' : totalIngredients}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Low Stock</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{loading ? '--' : lowStockCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Out of Stock</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{loading ? '--' : outOfStockCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Stock Value</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? '--' : `₹${Math.round(totalStockValue).toLocaleString()}`}
            </h3>
          </CardContent>
        </Card>
      </div>

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p>Loading inventory...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInventory.map((item) => {
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
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-orange-50">
                        View Movement
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!loading && filteredInventory.length === 0 && (
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
  )
}
