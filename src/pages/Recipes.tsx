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
import { Search, ChefHat } from "lucide-react"

export default function Recipes() {
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
              {[
                { name: 'Butter Chicken', ings: '6 ingredients', cost: '₹132', price: '₹280', margin: '53%', status: 'Configured' },
                { name: 'Chicken Biryani', ings: '8 ingredients', cost: '₹95', price: '₹220', margin: '57%', status: 'Configured' },
                { name: 'Garlic Naan', ings: '4 ingredients', cost: '₹12', price: '₹60', margin: '80%', status: 'Configured' },
                { name: 'Paneer Butter Masala', ings: '0 ingredients', cost: '₹0', price: '₹240', margin: '0%', status: 'Missing' },
              ].map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6 font-medium text-gray-900 flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-gray-400" /> {r.name}
                  </TableCell>
                  <TableCell className="text-gray-600">{r.ings}</TableCell>
                  <TableCell className="font-medium text-gray-700">{r.cost}</TableCell>
                  <TableCell className="font-medium text-gray-900">{r.price}</TableCell>
                  <TableCell className="text-green-600 font-medium">{r.margin}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.status === 'Configured' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-orange-50">
                      Edit Recipe
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
