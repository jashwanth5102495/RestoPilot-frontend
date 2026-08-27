import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Loader2, UtensilsCrossed } from "lucide-react"
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

  const [activeTab, setActiveTab] = useState<'FAST_BILLING' | 'TABLES'>('FAST_BILLING')
  const [tables, setTables] = useState<any[]>([])
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState<any>(null)

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

        const tablesRes = await axios.get(`${API_URL}/public/billing/${slug}/tables`)
        setTables(tablesRes.data.data.tables)
        setActiveOrders(tablesRes.data.data.activeOrders)
      } catch (err: any) {
        console.error('Error fetching billing data:', err)
        setError(err.response?.data?.message || 'Failed to load Billing Portal')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  const refreshTables = async () => {
    try {
      const tablesRes = await axios.get(`${API_URL}/public/billing/${slug}/tables`)
      setTables(tablesRes.data.data.tables)
      setActiveOrders(tablesRes.data.data.activeOrders)
    } catch (err) {
      console.error(err)
    }
  }

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

      const response = await axios.post(`${API_URL}/public/billing/${slug}/sale`, payload)

      const billNumber = response.data.data.bill.billNumber
      toast({
        title: "Bill generated successfully",
        description: `Order ${billNumber} completed via ${paymentMethod}.`,
      })
      
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

  const handleSettleTable = async () => {
    if (!selectedTable) return
    setIsProcessing(true)
    try {
      const res = await axios.post(`${API_URL}/public/billing/${slug}/tables/${selectedTable._id}/settle`, {
        paymentMethod
      })
      toast({
        title: "Table Settled",
        description: `Order for ${selectedTable.name} completed successfully.`,
      })
      printReceipt(res.data.data)
      setSelectedTable(null)
      refreshTables()
    } catch (err: any) {
      toast({
        title: "Failed to settle table",
        description: err.response?.data?.message || 'Error settling table',
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

  const getTableOrder = (tableId: string) => activeOrders.find(o => o.tableId === tableId)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-white border-r flex flex-col items-center py-6 gap-6 shadow-sm z-10 hidden sm:flex">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm mb-4">
          {restaurantData?.name?.charAt(0) || 'R'}
        </div>
        
        <button
          onClick={() => setActiveTab('FAST_BILLING')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            activeTab === 'FAST_BILLING' 
              ? 'bg-primary/10 text-primary scale-110' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Fast Billing"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] font-bold">POS</span>
        </button>

        <button
          onClick={() => { setActiveTab('TABLES'); refreshTables(); }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            activeTab === 'TABLES' 
              ? 'bg-primary/10 text-primary scale-110' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Table Orders"
        >
          <UtensilsCrossed className="w-6 h-6" />
          <span className="text-[10px] font-bold">Tables</span>
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Nav & Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between sm:hidden">
           <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {restaurantData?.name} 
          </h1>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('FAST_BILLING')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'FAST_BILLING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              POS
            </button>
            <button 
              onClick={() => { setActiveTab('TABLES'); refreshTables(); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'TABLES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Tables
            </button>
          </div>
        </header>
        
        <header className="bg-white border-b px-6 py-4 items-center justify-between hidden sm:flex shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurantData?.name}</h1>
            <p className="text-sm text-gray-500">{activeTab === 'FAST_BILLING' ? 'Point of Sale (Fast Billing)' : 'Table Bills Management'}</p>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="h-full flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto min-h-[600px]">
          
          {activeTab === 'FAST_BILLING' ? (
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
                        className={`hover:border-primary/50 transition-colors group overflow-hidden flex flex-col justify-between relative ${!dish.isAvailable ? 'opacity-50 grayscale' : ''}`}
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const toggleAvailability = async () => {
                              try {
                                const newStatus = !dish.isAvailable;
                                await axios.patch(`${API_URL}/public/billing/${slug}/dishes/${dish._id}/availability`, { isAvailable: newStatus });
                                setDishes(prev => prev.map(d => d._id === dish._id ? { ...d, isAvailable: newStatus } : d));
                                toast({ title: newStatus ? 'Dish is now available' : 'Dish marked as out of stock' });
                              } catch (err) {
                                toast({ title: 'Failed to update dish', variant: 'destructive' });
                              }
                            };
                            toggleAvailability();
                          }}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:bg-gray-100 z-10"
                          title={dish.isAvailable ? "Mark as Out of Stock" : "Mark as Available"}
                        >
                          <span className="font-serif italic text-xs font-bold">i</span>
                        </button>
                        <CardContent className="p-3 flex-1 pt-6">
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
          ) : (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col p-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">Active Tables</h2>
                <p className="text-sm text-gray-500">Select a table to settle its bill</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto">
                {tables.map(table => {
                  const order = getTableOrder(table._id);
                  const isOccupied = !!order;
                  
                  return (
                    <button
                      key={table._id}
                      onClick={() => isOccupied && setSelectedTable(table)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        selectedTable?._id === table._id
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : isOccupied 
                            ? 'border-orange-200 bg-orange-50 hover:bg-orange-100 cursor-pointer' 
                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <div className={`p-3 rounded-full ${isOccupied ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-400'}`}>
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>
                      </div>
                      <h3 className={`font-bold ${isOccupied ? 'text-gray-900' : 'text-gray-500'}`}>{table.name}</h3>
                      <p className="text-sm text-gray-500">
                        {isOccupied ? `₹${order.total}` : 'Available'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Right side: Cart / Table Order Summary */}
          <div className="w-full lg:w-96 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{activeTab === 'FAST_BILLING' ? 'Current Order' : (selectedTable ? `Table: ${selectedTable.name}` : 'Select a table')}</h2>
                <p className="text-sm text-gray-500">{activeTab === 'FAST_BILLING' ? 'Fast Billing' : (selectedTable ? 'Table Bill' : 'Waiting for selection')}</p>
              </div>
              {activeTab === 'TABLES' && selectedTable && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-0">Unpaid</Badge>
              )}
            </div>

            {activeTab === 'FAST_BILLING' && (
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
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'FAST_BILLING' ? (
                cart.length === 0 ? (
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
                )
              ) : (
                // Table orders view
                !selectedTable ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
                    <ShoppingBag className="w-12 h-12 mb-4 text-gray-200" />
                    <p>Please select an occupied table.</p>
                  </div>
                ) : (
                  getTableOrder(selectedTable._id)?.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{item.dishName}</h4>
                        <p className="text-sm text-gray-500">₹{item.unitPrice} × {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-sm">₹{item.lineTotal}</span>
                    </div>
                  ))
                )
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3 rounded-b-xl">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{activeTab === 'FAST_BILLING' ? subtotal.toFixed(2) : (selectedTable ? getTableOrder(selectedTable._id)?.subtotal.toFixed(2) : '0.00')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>₹{activeTab === 'FAST_BILLING' ? tax.toFixed(2) : (selectedTable ? getTableOrder(selectedTable._id)?.tax.toFixed(2) : '0.00')}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-lg text-gray-900">Total</span>
                <span className="font-bold text-2xl text-primary">₹{activeTab === 'FAST_BILLING' ? total.toFixed(2) : (selectedTable ? getTableOrder(selectedTable._id)?.total.toFixed(2) : '0.00')}</span>
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
                {activeTab === 'FAST_BILLING' ? (
                  <>
                    <Button variant="outline" className="w-1/3" onClick={() => { setCart([]); setCustomerName(''); setCustomerPhone(''); }}>Clear</Button>
                    <Button className="flex-1 font-semibold text-base shadow-md" onClick={handleGenerateBill} disabled={cart.length === 0 || isProcessing}>
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Bill'}
                    </Button>
                  </>
                ) : (
                  <Button className="w-full font-semibold text-base shadow-md" onClick={handleSettleTable} disabled={!selectedTable || isProcessing}>
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Settle Table Bill'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
