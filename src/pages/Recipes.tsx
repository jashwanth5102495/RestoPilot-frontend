import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ChefHat, Loader2 } from "lucide-react"

export default function Recipes() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ingredients, setIngredients] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<any>(null)
  const [recipeItems, setRecipeItems] = useState<any[]>([])
  const [savingRecipe, setSavingRecipe] = useState(false)
  const { toast } = useToast()

  const fetchIngredients = async () => {
    try {
      const res = await api.get('/ingredients')
      setIngredients(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch ingredients:', error)
    }
  }

  const fetchRecipes = async () => {
    try {
      const res = await api.get('/recipes')
      setRecipes(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
    fetchIngredients()
  }, [])

  const openRecipeModal = (recipeData: any) => {
    setEditingRecipe(recipeData);
    setRecipeItems(recipeData.recipe.items.map((i: any) => ({
      ingredientId: i.ingredientId,
      ingredientName: i.ingredientName,
      quantity: i.quantity,
      unit: i.unit
    })));
    setIsModalOpen(true);
  }

  const saveRecipe = async () => {
    if (!editingRecipe) return;
    setSavingRecipe(true);
    try {
      await api.post('/recipes', {
        dishId: editingRecipe._id,
        items: recipeItems
      });
      toast({ title: 'Recipe updated successfully' });
      setIsModalOpen(false);
      fetchRecipes();
    } catch (err: any) {
      toast({ title: 'Error saving recipe', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSavingRecipe(false);
    }
  }

  const addIngredientToRecipe = (ingredientId: string) => {
    if (!ingredientId) return;
    const ing = ingredients.find(i => i._id === ingredientId);
    if (!ing) return;
    if (recipeItems.find(i => i.ingredientId === ingredientId)) return; // Already exists
    
    setRecipeItems([...recipeItems, {
      ingredientId: ing._id,
      ingredientName: ing.name,
      quantity: 1,
      unit: ing.unit || 'units'
    }]);
  }

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Recipes</h1>
          <p className="text-gray-500">Manage dish recipes and ingredient proportions.</p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search recipes..." 
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
                <TableHead className="pl-6 py-4">Dish</TableHead>
                <TableHead>Ingredients</TableHead>
                <TableHead>Est. Cost</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p>Loading recipes...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRecipes.map((r) => {
                const cost = r.recipe.estCost || 0;
                const price = r.price || 0;
                const margin = r.recipe.margin || 0;
                const ingsCount = r.recipe.itemsCount || 0;

                return (
                  <TableRow key={r._id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-6 font-medium text-gray-900 flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-gray-400" /> {r.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {ingsCount} {ingsCount === 1 ? 'ingredient' : 'ingredients'}
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">₹{cost.toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-gray-900">₹{price.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-medium">{margin}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={r.recipe.status === 'Configured' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                        {r.recipe.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-orange-50" onClick={() => openRecipeModal(r)}>
                        Edit Recipe
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filteredRecipes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p>No recipes found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Recipe Modal */}
      {isModalOpen && editingRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[90vh] flex flex-col">
            <CardHeader>
              <CardTitle>Edit Recipe: {editingRecipe.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Ingredient</label>
                <select 
                  className="w-full border rounded-md p-2 bg-white"
                  onChange={(e) => {
                    addIngredientToRecipe(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select an ingredient to add...</option>
                  {ingredients.map(ing => (
                    <option key={ing._id} value={ing._id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 mt-4">
                <label className="text-sm font-medium">Recipe Items</label>
                {recipeItems.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No ingredients added yet.</p>
                ) : (
                  recipeItems.map((item, index) => (
                    <div key={item.ingredientId} className="flex items-center gap-3 bg-gray-50 p-2 rounded border">
                      <span className="flex-1 font-medium text-sm">{item.ingredientName}</span>
                      <Input 
                        type="number" 
                        className="w-24 h-8" 
                        value={item.quantity}
                        min="0.01"
                        step="0.01"
                        onChange={(e) => {
                          const newItems = [...recipeItems];
                          newItems[index].quantity = parseFloat(e.target.value) || 0;
                          setRecipeItems(newItems);
                        }}
                      />
                      <span className="text-sm text-gray-500 w-12">{item.unit}</span>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setRecipeItems(recipeItems.filter((_, i) => i !== index));
                        }}
                      >
                        &times;
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={saveRecipe} disabled={savingRecipe}>
                  {savingRecipe ? 'Saving...' : 'Save Recipe'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
