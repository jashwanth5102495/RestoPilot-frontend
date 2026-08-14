import { useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminDataBackup() {
  const { toast } = useToast()
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('2026')
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!month || !year) return toast({ title: 'Select month and year', variant: 'destructive' })
    
    setLoading(true)
    try {
      // Create a direct link to download the JSON
      const token = localStorage.getItem('accessToken')
      const url = `${api.defaults.baseURL}/admin/backup/export?month=${month}&year=${year}`
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to download')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `restropilot-backup-${month}-${year}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast({ title: 'Backup Downloaded Successfully' })
    } catch (err) {
      toast({ title: 'Download Failed', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleWipe = async () => {
    if (!month || !year) return toast({ title: 'Select month and year', variant: 'destructive' })
    
    if (!window.confirm(`Are you absolutely sure you want to WIPE all data for ${month}/${year}? This action is irreversible unless you have downloaded the JSON.`)) {
      return
    }

    setLoading(true)
    try {
      const res = await api.delete(`/admin/backup/wipe?month=${month}&year=${year}`)
      toast({ title: 'Database Wiped', description: res.data.message })
    } catch (err) {
      toast({ title: 'Wipe Failed', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Backup & Wipe</h1>
        <p className="text-gray-500 mt-2">Export monthly data and wipe the database to save MongoDB space.</p>
      </div>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle>Manage Monthly Data</CardTitle>
          <CardDescription>Select a month to backup or delete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Month" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="01">January</SelectItem>
                <SelectItem value="02">February</SelectItem>
                <SelectItem value="03">March</SelectItem>
                <SelectItem value="04">April</SelectItem>
                <SelectItem value="05">May</SelectItem>
                <SelectItem value="06">June</SelectItem>
                <SelectItem value="07">July</SelectItem>
                <SelectItem value="08">August</SelectItem>
                <SelectItem value="09">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" /> 1. Download Backup
              </h3>
              <p className="text-sm text-slate-500 mb-4">Save a local copy of all orders and sales for this month.</p>
              <Button onClick={handleDownload} disabled={loading} variant="outline" className="w-full">
                Download JSON
              </Button>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 2. Wipe Database
              </h3>
              <p className="text-sm text-red-600/80 mb-4">Permanently delete all orders for this month from MongoDB.</p>
              <Button onClick={handleWipe} disabled={loading} variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" /> Wipe Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
