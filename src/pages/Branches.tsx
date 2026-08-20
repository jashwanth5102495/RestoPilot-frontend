import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Lock, Unlock, MessageCircle, MapPin, Building2, GitBranch, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, ChefHat, Package } from 'lucide-react'

type Ingredient = {
  id: string
  name: string
  unit: string
  stock: number
}

type RecipeItem = {
  ingredientId: string
  quantity: number
  unit?: string
}

type Dish = {
  id: string
  name: string
  price: number
  recipe: RecipeItem[]
}

export default function Branches() {
  const { toast } = useToast()
  const [branches, setBranches] = useState<any[]>([])
  
  // Agent mode states
  const [isAgentMode, setIsAgentMode] = useState(false)
  const [agentCodeInput, setAgentCodeInput] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)
  
  // Branch creation wizard states
  const [wizardStep, setWizardStep] = useState(1) // 1: Info, 2: Inventory, 3: Menu & Recipes
  const [newBranchId, setNewBranchId] = useState<string | null>(null)
  
  // Step 1: Info Form
  const [branchInfo, setBranchInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    restaurantType: 'Fine Dining'
  })

  // Step 2: Inventory State
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'g', stock: '' })

  // Step 3: Dishes State
  const [dishes, setDishes] = useState<Dish[]>([])
  const [newDish, setNewDish] = useState({ name: '', price: '' })
  const [activeDishId, setActiveDishId] = useState<string | null>(null)
  const [recipeItem, setRecipeItem] = useState({ ingredientId: '', quantity: '', unit: 'g' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchBranches = async () => {
    try {
      const res = await api.get('/restaurants/branches')
      setBranches(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch branches:', error)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const restaurantName = user?.restaurant?.name || 'my restaurant'
  
  const handleRequestWhatsApp = () => {
    const text = `Hi, I would like to add a new branch for my restaurant ${restaurantName}. Please help me set it up.`
    const url = `https://wa.me/918328246413?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleVerifyAgentCode = async () => {
    try {
      const res = await api.post('/restaurants/verify-agent', { code: agentCodeInput })
      setIsAgentMode(true)
      setShowCodeInput(false)
      setWizardStep(1)
      toast({
        title: "Agent Access Granted",
        description: `Welcome Agent, ${res.data.data.agentName || 'Agent'}. You can now configure this branch setup.`,
      })
    } catch (error: any) {
      toast({
        title: "Invalid Agent Code",
        description: error.response?.data?.message || "Please enter the correct agent setup code.",
        variant: "destructive"
      })
    }
  }

  // Step 1: Submit info & create branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await api.post('/restaurants', branchInfo)
      const branch = res.data.data
      setNewBranchId(branch._id)
      setWizardStep(2)
      toast({
        title: "Branch Created",
        description: "Restaurant details saved. Proceeding to inventory setup.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to create branch",
        description: error.response?.data?.message || "Verify the details and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Inventory actions
  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.stock) return
    setIngredients(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: newIngredient.name,
        unit: newIngredient.unit,
        stock: Number(newIngredient.stock)
      }
    ])
    setNewIngredient({ name: '', unit: 'g', stock: '' })
  }

  const handleRemoveIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id))
    setDishes(prev => prev.map(d => ({
      ...d,
      recipe: d.recipe.filter(r => r.ingredientId !== id)
    })))
  }

  // Step 3: Dishes & Recipes actions
  const handleAddDish = () => {
    if (!newDish.name || !newDish.price) return
    const id = Math.random().toString(36).substr(2, 9)
    setDishes(prev => [
      ...prev,
      {
        id,
        name: newDish.name,
        price: Number(newDish.price),
        recipe: []
      }
    ])
    setNewDish({ name: '', price: '' })
    setActiveDishId(id)
  }

  const handleAddRecipeItem = (dishId: string) => {
    if (!recipeItem.ingredientId || !recipeItem.quantity) return
    
    setDishes(prev => prev.map(dish => {
      if (dish.id === dishId) {
        const exists = dish.recipe.find(r => r.ingredientId === recipeItem.ingredientId)
        if (exists) {
          return {
            ...dish,
            recipe: dish.recipe.map(r => r.ingredientId === recipeItem.ingredientId ? { ...r, quantity: r.quantity + Number(recipeItem.quantity), unit: recipeItem.unit || r.unit } : r)
          }
        }
        return {
          ...dish,
          recipe: [...dish.recipe, { ingredientId: recipeItem.ingredientId, quantity: Number(recipeItem.quantity), unit: recipeItem.unit }]
        }
      }
      return dish
    }))
    setRecipeItem({ ingredientId: '', quantity: '', unit: 'g' })
  }

  const handleRemoveRecipeItem = (dishId: string, ingredientId: string) => {
    setDishes(prev => prev.map(dish => {
      if (dish.id === dishId) {
        return { ...dish, recipe: dish.recipe.filter(r => r.ingredientId !== ingredientId) }
      }
      return dish
    }))
  }

  // Wizard Complete Setup
  const handleCompleteSetup = async () => {
    if (!newBranchId) return
    setIsSubmitting(true)
    try {
      await api.post('/setup/complete', { 
        ingredients, 
        dishes,
        restaurantId: newBranchId 
      })
      
      toast({
        title: "Setup Complete!",
        description: "The new branch menu and inventory have been configured.",
      })
      
      // Reset wizard states
      setIsAgentMode(false)
      setWizardStep(1)
      setNewBranchId(null)
      setIngredients([])
      setDishes([])
      
      // Refresh branches list
      fetchBranches()
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.response?.data?.message || "There was a problem saving your setup.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- RENDERING NORMAL MODE ---
  if (!isAgentMode) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Branches</h1>
            <p className="text-gray-500">Manage your restaurant branches and locations.</p>
          </div>
          {!showCodeInput ? (
            <Button variant="outline" onClick={() => setShowCodeInput(true)} className="gap-2 bg-white">
              <Unlock className="w-4 h-4" /> Agent Code
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Enter agent code..." 
                value={agentCodeInput}
                onChange={(e: any) => setAgentCodeInput(e.target.value)}
                className="w-44 bg-white h-9"
                type="password"
              />
              <Button size="sm" onClick={handleVerifyAgentCode}>Verify</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCodeInput(false)}>Cancel</Button>
            </div>
          )}
        </div>
        
        {branches.length > 1 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {branches.map(branch => (
              <Card key={branch._id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">{branch.name}</CardTitle>
                    {!branch.parentRestaurantId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Main Branch
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                        Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-start text-sm text-gray-500">
                      <Building2 className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                      <span>{branch.city || 'N/A'}</span>
                    </div>
                    <div className="flex items-start text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{branch.address || 'No address provided'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Add New Branch</h2>
            <p className="text-gray-500 max-w-md mb-6">
              Adding a new branch requires assistance from our team. Send us a request on WhatsApp and we'll set it up for you.
            </p>
            <Button 
              onClick={handleRequestWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Request on WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- RENDERING AGENT WIZARD MODE ---
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Branch Agent Setup Wizard</h1>
          <p className="text-gray-500">Add branch details and configure initial inventory and menu.</p>
        </div>
        <Button variant="ghost" onClick={() => setIsAgentMode(false)} className="text-gray-500 hover:text-red-600">
          Cancel Setup
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center py-4 bg-white rounded-lg border border-slate-200">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${wizardStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <div className={`w-24 h-1 mx-2 ${wizardStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${wizardStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
          <div className={`w-24 h-1 mx-2 ${wizardStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${wizardStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
            3
          </div>
        </div>
      </div>

      {/* Step 1: Restaurant Info */}
      {wizardStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Branch Details</CardTitle>
            <CardDescription>Enter the general business details of the new branch location.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateBranch}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input 
                    id="branchName" 
                    placeholder="e.g. Spice Garden (Main Road)" 
                    value={branchInfo.name}
                    onChange={(e: any) => setBranchInfo(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchPhone">Phone Number</Label>
                  <Input 
                    id="branchPhone" 
                    placeholder="e.g. +91 9876543210" 
                    value={branchInfo.phone}
                    onChange={(e: any) => setBranchInfo(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchEmail">Email Address</Label>
                  <Input 
                    id="branchEmail" 
                    type="email"
                    placeholder="e.g. branch@spicegarden.com" 
                    value={branchInfo.email}
                    onChange={(e: any) => setBranchInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchType">Restaurant Type</Label>
                  <select 
                    id="branchType"
                    value={branchInfo.restaurantType}
                    onChange={(e) => setBranchInfo(prev => ({ ...prev, restaurantType: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Fine Dining">Fine Dining</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Buffet">Buffet</option>
                    <option value="Pub/Bar">Pub/Bar</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="branchAddress">Address</Label>
                  <Input 
                    id="branchAddress" 
                    placeholder="e.g. Plot No 12, Market Street" 
                    value={branchInfo.address}
                    onChange={(e: any) => setBranchInfo(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchCity">City</Label>
                  <Input 
                    id="branchCity" 
                    placeholder="e.g. Guntur" 
                    value={branchInfo.city}
                    onChange={(e: any) => setBranchInfo(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branchState">State</Label>
                    <Input 
                      id="branchState" 
                      placeholder="AP" 
                      value={branchInfo.state}
                      onChange={(e: any) => setBranchInfo(prev => ({ ...prev, state: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchPincode">Pincode</Label>
                    <Input 
                      id="branchPincode" 
                      placeholder="522001" 
                      value={branchInfo.pincode}
                      onChange={(e: any) => setBranchInfo(prev => ({ ...prev, pincode: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end p-6 border-t">
              <Button type="submit" disabled={isSubmitting} className="bg-primary">
                {isSubmitting ? 'Saving...' : 'Next: Setup Inventory'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Step 2: Setup Inventory */}
      {wizardStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Setup Branch Inventory</CardTitle>
            <CardDescription>Add the raw ingredients available at this branch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-2 flex-1">
                <Label htmlFor="ingName">Ingredient Name</Label>
                <Input 
                  id="ingName" 
                  placeholder="e.g. Chicken" 
                  value={newIngredient.name}
                  onChange={(e: any) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2 w-full sm:w-32">
                <Label htmlFor="ingUnit">Unit</Label>
                <select 
                  id="ingUnit"
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="l">Liters (L)</option>
                  <option value="pcs">Pieces (pcs)</option>
                </select>
              </div>
              <div className="space-y-2 w-full sm:w-32">
                <Label htmlFor="ingStock">Initial Stock</Label>
                <Input 
                  id="ingStock" 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={newIngredient.stock}
                  onChange={(e: any) => setNewIngredient(prev => ({ ...prev, stock: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddIngredient} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>

            {ingredients.length > 0 ? (
              <div className="border rounded-md divide-y overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-50 p-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="col-span-6">Ingredient Name</div>
                  <div className="col-span-4">Starting Stock</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>
                <div className="divide-y max-h-80 overflow-y-auto bg-white">
                  {ingredients.map(ing => (
                    <div key={ing.id} className="grid grid-cols-12 p-3 items-center hover:bg-slate-50/50">
                      <div className="col-span-6 font-medium">{ing.name}</div>
                      <div className="col-span-4">{ing.stock} {ing.unit}</div>
                      <div className="col-span-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveIngredient(ing.id)} className="text-red-500 h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No ingredients added yet. Add raw materials above.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="outline" onClick={() => setWizardStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={() => setWizardStep(3)} disabled={ingredients.length === 0} className="bg-primary hover:bg-primary/90">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Setup Menu & Recipes */}
      {wizardStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary" /> Setup Menu & Recipes</CardTitle>
            <CardDescription>Add menu dishes and link the ingredients required to prepare them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-2 flex-1">
                <Label htmlFor="dishName">Dish Name</Label>
                <Input 
                  id="dishName" 
                  placeholder="e.g. Butter Chicken" 
                  value={newDish.name}
                  onChange={(e: any) => setNewDish(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2 w-full sm:w-48">
                <Label htmlFor="dishPrice">Selling Price (₹)</Label>
                <Input 
                  id="dishPrice" 
                  type="number" 
                  placeholder="e.g. 250" 
                  value={newDish.price}
                  onChange={(e: any) => setNewDish(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddDish} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" /> Add Dish
              </Button>
            </div>

            {dishes.length > 0 ? (
              <div className="space-y-6">
                {dishes.map(dish => (
                  <div key={dish.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <div className="bg-slate-100 p-4 flex justify-between items-center cursor-pointer" onClick={() => setActiveDishId(activeDishId === dish.id ? null : dish.id)}>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{dish.name}</h3>
                        <p className="text-sm text-slate-500">₹{dish.price} • {dish.recipe.length} ingredients</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDishes(prev => prev.filter(d => d.id !== dish.id)) }} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {activeDishId === dish.id && (
                      <div className="p-4 border-t border-slate-200 space-y-4">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1 space-y-2">
                            <Label>Select Ingredient</Label>
                            <select 
                              value={recipeItem.ingredientId}
                              onChange={(e) => setRecipeItem(prev => ({ ...prev, ingredientId: e.target.value }))}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">-- Choose --</option>
                              {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-48 space-y-2">
                            <Label>Qty used</Label>
                            <div className="flex gap-2">
                              <Input 
                                type="number" 
                                placeholder="e.g. 250" 
                                value={recipeItem.quantity}
                                onChange={(e: any) => setRecipeItem(prev => ({ ...prev, quantity: e.target.value }))}
                              />
                              <select 
                                value={recipeItem.unit}
                                onChange={(e) => setRecipeItem(prev => ({ ...prev, unit: e.target.value }))}
                                className="h-10 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-20"
                              >
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="l">L</option>
                                <option value="pcs">pcs</option>
                              </select>
                            </div>
                          </div>
                          <Button onClick={() => handleAddRecipeItem(dish.id)} variant="secondary">
                            Add
                          </Button>
                        </div>

                        {dish.recipe.length > 0 && (
                          <div className="mt-4 border rounded-md divide-y bg-slate-50/50">
                            {dish.recipe.map(r => {
                              const ing = ingredients.find(i => i.id === r.ingredientId)
                              if (!ing) return null
                              return (
                                <div key={r.ingredientId} className="flex justify-between items-center p-2 px-3 text-sm bg-white">
                                  <span className="font-medium text-slate-700">{ing.name}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-slate-600 bg-white px-2 py-1 rounded border shadow-sm">{r.quantity} {r.unit || ing.unit}</span>
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveRecipeItem(dish.id, r.ingredientId)} className="text-red-400 h-6 w-6 p-0 hover:text-red-600 hover:bg-red-50">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {dish.recipe.length === 0 && (
                          <p className="text-sm text-slate-400 italic">No ingredients added to this recipe yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No dishes added yet. Create a dish and map its recipe.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="outline" onClick={() => setWizardStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={handleCompleteSetup} disabled={dishes.length === 0 || isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
              {isSubmitting ? 'Saving...' : 'Complete Setup'} <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
