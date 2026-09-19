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
  const [amount, setAmount] = useState<number>(5000)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await api.get('/admin/subscription-price')
        setAmount(res.data.data.amount)
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
    if (amount < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'The subscription amount must be at least ₹100.',
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
                min="100"
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
    </div>
  )
}
