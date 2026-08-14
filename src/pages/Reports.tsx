import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const monthlySales = [
  { name: 'Jan', revenue: 450000 },
  { name: 'Feb', revenue: 520000 },
  { name: 'Mar', revenue: 480000 },
  { name: 'Apr', revenue: 610000 },
  { name: 'May', revenue: 590000 },
  { name: 'Jun', revenue: 680000 },
]

const categorySales = [
  { name: 'Main Course', value: 45 },
  { name: 'Starters', value: 25 },
  { name: 'Rice', value: 15 },
  { name: 'Breads', value: 10 },
  { name: 'Beverages', value: 5 },
]



const COLORS = ['#F97316', '#FDBA74', '#FFEDD5', '#111111', '#6B7280']

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sales Reports</h1>
        <p className="text-gray-500">Analytics and insights for your restaurant.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: "Total Revenue", value: "₹33,30,000" },
          { title: "Total Orders", value: "8,450" },
          { title: "Avg. Order Value", value: "₹394" },
          { title: "Total Tax Collected", value: "₹1,66,500" },
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
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySales}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categorySales.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
