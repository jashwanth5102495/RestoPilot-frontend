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

export default function Purchases() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchases</h1>
          <p className="text-gray-500">Track incoming stock and payments to suppliers.</p>
        </div>
        <Button className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Purchase
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Total Purchases (This Month)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹1,82,500</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Pending Payments</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">₹24,500</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Active Suppliers</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">18</h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search purchases..." 
              className="pl-9 bg-white"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50 text-gray-500">
              <TableRow>
                <TableHead className="pl-6 py-4">Purchase ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: 'PO-102', sup: 'ABC Foods', amt: '₹12,450', stat: 'Paid', date: 'Today' },
                { id: 'PO-101', sup: 'Fresh Farms', amt: '₹8,200', stat: 'Pending', date: 'Yesterday' },
                { id: 'PO-100', sup: 'Meat Masters', amt: '₹24,500', stat: 'Paid', date: '12 Aug 2026' },
              ].map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6 font-medium text-gray-900">{p.id}</TableCell>
                  <TableCell>{p.sup}</TableCell>
                  <TableCell className="font-medium text-gray-900">{p.amt}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.stat === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                      {p.stat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{p.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
