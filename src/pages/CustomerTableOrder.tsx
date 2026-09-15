import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Minus, Plus, Utensils, AlertTriangle, ChevronRight, ChevronsRight, Check, Sparkles, X, Search } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

// ── Slide to Confirm Slider Component ──────────────────────────────────────
function SlideToConfirm({ onConfirm, disabled, label = "Slide to Place Order" }: { onConfirm: () => void; disabled?: boolean; label?: string }) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)

  const handleStart = (clientX: number) => {
    if (disabled) return
    setIsDragging(true)
    startXRef.current = clientX - dragX
  }

  const handleMove = (clientX: number) => {
    if (!isDragging || !trackRef.current) return
    const maxDrag = trackRef.current.clientWidth - 52 // 52px handle width
    const newX = Math.max(0, Math.min(clientX - startXRef.current, maxDrag))
    setDragX(newX)
    if (newX >= maxDrag * 0.9) {
      setIsDragging(false)
      setDragX(maxDrag)
      onConfirm()
    }
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (trackRef.current) {
      const maxDrag = trackRef.current.clientWidth - 52
      if (dragX < maxDrag * 0.9) {
        setDragX(0)
      }
    }
  }

  return (
    <div
      ref={trackRef}
      className={`relative h-14 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-600 rounded-full overflow-hidden select-none p-1 shadow-lg shadow-orange-500/20 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      {/* Background Track Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-6 pr-2">
        <span className="text-white font-bold text-sm tracking-wider flex items-center gap-1.5 drop-shadow">
          {label}
          <ChevronsRight className="w-5 h-5 animate-pulse" />
        </span>
      </div>

      {/* Slide Handle Knob */}
      <div
        className="absolute top-1 bottom-1 w-12 bg-white rounded-full flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-transform z-10"
        style={{ transform: `translateX(${dragX}px)`, transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        <ChevronRight className="w-6 h-6 text-orange-600 font-bold" />
      </div>
    </div>
  )
}

// ── Main Customer Table Order Component ────────────────────────────────────
export default function CustomerTableOrder() {
  const { slug, tableId } = useParams()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restaurant, setRestaurant] = useState<any>(null)
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])

  const [cart, setCart] = useState<any[]>([])
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [isCartOpenMobile, setIsCartOpenMobile] = useState(false)

  const fetchMenu = async () => {
    try {
      const res = await api.get(`/public/table-qr/${slug}/tables/${tableId}/menu`)
      setRestaurant(res.data.data.restaurant)
      setTableInfo(res.data.data.table)
      setCategories([{ _id: 'All', name: 'All' }, ...res.data.data.categories])
      setDishes(res.data.data.dishes)
      if (res.data.data.activeOrder) {
        setActiveOrder(res.data.data.activeOrder)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Restaurant menu not available.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug && tableId) {
      fetchMenu()
      // Real-time polling every 6s to refresh active order status from kitchen/billing
      const interval = setInterval(fetchMenu, 6000)
      return () => clearInterval(interval)
    }
  }, [slug, tableId])

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

  const getItemQuantity = (dishId: string) => {
    const item = cart.find(i => i.dish._id === dishId)
    return item ? item.quantity : 0
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0)
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return
    setIsSubmitting(true)

    try {
      const payload = {
        items: cart.map(c => ({ dishId: c.dish._id, quantity: c.quantity }))
      }
      const res = await api.post(`/public/table-qr/${slug}/tables/${tableId}/order`, payload)
      if (res.data.data) {
        setActiveOrder(res.data.data)
      }
      setOrderSuccess(true)
      setCart([])
      setIsCartOpenMobile(false)
    } catch (err: any) {
      toast({
        title: 'Order failed',
        description: err.response?.data?.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Sparkles className="w-10 h-10 text-orange-500 animate-spin mb-3" />
        <p className="text-slate-400 font-medium">Loading Menu...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-white">
        <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Unable to Load Menu</h1>
        <p className="text-slate-400 max-w-sm">{error}</p>
      </div>
    )
  }

  if (orderSuccess) {
    const tableNameStr = tableInfo ? (tableInfo.name || `Table ${tableInfo.tableNumber}`) : 'your table'
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-white">
        <div className="w-24 h-24 bg-gradient-to-tr from-emerald-600 to-teal-400 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">
          <Check className="w-12 h-12 stroke-[3]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Order Sent to Kitchen!</h1>
        <p className="text-slate-300 max-w-md text-sm leading-relaxed mb-6">
          Your dishes for <span className="text-orange-400 font-bold underline decoration-orange-400/50">{tableNameStr}</span> have been placed and added to your running table bill.
        </p>

        {activeOrder && activeOrder.items && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-md w-full mb-6 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Dishes Ordered So Far</p>
            <div className="space-y-1.5 divide-y divide-slate-800">
              {activeOrder.items.map((item: any, i: number) => (
                <div key={i} className="pt-1.5 flex justify-between text-xs text-slate-200 font-medium">
                  <span>{item.dishName} × {item.quantity}</span>
                  <span className="font-bold text-orange-400">₹{item.lineTotal}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-800 mt-3 pt-2 flex justify-between text-sm font-extrabold text-white">
              <span>Running Total (Incl Tax)</span>
              <span className="text-orange-400">₹{activeOrder.total}</span>
            </div>
          </div>
        )}

        <Button
          onClick={() => { setOrderSuccess(false); fetchMenu(); }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 rounded-full shadow-lg shadow-orange-500/25"
        >
          Add More Dishes to Order
        </Button>
      </div>
    )
  }

  const filteredDishes = dishes.filter(d => {
    const categoryId = typeof d.categoryId === 'object' ? d.categoryId?._id : d.categoryId
    const matchesCategory = activeCategory === 'All' || String(categoryId) === String(activeCategory)
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query || [d.name, d.description]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query))

    return matchesCategory && matchesSearch
  })
  const tableNameDisplay = tableInfo ? (tableInfo.name || `Table ${tableInfo.tableNumber}`) : 'Table'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">

      {/* ── Main Menu Container ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-28 md:pb-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-6 pt-10 pb-8 border-b border-slate-800/80">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {restaurant?.name || 'Restaurant'}
                </h1>
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  📍 {tableNameDisplay}
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">
                Ordering for <span className="text-orange-400 font-bold">{tableNameDisplay}</span> • Direct to Kitchen &amp; Billing
              </p>
            </div>
          </div>
        </div>

        {/* ── Menu Content Area ──────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">

          {/* Active Table Order History Banner */}
          {activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
            <div className="bg-slate-900/90 border border-orange-500/40 rounded-2xl p-4 shadow-lg shadow-orange-500/5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center font-bold">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Dishes Already Ordered</h3>
                    <p className="text-[11px] text-slate-400">Your table's active running order until bill settlement</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  {activeOrder.orderStatus || 'ACTIVE'}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-800/60">
                {activeOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-semibold">{item.dishName} <span className="text-orange-400 font-bold ml-1">× {item.quantity}</span></span>
                    <span className="font-extrabold text-orange-400">₹{Number(item.lineTotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800/90 pt-2.5 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300">Running Total ({activeOrder.items.length} items + tax)</span>
                <span className="text-base font-black text-orange-400">₹{Number(activeOrder.total).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Menu Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search dishes..."
              aria-label="Search dishes"
              className="h-12 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-11 pr-4 text-sm font-medium text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => {
              const isActive = activeCategory === cat._id
              return (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-105'
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* Dishes List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDishes.map(dish => {
              const qty = getItemQuantity(dish._id)
              return (
                <div
                  key={dish._id}
                  className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
                >
                  <div>
                    <h3 className="font-bold text-base text-white">{dish.name}</h3>
                    {dish.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    )}
                    <p className="text-lg font-black text-orange-400 mt-3">
                      ₹{dish.price}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    {qty === 0 ? (
                      <Button
                        onClick={() => addToCart(dish)}
                        className="w-full bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-200 font-bold text-xs h-9 rounded-xl transition-all"
                      >
                        + Add to Order
                      </Button>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-slate-800/90 rounded-xl p-1 border border-orange-500/30">
                        <button
                          onClick={() => updateQuantity(dish._id, -1)}
                          className="w-8 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-xs text-orange-400 px-2">
                          {qty} added
                        </span>
                        <button
                          onClick={() => updateQuantity(dish._id, 1)}
                          className="w-8 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredDishes.length === 0 && (
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-10 text-center">
                <Search className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                <p className="font-bold text-slate-300">No dishes found</p>
                <p className="mt-1 text-xs text-slate-500">Try another dish name or category.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Desktop Right Sidebar (Persistent Order & Slide to Confirm) ──── */}
      <div className="hidden md:flex w-96 bg-slate-900 border-l border-slate-800/80 flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            Your Table Order
          </h2>
          <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full">
            {tableNameDisplay}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="font-semibold text-slate-400">Cart is empty</p>
              <p className="text-xs text-slate-600 mt-1">Tap items on the menu to add to your order.</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.dish._id}
                className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800"
              >
                <div className="flex-1 pr-3">
                  <p className="font-bold text-sm text-slate-200 line-clamp-1">{item.dish.name}</p>
                  <p className="text-xs text-slate-500">₹{item.dish.price} × {item.quantity}</p>
                </div>
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button
                    onClick={() => updateQuantity(item.dish._id, -1)}
                    className="w-7 h-6 text-slate-300 hover:bg-slate-700 rounded flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.dish._id, 1)}
                    className="w-7 h-6 text-white hover:bg-orange-500 rounded flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-800 bg-slate-950 space-y-4">
            <div className="flex justify-between items-center text-slate-300 font-bold text-lg">
              <span>Total</span>
              <span className="text-xl font-black text-orange-400">₹{cartTotal}</span>
            </div>

            {/* iPhone style Slider */}
            <SlideToConfirm
              onConfirm={handleSubmitOrder}
              disabled={isSubmitting}
              label={isSubmitting ? "Submitting..." : `Slide to Order for ${tableNameDisplay}`}
            />
          </div>
        )}
      </div>

      {/* ── Mobile Floating Cart Bar & Slide Modal ──────────────────────── */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 shadow-2xl">
          {!isCartOpenMobile ? (
            <button
              onClick={() => setIsCartOpenMobile(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white h-14 rounded-2xl px-5 flex items-center justify-between font-bold shadow-lg shadow-orange-500/25 active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>View Order ({totalItemCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>₹{cartTotal}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ) : (
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                  Your Order • {tableNameDisplay}
                </h3>
                <button
                  onClick={() => setIsCartOpenMobile(false)}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto my-4 space-y-3 max-h-60 pr-1">
                {cart.map(item => (
                  <div
                    key={item.dish._id}
                    className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-sm text-slate-200">{item.dish.name}</p>
                      <p className="text-xs text-slate-500">₹{item.dish.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.dish._id, -1)}
                        className="w-7 h-6 text-slate-300 rounded flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.dish._id, 1)}
                        className="w-7 h-6 text-white bg-orange-500 rounded flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-4">
                <div className="flex justify-between items-center text-white font-extrabold text-base">
                  <span>Total Bill</span>
                  <span className="text-xl text-orange-400">₹{cartTotal}</span>
                </div>

                {/* iPhone style Slide to Order Bar */}
                <SlideToConfirm
                  onConfirm={handleSubmitOrder}
                  disabled={isSubmitting}
                  label={isSubmitting ? "Sending to Kitchen..." : "Slide to Place Order"}
                />
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
