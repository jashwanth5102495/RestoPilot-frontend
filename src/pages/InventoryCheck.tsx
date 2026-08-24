import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft, Check, AlertTriangle } from "lucide-react"
import { Link } from "react-router-dom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function InventoryCheck() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formState, setFormState] = useState<Record<string, { actualQuantity: string, reason: string, notes: string }>>({})

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/inventory/checks/status')
        const fetchedItems = res.data.data.items.filter((i: any) => i.checkStatus === 'OVERDUE' || i.checkStatus === 'DUE')
        setItems(fetchedItems)
        
        const initialFormState: Record<string, any> = {}
        fetchedItems.forEach((i: any) => {
          initialFormState[i._id] = { actualQuantity: '', reason: 'Other', notes: '' }
        })
        setFormState(initialFormState)
      } catch (err) {
        console.error(err)
        toast({ title: 'Error', description: 'Failed to fetch inventory check list', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [])

  const handleInputChange = (id: string, field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const calculateVariance = (estimated: number, actualStr: string) => {
    if (!actualStr) return null
    const actual = Number(actualStr)
    if (isNaN(actual)) return null
    const variance = actual - estimated
    let percentage = 0
    if (estimated > 0) percentage = (variance / estimated) * 100
    else if (estimated === 0 && actual > 0) percentage = 100
    return { variance, percentage }
  }

  const handleSubmit = async () => {
    const checksToSubmit = Object.entries(formState)
      .filter(([_, state]) => state.actualQuantity !== '')
      .map(([id, state]) => ({
        ingredientId: id,
        actualQuantity: Number(state.actualQuantity),
        reason: state.reason,
        notes: state.notes
      }))

    if (checksToSubmit.length === 0) {
      return toast({ title: 'No input', description: 'Please enter actual quantities for at least one item.', variant: 'destructive' })
    }

    setSubmitting(true)
    try {
      await api.post('/inventory/checks', { checks: checksToSubmit })
      toast({ title: 'Success', description: 'Inventory checks submitted successfully.' })
      window.location.href = '/inventory'
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to submit', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link to="/inventory">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Physical Stock Check</h1>
          <p className="text-gray-500">Verify estimated stock against actual physical quantities.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Due for Verification</CardTitle>
          <CardDescription>Enter the actual quantities found in the kitchen.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <Check className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900">All caught up!</p>
              <p>There are no ingredients currently due for verification.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map(item => {
                const state = formState[item._id]
                const stats = calculateVariance(item.currentStock, state.actualQuantity)
                const isSignificant = stats && Math.abs(stats.percentage) > 5

                return (
                  <div key={item._id} className="p-4 border rounded-lg bg-gray-50/50">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                          {item.checkStatus === 'OVERDUE' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Overdue</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Estimated Stock: <span className="font-medium text-gray-900">{item.currentStock} {item.unit}</span>
                        </p>
                      </div>

                      <div className="flex-1 flex gap-4">
                        <div className="w-32">
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Actual ({item.unit})</label>
                          <Input 
                            type="number" 
                            step="any"
                            placeholder={`e.g. ${item.currentStock}`} 
                            value={state.actualQuantity}
                            onChange={(e) => handleInputChange(item._id, 'actualQuantity', e.target.value)}
                          />
                        </div>
                        <div className="w-32 pt-6">
                          {stats && (
                            <div className={`text-sm font-medium flex flex-col ${stats.variance < 0 ? 'text-red-600' : stats.variance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                              <span>{stats.variance > 0 ? '+' : ''}{stats.variance.toFixed(2)} {item.unit}</span>
                              <span className="text-xs">{stats.variance > 0 ? '+' : ''}{stats.percentage.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {isSignificant && (
                        <div className="flex-1 space-y-3 p-3 bg-white border border-orange-100 rounded-md">
                          <div className="flex items-center gap-2 text-sm text-orange-700 font-medium mb-1">
                            <AlertTriangle className="w-4 h-4" /> Significant Variance
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Reason</label>
                            <Select value={state.reason} onValueChange={(val) => handleInputChange(item._id, 'reason', val)}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Wastage">Wastage</SelectItem>
                                <SelectItem value="Spoilage">Spoilage</SelectItem>
                                <SelectItem value="Preparation Loss">Preparation Loss</SelectItem>
                                <SelectItem value="Unrecorded Usage">Unrecorded Usage</SelectItem>
                                <SelectItem value="Stock Entry Error">Stock Entry Error</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700 mb-1 block">Notes (Optional)</label>
                            <Input 
                              className="h-8 text-sm" 
                              placeholder="Explain variance..." 
                              value={state.notes}
                              onChange={(e) => handleInputChange(item._id, 'notes', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => window.location.href = '/inventory'}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="min-w-[150px]">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Adjustments
          </Button>
        </div>
      )}
    </div>
  )
}
