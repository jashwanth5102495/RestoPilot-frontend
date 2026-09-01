import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Loader2, UtensilsCrossed, RefreshCw, Globe, MapPin, Phone, User, Printer } from "lucide-react"
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

  const [activeTab, setActiveTab] = useState<'FAST_BILLING' | 'TABLES' | 'ONLINE'>('FAST_BILLING')
  const [tables, setTables] = useState<any[]>([])
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState<any>(null)

  // Online Orders state
  const [onlineOrders, setOnlineOrders] = useState<any[]>([])
  const [selectedOnlineOrder, setSelectedOnlineOrder] = useState<any>(null)
  const [onlineFilter, setOnlineFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')
  const [onlineSearch, setOnlineSearch] = useState('')
  const prevPendingCountRef = useRef<number>(0)

  // Customer states
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchOnlineOrders = async (silent = false) => {
    try {
      const res = await axios.get(`${API_URL}/public/billing/${slug}/online-orders`)
      const orders = res.data.data || []
      setOnlineOrders(orders)
      
      const pendingCount = orders.filter((o: any) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length
      if (!silent && pendingCount > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
        toast({
          title: "New Online Order Received!",
          description: `You have incoming online order(s). Check the Online tab.`,
        })
      }
      prevPendingCountRef.current = pendingCount
    } catch (err) {
      console.error('Failed to fetch online orders', err)
    }
  }

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

        await fetchOnlineOrders(true)
      } catch (err: any) {
        console.error('Error fetching billing data:', err)
        setError(err.response?.data?.message || 'Failed to load Billing Portal')
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Poll online orders and tables periodically
    const interval = setInterval(() => {
      fetchOnlineOrders(false)
      if (activeTab === 'TABLES') {
        refreshTables()
      }
    }, 10000)

    return () => clearInterval(interval)
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
  const cgst = subtotal * 0.025
  const sgst = subtotal * 0.025
  const tax = cgst + sgst
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
      
      printReceipt(response.data.data.order, restaurantData?.name, restaurantData?.address, restaurantData?.phone, restaurantData?.gstNumber)

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
      printReceipt(res.data.data, restaurantData?.name, restaurantData?.address, restaurantData?.phone, restaurantData?.gstNumber)
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

  const pendingOnlineOrdersCount = onlineOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length

  const filteredOnlineOrders = onlineOrders.filter(order => {
    const matchesFilter = onlineFilter === 'ALL' ||
      (onlineFilter === 'PENDING' && order.orderStatus !== 'COMPLETED' && order.orderStatus !== 'CANCELLED') ||
      (onlineFilter === 'COMPLETED' && order.orderStatus === 'COMPLETED')
    
    const searchLower = onlineSearch.toLowerCase()
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchLower) ||
      (order.customerInfo?.name || '').toLowerCase().includes(searchLower) ||
      (order.customerInfo?.phone || '').includes(searchLower)

    return matchesFilter && matchesSearch
  })

  const handleSettleOnlineOrder = async () => {
    if (!selectedOnlineOrder) return
    setIsProcessing(true)
    try {
      const res = await axios.post(`${API_URL}/public/billing/${slug}/online-orders/${selectedOnlineOrder._id}/settle`, {
        paymentMethod
      })
      toast({
        title: "Online Order Settled",
        description: `Order ${selectedOnlineOrder.orderNumber} completed.`,
      })
      printReceipt(res.data.data, restaurantData?.name, restaurantData?.address, restaurantData?.phone, restaurantData?.gstNumber)
      setSelectedOnlineOrder(res.data.data)
      fetchOnlineOrders(true)
    } catch (err: any) {
      toast({
        title: "Failed to settle online order",
        description: err.response?.data?.message || 'Error completing online order',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateOnlineStatus = async (status: string) => {
    if (!selectedOnlineOrder) return
    setIsProcessing(true)
    try {
      const res = await axios.patch(`${API_URL}/public/billing/${slug}/online-orders/${selectedOnlineOrder._id}/status`, {
        status
      })
      toast({
        title: `Order status updated to ${status}`,
      })
      setSelectedOnlineOrder(res.data.data)
      fetchOnlineOrders(true)
    } catch (err: any) {
      toast({
        title: "Failed to update status",
        description: err.response?.data?.message || 'Error updating order status',
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

        <button
          onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
          className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
            activeTab === 'ONLINE' 
              ? 'bg-primary/10 text-primary scale-110' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Online Orders"
        >
          <Globe className="w-6 h-6" />
          <span className="text-[10px] font-bold">Online</span>
          {pendingOnlineOrdersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {pendingOnlineOrdersCount}
            </span>
          )}
        </button>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Nav & Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between sm:hidden">
           <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {restaurantData?.name} 
          </h1>
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('FAST_BILLING')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'FAST_BILLING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              POS
            </button>
            <button 
              onClick={() => { setActiveTab('TABLES'); refreshTables(); }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'TABLES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Tables
            </button>
            <button 
              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
              className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Online
              {pendingOnlineOrdersCount > 0 && (
                <span className="inline-block ml-1 px-1 bg-orange-500 text-white rounded-full text-[9px]">
                  {pendingOnlineOrdersCount}
                </span>
              )}
            </button>
          </div>
        </header>
        
        <header className="bg-white border-b px-6 py-4 items-center justify-between hidden sm:flex shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurantData?.name}</h1>
            <p className="text-sm text-gray-500">
              {activeTab === 'FAST_BILLING' 
                ? 'Point of Sale (Fast Billing)' 
                : activeTab === 'TABLES' 
                  ? 'Table Bills Management' 
                  : 'Online Orders Management'}
            </p>
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
          ) : activeTab === 'TABLES' ? (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Active Tables</h2>
                  <p className="text-sm text-gray-500">Select a table to settle its bill</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshTables} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
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
          ) : (
            /* Online Orders tab */
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  {(['ALL', 'PENDING', 'COMPLETED'] as const).map(f => (
                    <Badge 
                      key={f}
                      variant={onlineFilter === f ? "default" : "secondary"}
                      className={`cursor-pointer px-3 py-1.5 text-xs font-semibold ${onlineFilter === f ? 'bg-primary text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}
                      onClick={() => setOnlineFilter(f)}
                    >
                      {f === 'ALL' ? 'All Orders' : f === 'PENDING' ? `Pending (${pendingOnlineOrdersCount})` : 'Completed'}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Search order #, customer..." 
                      value={onlineSearch}
                      onChange={(e) => setOnlineSearch(e.target.value)}
                      className="pl-9 h-9 bg-white"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchOnlineOrders(true)} className="gap-1 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F8F7]">
                {filteredOnlineOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                    <Globe className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No online orders found</p>
                    <p className="text-xs text-gray-400 mt-1">Incoming orders from your online menu will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredOnlineOrders.map(order => {
                      const isSelected = selectedOnlineOrder?._id === order._id;
                      const isCompleted = order.orderStatus === 'COMPLETED';
                      return (
                        <Card 
                          key={order._id}
                          onClick={() => setSelectedOnlineOrder(order)}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected 
                              ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                              : isCompleted 
                                ? 'border-gray-200 bg-white opacity-85'
                                : 'border-purple-200 bg-white'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-bold text-base text-gray-900">{order.orderNumber}</span>
                                <p className="text-xs text-gray-500">
                                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <Badge className={`text-[10px] uppercase font-bold ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                              }`}>
                                {order.orderStatus}
                              </Badge>
                            </div>

                            {order.customerInfo && (
                              <div className="my-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs">
                                <p className="font-semibold text-gray-800 flex items-center gap-1.5 truncate">
                                  <User className="w-3 h-3 text-gray-500" /> {order.customerInfo.name || 'Walk-in Customer'}
                                </p>
                                {order.customerInfo.phone && (
                                  <p className="text-gray-600 flex items-center gap-1.5 mt-0.5">
                                    <Phone className="w-3 h-3 text-gray-500" /> {order.customerInfo.phone}
                                  </p>
                                )}
                                {order.customerInfo.address && (
                                  <p className="text-gray-600 flex items-start gap-1.5 mt-0.5 truncate">
                                    <MapPin className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" /> {order.customerInfo.address}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-gray-500 my-2">
                              {order.items?.length || 0} item(s) • Total: <span className="font-bold text-gray-900 text-sm">₹{Number(order.total).toFixed(2)}</span>
                            </div>

                            <div className="flex gap-2 pt-2 mt-2 border-t border-gray-100">
                              <Button 
                                size="sm" 
                                variant={isSelected ? "default" : "outline"}
                                className="w-full text-xs h-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOnlineOrder(order);
                                }}
                              >
                                {isSelected ? 'Selected' : 'View & Settle Bill'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right side: Cart / Table / Online Order Summary */}
          <div className="w-full lg:w-96 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeTab === 'FAST_BILLING' 
                    ? 'Current Order' 
                    : activeTab === 'TABLES' 
                      ? (selectedTable ? `Table: ${selectedTable.name}` : 'Select a table')
                      : (selectedOnlineOrder ? `Online: ${selectedOnlineOrder.orderNumber}` : 'Select an online order')}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeTab === 'FAST_BILLING' 
                    ? 'Fast Billing' 
                    : activeTab === 'TABLES' 
                      ? (selectedTable ? 'Table Bill' : 'Waiting for selection')
                      : (selectedOnlineOrder ? 'Online Order Details' : 'Waiting for selection')}
                </p>
              </div>
              {activeTab === 'TABLES' && selectedTable && (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-0">Unpaid</Badge>
              )}
              {activeTab === 'ONLINE' && selectedOnlineOrder && (
                <Badge variant="outline" className={`border-0 ${selectedOnlineOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                  {selectedOnlineOrder.paymentStatus || 'PENDING'}
                </Badge>
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

            {activeTab === 'ONLINE' && selectedOnlineOrder?.customerInfo && (
              <div className="p-4 border-b border-gray-200 bg-purple-50/40 text-xs space-y-1">
                <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" /> {selectedOnlineOrder.customerInfo.name}
                </p>
                <p className="text-gray-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-600" /> {selectedOnlineOrder.customerInfo.phone}
                </p>
                {selectedOnlineOrder.customerInfo.address && (
                  <p className="text-gray-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" /> {selectedOnlineOrder.customerInfo.address}
                  </p>
                )}
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
              ) : activeTab === 'TABLES' ? (
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
              ) : (
                /* Online tab items */
                !selectedOnlineOrder ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
                    <Globe className="w-12 h-12 mb-4 text-gray-200" />
                    <p>Please select an online order to view details.</p>
                  </div>
                ) : (
                  selectedOnlineOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{item.dishName}</h4>
                        <p className="text-sm text-gray-500">₹{item.unitPrice} × {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-sm">₹{Number(item.lineTotal).toFixed(2)}</span>
                    </div>
                  ))
                )
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3 rounded-b-xl">
              {(() => {
                const currentSubtotal = activeTab === 'FAST_BILLING' 
                  ? subtotal 
                  : activeTab === 'TABLES'
                    ? (selectedTable ? (getTableOrder(selectedTable._id)?.subtotal || 0) : 0)
                    : (selectedOnlineOrder ? (selectedOnlineOrder.subtotal || 0) : 0);
                
                const tableOrder = selectedTable ? getTableOrder(selectedTable._id) : null;
                
                const currentCgst = activeTab === 'FAST_BILLING'
                  ? cgst
                  : activeTab === 'TABLES'
                    ? (tableOrder ? (tableOrder.cgst ?? (tableOrder.tax ? tableOrder.tax / 2 : (tableOrder.subtotal || 0) * 0.025)) : 0)
                    : (selectedOnlineOrder ? (selectedOnlineOrder.cgst ?? (selectedOnlineOrder.tax ? selectedOnlineOrder.tax / 2 : (selectedOnlineOrder.subtotal || 0) * 0.025)) : 0);
                
                const currentSgst = activeTab === 'FAST_BILLING'
                  ? sgst
                  : activeTab === 'TABLES'
                    ? (tableOrder ? (tableOrder.sgst ?? (tableOrder.tax ? tableOrder.tax / 2 : (tableOrder.subtotal || 0) * 0.025)) : 0)
                    : (selectedOnlineOrder ? (selectedOnlineOrder.sgst ?? (selectedOnlineOrder.tax ? selectedOnlineOrder.tax / 2 : (selectedOnlineOrder.subtotal || 0) * 0.025)) : 0);
                
                const currentTax = activeTab === 'FAST_BILLING'
                  ? tax
                  : activeTab === 'TABLES'
                    ? (tableOrder ? (tableOrder.tax ?? (currentCgst + currentSgst)) : 0)
                    : (selectedOnlineOrder ? (selectedOnlineOrder.tax ?? (currentCgst + currentSgst)) : 0);
                
                const currentTotal = activeTab === 'FAST_BILLING'
                  ? total
                  : activeTab === 'TABLES'
                    ? (tableOrder ? (tableOrder.total || 0) : 0)
                    : (selectedOnlineOrder ? (selectedOnlineOrder.total || 0) : 0);

                return (
                  <>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>₹{Number(currentSubtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>CGST (2.5%)</span>
                        <span>₹{Number(currentCgst).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>SGST (2.5%)</span>
                        <span>₹{Number(currentSgst).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 font-medium">
                        <span>Total Tax (5% GST)</span>
                        <span>₹{Number(currentTax).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-lg text-gray-900">Total</span>
                      <span className="font-bold text-2xl text-primary">₹{Number(currentTotal).toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}

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

              <div className="flex flex-col gap-2 pt-2">
                {activeTab === 'FAST_BILLING' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="w-1/3" onClick={() => { setCart([]); setCustomerName(''); setCustomerPhone(''); }}>Clear</Button>
                    <Button className="flex-1 font-semibold text-base shadow-md" onClick={handleGenerateBill} disabled={cart.length === 0 || isProcessing}>
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Bill'}
                    </Button>
                  </div>
                ) : activeTab === 'TABLES' ? (
                  <Button className="w-full font-semibold text-base shadow-md" onClick={handleSettleTable} disabled={!selectedTable || isProcessing}>
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Settle Table Bill'}
                  </Button>
                ) : (
                  /* Online Actions */
                  <div className="space-y-2">
                    {selectedOnlineOrder && selectedOnlineOrder.orderStatus !== 'COMPLETED' && (
                      <div className="flex gap-2">
                        {selectedOnlineOrder.orderStatus === 'PLACED' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 bg-white border-orange-200 text-orange-700 hover:bg-orange-50"
                            onClick={() => handleUpdateOnlineStatus('PREPARING')}
                            disabled={isProcessing}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {selectedOnlineOrder.orderStatus === 'PREPARING' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 bg-white border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleUpdateOnlineStatus('READY')}
                            disabled={isProcessing}
                          >
                            Mark Ready
                          </Button>
                        )}
                      </div>
                    )}
                    <Button 
                      className="w-full font-semibold text-base shadow-md bg-primary hover:bg-primary/90" 
                      onClick={handleSettleOnlineOrder} 
                      disabled={!selectedOnlineOrder || isProcessing || selectedOnlineOrder.orderStatus === 'COMPLETED'}
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Settle & Print Bill'}
                    </Button>
                    {selectedOnlineOrder && (
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 text-gray-700" 
                        onClick={() => printReceipt(selectedOnlineOrder, restaurantData?.name, restaurantData?.address, restaurantData?.phone, restaurantData?.gstNumber)}
                      >
                        <Printer className="w-4 h-4" /> Print Bill
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
