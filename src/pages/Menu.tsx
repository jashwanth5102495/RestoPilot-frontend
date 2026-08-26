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
import DishRecipeSidePanel from "@/components/DishRecipeSidePanel"

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
  const [editDishId, setEditDishId] = useState<string | null>(null)
  const [selectedDishForPanel, setSelectedDishForPanel] = useState<any | null>(null)

  // Form states
  const [dishName, setDishName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [taxRate, setTaxRate] = useState('5')
  const [description, setDescription] = useState('')

  // Inline category creation states
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  // Recipe builder state
  const [recipeItems, setRecipeItems] = useState<any[]>([])
  const [selectedIngId, setSelectedIngId] = useState('')
  const [ingQuantity, setIngQuantity] = useState('')
  const [ingUnit, setIngUnit] = useState('g')

  // Auto-fill template state
  const [templateMatchStatus, setTemplateMatchStatus] = useState<'none' | 'loading' | 'found'>('none')
  const [unmappedTemplateIngredients, setUnmappedTemplateIngredients] = useState<any[]>([])

  useEffect(() => {
    if (editDishId && recipeItems.length > 0) return; // Don't overwrite existing recipes
    
    const delayDebounceFn = setTimeout(async () => {
      if (dishName.trim().length > 2) {
        try {
          setTemplateMatchStatus('loading');
          const res = await api.get(`/recipes/templates/match?name=${encodeURIComponent(dishName.trim())}`);
          if (res.data.data) {
            setTemplateMatchStatus('found');
            
            const templateIngredients = res.data.data.ingredients;
            const newRecipeItems: any[] = [];
            const unmappedItems: any[] = [];
            
            templateIngredients.forEach((tIng: any) => {
              // Try to find matching ingredient in restaurant's inventory
              const matchingIng = ingredients.find(i => i.name.toLowerCase() === tIng.name.toLowerCase());
              if (matchingIng) {
                newRecipeItems.push({
                  ingredientId: matchingIng._id,
                  name: matchingIng.name,
                  quantity: tIng.quantity,
                  unit: matchingIng.unit
                });
              } else {
                unmappedItems.push({
                  templateName: tIng.name,
                  quantity: tIng.quantity,
                  unit: tIng.unit
                });
              }
            });
            
            setRecipeItems(newRecipeItems);
            setUnmappedTemplateIngredients(unmappedItems);
          }
        } catch (err) {
          // 404 or other errors mean no template found
          setTemplateMatchStatus('none');
          setUnmappedTemplateIngredients([]);
          if (!editDishId) {
             // If we're creating a new dish and no template found, keep it empty
             setRecipeItems([]);
          }
        }
      } else {
        setTemplateMatchStatus('none');
        setUnmappedTemplateIngredients([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [dishName, editDishId, ingredients]);

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setCreatingCategory(true)
    try {
      const res = await api.post('/categories', { name: newCategoryName.trim() })
      const newCat = res.data.data
      
      setCategories(prev => [...prev, newCat])
      setSelectedCategoryId(newCat._id)
      setNewCategoryName('')
      setShowNewCategoryForm(false)
      
      toast({
        title: "Category Created",
        description: `Category "${newCat.name}" has been created and selected.`
      })
    } catch (error: any) {
      toast({
        title: "Failed to create category",
        description: error.response?.data?.message || "Something went wrong.",
        variant: "destructive"
      })
    } finally {
      setCreatingCategory(false)
    }
  }

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

  const handleMapMissingIngredient = (templateItem: any, selectedMapIngId: string) => {
    if (!selectedMapIngId) return;
    const ing = ingredients.find(i => i._id === selectedMapIngId);
    if (!ing) return;

    setRecipeItems(prev => [...prev, {
      ingredientId: selectedMapIngId,
      name: ing.name,
      quantity: templateItem.quantity,
      unit: ing.unit
    }]);

    setUnmappedTemplateIngredients(prev => 
      prev.filter(item => item.templateName !== templateItem.templateName)
    );
  }

  const openEditDialog = async (dish: any) => {
    setEditDishId(dish._id)
    setDishName(dish.name)
    setSelectedCategoryId(dish.categoryId?._id || '')
    setPrice(dish.price.toString())
    setTaxRate(dish.taxRate?.toString() || '5')
    setDescription(dish.description || '')
    
    // Fetch its recipe
    try {
      const res = await api.get('/recipes')
      const recipes = res.data.data
      const myRecipe = recipes.find((r: any) => r._id === dish._id)
      if (myRecipe && myRecipe.recipe && myRecipe.recipe.items) {
        // Map the items to include names
        const loadedItems = myRecipe.recipe.items.map((item: any) => {
          const ing = ingredients.find(i => i._id === item.ingredientId)
          return {
            ingredientId: item.ingredientId,
            name: ing ? ing.name : 'Unknown',
            quantity: item.quantity,
            unit: ing ? ing.unit : ''
          }
        })
        setRecipeItems(loadedItems)
      } else {
        setRecipeItems([])
      }
    } catch (err) {
      console.error(err)
      setRecipeItems([])
    }
    
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditDishId(null)
    setDishName('')
    setSelectedCategoryId('')
    setPrice('')
    setTaxRate('5')
    setDescription('')
    setRecipeItems([])
    setSelectedIngId('')
    setIngQuantity('')
    setShowNewCategoryForm(false)
    setNewCategoryName('')
    setTemplateMatchStatus('none')
    setUnmappedTemplateIngredients([])
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
      const dishPayload = {
        name: dishName,
        categoryId: selectedCategoryId,
        price: Number(price),
        taxRate: Number(taxRate),
        description
      }

      let savedDishId = editDishId

      if (editDishId) {
        await api.put(`/dishes/${editDishId}`, dishPayload)
        toast({ title: "Dish Updated", description: "Dish details updated successfully." })
      } else {
        const dishRes = await api.post('/dishes', dishPayload)
        savedDishId = dishRes.data.data._id
        toast({ title: "Dish Added", description: "New dish created successfully." })
      }

      // Save recipe
      if (recipeItems.length > 0 && savedDishId) {
        const recipePayload = {
          dishId: savedDishId,
          items: recipeItems.map(item => ({
            ingredientId: item.ingredientId,
            quantity: Number(item.quantity)
          }))
        }
        await api.post('/recipes', recipePayload)
      }

      setIsDialogOpen(false)
      resetForm()
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
                    list="dish-suggestions"
                  />
                  <datalist id="dish-suggestions">
                    <option value="Butter Chicken" />
                    <option value="Paneer Butter Masala" />
                    <option value="Chicken Biryani" />
                    <option value="Veg Biryani" />
                    <option value="Dal Makhani" />
                    <option value="Masala Dosa" />
                    <option value="Idli Sambar" />
                    <option value="Tandoori Roti" />
                    <option value="Garlic Naan" />
                    <option value="Gulab Jamun" />
                  </datalist>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="category">Category *</Label>
                    <button 
                      type="button" 
                      onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      {showNewCategoryForm ? "Cancel" : "+ New"}
                    </button>
                  </div>
                  {showNewCategoryForm ? (
                    <div className="flex gap-2">
                      <Input 
                        placeholder="New category name..." 
                        value={newCategoryName}
                        onChange={(e: any) => setNewCategoryName(e.target.value)}
                        className="h-10 text-sm"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleCreateCategory}
                        disabled={creatingCategory}
                        className="h-10 text-xs px-3"
                      >
                        {creatingCategory ? "..." : "Create"}
                      </Button>
                    </div>
                  ) : (
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
                  )}
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
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-900">Configure Predefined Recipe</h3>
                  {templateMatchStatus === 'loading' && (
                    <span className="text-xs text-blue-500 flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Searching template...</span>
                  )}
                  {templateMatchStatus === 'found' && (
                    <span className="text-xs text-green-600 font-medium flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> ✓ Standard recipe automatically found</span>
                  )}
                </div>
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
                    {recipeItems.map((item, idx) => (
                      <div key={item.ingredientId || idx} className="flex justify-between items-center p-2 px-3 text-xs">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <Input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = e.target.value;
                              setRecipeItems(prev => prev.map(p => p.ingredientId === item.ingredientId ? {...p, quantity: newQty} : p));
                            }}
                            className="w-16 h-6 text-xs p-1 text-center"
                          />
                          <span className="text-slate-500">{item.unit}</span>
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

                {unmappedTemplateIngredients.length > 0 && (
                  <div className="mt-4 border border-orange-200 rounded-md bg-orange-50/30 overflow-hidden">
                    <div className="bg-orange-100/50 px-3 py-2 border-b border-orange-200 flex items-center">
                      <XCircle className="w-4 h-4 text-orange-600 mr-2" />
                      <h4 className="text-xs font-semibold text-orange-900">Missing inventory ingredients</h4>
                    </div>
                    <div className="divide-y divide-orange-100">
                      {unmappedTemplateIngredients.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 px-3 text-xs flex-wrap gap-2">
                          <div>
                            <span className="font-medium text-slate-700">{item.templateName}</span>
                            <span className="text-slate-500 ml-2">({item.quantity} {item.unit})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select 
                              onChange={(e) => handleMapMissingIngredient(item, e.target.value)}
                              className="h-7 rounded-md border border-orange-200 bg-white px-2 py-0 focus:outline-none focus:ring-1 focus:ring-orange-400"
                              defaultValue=""
                            >
                              <option value="" disabled>Map to inventory...</option>
                              {ingredients.map(i => (
                                <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
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
              <TableRow key={dish._id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedDishForPanel(dish)}>
                <TableCell className="pl-6 font-medium text-gray-900 group-hover:text-primary transition-colors">
                  {dish.name}
                </TableCell>
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
                    <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(dish); }} className="cursor-pointer flex items-center">
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteDish(dish._id); }} className="cursor-pointer text-red-600 flex items-center focus:bg-red-50 focus:text-red-700">
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

      <DishRecipeSidePanel 
        isOpen={!!selectedDishForPanel}
        dish={selectedDishForPanel}
        onClose={() => setSelectedDishForPanel(null)}
        allIngredients={ingredients}
      />
    </div>
  )
}
