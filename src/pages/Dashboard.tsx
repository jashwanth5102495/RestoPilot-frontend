import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, ShoppingBag, TrendingUp, AlertTriangle, Download, Building2 } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

// Hardcoded salesData removed

export default function Dashboard() {
  const { toast } = useToast()
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([])
  const [timeFilter, setTimeFilter] = useState("today")
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    lowStockItems: 0,
    recentOrders: [],
    popularDishes: [],
    totalOnlineOrders: 0,
    salesData: []
  })

  const handleDownloadPDF = async () => {
    const dashboardElement = document.getElementById("dashboard-content");
    if (!dashboardElement) return;

    try {
      const canvas = await html2canvas(dashboardElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("RestoPilot-Dashboard-Report.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  }

  const handleSwitchContext = async () => {
    if (!selectedBranch || selectedBranch === 'overall') return
    try {
      const res = await api.post('/auth/switch-branch', { branchId: selectedBranch })
      const { accessToken, user } = res.data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify(user))
      
      toast({
        title: "Active Context Switched",
        description: `Restaurant set to: ${user?.restaurant?.name || 'Selected branch'}`
      })
      
      window.location.reload()
    } catch (err) {
      console.error("Failed to switch context:", err)
      toast({
        title: "Switch Failed",
        description: "Failed to switch active restaurant context.",
        variant: "destructive"
      })
    }
  }

  // Fetch branches and initial static lists on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const branchRes = await api.get('/restaurants/branches')
        const branchList = branchRes.data.data || []
        setBranches(branchList)
        
        const userStored = JSON.parse(localStorage.getItem('user') || '{}')
        const currentActiveId = userStored?.restaurant?._id
        
        if (currentActiveId && branchList.some((b: any) => b._id === currentActiveId)) {
          setSelectedBranch(currentActiveId)
        } else if (branchList.length > 1 && !selectedBranch) {
          setSelectedBranch('overall') // Default to overall if multiple branches exist
        } else if (branchList.length > 0 && !selectedBranch) {
          setSelectedBranch(branchList[0]._id)
        }
      } catch (e) {
        console.error('Failed to fetch branches:', e)
      }
      
      try {
        const [dishesRes, ingredientsRes] = await Promise.all([
          api.get('/dishes'),
          api.get('/ingredients')
        ])
        
        // Map real ingredients to low stock alerts if currentStock <= minimumStock
        const alerts = ingredientsRes.data.data
          .filter((ing: any) => ing.currentStock <= (ing.minimumStock || 5))
          .map((ing: any) => ({
            id: ing._id,
            item: ing.name,
            current: `${ing.currentStock} ${ing.unit}`,
            min: `${ing.minimumStock || 0} ${ing.unit}`,
            status: ing.currentStock === 0 ? 'Out of Stock' : 'Low Stock'
          }))
        
        setInventoryAlerts(alerts)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      }
    }
    fetchDashboardData()
  }, [])

  // Fetch dashboard stats when selectedBranch changes
  useEffect(() => {
    if (!selectedBranch) return

    const fetchBranchStats = async () => {
      try {
        const res = await api.get(`/restaurants/${selectedBranch}/dashboard`)
        setDashboardStats(res.data.data || {
          totalOrders: 0,
          totalSales: 0,
          lowStockItems: 0,
          recentOrders: [],
          popularDishes: [],
          totalOnlineOrders: 0,
          salesData: []
        })
      } catch (err) {
        console.error("Failed to fetch branch stats:", err)
      }
    }

    fetchBranchStats()
  }, [selectedBranch])

  return (
    <div className="space-y-6" id="dashboard-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Good morning, Owner</h1>
          <p className="text-gray-500">Here's what's happening at your restaurant {timeFilter === 'today' ? 'today' : 'lately'}.</p>
        </div>
        <div className="flex items-center gap-3">
          {branches.length > 1 && (
            <div className="flex items-center gap-2">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall (All Branches)</SelectItem>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name}{!branch.parentRestaurantId ? ' (Main)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBranch !== 'overall' && selectedBranch !== '' && (
                <Button 
                  onClick={handleSwitchContext} 
                  variant="outline"
                  className="bg-primary hover:bg-primary/90 text-white border-transparent h-9 px-3"
                >
                  Switch
                </Button>
              )}
            </div>
          )}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleDownloadPDF} className="bg-white gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{dashboardStats.totalSales.toLocaleString()}</div>
            <p className="text-xs text-gray-500 font-medium flex items-center mt-1">
              {dashboardStats.totalSales > 0 ? "Overall sales" : "No sales recorded"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalOrders}</div>
            <p className="text-xs text-gray-500 font-medium flex items-center mt-1">
              {dashboardStats.totalOrders > 0 ? "Overall orders" : "No orders recorded"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardStats.totalOnlineOrders || 0}
            </div>
            <p className="text-xs text-gray-500 font-medium flex items-center mt-1">
              {dashboardStats.totalOnlineOrders > 0 ? "From public link" : "No online orders"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardStats.lowStockItems}</div>
            <p className="text-xs text-orange-700 font-medium flex items-center mt-1">
              {dashboardStats.lowStockItems > 0 ? "Needs attention" : "All clear"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-7 lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardStats.salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-7 lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Top Selling Dishes</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="h-[300px] overflow-y-auto p-6 pt-0 space-y-4">
              {dashboardStats.popularDishes && dashboardStats.popularDishes.length > 0 ? dashboardStats.popularDishes.map((dish, i) => (
                <div key={dish.id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                  <div className="w-8 text-sm font-bold text-primary">{i + 1}</div>
                  <div className="ml-2 space-y-1 flex-1">
                    <p className="text-sm font-semibold leading-none text-gray-900">{dish.name}</p>
                    <p className="text-xs text-gray-500">{dish.orders} sold</p>
                  </div>
                  <div className="font-medium text-sm text-gray-900">
                    ₹{dish.revenue.toLocaleString()}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-8">No dishes added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory Alerts</CardTitle>
            <button className="text-sm font-medium text-primary hover:underline">View Inventory</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryAlerts.length > 0 ? inventoryAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.item}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Min: {alert.min}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${alert.status === 'Out of Stock' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                      <span className="text-sm font-bold text-gray-900">{alert.current}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${alert.status === 'Out of Stock' ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'}`}>{alert.status}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">No inventory alerts.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 rounded-tl-md rounded-bl-md">Order ID</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 rounded-tr-md rounded-br-md">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardStats.recentOrders && dashboardStats.recentOrders.length > 0 ? (
                    dashboardStats.recentOrders.map((order: any) => (
                      <tr key={order._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{order.customerInfo?.name || 'Walk-in'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">₹{order.total}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.orderStatus === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No recent orders.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
