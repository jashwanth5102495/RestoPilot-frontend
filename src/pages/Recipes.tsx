import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from "@/components/ui/card"
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
  }, [])

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
                      <Button variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-orange-50">
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
    </div>
  )
}
