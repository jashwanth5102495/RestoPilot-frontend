import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from "@/components/ui/card"
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Printer, Download, Eye, Calendar, Banknote, Smartphone, CreditCard } from "lucide-react"

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders')
        setOrders(res.data.data || [])
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    // Map backend statuses to filter states
    const matchesFilter = filter === 'All' || 
      (filter === 'Completed' && order.orderStatus === 'COMPLETED') ||
      (filter === 'Pending' && (order.orderStatus === 'PLACED' || order.orderStatus === 'PREPARING' || order.orderStatus === 'READY')) ||
      (filter === 'Cancelled' && order.orderStatus === 'CANCELLED')

    const customerName = order.customerInfo?.name || 'Walk-in'
    const matchesSearch = order.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
                          customerName.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusBadgeClass = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-50 text-green-700 border-green-200'
    if (status === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-200'
    return 'bg-orange-50 text-orange-700 border-orange-200' // PLACED, PREPARING, READY
  }

  const getStatusLabel = (status: string) => {
    if (status === 'COMPLETED') return 'Completed'
    if (status === 'CANCELLED') return 'Cancelled'
    return 'Pending'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h1>
          <p className="text-gray-500">View and manage all your restaurant orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white">
            <Calendar className="w-4 h-4 mr-2" />
            Today
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            {['All', 'Completed', 'Pending', 'Cancelled'].map(f => (
              <Badge 
                key={f}
                variant={filter === f ? "default" : "secondary"}
                className={`cursor-pointer px-3 py-1 text-sm font-medium ${filter === f ? 'bg-primary' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </Badge>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search order ID or customer..." 
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
                <TableHead className="w-[120px] pl-6 py-4">Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-gray-500">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.map((order) => {
                const totalQuantity = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                return (
                  <TableRow key={order._id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-6 font-medium text-gray-900">{order.orderNumber}</TableCell>
                    <TableCell className="font-medium text-gray-700">{order.customerInfo?.name || 'Walk-in'}</TableCell>
                    <TableCell className="text-gray-500">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</TableCell>
                    <TableCell className="font-medium text-gray-900">₹{order.total}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                        {order.paymentMethod === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                        {order.paymentMethod === 'UPI' && <Smartphone className="w-3.5 h-3.5" />}
                        {order.paymentMethod === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                        {order.paymentMethod || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeClass(order.orderStatus)}>
                        {getStatusLabel(order.orderStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="cursor-pointer text-gray-700 flex items-center">
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-gray-700 flex items-center">
                            <Printer className="w-4 h-4 mr-2" /> Print Bill
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-gray-700 flex items-center">
                            <Download className="w-4 h-4 mr-2" /> Download Receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p>No orders found.</p>
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
