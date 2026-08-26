import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Loader2, TrendingUp, BarChart2 } from "lucide-react"

const COLORS = ['#F97316', '#FDBA74', '#FFEDD5', '#111111', '#6B7280']

export default function Reports() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders')
        setOrders(res.data.data || [])
      } catch (err) {
        console.error('Failed to fetch orders for reports:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Calculate dynamic stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Calculate daily sales trend (last 7 days)
  const dailyTotals: { [key: string]: number } = {}
  
  // Sort orders by date ascending to build trend chronologically
  const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  
  for (const order of sortedOrders) {
    const dateStr = new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
    dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + order.total
  }

  const trendData = Object.entries(dailyTotals).map(([name, revenue]) => ({
    name,
    revenue: Math.round(revenue)
  })).slice(-7) // Last 7 unique days

  // Calculate top dish sales for Pie Chart
  const dishSalesMap: { [key: string]: number } = {}
  for (const order of orders) {
    for (const item of order.items || []) {
      dishSalesMap[item.dishName] = (dishSalesMap[item.dishName] || 0) + (item.lineTotal || 0)
    }
  }

  const topDishesData = Object.entries(dishSalesMap)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 dishes

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sales Reports</h1>
        <p className="text-gray-500">Analytics and insights for your restaurant.</p>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
          <p>Analyzing sales reports...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Total Revenue", value: `₹${Math.round(totalRevenue).toLocaleString()}` },
              { title: "Total Orders", value: totalOrders.toLocaleString() },
              { title: "Avg. Order Value", value: `₹${Math.round(avgOrderValue).toLocaleString()}` },
            ].map((stat, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Daily Revenue Trend</CardTitle>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                        <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                        <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No sales recorded yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Selling Dishes (by Revenue)</CardTitle>
                <BarChart2 className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex flex-col md:flex-row items-center justify-center gap-6">
                  {topDishesData.length > 0 ? (
                    <>
                      <div className="w-full md:w-1/2 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={topDishesData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {topDishesData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {topDishesData.map((dish, i) => (
                          <div key={dish.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-gray-700 font-medium truncate max-w-[120px]">{dish.name}</span>
                            </div>
                            <span className="text-gray-900 font-bold">₹{dish.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400">
                      No sales data available.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
