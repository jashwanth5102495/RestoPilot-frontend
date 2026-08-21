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
import { useToast } from "@/hooks/use-toast"

export default function Menu() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form states
  const [dishName, setDishName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [taxRate, setTaxRate] = useState('5')
  const [description, setDescription] = useState('')

  // Recipe builder state
  const [recipeItems, setRecipeItems] = useState<any[]>([])
  const [selectedIngId, setSelectedIngId] = useState('')
  const [ingQuantity, setIngQuantity] = useState('')
  const [ingUnit, setIngUnit] = useState('g')

  const fetchMenuData = async () => {
    try {
      const [catsRes, dishesRes, ingRes] = await Promise.all([
        api.get('/categories'),
        api.get('/dishes'),
        api.get('/ingredients')
      ])
      setCategories([{ _id: 'All', name: 'All' }, ...catsRes.data.data])
      setDishes(dishesRes.data.data)
      setIngredients(ingRes.data.data || [])
    } catch (error) {
      console.error('Error fetching menu data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuData()
  }, [])

  const filteredMenu = dishes.filter(dish => {
    const matchesCategory = activeCategory === 'All' || dish.categoryId?.name === activeCategory || dish.categoryId?._id === activeCategory
    const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleSelectIngredient = (id: string) => {
    setSelectedIngId(id)
    const ing = ingredients.find(i => i._id === id)
    if (ing) {
      setIngUnit(ing.unit)
    }
  }

  const handleAddRecipeItem = () => {
    if (!selectedIngId || !ingQuantity) return
    const ing = ingredients.find(i => i._id === selectedIngId)
    if (!ing) return

    const exists = recipeItems.find(item => item.ingredientId === selectedIngId)
    if (exists) {
      setRecipeItems(prev => prev.map(item => 
        item.ingredientId === selectedIngId 
          ? { ...item, quantity: item.quantity + Number(ingQuantity) } 
          : item
      ))
    } else {
      setRecipeItems(prev => [...prev, {
        ingredientId: selectedIngId,
        name: ing.name,
        quantity: Number(ingQuantity),
        unit: ingUnit
      }])
    }

    setSelectedIngId('')
    setIngQuantity('')
  }

  const handleRemoveRecipeItem = (id: string) => {
    setRecipeItems(prev => prev.filter(item => item.ingredientId !== id))
  }

  const handleSaveDish = async () => {
    if (!dishName || !selectedCategoryId || !price) {
      toast({
        title: "Validation Error",
        description: "Please fill out Dish Name, Category, and Price.",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const dishRes = await api.post('/dishes', {
        name: dishName,
        categoryId: selectedCategoryId,
        price: Number(price),
        taxRate: Number(taxRate),
        description,
        isAvailable: true
      })
      
      const createdDish = dishRes.data.data

      if (recipeItems.length > 0) {
        await api.post('/recipes', {
          dishId: createdDish._id,
          items: recipeItems.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit
          }))
        })
      }

      toast({
        title: "Dish Saved",
        description: `"${dishName}" has been successfully added to your menu.`,
      })

      // Reset form states
      setDishName('')
      setSelectedCategoryId('')
      setPrice('')
      setTaxRate('5')
      setDescription('')
      setRecipeItems([])
      setIsDialogOpen(false)

      // Refresh dishes list
      fetchMenuData()
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.response?.data?.message || "Failed to save the dish. Please verify details.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDish = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return

    try {
      await api.delete(`/dishes/${id}`)
      toast({
        title: "Dish Deleted",
        description: "Dish deleted successfully."
      })
      fetchMenuData()
    } catch (error) {
      console.error(error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete dish.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Menu Management</h1>
          <p className="text-gray-500">Manage your restaurant dishes and their availability.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Dish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Dish</DialogTitle>
              <DialogDescription>
                Create a new dish for your menu. Configure its recipe details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dish Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Butter Chicken" 
                    value={dishName}
                    onChange={(e: any) => setDishName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select 
                    id="category" 
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select category...</option>
                    {categories.filter(c => c._id !== 'All').map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price (₹) *</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="280" 
                    value={price}
                    onChange={(e: any) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input 
                    id="tax" 
                    type="number" 
                    value={taxRate}
                    onChange={(e: any) => setTaxRate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input 
                  id="desc" 
                  placeholder="Brief description of the dish..." 
                  value={description}
                  onChange={(e: any) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Configure Predefined Recipe</h3>
                <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100">
                  Select ingredients and quantities. When this dish is sold, inventory will be deducted automatically in real-time.
                </div>
                
                <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Ingredient</Label>
                    <select 
                      value={selectedIngId}
                      onChange={(e) => handleSelectIngredient(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">-- Choose ingredient --</option>
                      {ingredients.map(i => (
                        <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32 space-y-1">
                    <Label className="text-xs">Qty ({ingUnit})</Label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 250" 
                      value={ingQuantity}
                      onChange={(e: any) => setIngQuantity(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <Button type="button" onClick={handleAddRecipeItem} size="sm" variant="secondary" className="h-9">
                    Add
                  </Button>
                </div>

                {recipeItems.length > 0 && (
                  <div className="border rounded-md divide-y max-h-40 overflow-y-auto bg-white">
                    {recipeItems.map(item => (
                      <div key={item.ingredientId} className="flex justify-between items-center p-2 px-3 text-xs">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="bg-slate-50 px-2 py-0.5 rounded border text-slate-600">{item.quantity} {item.unit}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveRecipeItem(item.ingredientId)} 
                            className="text-red-500 h-6 w-6 p-0 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSaveDish} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Dish'}
              </Button>
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
              <TableHead>Availability</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p>Loading menu...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMenu.map((dish) => (
              <TableRow key={dish._id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="pl-6 font-medium text-gray-900">{dish.name}</TableCell>
                <TableCell className="text-gray-600">{dish.categoryId?.name || 'N/A'}</TableCell>
                <TableCell className="font-medium text-gray-900">₹{dish.price}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleDeleteDish(dish._id)} className="cursor-pointer text-red-600 flex items-center focus:bg-red-50 focus:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredMenu.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-gray-500">
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
