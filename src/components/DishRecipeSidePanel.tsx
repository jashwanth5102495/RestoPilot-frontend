import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { X, Loader2, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface DishRecipeSidePanelProps {
  isOpen: boolean;
  dish: any | null;
  onClose: () => void;
  allIngredients: any[];
}

export default function DishRecipeSidePanel({ isOpen, dish, onClose, allIngredients }: DishRecipeSidePanelProps) {
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [recipeItems, setRecipeItems] = useState<any[]>([])
  const [originalRecipeItems, setOriginalRecipeItems] = useState<any[]>([])
  const [recipeStatus, setRecipeStatus] = useState<'Configured' | 'Missing'>('Missing')
  const [allTemplates, setAllTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  
  const [selectedIngId, setSelectedIngId] = useState('')
  const [ingQuantity, setIngQuantity] = useState('')
  const [ingUnit, setIngUnit] = useState('g')

  // Role checking
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const canEdit = user && ['OWNER', 'MANAGER'].includes(user.role)

  const fetchRecipe = useCallback(async () => {
    if (!dish) return
    setLoading(true)
    try {
      const res = await api.get('/recipes')
      const recipes = res.data.data
      const myRecipe = recipes.find((r: any) => r._id === dish._id)
      
      if (myRecipe && myRecipe.recipe && myRecipe.recipe.items.length > 0) {
        const loadedItems = myRecipe.recipe.items.map((item: any) => {
          const ing = allIngredients.find(i => i._id === item.ingredientId)
          return {
            ingredientId: item.ingredientId,
            name: ing ? ing.name : item.ingredientName || 'Unknown',
            quantity: item.quantity,
            unit: ing ? ing.unit : item.unit || ''
          }
        })
        setRecipeItems(loadedItems)
        setOriginalRecipeItems(JSON.parse(JSON.stringify(loadedItems)))
        setRecipeStatus('Configured')
      } else {
        setRecipeItems([])
        setOriginalRecipeItems([])
        setRecipeStatus('Missing')
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Error loading recipe",
        description: "Failed to fetch the recipe for this dish.",
        variant: "destructive"
      })
      setRecipeItems([])
      setOriginalRecipeItems([])
      setRecipeStatus('Missing')
    } finally {
      setLoading(false)
    }
  }, [dish, allIngredients, toast])

  useEffect(() => {
    if (isOpen && dish) {
      fetchRecipe()
      setSelectedIngId('')
      setIngQuantity('')
      setShowTemplateSelector(false)
      setSelectedTemplateId('')
      
      // Fetch templates for mapping
      api.get('/recipes/templates').then(res => {
        setAllTemplates(res.data.data || [])
      }).catch(err => console.error(err))
    }
  }, [isOpen, dish, fetchRecipe])

  const hasChanges = JSON.stringify(recipeItems) !== JSON.stringify(originalRecipeItems)

  const handleClose = () => {
    if (hasChanges) {
      if (!window.confirm('You have unsaved changes. Discard them?')) {
        return
      }
    }
    onClose()
  }

  const handleAutoFill = async (templateId?: string) => {
    if (!dish) return
    setLoading(true)
    try {
      let url = `/recipes/templates/match?name=${encodeURIComponent(dish.name.trim())}`;
      const res = await api.get(url)
      let templateData = res.data.data
      
      // If a specific template was selected from the dropdown, find it and override
      if (templateId) {
         // We don't have a direct by-id endpoint right now, but the frontend doesn't need to fetch by ID 
         // if we can just match by the template's dishName. Wait, we DO have it if we query match?name=template.dishName
         const selected = allTemplates.find(t => t._id === templateId);
         if (selected) {
           const specificRes = await api.get(`/recipes/templates/match?name=${encodeURIComponent(selected.dishName)}`);
           templateData = specificRes.data.data;
         }
      }

      if (templateData) {
        const templateIngredients = templateData.ingredients
        const newRecipeItems: any[] = []
        
        templateIngredients.forEach((tIng: any) => {
          const matchingIng = allIngredients.find(i => i.name.toLowerCase() === tIng.name.toLowerCase())
          if (matchingIng) {
            newRecipeItems.push({
              ingredientId: matchingIng._id,
              name: matchingIng.name,
              quantity: tIng.quantity,
              unit: matchingIng.unit
            })
          }
        })
        
        if (newRecipeItems.length > 0) {
          setRecipeItems(newRecipeItems)
          setShowTemplateSelector(false)
          toast({
            title: "Template applied",
            description: `Standard recipe '${templateData.dishName}' populated. Review and save changes.`
          })
        } else {
          toast({
            title: "No matching ingredients",
            description: "Template found, but none of its ingredients match your inventory.",
            variant: "destructive"
          })
        }
      }
    } catch (err) {
      // If exact/fuzzy match fails, show the selector so they can pick one
      setShowTemplateSelector(true)
      toast({
        title: "No automatic match",
        description: "Could not automatically match a global concept. Please select one manually.",
        variant: "default"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectIngredient = (id: string) => {
    setSelectedIngId(id)
    const ing = allIngredients.find(i => i._id === id)
    if (ing) {
      setIngUnit(ing.unit)
    }
  }

  const handleAddRecipeItem = () => {
    if (!selectedIngId || !ingQuantity) return
    const qty = Number(ingQuantity)
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid quantity", description: "Quantity must be greater than 0.", variant: "destructive" })
      return
    }
    const ing = allIngredients.find(i => i._id === selectedIngId)
    if (!ing) return

    const exists = recipeItems.find(item => item.ingredientId === selectedIngId)
    if (exists) {
      setRecipeItems(prev => prev.map(item => 
        item.ingredientId === selectedIngId 
          ? { ...item, quantity: item.quantity + qty } 
          : item
      ))
    } else {
      setRecipeItems(prev => [...prev, {
        ingredientId: selectedIngId,
        name: ing.name,
        quantity: qty,
        unit: ingUnit
      }])
    }

    setSelectedIngId('')
    setIngQuantity('')
  }

  const handleRemoveRecipeItem = (id: string) => {
    setRecipeItems(prev => prev.filter(item => item.ingredientId !== id))
  }

  const handleSave = async () => {
    if (!dish) return
    
    // Validate
    for (const item of recipeItems) {
      const qty = Number(item.quantity)
      if (isNaN(qty) || qty <= 0) {
        toast({ title: "Validation Error", description: `Invalid quantity for ${item.name}`, variant: "destructive" })
        return
      }
    }

    setSaving(true)
    try {
      const recipePayload = {
        dishId: dish._id,
        items: recipeItems.map(item => ({
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity)
        }))
      }
      await api.post('/recipes', recipePayload)
      
      setOriginalRecipeItems(JSON.parse(JSON.stringify(recipeItems)))
      setRecipeStatus(recipeItems.length > 0 ? 'Configured' : 'Missing')
      
      toast({
        title: "Success",
        description: "✓ Recipe updated successfully"
      })
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.response?.data?.message || "Failed to save the recipe.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity" 
        onClick={handleClose}
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{dish?.name}</h2>
            <div className="flex items-center mt-1">
              <span className="text-xs text-slate-500 mr-2">Recipe Status:</span>
              {recipeStatus === 'Configured' ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> ACTIVE
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-600 flex items-center bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  <AlertTriangle className="w-3 h-3 mr-1" /> NOT CONFIGURED
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p className="text-sm">Loading recipe...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* No Recipe State */}
              {recipeItems.length === 0 && recipeStatus === 'Missing' && canEdit && !showTemplateSelector && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-center flex flex-col items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-600 mb-4">This dish does not have a recipe yet.</p>
                  <Button onClick={() => handleAutoFill()} variant="outline" className="text-sm shadow-sm mb-2">
                    Auto-match Global Concept
                  </Button>
                  <Button onClick={() => setShowTemplateSelector(true)} variant="ghost" className="text-xs text-slate-500">
                    Select Concept Manually
                  </Button>
                </div>
              )}

              {/* Template Selector */}
              {showTemplateSelector && recipeItems.length === 0 && canEdit && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Map Global Dish Concept</h3>
                  <p className="text-xs text-blue-600 mb-4">Select the underlying global dish concept to populate the standard inventory ingredients for <b>{dish.name}</b>.</p>
                  
                  <select 
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm mb-4"
                  >
                    <option value="">-- Search & Select Global Concept --</option>
                    {allTemplates.map(t => (
                      <option key={t._id} value={t._id}>{t.dishName} ({t.category})</option>
                    ))}
                  </select>
                  
                  <div className="flex gap-2">
                    <Button onClick={() => handleAutoFill(selectedTemplateId)} disabled={!selectedTemplateId} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Use Standard Recipe
                    </Button>
                    <Button onClick={() => setShowTemplateSelector(false)} variant="outline" className="flex-1">
                      Create Manually
                    </Button>
                  </div>
                </div>
              )}

              {/* Edit Recipe List */}
              {(recipeItems.length > 0 || recipeStatus === 'Configured') && (
                <div className="space-y-4">
                  {recipeItems.map((item, idx) => (
                    <div key={item.ingredientId || idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-slate-200 transition-colors">
                      <div className="font-medium text-slate-700 text-sm">{item.name}</div>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number"
                          value={item.quantity}
                          disabled={!canEdit}
                          onChange={(e) => {
                            const newQty = e.target.value;
                            setRecipeItems(prev => prev.map(p => p.ingredientId === item.ingredientId ? {...p, quantity: newQty} : p));
                          }}
                          className="w-20 h-8 text-sm p-2 text-center"
                        />
                        <span className="text-slate-500 text-sm w-8">{item.unit}</span>
                        {canEdit && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveRecipeItem(item.ingredientId)} 
                            className="text-red-400 h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Ingredient Form */}
              {canEdit && (
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">+ Add Ingredient</h3>
                  <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-slate-500">Ingredient</Label>
                      <select 
                        value={selectedIngId}
                        onChange={(e) => handleSelectIngredient(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      >
                        <option value="">-- Choose --</option>
                        {allIngredients.map(i => (
                          <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs text-slate-500">Qty ({ingUnit})</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 50" 
                        value={ingQuantity}
                        onChange={(e: any) => setIngQuantity(e.target.value)}
                        className="h-9 text-xs shadow-sm"
                      />
                    </div>
                    <Button type="button" onClick={handleAddRecipeItem} size="sm" variant="secondary" className="h-9">
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Read Only Message */}
              {!canEdit && recipeItems.length > 0 && (
                <div className="text-xs text-center text-slate-400 mt-4">
                  You do not have permission to edit recipe quantities.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {canEdit && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || saving || !hasChanges}
              className="min-w-[120px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
