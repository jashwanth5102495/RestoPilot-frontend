import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminDataRequests() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dataUrls, setDataUrls] = useState<Record<string, string>>({})

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/data-requests')
      setRequests(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleFulfill = async (id: string) => {
    const url = dataUrls[id]
    if (!url) return toast({ title: 'Please provide a Data URL', variant: 'destructive' })

    setLoading(true)
    try {
      await api.post(`/admin/data-requests/${id}/fulfill`, { dataUrl: url })
      toast({ title: 'Request Fulfilled', description: 'The restaurant owner can now view their data.' })
      fetchRequests()
    } catch (err) {
      toast({ title: 'Failed to fulfill request', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Requests</h1>
        <p className="text-gray-500 mt-2">Manage historical data restore requests from restaurants.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending & Fulfilled Requests</CardTitle>
          <CardDescription>Upload the downloaded JSON file to a secure host (like AWS S3) and paste the URL here to fulfill a request.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-slate-500 italic">No data requests found.</p>
            ) : (
              requests.map(req => (
                <div key={req._id} className="p-4 border rounded-lg bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900">{req.restaurantId?.name || 'Unknown Restaurant'}</h3>
                    <p className="text-sm text-slate-500">Requested: {req.month}/{req.year}</p>
                    <div className="mt-2">
                      {req.status === 'FULFILLED' ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4" /> Fulfilled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                          <Clock className="w-4 h-4" /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {req.status === 'PENDING' ? (
                    <div className="flex w-full md:w-auto gap-2">
                      <Input 
                        placeholder="Paste JSON URL here..."
                        value={dataUrls[req._id] || ''}
                        onChange={(e) => setDataUrls(prev => ({...prev, [req._id]: e.target.value}))}
                        className="w-full md:w-64"
                      />
                      <Button onClick={() => handleFulfill(req._id)} disabled={loading}>
                        Fulfill
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 truncate w-full md:w-64">
                      Provided URL: <a href={req.dataUrl} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Link</a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
