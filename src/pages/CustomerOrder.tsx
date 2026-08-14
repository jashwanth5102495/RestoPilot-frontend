import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Minus, Plus, Utensils, AlertTriangle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function CustomerOrder() {
  const { slug } = useParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restaurant, setRestaurant] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  
  const [cart, setCart] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get(`/public/restaurants/${slug}`)
        setRestaurant(res.data.data.restaurant)
        setCategories([{ _id: 'All', name: 'All' }, ...res.data.data.categories])
        setDishes(res.data.data.dishes)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Restaurant not found or not accepting online orders.')
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchMenu()
  }, [slug])

  const addToCart = (dish: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish._id === dish._id)
      if (existing) {
        return prev.map(item => item.dish._id === dish._id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { dish, quantity: 1 }]
    })
  }

  const updateQuantity = (dishId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.dish._id === dishId) {
        const newQ = item.quantity + delta
        return newQ > 0 ? { ...item, quantity: newQ } : null
      }
      return item
    }).filter(Boolean) as any[])
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0)

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return toast({ title: 'Cart empty', variant: 'destructive' })
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      return toast({ title: 'Please fill all details', variant: 'destructive' })
    }

    setIsSubmitting(true)
    try {
      const payload = {
        customerInfo,
        items: cart.map(c => ({ dishId: c.dish._id, quantity: c.quantity }))
      }
      await api.post(`/public/restaurants/${slug}/orders`, payload)
      setOrderSuccess(true)
      setCart([])
    } catch (err) {
      toast({ title: 'Order failed', description: 'Please try again', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Loading menu...</div>
  if (error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
      <p className="text-gray-500">{error}</p>
    </div>
  )
  if (orderSuccess) return (
    <div className="h-screen flex flex-col items-center justify-center bg-green-50 text-center px-4">
      <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h1 className="text-3xl font-bold text-green-900 mb-2">Order Received!</h1>
      <p className="text-green-700 max-w-md">Thank you, {customerInfo.name}. Your order has been sent to {restaurant.name}. You pay on delivery/pickup.</p>
      <Button className="mt-8" onClick={() => setOrderSuccess(false)}>Order More</Button>
    </div>
  )

  const filteredDishes = dishes.filter(d => activeCategory === 'All' || d.categoryId === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Menu Section */}
      <div className="flex-1 overflow-y-auto pb-32 md:pb-0">
        <div className="bg-slate-900 text-white px-6 py-12 text-center md:text-left shadow-md">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
              <Utensils className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{restaurant?.name}</h1>
              <p className="text-slate-400 mt-1">Order online for delivery or pickup</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  activeCategory === cat._id 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Dishes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDishes.map(dish => (
              <Card key={dish._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{dish.name}</h3>
                    {dish.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dish.description}</p>}
                    <p className="font-bold text-gray-900 mt-3">₹{dish.price}</p>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => addToCart(dish)}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col fixed md:relative bottom-0 left-0 right-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none h-[60vh] md:h-screen transition-transform transform translate-y-[calc(100%-60px)] md:translate-y-0 group hover:translate-y-0 md:hover:translate-y-0">
        
        {/* Mobile Handle */}
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white cursor-pointer rounded-t-2xl">
          <div className="font-bold flex items-center gap-2"><ShoppingBag className="w-5 h-5"/> View Cart ({cart.reduce((a,b)=>a+b.quantity,0)})</div>
          <div className="font-bold">₹{cartTotal}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 hidden md:block group-hover:block">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ShoppingBag className="w-5 h-5"/> Your Order</h2>
          
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">Your cart is empty.</div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.dish._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-sm text-gray-900 line-clamp-1">{item.dish.name}</p>
                    <p className="text-xs text-gray-500">₹{item.dish.price}</p>
                  </div>
                  <div className="flex items-center bg-white rounded-md border border-gray-200">
                    <button onClick={() => updateQuantity(item.dish._id, -1)} className="p-1 hover:bg-gray-100 rounded-l-md"><Minus className="w-4 h-4 text-gray-600" /></button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.dish._id, 1)} className="p-1 hover:bg-gray-100 rounded-r-md"><Plus className="w-4 h-4 text-gray-600" /></button>
                  </div>
                </div>
              ))}
              
              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{cartTotal}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitOrder} className="mt-8 space-y-4 border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900">Delivery Details</h3>
                <Input placeholder="Full Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} required />
                <Input placeholder="Phone Number" type="tel" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} required />
                <Input placeholder="Delivery Address" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} required />
                
                <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Place Order (Pay on Delivery)'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
