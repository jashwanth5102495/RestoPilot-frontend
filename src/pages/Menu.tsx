import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreVertical, Edit2, Copy, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function Menu() {
  const [categories, setCategories] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, dishesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/dishes')
        ])
        setCategories([{ _id: 'All', name: 'All' }, ...catsRes.data.data])
        setDishes(dishesRes.data.data)
      } catch (error) {
        console.error('Error fetching menu data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredMenu = dishes.filter(dish => {
    const matchesCategory = activeCategory === 'All' || dish.categoryId?.name === activeCategory || dish.categoryId?._id === activeCategory
    const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Menu Management</h1>
          <p className="text-gray-500">Manage your restaurant dishes and their availability.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Dish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Dish</DialogTitle>
              <DialogDescription>
                Create a new dish for your menu. You can link recipes later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dish Name</Label>
                  <Input id="name" placeholder="e.g. Butter Chicken" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select id="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select category...</option>
                    {categories.filter(c => c._id !== 'All').map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price (₹)</Label>
                  <Input id="price" type="number" placeholder="280" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input id="tax" type="number" defaultValue="5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" placeholder="Brief description of the dish..." />
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold mb-3 text-gray-900">Recipe / Ingredients</h3>
                <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                  You can configure the exact ingredients required for this dish. This helps track inventory automatically when a sale is made.
                </div>
                <Button variant="outline" className="w-full border-dashed text-primary hover:text-primary hover:bg-orange-50">
                  <Plus className="w-4 h-4 mr-2" /> Add Ingredient
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Dish</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            {categories.map(c => (
              <Badge 
                key={c._id}
                variant={activeCategory === c.name ? "default" : "secondary"}
                className={`cursor-pointer px-3 py-1 text-sm font-medium ${activeCategory === c.name ? 'bg-primary' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setActiveCategory(c.name)}
              >
                {c.name}
              </Badge>
            ))}
          </div>
          <div className="relative w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search menu..." 
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-gray-50 text-gray-500">
            <TableRow>
              <TableHead className="pl-6 py-4">Dish Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Recipe Status</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p>Loading menu...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMenu.map((dish) => (
              <TableRow key={dish._id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="pl-6 font-medium text-gray-900">{dish.name}</TableCell>
                <TableCell className="text-gray-600">{dish.categoryId?.name}</TableCell>
                <TableCell className="font-medium text-gray-900">₹{dish.price}</TableCell>
                <TableCell>
                  {/* Assuming recipe integration logic checks dish status. Just mock True if needed or derive it. */}
                  {true ? (
                    <div className="flex items-center text-sm text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full w-fit border border-green-200 font-medium gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full w-fit border border-gray-200 font-medium gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Missing
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`
                    ${dish.isAvailable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                  `}>
                    {dish.isAvailable ? 'Available' : 'Out of Stock'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="cursor-pointer text-gray-700 flex items-center">
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Dish
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-gray-700 flex items-center">
                        <Copy className="w-4 h-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-600 flex items-center focus:bg-red-50 focus:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredMenu.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 text-gray-300 mb-2" />
                    <p>No dishes found in this category.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
