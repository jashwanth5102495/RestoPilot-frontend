import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type CartItem = {
  dish: any
  quantity: number
}

export default function Billing() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, dishesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/dishes')
        ])
        setCategories([{ _id: 'All', name: 'All' }, ...catsRes.data.data])
        setDishes(dishesRes.data.data)
      } catch (error) {
        console.error('Error fetching billing data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = activeCategory === 'All' || dish.categoryId?.name === activeCategory || dish.categoryId?._id === activeCategory
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (dish: any) => {
    if (!dish.isAvailable) {
      toast({ title: 'Dish Unavailable', description: 'This dish is currently out of stock.', variant: 'destructive' })
      return
    }
    setCart(prev => {
      const existing = prev.find(item => item.dish._id === dish._id)
      if (existing) {
        return prev.map(item => item.dish._id === dish._id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { dish, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.dish._id === id) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0)
  const tax = subtotal * 0.05 // Assuming flat 5% GST for demo
  const total = subtotal + tax

  const handleGenerateBill = async () => {
    if (cart.length === 0) return
    setIsProcessing(true)
    
    try {
      const items = cart.map(item => ({
        dishId: item.dish._id,
        quantity: item.quantity
      }))

      const response = await api.post('/billing/sale', {
        items,
        paymentMethod
      })

      const billNumber = response.data.data.bill.billNumber
      toast({
        title: "Bill generated successfully",
        description: `Order ${billNumber} completed via ${paymentMethod}.`,
      })
      
      setCart([])
    } catch (error: any) {
      toast({
        title: "Billing Failed",
        description: error.response?.data?.message || 'Failed to process sale. Check inventory levels.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Left side: Menu */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Badge 
                key={category._id} 
                variant={activeCategory === category.name ? "default" : "secondary"}
                className={`cursor-pointer px-3 py-1 ${activeCategory === category.name ? 'bg-primary hover:bg-primary/90' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search dishes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-[#F8F8F7]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
              <p>Loading menu...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDishes.map(dish => (
                <Card 
                  key={dish._id} 
                  className={`cursor-pointer hover:border-primary/50 transition-colors group overflow-hidden ${!dish.isAvailable ? 'opacity-50 grayscale' : ''}`}
                  onClick={() => addToCart(dish)}
                >

                  <CardContent className="p-3">
                    <p className="text-xs text-primary font-medium mb-1">{dish.categoryId?.name}</p>
                    <h3 className="font-semibold text-gray-900 leading-tight mb-1">{dish.name}</h3>
                    <p className="font-bold text-gray-900">₹{dish.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!loading && filteredDishes.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Search className="w-12 h-12 mb-4 text-gray-300" />
              <p>No dishes found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Cart */}
      <div className="w-full lg:w-96 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">Current Order</h2>
          <p className="text-sm text-gray-500">Order #RP{Math.floor(1000 + Math.random() * 9000)}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingBag className="w-12 h-12 mb-4 text-gray-200" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.dish._id} className="flex items-center justify-between group">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-medium text-sm text-gray-900 truncate">{item.dish.name}</h4>
                  <p className="text-sm text-gray-500">₹{item.dish.price} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm w-12 text-right">₹{item.dish.price * item.quantity}</span>
                  <div className="flex items-center bg-gray-100 rounded-md">
                    <button onClick={() => updateQuantity(item.dish._id, -1)} className="p-1 hover:bg-gray-200 rounded-l-md text-gray-600 transition-colors">
                      {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.dish._id, 1)} className="p-1 hover:bg-gray-200 rounded-r-md text-gray-600 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3 rounded-b-xl">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (5% GST)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>₹0.00</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-bold text-lg text-gray-900">Total</span>
            <span className="font-bold text-2xl text-primary">₹{total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { id: 'CASH', label: 'Cash', icon: Banknote },
              { id: 'UPI', label: 'UPI', icon: Smartphone },
              { id: 'CARD', label: 'Card', icon: CreditCard }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`py-2 px-1 flex flex-col items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-colors ${
                  paymentMethod === method.id 
                    ? 'border-primary bg-orange-50 text-primary' 
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <method.icon className="w-4 h-4" />
                {method.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="w-1/3">Draft</Button>
            <Button className="flex-1 font-semibold text-base shadow-md" onClick={handleGenerateBill} disabled={cart.length === 0 || isProcessing}>
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Bill'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
