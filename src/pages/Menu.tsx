import { useState, useEffect, useRef } from 'react'
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
import { Switch } from "@/components/ui/switch"
import { Search, Plus, MoreVertical, Edit2, Copy, Trash2, CheckCircle2, XCircle, Loader2, Layers, SlidersHorizontal, Eye, EyeOff, Check, X } from "lucide-react"
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
  const isSubmittingRef = useRef(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editDishId, setEditDishId] = useState<string | null>(null)
  const [selectedDishForPanel, setSelectedDishForPanel] = useState<any | null>(null)

  // Category management modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [newCategoryModalName, setNewCategoryModalName] = useState('')
  const [newCategoryModalActive, setNewCategoryModalActive] = useState(true)
  const [creatingCategoryModal, setCreatingCategoryModal] = useState(false)

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

  const handleToggleCategory = async (id: string, newActiveState: boolean) => {
    // Optimistic update
    setCategories(prev => prev.map(c => c._id === id ? { ...c, isActive: newActiveState } : c))
    
    try {
      await api.patch(`/categories/${id}/toggle`, { isActive: newActiveState })
      toast({
        title: newActiveState ? "Category Visible" : "Category Hidden",
        description: `Category is now ${newActiveState ? "visible in" : "hidden from"} waiter, QR, and public menus.`
      })
    } catch (error: any) {
      // Revert on failure
      setCategories(prev => prev.map(c => c._id === id ? { ...c, isActive: !newActiveState } : c))
      toast({
        title: "Failed to update category visibility",
        description: error.response?.data?.message || "Something went wrong.",
        variant: "destructive"
      })
    }
  }

  const handleRenameCategory = async (id: string, name: string) => {
    if (!name.trim()) return
    try {
      await api.put(`/categories/${id}`, { name: name.trim() })
      setCategories(prev => prev.map(c => c._id === id ? { ...c, name: name.trim() } : c))
      setEditingCategoryId(null)
      toast({
        title: "Category Updated",
        description: `Category renamed to "${name.trim()}".`
      })
    } catch (error: any) {
      toast({
        title: "Rename Failed",
        description: error.response?.data?.message || "Failed to rename category.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCategory = async (id: string, name: string, count: number) => {
    if (count > 0) {
      if (!window.confirm(`Category "${name}" has ${count} dish(es) assigned to it. Are you sure you want to delete it?`)) {
        return
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
        return
      }
    }
    try {
      await api.delete(`/categories/${id}`)
      setCategories(prev => prev.filter(c => c._id !== id))
      if (activeCategory === name) {
        setActiveCategory('All')
      }
      toast({
        title: "Category Deleted",
        description: `Category "${name}" was deleted.`
      })
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to delete category.",
        variant: "destructive"
      })
    }
  }

  const handleCreateCategoryFromModal = async () => {
    if (!newCategoryModalName.trim()) return
    setCreatingCategoryModal(true)
    try {
      const res = await api.post('/categories', { 
        name: newCategoryModalName.trim(), 
        isActive: newCategoryModalActive 
      })
      const newCat = res.data.data
      setCategories(prev => [...prev, newCat])
      setNewCategoryModalName('')
      setNewCategoryModalActive(true)
      toast({
        title: "Category Created",
        description: `Category "${newCat.name}" created successfully.`
      })
    } catch (error: any) {
      toast({
        title: "Failed to create category",
        description: error.response?.data?.message || "Something went wrong.",
        variant: "destructive"
      })
    } finally {
      setCreatingCategoryModal(false)
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
    const catId = typeof dish.categoryId === 'object' ? (dish.categoryId?._id || '') : (dish.categoryId || '')
    setSelectedCategoryId(catId)
    setPrice(dish.price !== undefined ? dish.price.toString() : '')
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
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsCategoryModalOpen(true)}
            className="shadow-sm border-gray-300 hover:bg-gray-50"
          >
            <Layers className="w-4 h-4 mr-2 text-primary" /> Manage Categories
          </Button>
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
                        <option key={c._id} value={c._id}>
                          {c.name}{c.isActive === false ? ' (Hidden from Menu)' : ''}
                        </option>
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
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            {categories.map(c => {
              const isHidden = c._id !== 'All' && c.isActive === false
              return (
                <Badge 
                  key={c._id}
                  variant={activeCategory === c.name ? "default" : "secondary"}
                  className={`cursor-pointer px-3 py-1 text-sm font-medium transition-all flex items-center gap-1.5 ${
                    activeCategory === c.name 
                      ? 'bg-primary text-white shadow-sm' 
                      : isHidden 
                        ? 'bg-amber-50/80 border-amber-200 text-amber-700 hover:bg-amber-100/70' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveCategory(c.name)}
                >
                  {isHidden && <EyeOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  <span>{c.name}</span>
                  {isHidden && (
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1 py-0.5 rounded font-semibold ml-0.5 leading-none">
                      Hidden
                    </span>
                  )}
                </Badge>
              )
            })}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCategoryModalOpen(true)} 
              className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 font-semibold ml-1"
            >
              <SlidersHorizontal className="w-3 h-3" /> Manage Visibility
            </Button>
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
                <TableCell className="text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span>{dish.categoryId?.name || 'N/A'}</span>
                    {((dish.categoryId?.isActive === false) || (categories.find(c => c._id === (dish.categoryId?._id || dish.categoryId))?.isActive === false)) && (
                      <span className="inline-flex items-center text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium gap-1" title="This category is currently hidden in waiter and online menus">
                        <EyeOff className="w-2.5 h-2.5" /> Hidden Category
                      </span>
                    )}
                  </div>
                </TableCell>
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

      {/* Category Management & Visibility Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Category Visibility & Management</DialogTitle>
                <DialogDescription className="text-sm">
                  Toggle categories ON or OFF to control what is displayed to waiters, customers, and POS.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Add new category section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add New Category</Label>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Input 
                placeholder="e.g. Chef's Specials, Mocktails..."
                value={newCategoryModalName}
                onChange={(e: any) => setNewCategoryModalName(e.target.value)}
                className="bg-white flex-1"
                onKeyDown={(e: any) => { if (e.key === 'Enter') handleCreateCategoryFromModal(); }}
              />
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <Switch 
                    checked={newCategoryModalActive} 
                    onCheckedChange={setNewCategoryModalActive} 
                    id="new-cat-active"
                  />
                  <Label htmlFor="new-cat-active" className="text-xs font-medium cursor-pointer">
                    {newCategoryModalActive ? 'Show in Menu' : 'Hidden'}
                  </Label>
                </div>
                <Button 
                  onClick={handleCreateCategoryFromModal} 
                  disabled={creatingCategoryModal || !newCategoryModalName.trim()}
                  className="shrink-0"
                >
                  {creatingCategoryModal ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  Add Category
                </Button>
              </div>
            </div>
          </div>

          {/* Category Search & Counter */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-gray-500 font-medium">
              {categories.filter(c => c._id !== 'All').length} Categories Total • {categories.filter(c => c._id !== 'All' && c.isActive !== false).length} Visible in Menu
            </div>
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Filter categories..."
                value={categorySearch}
                onChange={(e: any) => setCategorySearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-white"
              />
            </div>
          </div>

          {/* Category List */}
          <div className="border rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
            {categories.filter(c => c._id !== 'All').filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => {
              const isEditing = editingCategoryId === cat._id;
              const catDishesCount = cat.dishCount !== undefined ? cat.dishCount : dishes.filter(d => (d.categoryId?._id || d.categoryId) === cat._id).length;
              const isVisible = cat.isActive !== false;

              return (
                <div key={cat._id} className="p-3 sm:px-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <Input 
                          value={editingCategoryName}
                          onChange={(e: any) => setEditingCategoryName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e: any) => {
                            if (e.key === 'Enter') handleRenameCategory(cat._id, editingCategoryName);
                            if (e.key === 'Escape') setEditingCategoryId(null);
                          }}
                        />
                        <Button size="sm" className="h-8 px-2.5" onClick={() => handleRenameCategory(cat._id, editingCategoryName)}>
                          <Check className="w-3.5 h-3.5 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingCategoryId(null)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-semibold text-gray-900 text-sm truncate">{cat.name}</span>
                        <Badge variant="secondary" className="text-[11px] font-medium bg-slate-100 text-slate-600 shrink-0">
                          {catDishesCount} {catDishesCount === 1 ? 'dish' : 'dishes'}
                        </Badge>
                        {isVisible ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold gap-1 shrink-0">
                            <Eye className="w-3 h-3" /> Visible
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold gap-1 shrink-0">
                            <EyeOff className="w-3 h-3" /> Hidden from Menu
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Switch 
                        checked={isVisible}
                        onCheckedChange={(checked) => handleToggleCategory(cat._id, checked)}
                        aria-label={`Toggle visibility of ${cat.name}`}
                      />
                      <span className="text-xs font-semibold w-14 text-right">
                        {isVisible ? (
                          <span className="text-emerald-600">Active</span>
                        ) : (
                          <span className="text-amber-600">Hidden</span>
                        )}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                          onClick={() => { setEditingCategoryId(cat._id); setEditingCategoryName(cat.name); }}
                          title="Rename category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCategory(cat._id, cat.name, catDishesCount)}
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-3 border-t text-xs text-gray-500">
            <span>💡 Changes take effect in real time on waiter, table QR, and online ordering menus.</span>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
