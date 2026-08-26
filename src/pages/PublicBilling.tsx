import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { printReceipt } from '@/lib/printReceipt'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

type CartItem = {
  dish: any
  quantity: number
}

export default function PublicBilling() {
  const { slug } = useParams<{ slug: string }>()
  const { toast } = useToast()
  
  const [restaurantData, setRestaurantData] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH')

  // Customer states
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/billing/${slug}/menu`)
        const data = res.data.data
        setRestaurantData(data.restaurant)
        setCategories([{ _id: 'All', name: 'All' }, ...data.categories])
        setDishes(data.dishes)
      } catch (err: any) {
        console.error('Error fetching billing data:', err)
        setError(err.response?.data?.message || 'Failed to load Billing Portal')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

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

      const payload: any = {
        items,
        paymentMethod,
        customerId: null // Currently unauthenticated
      }
      if (customerName || customerPhone) {
        // Optional: you can handle customer creation server side if needed
      }

      const response = await axios.post(`${API_URL}/public/billing/${slug}/sale`, payload)

      const billNumber = response.data.data.bill.billNumber
      toast({
        title: "Bill generated successfully",
        description: `Order ${billNumber} completed via ${paymentMethod}.`,
      })
      
      // Print the receipt
      printReceipt(response.data.data.order)

      setCart([])
      setCustomerName('')
      setCustomerPhone('')
    } catch (err: any) {
      toast({
        title: "Billing Failed",
        description: err.response?.data?.message || 'Failed to process sale. Check inventory levels.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return <div className="h-screen flex flex-col items-center justify-center text-gray-500"><Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" /><p>Loading Billing Portal...</p></div>
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          {restaurantData?.name} 
          <span className="text-sm font-normal text-gray-500 px-2 py-1 bg-gray-100 rounded-md">Billing POS</span>
        </h1>
      </header>

      <div className="flex-1 p-4 md:p-6">
        <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
          
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
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDishes.map(dish => {
                  const cartItem = cart.find(item => item.dish._id === dish._id);
                  const quantity = cartItem ? cartItem.quantity : 0;
                  return (
                    <Card 
                      key={dish._id} 
                      className={`hover:border-primary/50 transition-colors group overflow-hidden flex flex-col justify-between ${!dish.isAvailable ? 'opacity-50 grayscale' : ''}`}
                    >
                      <CardContent className="p-3 flex-1">
                        <p className="text-xs text-primary font-medium mb-1">{dish.categoryId?.name}</p>
                        <h3 className="font-semibold text-gray-900 leading-tight mb-1">{dish.name}</h3>
                        <p className="font-bold text-gray-900">₹{dish.price}</p>
                      </CardContent>
                      <div className="p-3 pt-0">
                        {quantity === 0 ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full text-xs font-semibold h-8 border-primary text-primary hover:bg-primary hover:text-white"
                            onClick={() => addToCart(dish)}
                          >
                            Add
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between w-full bg-gray-100 rounded-md h-8 px-1">
                            <button 
                              onClick={() => updateQuantity(dish._id, -1)} 
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-medium">{quantity}</span>
                            <button 
                              onClick={() => updateQuantity(dish._id, 1)} 
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
              {filteredDishes.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
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
              <p className="text-sm text-gray-500">Fast Billing</p>
            </div>

            <div className="p-4 border-b border-gray-200 space-y-3">
              <Input 
                placeholder="Customer Name (Optional)" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9"
              />
              <Input 
                placeholder="Contact Number (Optional)" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
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
                <Button variant="outline" className="w-1/3" onClick={() => { setCart([]); setCustomerName(''); setCustomerPhone(''); }}>Clear</Button>
                <Button className="flex-1 font-semibold text-base shadow-md" onClick={handleGenerateBill} disabled={cart.length === 0 || isProcessing}>
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Bill'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
