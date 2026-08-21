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
import { Search, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Purchases() {
  const { toast } = useToast()
  const [purchases, setPurchases] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [selectedIngredientId, setSelectedIngredientId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')

  const fetchData = async () => {
    try {
      const [purRes, supRes, ingRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/ingredients')
      ])
      setPurchases(purRes.data.data || [])
      setSuppliers(supRes.data.data || [])
      setIngredients(ingRes.data.data || [])
    } catch (error) {
      console.error('Error fetching purchases data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredPurchases = purchases.filter(p => 
    p.purchaseNumber.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplierId?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreatePurchase = async () => {
    if (!selectedIngredientId || !quantity || !totalPrice || !selectedSupplierId) {
      toast({
        title: "Incomplete Fields",
        description: "Please fill out all the fields to record the purchase.",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const ing = ingredients.find(i => i._id === selectedIngredientId)
      await api.post('/purchases', {
        supplierId: selectedSupplierId,
        paymentStatus: 'PAID',
        purchaseDate: new Date(),
        notes: `Recorded via purchases panel`,
        items: [{
          ingredientId: selectedIngredientId,
          quantity: Number(quantity),
          unitCost: Number(totalPrice) / Number(quantity),
          unit: ing?.unit || 'pcs'
        }]
      })

      toast({
        title: "Purchase Recorded",
        description: `Purchase order registered successfully.`
      })

      // Reset form states
      setSelectedIngredientId('')
      setQuantity('')
      setTotalPrice('')
      setSelectedSupplierId('')
      setIsDialogOpen(false)

      // Refresh data
      fetchData()
    } catch (error: any) {
      toast({
        title: "Failed to record purchase",
        description: error.response?.data?.message || "Verify the details and try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate dynamic stats
  const totalPurchasesMonth = purchases
    .filter(p => {
      const date = new Date(p.purchaseDate)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    .reduce((sum, p) => sum + (p.total || 0), 0)

  const pendingPayments = purchases
    .filter(p => p.paymentStatus === 'PENDING')
    .reduce((sum, p) => sum + (p.total || 0), 0)

  const activeSuppliersCount = suppliers.filter(s => s.isActive).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchases</h1>
          <p className="text-gray-500">Track incoming stock and payments to suppliers.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> New Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record New Purchase</DialogTitle>
              <DialogDescription>
                Add ingredient purchases to dynamically adjust inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ingredient">Ingredient</Label>
                <select 
                  id="ingredient" 
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select ingredient...</option>
                  {ingredients.map(i => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="price">Purchase Cost (Total ₹)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="₹" 
                    value={totalPrice}
                    onChange={(e: any) => setTotalPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <select 
                  id="supplier" 
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePurchase} disabled={submitting}>
                {submitting ? 'Recording...' : 'Record Purchase'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Total Purchases (This Month)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? '--' : `₹${Math.round(totalPurchasesMonth).toLocaleString()}`}
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Pending Payments</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">
              {loading ? '--' : `₹${Math.round(pendingPayments).toLocaleString()}`}
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Active Suppliers</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {loading ? '--' : activeSuppliersCount}
            </h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search purchases..." 
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
                <TableHead className="pl-6 py-4">Purchase ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p>Loading purchases...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.map((p) => (
                <TableRow key={p._id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="pl-6 font-medium text-gray-900">{p.purchaseNumber}</TableCell>
                  <TableCell>{p.supplierId?.name || 'Unknown Supplier'}</TableCell>
                  <TableCell className="font-medium text-gray-900">₹{p.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${p.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      ${p.paymentStatus === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                      ${p.paymentStatus === 'REFUNDED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    `}>
                      {p.paymentStatus === 'PAID' ? 'Paid' : p.paymentStatus === 'PENDING' ? 'Pending' : 'Refunded'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(p.purchaseDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filteredPurchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p>No purchases found.</p>
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
