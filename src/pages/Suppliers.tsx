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
import { Search, Plus } from "lucide-react"

export default function Suppliers() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Suppliers</h1>
          <p className="text-gray-500">Manage your restaurant suppliers and vendors.</p>
        </div>
        <Button className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Supplier
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search suppliers..." 
              className="pl-9 bg-white"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50 text-gray-500">
              <TableRow>
                <TableHead className="pl-6 py-4">Supplier Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'ABC Foods', phone: '+91 98765 43210', products: 'Chicken, Meat', purchases: '₹84,500', outstanding: '₹12,000', status: 'Active' },
                { name: 'Fresh Farms', phone: '+91 98765 12345', products: 'Vegetables, Fruits', purchases: '₹42,100', outstanding: '₹0', status: 'Active' },
                { name: 'Dairy Co', phone: '+91 91234 56789', products: 'Milk, Paneer, Butter', purchases: '₹38,000', outstanding: '₹5,000', status: 'Active' },
              ].map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6 font-medium text-gray-900">{s.name}</TableCell>
                  <TableCell className="text-gray-600">{s.phone}</TableCell>
                  <TableCell className="text-gray-600">{s.products}</TableCell>
                  <TableCell className="font-medium text-gray-900">{s.purchases}</TableCell>
                  <TableCell className="text-orange-600 font-medium">{s.outstanding}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {s.status}
                    </Badge>
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
