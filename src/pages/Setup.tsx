import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, ChefHat, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

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

export default function Setup() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  
  // Step 1 State: Inventory
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'g', stock: '' })

  // Step 2 State: Dishes
  const [dishes, setDishes] = useState<Dish[]>([])
  const [newDish, setNewDish] = useState({ name: '', price: '' })
  
  // Recipe building state for the currently active dish
  const [activeDishId, setActiveDishId] = useState<string | null>(null)
  const [recipeItem, setRecipeItem] = useState({ ingredientId: '', quantity: '', unit: 'g' })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    // Also remove from all recipes
    setDishes(prev => prev.map(d => ({
      ...d,
      recipe: d.recipe.filter(r => r.ingredientId !== id)
    })))
  }

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
        // Check if ingredient already exists in recipe
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

  const handleCompleteSetup = async () => {
    setIsSubmitting(true)
    try {
      // Send `ingredients` and `dishes` to the backend.
      await api.post('/setup/complete', { ingredients, dishes })
      
      toast({
        title: "Setup Complete!",
        description: "Your inventory and menu have been configured successfully.",
      })
      navigate('/dashboard')
    } catch (error) {
      console.error(error)
      toast({
        title: "Setup Failed",
        description: "There was a problem saving your setup.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center">
            Restaurant Setup
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Configure your inventory and menu to start managing your restaurant efficiently.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              1
            </div>
            <div className={`w-24 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              2
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Setup Initial Inventory</CardTitle>
              <CardDescription>Add raw ingredients that you use for cooking. These will be deducted automatically when a dish is ordered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="ingName">Ingredient Name</Label>
                  <Input 
                    id="ingName" 
                    placeholder="e.g. Chicken" 
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                    list="ingredients-list"
                  />
                  <datalist id="ingredients-list">
                    <option value="Chicken" />
                    <option value="Beef" />
                    <option value="Pork" />
                    <option value="Mutton" />
                    <option value="Fish" />
                    <option value="Prawns" />
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
                    <option value="Pepper" />
                    <option value="Rice" />
                    <option value="Pasta" />
                    <option value="Oil" />
                    <option value="Ghee" />
                  </datalist>
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
                    onChange={(e) => setNewIngredient(prev => ({ ...prev, stock: e.target.value }))}
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
                  <div className="divide-y max-h-80 overflow-y-auto">
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
                  <p className="text-slate-500 text-sm">No ingredients added yet. Start by adding your raw materials above.</p>
                </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="ghost" onClick={() => setStep(2)}>Skip Step</Button>
              <Button onClick={() => setStep(2)} className="bg-primary hover:bg-primary/90">
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary" /> Setup Menu & Recipes</CardTitle>
              <CardDescription>Add dishes to your menu and map exactly how much of each ingredient is required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="dishName">Dish Name</Label>
                  <Input 
                    id="dishName" 
                    placeholder="e.g. Butter Chicken" 
                    value={newDish.name}
                    onChange={(e) => setNewDish(prev => ({ ...prev, name: e.target.value }))}
                    list="dishes-list"
                  />
                  <datalist id="dishes-list">
                    <option value="Butter Chicken" />
                    <option value="Chicken Tikka Masala" />
                    <option value="Paneer Butter Masala" />
                    <option value="Palak Paneer" />
                    <option value="Dal Makhani" />
                    <option value="Margherita Pizza" />
                    <option value="Pepperoni Pizza" />
                    <option value="Pasta Alfredo" />
                    <option value="Spaghetti Bolognese" />
                    <option value="Caesar Salad" />
                    <option value="Greek Salad" />
                    <option value="Cheeseburger" />
                    <option value="Chicken Burger" />
                    <option value="Veggie Burger" />
                    <option value="French Fries" />
                    <option value="Garlic Bread" />
                    <option value="Chocolate Brownie" />
                    <option value="Vanilla Ice Cream" />
                    <option value="Cold Coffee" />
                    <option value="Mango Lassi" />
                  </datalist>
                </div>
                <div className="space-y-2 w-full sm:w-48">
                  <Label htmlFor="dishPrice">Selling Price (₹)</Label>
                  <Input 
                    id="dishPrice" 
                    type="number" 
                    placeholder="e.g. 250" 
                    value={newDish.price}
                    onChange={(e) => setNewDish(prev => ({ ...prev, price: e.target.value }))}
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
                                  onChange={(e) => setRecipeItem(prev => ({ ...prev, quantity: e.target.value }))}
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
                                  <div key={r.ingredientId} className="flex justify-between items-center p-2 px-3 text-sm">
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
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  Skip Setup
                </Button>
                <Button onClick={handleCompleteSetup} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? 'Saving...' : 'Complete Setup'} <CheckCircle2 className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

      </div>
    </div>
  )
}
