import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, Save, Loader2 } from 'lucide-react'

export default function AdminSubscriptionPricing() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [thresholdSaving, setThresholdSaving] = useState(false)
  const [amount, setAmount] = useState<number>(5000)
  const [minimumAmount, setMinimumAmount] = useState<number>(100)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [clientAmounts, setClientAmounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const [priceRes, subscriptionsRes] = await Promise.all([
          api.get('/admin/subscription-price'),
          api.get('/admin/subscriptions'),
        ])
        setAmount(priceRes.data.data.amount)
        setMinimumAmount(priceRes.data.data.minimumAmount ?? 100)
        const rows = subscriptionsRes.data.data || []
        setSubscriptions(rows)
        setClientAmounts(Object.fromEntries(rows.map((row: any) => [row.restaurantId?._id || row.restaurantId, row.pendingAmount ?? row.amount])))
      } catch (err) {
        console.error(err)
        toast({
          title: 'Error',
          description: 'Failed to fetch subscription price',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchPrice()
  }, [toast])

  const handleSave = async () => {
    if (amount < minimumAmount) {
      toast({
        title: 'Invalid Amount',
        description: `The subscription amount must be at least ₹${minimumAmount}.`,
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      await api.put('/admin/subscription-price', { amount })
      toast({
        title: 'Success',
        description: 'Subscription price updated successfully.',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Error',
        description: 'Failed to update subscription price',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMinimum = async () => {
    if (minimumAmount < 1 || minimumAmount > amount) {
      toast({
        title: 'Invalid Threshold',
        description: 'The minimum threshold must be at least ₹1 and cannot exceed the default subscription price.',
        variant: 'destructive',
      })
      return
    }

    setThresholdSaving(true)
    try {
      await api.put('/admin/subscription-minimum-price', { minimumAmount })
      toast({ title: 'Success', description: 'Minimum subscription threshold updated successfully.' })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update minimum threshold',
        variant: 'destructive',
      })
    } finally {
      setThresholdSaving(false)
    }
  }

  const saveClientPrice = async (subscription: any) => {
    const restaurantId = subscription.restaurantId?._id || subscription.restaurantId
    const nextAmount = clientAmounts[restaurantId]
    if (!nextAmount || nextAmount < minimumAmount) {
      toast({ title: 'Invalid Amount', description: `The restaurant amount must be at least ₹${minimumAmount}.`, variant: 'destructive' })
      return
    }

    try {
      const response = await api.patch(`/admin/subscriptions/${restaurantId}`, { amount: nextAmount })
      setSubscriptions(current => current.map(row => row._id === subscription._id ? response.data.data : row))
      toast({ title: 'Restaurant price updated', description: 'The new amount will apply from the next payment period.' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update restaurant price', variant: 'destructive' })
    }
  }

  const toggleClientAccess = async (subscription: any) => {
    const restaurantId = subscription.restaurantId?._id || subscription.restaurantId
    try {
      const response = await api.patch(`/admin/subscriptions/${restaurantId}`, { accessEnabled: !subscription.accessEnabled })
      setSubscriptions(current => current.map(row => row._id === subscription._id ? response.data.data : row))
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update access', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Subscription Pricing</h2>
        <p className="text-gray-500">Configure the monthly subscription price for restaurants.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Monthly Subscription Fee</CardTitle>
              <CardDescription>This is the amount billed to restaurant owners every 30 days.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <Input
                type="number"
                min={minimumAmount}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="pl-8 text-lg"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Pricing
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minimum subscription threshold</CardTitle>
          <CardDescription>Amounts below this value cannot be assigned to the default price or an individual restaurant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Minimum amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <Input
                type="number"
                min="1"
                max={amount}
                value={minimumAmount}
                onChange={(event) => setMinimumAmount(Number(event.target.value))}
                className="pl-8 text-lg"
              />
            </div>
          </div>
          <Button onClick={handleSaveMinimum} disabled={thresholdSaving} className="w-full sm:w-auto">
            {thresholdSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Minimum Threshold
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurant subscriptions</CardTitle>
          <CardDescription>Override an individual restaurant price or disable its access independently.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(subscription => {
                  const restaurantId = subscription.restaurantId?._id || subscription.restaurantId
                  return (
                    <tr key={subscription._id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{subscription.restaurantId?.name || restaurantId}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={minimumAmount}
                          value={clientAmounts[restaurantId] ?? subscription.amount}
                          onChange={event => setClientAmounts(current => ({ ...current, [restaurantId]: Number(event.target.value) }))}
                          className="w-32"
                        />
                      </td>
                      <td className="p-3">{subscription.status}</td>
                      <td className="p-3">{subscription.paymentMode}</td>
                      <td className="p-3 flex gap-2">
                        <Button size="sm" onClick={() => saveClientPrice(subscription)}>Save price</Button>
                        <Button size="sm" variant="outline" onClick={() => toggleClientAccess(subscription)}>
                          {subscription.accessEnabled ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
