import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

export default function InventoryCheckHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/inventory/checks/history?limit=100')
        setHistory(res.data.data || [])
      } catch (err) {
        console.error('Failed to fetch history', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link to="/inventory">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Check History</h1>
          <p className="text-gray-500">Record of past physical inventory reconciliations.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Log</CardTitle>
          <CardDescription>All recorded physical stock adjustments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50 text-gray-500">
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Ingredient</TableHead>
                <TableHead>Estimated</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <p>Loading history...</p>
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                    No physical checks have been recorded yet.
                  </TableCell>
                </TableRow>
              ) : history.map((record) => (
                <TableRow key={record._id} className="hover:bg-gray-50/50">
                  <TableCell className="pl-6 text-gray-500 text-sm">
                    {new Date(record.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{record.ingredientName}</TableCell>
                  <TableCell className="text-gray-600">{record.estimatedQuantity} {record.unit}</TableCell>
                  <TableCell className="font-medium text-gray-900">{record.actualQuantity} {record.unit}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${record.variance < 0 ? 'text-red-600' : record.variance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {record.variance > 0 ? '+' : ''}{record.variance} {record.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    {record.reason ? (
                      <div>
                        <span className="text-sm font-medium text-gray-800">{record.reason}</span>
                        {record.notes && <p className="text-xs text-gray-500">{record.notes}</p>}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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
