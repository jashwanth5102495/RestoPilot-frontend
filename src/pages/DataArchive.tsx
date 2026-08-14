import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Database, CheckCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DataArchive() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<any[]>([])
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('2026')
  const [loading, setLoading] = useState(false)

  const fetchRequests = async () => {
    try {
      const res = await api.get('/billing/data-requests')
      setRequests(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleRequest = async () => {
    if (!month || !year) {
      return toast({ title: 'Select month and year', variant: 'destructive' })
    }
    
    setLoading(true)
    try {
      await api.post('/billing/data-request/pay', { month, year })
      toast({ title: 'Request Submitted & Paid', description: '₹50 was charged. Data will be available soon.' })
      fetchRequests()
    } catch (err) {
      toast({ title: 'Request Failed', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="bg-orange-100 p-3 rounded-xl">
          <Database className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Archive</h1>
          <p className="text-gray-500 mt-1">Request and view your previous months' data.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Request Historical Data</CardTitle>
            <CardDescription>
              We delete data older than 1 month to stay within our free tier. 
              You can request an archived copy for ₹50 per month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            
            <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-100 mt-4">
              <span className="text-gray-600">Retrieval Fee</span>
              <span className="text-xl font-bold text-gray-900">₹50</span>
            </div>

            <Button onClick={handleRequest} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11">
              Pay & Request Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Data Requests</CardTitle>
            <CardDescription>Access your requested archived data</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No requests made yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req._id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">{req.month}/{req.year}</p>
                      <div className="flex items-center gap-1 text-xs mt-1">
                        {req.status === 'FULFILLED' ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Ready</span>
                        ) : (
                          <span className="text-orange-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Processing</span>
                        )}
                      </div>
                    </div>
                    {req.status === 'FULFILLED' && req.dataUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={req.dataUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" /> View Data
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
