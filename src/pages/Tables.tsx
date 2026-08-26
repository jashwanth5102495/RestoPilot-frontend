import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Link2, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { printReceipt } from "@/lib/printReceipt"

export default function Tables() {
  const { toast } = useToast()
  
  // Table States
  const [tables, setTables] = useState<any[]>([])
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [tableCount, setTableCount] = useState<number>(0)
  const [tableLoading, setTableLoading] = useState(true)
  const [editingTable, setEditingTable] = useState<any>(null)
  const [editingTableName, setEditingTableName] = useState("")

  // Waiter URL states
  const [isWaiterEnabled, setIsWaiterEnabled] = useState(false)
  const [waiterSlug, setWaiterSlug] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(true)

  const publicUrl = waiterSlug ? `${window.location.origin}/waiter-pos/${waiterSlug}` : ''

  const fetchTablesAndOrders = async () => {
    setTableLoading(true)
    try {
      const res = await api.get('/tables')
      const ordersRes = await api.get('/orders')
      
      setTables(res.data.data)
      setTableCount(res.data.data.length)
      
      // Filter out completed and cancelled orders
      const active = ordersRes.data.data.filter((o: any) => 
        o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED' && o.tableId
      )
      setActiveOrders(active)
    } catch (error) {
      console.error('Failed to fetch tables:', error)
    } finally {
      setTableLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get('/auth/me') 
      const restaurant = res.data?.data?.user?.restaurant
      if (restaurant) {
        setIsWaiterEnabled(restaurant.isWaiterOrderingEnabled || false)
        setWaiterSlug(restaurant.waiterSlug || '')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    fetchTablesAndOrders()
    fetchSettings()
  }, [])

  const handleUpdateTableCount = async () => {
    try {
      await api.patch('/tables/count', { count: tableCount })
      toast({ title: 'Table count updated successfully' })
      fetchTablesAndOrders()
    } catch (err: any) {
      toast({ title: 'Error updating tables', description: err.response?.data?.message, variant: 'destructive' })
    }
  }

  const handleRenameTable = async (id: string) => {
    if (!editingTableName.trim()) return;
    try {
      await api.patch(`/tables/${id}`, { name: editingTableName })
      toast({ title: 'Table renamed successfully' })
      setEditingTable(null)
      fetchTablesAndOrders()
    } catch (err: any) {
      toast({ title: 'Error renaming table', description: err.response?.data?.message, variant: 'destructive' })
    }
  }

  const handleToggle = async (checked: boolean) => {
    try {
      const res = await api.post('/public/settings/waiter-ordering', { enabled: checked })
      setIsWaiterEnabled(res.data.data.isWaiterOrderingEnabled)
      setWaiterSlug(res.data.data.waiterSlug || '')
      toast({
        title: checked ? "Waiter Portal Enabled" : "Waiter Portal Disabled",
        description: checked ? "The public waiter link is now active." : "The public waiter link is now inactive.",
      })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' })
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    toast({ title: 'Link copied', description: 'URL copied to clipboard' })
  }

  const handleGenerateBill = async (tableId: string) => {
    const order = activeOrders.find(o => o.tableId === tableId);
    if (!order) return;
    try {
      const res = await api.patch(`/orders/${order._id}/status`, { status: 'COMPLETED' });
      toast({ title: 'Bill Generated!' });
      
      if (res.data?.data) {
        printReceipt(res.data.data);
      }
      
      fetchTablesAndOrders();
    } catch (err: any) {
      toast({ title: 'Error generating bill', description: err.response?.data?.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tables</h1>
        <p className="text-gray-500">Manage your restaurant layout and Waiter ordering portal.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-500" />
                Public Waiter Portal
              </CardTitle>
              <CardDescription>
                Enable a public link for waiters to take orders on tablets without needing to log in.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{isWaiterEnabled ? 'Active' : 'Disabled'}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isWaiterEnabled} onChange={(e) => handleToggle(e.target.checked)} disabled={settingsLoading} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </CardHeader>
        {isWaiterEnabled && waiterSlug && (
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-2">Waiter Ordering Link (Save this to your tablets):</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white p-2 rounded border border-slate-200 text-sm font-mono text-slate-600 truncate">
                  {publicUrl}
                </code>
                <Button variant="outline" size="icon" onClick={copyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="default" className="gap-2" onClick={() => window.open(publicUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Table Configuration</CardTitle>
              <CardDescription>Set the number of tables in your restaurant and rename them.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={fetchTablesAndOrders}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableCount">Number of Tables</Label>
              <Input 
                id="tableCount" 
                type="number" 
                min="0"
                value={tableCount}
                onChange={(e: any) => setTableCount(parseInt(e.target.value) || 0)}
              />
            </div>
            <Button onClick={handleUpdateTableCount}>Update Count</Button>
          </div>
          
          {tableLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {tables.map((table: any) => {
                const order = activeOrders.find(o => o.tableId === table._id);
                return (
                <div key={table._id} className={`border p-4 rounded-lg flex flex-col space-y-3 relative ${table.status === 'OCCUPIED' ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-200'}`}>
                  {editingTable === table._id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <Input 
                        value={editingTableName} 
                        onChange={(e) => setEditingTableName(e.target.value)} 
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRenameTable(table._id)} className="w-full">Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingTable(null)} className="w-full">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full w-full">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="text-xl font-bold">{table.name || `Table ${table.tableNumber}`}</span>
                          <span className="text-xs font-semibold uppercase">{table.status}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs bg-white/50" onClick={() => {
                          setEditingTable(table._id)
                          setEditingTableName(table.name || `Table ${table.tableNumber}`)
                        }}>Edit</Button>
                      </div>
                      
                      {table.status === 'OCCUPIED' && order && (
                        <div className="flex flex-col flex-1">
                          <div className="bg-white/60 p-2 rounded-md mb-3 flex-1">
                            <p className="text-xs font-bold text-gray-500 mb-1 border-b pb-1">Current Order</p>
                            <ul className="text-sm space-y-1">
                              {order.items.map((item: any, i: number) => (
                                <li key={i} className="flex justify-between">
                                  <span className="truncate pr-2">{item.quantity}x {item.dishName}</span>
                                  <span className="font-medium text-primary">₹{item.lineTotal}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="flex justify-between font-bold text-sm mt-2 pt-1 border-t">
                              <span>Total</span>
                              <span className="text-primary">₹{order.total}</span>
                            </div>
                          </div>
                          <Button 
                            className="w-full mt-auto" 
                            size="sm" 
                            onClick={() => handleGenerateBill(table._id)}
                          >
                            Generate Bill
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )})}
              {tables.length === 0 && <div className="col-span-full text-center text-gray-500 py-4">No tables configured. Update the count above to create tables.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
