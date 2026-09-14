import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  Database, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  Search, 
  Lock, 
  History, 
  RefreshCw,
  Printer
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { printReceipt } from '@/lib/printReceipt'

export default function DataPortal() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Upload & Restore State
  const [fileContent, setFileContent] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [isValidating, setIsValidating] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Historical Viewer State
  const [historicalMonths, setHistoricalMonths] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState<any>(null)
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  const fetchSummary = async () => {
    try {
      const res = await api.get('/data/summary')
      setSummary(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchHistoricalMonths = async () => {
    try {
      const res = await api.get('/data/historical/months')
      setHistoricalMonths(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/data/audit-logs')
      setAuditLogs(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchSummary()
      await fetchHistoricalMonths()
      await fetchAuditLogs()
      setLoading(false)
    }
    init()
  }, [])

  // File Upload & SHA-256 Calculation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsValidating(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        setFileContent(text)

        // Send file to backend for schema, checksum, and tenant verification
        const res = await api.post('/data/historical/upload', { fileContent: text })
        setPreviewData(res.data.data)
        setIsPreviewOpen(true)
      } catch (err: any) {
        toast({
          title: "Backup Validation Failed",
          description: err.response?.data?.message || err.message || "Invalid backup file structure",
          variant: "destructive"
        })
      } finally {
        setIsValidating(false)
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    if (!previewData) return
    setIsImporting(true)

    try {
      const res = await api.post('/data/historical/import', { previewData })
      toast({
        title: "Historical Data Imported",
        description: `Successfully restored ${res.data.data.importedCount} historical records.`
      })
      setIsPreviewOpen(false)
      await fetchSummary()
      await fetchHistoricalMonths()
      await fetchAuditLogs()
      setActiveTab('historical')
    } catch (err: any) {
      toast({
        title: "Import Failed",
        description: err.response?.data?.message || "Failed to import historical data",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleSelectMonth = async (m: any) => {
    setSelectedMonth(m)
    try {
      const res = await api.get(`/data/historical/details?year=${m._id.year}&month=${m._id.month}`)
      setHistoricalData(res.data.data)
    } catch (err: any) {
      toast({ title: 'Failed to load month data', variant: 'destructive' })
    }
  }

  const filteredOrders = (historicalData?.orders || []).filter((o: any) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.customerInfo?.name || '').toLowerCase().includes(q) ||
      (o.tableName || '').toLowerCase().includes(q)
    )
  })

  const [isExporting, setIsExporting] = useState(false)

  const handleExportMyData = async () => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      const response = await fetch(`${api.defaults.baseURL}/data/export/download`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupType: 'MANUAL' })
      })

      if (!response.ok) throw new Error('Failed to export data')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `my-restaurant-sales-backup.json`
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({ title: 'Backup Downloaded', description: 'Saved my-restaurant-sales-backup.json' })
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-2xl">
            <Database className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data & Archival Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Secure sales backup, safe monthly archival, and read-only historical data restoration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportMyData} disabled={isExporting} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs gap-1.5">
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 rotate-180" />}
            Download My Restaurant Sales Backup
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="upload" className="rounded-lg text-xs font-semibold px-4 py-2">Upload & Restore</TabsTrigger>
          <TabsTrigger value="historical" className="rounded-lg text-xs font-semibold px-4 py-2">Historical Viewer</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg text-xs font-semibold px-4 py-2">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Production Orders</CardTitle>
                <FileText className="w-5 h-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{summary?.activeOrdersCount ?? 0}</div>
                <p className="text-xs text-gray-500 mt-1">Operational live orders stored in production database</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Restored Historical Records</CardTitle>
                <History className="w-5 h-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{summary?.historicalOrdersCount ?? 0}</div>
                <p className="text-xs text-gray-500 mt-1">Isolated read-only historical orders from past archives</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Verified Backups</CardTitle>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{summary?.backupsCount ?? 0}</div>
                <p className="text-xs text-gray-500 mt-1">Cryptographically signed monthly & weekly backups</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-orange-100 bg-orange-50/40">
            <CardHeader>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-600" /> Data Isolation & Safeguard Guarantees
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-2">
              <p>• <strong>Strict Read-Only Isolation:</strong> Restored historical sales data is stored in a separate database representation and will NEVER mix into current operational billing, live order counters, or active table status.</p>
              <p>• <strong>Checksum Integrity:</strong> Every backup generates a unique SHA-256 cryptographic signature to detect file corruption or manual tampering.</p>
              <p>• <strong>Tenant Protection:</strong> Restoring or viewing backup files belonging to another restaurant is automatically blocked by the backend API.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Upload & Restore */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Upload Historical Sales Backup</CardTitle>
              <CardDescription>
                Select a verified <code>.restaurant-backup</code> or <code>.json</code> file to inspect metadata and restore into your historical viewer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors rounded-2xl p-8 text-center bg-gray-50/50">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 mb-1">Click or drag backup file here to upload</p>
                <p className="text-xs text-gray-500 mb-4">Supports <code>.restaurant-backup</code> or <code>.json</code> files up to 20MB</p>
                <Input 
                  type="file" 
                  accept=".json,.restaurant-backup" 
                  onChange={handleFileUpload} 
                  disabled={isValidating}
                  className="max-w-xs mx-auto cursor-pointer"
                />
              </div>

              {isValidating && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                  <span>Validating SHA-256 checksum and backup schema...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup Restore Preview Modal */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" /> Historical Backup Integrity Verified
                </DialogTitle>
                <DialogDescription>
                  Review backup metadata and period summary before importing into historical view.
                </DialogDescription>
              </DialogHeader>

              {previewData && (
                <div className="space-y-4 py-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                    <p className="font-bold text-emerald-900 flex items-center justify-between">
                      <span>Restaurant: {previewData.restaurant.name}</span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">SHA-256 Verified</Badge>
                    </p>
                    <p className="text-emerald-700">
                      Period: {new Date(previewData.period.from).toLocaleDateString()} — {new Date(previewData.period.to).toLocaleDateString()}
                    </p>
                    <p className="text-emerald-800 text-[10px] font-mono truncate mt-1">Checksum: {previewData.checksum}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-xs text-gray-500">Order Count</p>
                      <p className="font-bold text-gray-900 text-base">{previewData.orderCount}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-xs text-gray-500">Gross Sales</p>
                      <p className="font-bold text-gray-900 text-base">₹{previewData.grossSales?.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-xs text-gray-500">Total Tax (GST)</p>
                      <p className="font-bold text-gray-900 text-base">₹{previewData.totalTax?.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-xs text-gray-500">Total Discount</p>
                      <p className="font-bold text-gray-900 text-base">₹{previewData.totalDiscount?.toFixed(2)}</p>
                    </div>
                  </div>

                  {previewData.isAlreadyImported && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <span>Notice: Data for this period is already loaded. Re-importing will idempotently refresh the historical records for this month without creating duplicates.</span>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)} disabled={isImporting}>Cancel</Button>
                <Button onClick={handleConfirmImport} disabled={isImporting} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                  {isImporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Import Historical Data
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab 3: Historical Viewer */}
        <TabsContent value="historical" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar list of months */}
            <div className="w-full md:w-64 shrink-0 space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Restored Months</h3>
              {historicalMonths.length === 0 ? (
                <Card className="p-4 text-center text-xs text-gray-400">
                  No historical months loaded yet. Upload a backup to get started.
                </Card>
              ) : (
                historicalMonths.map((m, idx) => {
                  const monthName = new Date(m._id.year, m._id.month - 1, 1).toLocaleString('default', { month: 'long' })
                  const isSelected = selectedMonth?._id?.year === m._id.year && selectedMonth?._id?.month === m._id.month
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectMonth(m)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-1 ring-orange-500' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold text-sm text-gray-900">{monthName} {m._id.year}</div>
                      <div className="text-xs text-gray-500 mt-1">{m.orderCount} orders • ₹{Number(m.totalSales).toFixed(2)}</div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Dashboard and Orders view */}
            <div className="flex-1 space-y-6 min-w-0">
              {!selectedMonth ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-600">Select a month from the left sidebar to view historical sales data</p>
                </div>
              ) : (
                <>
                  {/* READ-ONLY BANNER */}
                  <div className="bg-amber-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between shadow-sm">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> READ-ONLY HISTORICAL DATA — {new Date(selectedMonth._id.year, selectedMonth._id.month - 1, 1).toLocaleString('default', { month: 'long' }).toUpperCase()} {selectedMonth._id.year}
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">ISOLATED MODE</span>
                  </div>

                  {historicalData?.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500">Gross Sales</p>
                        <p className="text-xl font-bold text-gray-900">₹{historicalData.summary.grossSales.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500">Orders</p>
                        <p className="text-xl font-bold text-gray-900">{historicalData.summary.orderCount}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500">Total Tax (GST)</p>
                        <p className="text-xl font-bold text-gray-900">₹{historicalData.summary.totalTax.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500">Avg Order Value</p>
                        <p className="text-xl font-bold text-gray-900">₹{historicalData.summary.avgOrderValue.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {/* Orders Search & Table */}
                  <Card className="border-gray-200">
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-base font-bold">Historical Orders List</CardTitle>
                        <CardDescription>Read-only sales records for the selected month</CardDescription>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          placeholder="Search order #, table, customer..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-gray-600">
                          <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
                            <tr>
                              <th className="px-4 py-3">Order #</th>
                              <th className="px-4 py-3">Date & Time</th>
                              <th className="px-4 py-3">Table / Customer</th>
                              <th className="px-4 py-3">Items</th>
                              <th className="px-4 py-3">Payment</th>
                              <th className="px-4 py-3 text-right">Total</th>
                              <th className="px-4 py-3 text-center">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((o: any) => (
                              <tr key={o._id} className="hover:bg-gray-50/80">
                                <td className="px-4 py-3 font-bold text-gray-900">{o.orderNumber}</td>
                                <td className="px-4 py-3">{new Date(o.originalCreatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td className="px-4 py-3">{o.tableName || o.customerInfo?.name || 'Walk-in'}</td>
                                <td className="px-4 py-3">{o.items?.length || 0} item(s)</td>
                                <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{o.paymentMethod}</Badge></td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900">₹{Number(o.total).toFixed(2)}</td>
                                <td className="px-4 py-3 text-center">
                                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-gray-600" onClick={() => printReceipt(o)}>
                                    <Printer className="w-3.5 h-3.5" /> Receipt
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                              <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-400">No historical orders match your search query.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Data Audit Trail</CardTitle>
              <CardDescription>Immutable log of backup exports, SHA-256 verifications, archival events, and restores.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3 font-mono text-[10px]">SHA-256 Checksum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] uppercase font-bold ${
                            log.action.includes('ARCHIVED') || log.action.includes('DELETED') 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{log.userId?.name || 'System User'}</td>
                        <td className="px-4 py-3">{log.details}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-gray-400 truncate max-w-[120px]">{log.checksum || 'N/A'}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">No audit logs recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
