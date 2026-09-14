import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Download, Trash2, ShieldCheck, AlertTriangle, RefreshCw, FileText, CheckCircle2, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminDataBackup() {
  const { toast } = useToast()
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('')
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [backupType, setBackupType] = useState<string>('WEEKLY')
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Archival Confirmation Modal State
  const [selectedBackupForArchive, setSelectedBackupForArchive] = useState<any>(null)
  const [confirmationInput, setConfirmationInput] = useState<string>('')
  const [isArchiving, setIsArchiving] = useState<boolean>(false)

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants')
      setRestaurants(res.data.data || [])
      if (res.data.data?.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(res.data.data[0]._id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBackups = async () => {
    try {
      const url = selectedRestaurantId && selectedRestaurantId !== 'ALL'
        ? `/admin/backups?restaurantId=${selectedRestaurantId}`
        : '/admin/backups'
      const res = await api.get(url)
      setBackups(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    fetchBackups()
  }, [selectedRestaurantId])

  const handleGenerateBackup = async () => {
    if (!selectedRestaurantId || selectedRestaurantId === 'ALL' || !periodStart || !periodEnd) {
      return toast({ title: 'Please select a specific restaurant account, start date, and end date', variant: 'destructive' })
    }

    setLoading(true)
    try {
      const res = await api.post('/admin/backups/generate', {
        restaurantId: selectedRestaurantId,
        periodStart,
        periodEnd,
        backupType
      })
      toast({
        title: 'Backup Generated & Verified',
        description: `SHA-256: ${res.data.data.checksum.slice(0, 16)}...`
      })
      fetchBackups()
      
      // Auto-trigger direct download for user convenience
      if (res.data.data?.backupRecord?._id) {
        handleDownloadBackup(res.data.data.backupRecord)
      }
    } catch (err: any) {
      toast({ title: 'Backup Generation Failed', description: err.response?.data?.message || err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = async (backupRecord: any) => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      const url = `${api.defaults.baseURL}/admin/backups/${backupRecord._id}/download`
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to download backup')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      const restName = (backupRecord.restaurantId?.name || 'restaurant').toLowerCase().replace(/\s+/g, '-')
      link.download = `${restName}-${backupRecord.backupId}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast({ title: 'Backup Downloaded', description: `Saved ${restName}-${backupRecord.backupId}.json` })
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message, variant: 'destructive' })
    }
  }

  const handleOpenArchiveModal = (b: any) => {
    setSelectedBackupForArchive(b)
    setConfirmationInput('')
  }

  const handleExecuteArchive = async () => {
    if (!selectedBackupForArchive) return

    setIsArchiving(true)
    try {
      const res = await api.post(`/admin/archives/${selectedBackupForArchive._id}/execute`, {
        confirmationText: confirmationInput,
        restaurantId: selectedBackupForArchive.restaurantId?._id || selectedBackupForArchive.restaurantId
      })

      toast({
        title: 'Monthly Archival & Safe Server Data Deletion Complete',
        description: `Archived ${res.data.data.archivedCount} orders into historical storage and deleted from production DB.`
      })

      setSelectedBackupForArchive(null)
      fetchBackups()
    } catch (err: any) {
      toast({
        title: 'Archival Failed',
        description: err.response?.data?.message || 'Failed to archive data',
        variant: 'destructive'
      })
    } finally {
      setIsArchiving(false)
    }
  }

  const getRequiredConfirmation = (b: any) => {
    if (!b) return ''
    const date = new Date(b.periodStart)
    const month = date.toLocaleString('default', { month: 'long' }).toUpperCase()
    const year = date.getFullYear()
    return `ARCHIVE ${month} ${year}`
  }

  const selectedRestaurantObj = restaurants.find(r => r._id === selectedRestaurantId)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Restaurant Data Backup & Export Portal</h1>
        <p className="text-gray-500 mt-1">Select any restaurant account to generate and download verified sales data backups.</p>
      </div>

      {/* Generator Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">1. Select Restaurant & Download Sales Backup</CardTitle>
          <CardDescription>Choose a specific restaurant account and date range to download verified sales data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Select Restaurant Account</label>
              <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
                <SelectTrigger className="w-full font-medium"><SelectValue placeholder="Select Restaurant" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Show All Restaurant Accounts</SelectItem>
                  {restaurants.map(r => (
                    <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Backup Period Type</label>
              <Select value={backupType} onValueChange={setBackupType}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly (Mon - Sun)</SelectItem>
                  <SelectItem value="MONTHLY">Monthly (1st - Last Day)</SelectItem>
                  <SelectItem value="MANUAL">Manual Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Start Date</label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">End Date</label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          {selectedRestaurantObj && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs flex items-center justify-between text-orange-900">
              <span>Selected Account: <strong>{selectedRestaurantObj.name}</strong></span>
              <span className="text-orange-700">Account ID: <code className="font-mono">{selectedRestaurantObj._id}</code></span>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleGenerateBackup} disabled={loading || selectedRestaurantId === 'ALL'} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Generate & Download Restaurant Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-lg font-bold">2. Restaurant Backup Files & Archival Records</CardTitle>
            <CardDescription>Filtered backup list for the selected restaurant account.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchBackups} className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Restaurant Account</th>
                  <th className="px-4 py-3">Backup ID</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Sales</th>
                  <th className="px-4 py-3 font-mono text-[10px]">SHA-256 Checksum</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backups.map((b: any) => (
                  <tr key={b._id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-bold text-gray-900">{b.restaurantId?.name || 'Restaurant Account'}</td>
                    <td className="px-4 py-3 font-mono text-gray-800">{b.backupId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(b.periodStart).toLocaleDateString()} — {new Date(b.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{b.backupType}</Badge></td>
                    <td className="px-4 py-3 font-medium">{b.orderCount}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">₹{Number(b.totalSales).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-400 truncate max-w-[120px]" title={b.checksum}>
                      {b.checksum.slice(0, 16)}...
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] uppercase font-bold ${
                        b.status === 'ARCHIVED' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => handleDownloadBackup(b)} className="h-7 text-xs gap-1">
                        <Download className="w-3.5 h-3.5" /> Download Data
                      </Button>

                      {b.status !== 'ARCHIVED' && (
                        <Button size="sm" variant="destructive" onClick={() => handleOpenArchiveModal(b)} className="h-7 text-xs gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Archive Month
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {backups.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">No backup records found for this selection.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal for Safe Server Data Deletion */}
      <Dialog open={!!selectedBackupForArchive} onOpenChange={(open) => !open && setSelectedBackupForArchive(null)}>
        <DialogContent className="max-w-md border-red-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <AlertTriangle className="w-5 h-5" /> High-Risk Monthly Data Archival & Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              You are about to remove verified production sales records from active operational database storage. The data will be safely moved to historical storage.
            </DialogDescription>
          </DialogHeader>

          {selectedBackupForArchive && (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200 space-y-1">
                <p className="font-bold text-red-900">Target Backup: {selectedBackupForArchive.backupId}</p>
                <p className="text-red-700">Orders: {selectedBackupForArchive.orderCount} | Sales: ₹{Number(selectedBackupForArchive.totalSales).toFixed(2)}</p>
                <p className="text-red-800 font-mono text-[10px]">SHA-256: {selectedBackupForArchive.checksum}</p>
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Type <span className="font-mono text-red-600 font-bold">{getRequiredConfirmation(selectedBackupForArchive)}</span> to confirm:
                </label>
                <Input 
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={getRequiredConfirmation(selectedBackupForArchive)}
                  className="font-mono uppercase text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBackupForArchive(null)} disabled={isArchiving}>Cancel</Button>
            <Button 
              onClick={handleExecuteArchive} 
              disabled={isArchiving || confirmationInput.trim().toUpperCase() !== getRequiredConfirmation(selectedBackupForArchive)}
              variant="destructive"
              className="font-semibold"
            >
              {isArchiving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Confirm & Execute Archival
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
