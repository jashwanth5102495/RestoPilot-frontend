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

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await api.get('/ingredients')
        setIngredients(response.data.data)
      } catch (error) {
        console.error('Error fetching inventory:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchIngredients()
  }, [])

  const filteredInventory = ingredients.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatus = (item: any) => {
    if (item.currentStock <= 0) return 'Out of Stock'
    if (item.currentStock <= item.minimumStock) return 'Low Stock'
    return 'Healthy'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory</h1>
          <p className="text-gray-500">Track ingredients, stock levels and movement.</p>
        </div>
        <Dialog>
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
              <div className="space-y-2">
                <Label htmlFor="ingredient">Ingredient</Label>
                <select id="ingredient" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                  <option value="">Select ingredient...</option>
                  {ingredients.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input id="qty" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Purchase Price (Total)</Label>
                  <Input id="price" type="number" placeholder="₹" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <select id="supplier" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                  <option value="">Select supplier...</option>
                  <option value="1">ABC Foods</option>
                  <option value="2">Fresh Farms</option>
                </select>
              </div>
              
              <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 flex justify-between">
                  <span>Current Stock:</span> <span>--</span>
                </p>
                <p className="text-sm font-medium text-green-600 flex justify-between mt-1">
                  <span>After Purchase:</span> <span>--</span>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline">Cancel</Button>
              <Button>Add Stock</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Total Ingredients</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">128</h3>
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
            <h3 className="text-2xl font-bold text-gray-900 mt-1">8</h3>
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
            <h3 className="text-2xl font-bold text-gray-900 mt-1">2</h3>
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
            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹2,84,500</h3>
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
