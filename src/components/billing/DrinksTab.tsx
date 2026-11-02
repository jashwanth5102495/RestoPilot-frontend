import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  ShoppingBag, 
  Loader2, 
  RefreshCw, 
  Printer, 
  CupSoda, 
  PackagePlus, 
  PackageCheck, 
  Edit3, 
  X, 
  AlertCircle, 
  Sparkles, 
  FileEdit,
  RotateCcw,
  CheckCircle2,
  DollarSign
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { printReceipt } from '@/lib/printReceipt'

interface DrinksTabProps {
  slug: string
  restaurantData: any
  onBillGenerated?: () => void
}

export type DrinkItem = {
  _id: string
  name: string
  price: number
  category: string
  currentStock: number
  unit: string
  cost?: number
  minStock?: number
  isAvailable: boolean
}

export type DrinkCartItem = {
  drinkId: string
  name: string
  unitPrice: number
  quantity: number
  lineTotal: number
  unit?: string
}

export default function DrinksTab({ slug, restaurantData, onBillGenerated }: DrinksTabProps) {
  const { toast } = useToast()

  // Tab view state: POS vs INVENTORY
  const [subTab, setSubTab] = useState<'POS' | 'INVENTORY'>('POS')

  // Drinks list and loading
  const [drinks, setDrinks] = useState<DrinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  // Drinks Cart state
  const [cart, setCart] = useState<DrinkCartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [taxRate, setTaxRate] = useState<number>(5) // 5% GST by default (2.5% CGST + 2.5% SGST)
  const [isProcessingSale, setIsProcessingSale] = useState(false)

  // Modals state
  const [isAddDrinkModalOpen, setIsAddDrinkModalOpen] = useState(false)
  const [isEditDrinkModalOpen, setIsEditDrinkModalOpen] = useState(false)
  const [selectedDrinkToEdit, setSelectedDrinkToEdit] = useState<DrinkItem | null>(null)

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [selectedDrinkToRestock, setSelectedDrinkToRestock] = useState<DrinkItem | null>(null)
  const [restockQty, setRestockQty] = useState<number>(12)
  const [restockNotes, setRestockNotes] = useState<string>('')
  const [isRestocking, setIsRestocking] = useState(false)

  // Final Bill Editor Modal state
  const [isEditFinalBillModalOpen, setIsEditFinalBillModalOpen] = useState(false)
  const [customItemName, setCustomItemName] = useState('')
  const [customItemPrice, setCustomItemPrice] = useState<string>('')
  const [customItemQty, setCustomItemQty] = useState<number>(1)

  // Form states for Add / Edit
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState<string>('')
  const [formCategory, setFormCategory] = useState('Cold Drinks')
  const [formStock, setFormStock] = useState<string>('24')
  const [formUnit, setFormUnit] = useState('can')
  const [formCost, setFormCost] = useState<string>('0')
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  const fetchDrinks = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get(`/public/billing/${slug}/drinks`)
      setDrinks(res.data.data?.drinks || [])
    } catch (err: any) {
      console.error('Failed to fetch drinks', err)
      if (!silent && err.response?.status !== 404) {
        toast({
          title: 'Error loading drinks',
          description: err.response?.data?.message || 'Could not load drinks menu.',
          variant: 'destructive'
        })
      }
      setDrinks([])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrinks()
  }, [slug])

  // Extract categories
  const categories = ['All', ...Array.from(new Set(drinks.map(d => d.category || 'Drinks')))]

  // Filtered drinks
  const filteredDrinks = drinks.filter(drink => {
    const matchesCat = activeCategory === 'All' || (drink.category || 'Drinks') === activeCategory
    const matchesSearch = drink.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const discount = Math.min(subtotal, Math.max(0, Number(discountAmount || 0)))
  const taxableSubtotal = Math.max(0, subtotal - discount)
  const cgst = Number(((taxableSubtotal * (taxRate / 2)) / 100).toFixed(2))
  const sgst = Number(((taxableSubtotal * (taxRate / 2)) / 100).toFixed(2))
  const totalTax = Number((cgst + sgst).toFixed(2))
  const total = Number((taxableSubtotal + totalTax).toFixed(2))

  // Cart Operations
  const addToCart = (drink: DrinkItem) => {
    if (drink.currentStock <= 0) {
      toast({
        title: 'Out of Stock',
        description: `${drink.name} has 0 stock. Please restock it first.`,
        variant: 'destructive'
      })
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.drinkId === drink._id)
      if (existing) {
        if (existing.quantity >= drink.currentStock) {
          toast({
            title: 'Stock Limit Reached',
            description: `Only ${drink.currentStock} ${drink.unit || 'units'} available in stock.`,
            variant: 'destructive'
          })
          return prev
        }
        return prev.map(item => item.drinkId === drink._id ? {
          ...item,
          quantity: item.quantity + 1,
          lineTotal: (item.quantity + 1) * item.unitPrice
        } : item)
      }
      return [...prev, {
        drinkId: drink._id,
        name: drink.name,
        unitPrice: drink.price,
        quantity: 1,
        lineTotal: drink.price,
        unit: drink.unit
      }]
    })
  }

  const updateQuantity = (drinkId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.drinkId === drinkId) {
        const drink = drinks.find(d => d._id === drinkId)
        const newQty = item.quantity + delta
        if (delta > 0 && drink && newQty > drink.currentStock) {
          toast({
            title: 'Stock Limit Reached',
            description: `Only ${drink.currentStock} available in stock.`,
            variant: 'destructive'
          })
          return item
        }
        return {
          ...item,
          quantity: Math.max(0, newQty),
          lineTotal: Math.max(0, newQty) * item.unitPrice
        }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  // Editable bill line items update handlers
  const updateCartItemPrice = (drinkId: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.drinkId === drinkId) {
        const price = Math.max(0, newPrice)
        return {
          ...item,
          unitPrice: price,
          lineTotal: item.quantity * price
        }
      }
      return item
    }))
  }

  const updateCartItemName = (drinkId: string, newName: string) => {
    setCart(prev => prev.map(item => {
      if (item.drinkId === drinkId) {
        return { ...item, name: newName }
      }
      return item
    }))
  }

  const removeCartItem = (drinkId: string) => {
    setCart(prev => prev.filter(item => item.drinkId !== drinkId))
  }

  const addCustomItemToCart = () => {
    if (!customItemName.trim()) return
    const price = Math.max(0, Number(customItemPrice || 0))
    const qty = Math.max(1, Number(customItemQty || 1))
    const customId = `custom-${Date.now()}`
    setCart(prev => [...prev, {
      drinkId: customId,
      name: customItemName.trim(),
      unitPrice: price,
      quantity: qty,
      lineTotal: price * qty,
      unit: 'pcs'
    }])
    setCustomItemName('')
    setCustomItemPrice('')
    setCustomItemQty(1)
  }

  // Handle Bill Generation & Print
  const handleGenerateAndPrintBill = async () => {
    if (cart.length === 0) return
    setIsProcessingSale(true)

    try {
      const payload = {
        items: cart.map(item => ({
          drinkId: item.drinkId.startsWith('custom-') ? undefined : item.drinkId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: taxRate,
          lineTotal: item.lineTotal
        })),
        subtotal,
        discount,
        tax: totalTax,
        cgst,
        sgst,
        total,
        paymentMethod,
        customerInfo: {
          name: customerName.trim(),
          phone: customerPhone.trim()
        },
        notes: 'Drinks Tab Order'
      }

      const res = await api.post(`/public/billing/${slug}/drinks/sale`, payload)
      const { order, bill } = res.data.data || {}

      toast({
        title: 'Drinks Bill Generated!',
        description: `Bill #${bill?.billNumber || order?.orderNumber} processed via ${paymentMethod}.`,
      })

      // Immediately print receipt!
      const receiptData = order || bill
      if (receiptData) {
        printReceipt(
          receiptData,
          restaurantData?.name,
          restaurantData?.address,
          restaurantData?.phone,
          restaurantData?.gstNumber
        )
      }

      // Clear cart & close edit modal
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setDiscountAmount(0)
      setIsEditFinalBillModalOpen(false)

      // Refresh drinks list to display decremented stocks
      await fetchDrinks(true)
      if (onBillGenerated) onBillGenerated()
    } catch (err: any) {
      console.error('Drinks bill failed', err)
      toast({
        title: 'Billing Failed',
        description: err.response?.data?.message || 'Failed to process drinks bill. Check inventory.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessingSale(false)
    }
  }

  // Add / Edit Drink Handler
  const handleSaveDrink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formPrice) return
    setIsSubmittingForm(true)

    try {
      if (selectedDrinkToEdit) {
        // Update existing drink
        await api.put(`/public/billing/${slug}/drinks/${selectedDrinkToEdit._id}`, {
          name: formName.trim(),
          price: Number(formPrice),
          category: formCategory.trim() || 'Drinks',
          currentStock: Math.max(0, Number(formStock || 0)),
          unit: formUnit.trim() || 'bottle',
          cost: Number(formCost || 0)
        })
        toast({ title: 'Drink Updated', description: `${formName} has been updated.` })
        setIsEditDrinkModalOpen(false)
        setSelectedDrinkToEdit(null)
      } else {
        // Add new drink
        await api.post(`/public/billing/${slug}/drinks`, {
          name: formName.trim(),
          price: Number(formPrice),
          category: formCategory.trim() || 'Drinks',
          currentStock: Math.max(0, Number(formStock || 0)),
          unit: formUnit.trim() || 'bottle',
          cost: Number(formCost || 0)
        })
        toast({ title: 'Drink Added', description: `${formName} has been added to the drinks menu.` })
        setIsAddDrinkModalOpen(false)
      }

      resetForm()
      await fetchDrinks(true)
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err.response?.data?.message || 'Could not save drink item.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingForm(false)
    }
  }

  const handleDeleteDrink = async (drink: DrinkItem) => {
    if (!confirm(`Are you sure you want to remove "${drink.name}" from the drinks menu?`)) return
    try {
      await api.delete(`/public/billing/${slug}/drinks/${drink._id}`)
      toast({ title: 'Drink Deleted', description: `${drink.name} was removed.` })
      await fetchDrinks(true)
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.response?.data?.message || 'Could not delete drink.',
        variant: 'destructive'
      })
    }
  }

  // Quick Restock Handler
  const handleQuickRestock = async (drinkId: string, quantityToAdd: number) => {
    if (quantityToAdd <= 0) return
    try {
      await api.post(`/public/billing/${slug}/drinks/restock`, {
        drinkId,
        quantityToAdd,
        notes: `Quick restock +${quantityToAdd}`
      })
      toast({
        title: 'Stock Updated!',
        description: `Added +${quantityToAdd} units to stock.`
      })
      await fetchDrinks(true)
    } catch (err: any) {
      toast({
        title: 'Restock Failed',
        description: err.response?.data?.message || 'Failed to update stock.',
        variant: 'destructive'
      })
    }
  }

  // Modal Restock Handler
  const handleModalRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDrinkToRestock || restockQty <= 0) return
    setIsRestocking(true)
    try {
      await api.post(`/public/billing/${slug}/drinks/restock`, {
        drinkId: selectedDrinkToRestock._id,
        quantityToAdd: Number(restockQty),
        notes: restockNotes.trim() || 'Restocked via Drinks Portal'
      })
      toast({
        title: 'Drink Restocked!',
        description: `Successfully added ${restockQty} ${selectedDrinkToRestock.unit || 'units'} to ${selectedDrinkToRestock.name}.`
      })
      setIsRestockModalOpen(false)
      setSelectedDrinkToRestock(null)
      setRestockQty(12)
      setRestockNotes('')
      await fetchDrinks(true)
    } catch (err: any) {
      toast({
        title: 'Restock Failed',
        description: err.response?.data?.message || 'Failed to update stock.',
        variant: 'destructive'
      })
    } finally {
      setIsRestocking(false)
    }
  }

  // 1-Click Starter Presets
  const handleAddPopularPresets = async () => {
    const presets = [
      { name: 'Coca Cola 330ml Can', price: 40, category: 'Cold Drinks', currentStock: 24, unit: 'can', cost: 30 },
      { name: 'Sprite 330ml Can', price: 40, category: 'Cold Drinks', currentStock: 24, unit: 'can', cost: 30 },
      { name: 'Thums Up 330ml Can', price: 40, category: 'Cold Drinks', currentStock: 24, unit: 'can', cost: 30 },
      { name: 'Red Bull 250ml', price: 125, category: 'Energy Drinks', currentStock: 12, unit: 'can', cost: 95 },
      { name: 'Mineral Water 1L', price: 20, category: 'Water', currentStock: 48, unit: 'bottle', cost: 12 },
      { name: 'Cold Coffee 300ml', price: 90, category: 'Coffee & Tea', currentStock: 20, unit: 'bottle', cost: 45 },
      { name: 'Fresh Lime Soda', price: 60, category: 'Beverages', currentStock: 30, unit: 'glass', cost: 20 },
      { name: 'Lemon Iced Tea', price: 80, category: 'Beverages', currentStock: 20, unit: 'glass', cost: 25 }
    ]
    try {
      for (const p of presets) {
        await api.post(`/public/billing/${slug}/drinks`, p)
      }
      toast({
        title: 'Popular Drinks Added!',
        description: '8 popular beverages added with starter inventory.'
      })
      await fetchDrinks(true)
    } catch (err: any) {
      toast({
        title: 'Preset creation failed',
        description: err.response?.data?.message || 'Could not add presets.',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormPrice('')
    setFormCategory('Cold Drinks')
    setFormStock('24')
    setFormUnit('can')
    setFormCost('0')
    setSelectedDrinkToEdit(null)
  }

  const openEditModal = (drink: DrinkItem) => {
    setSelectedDrinkToEdit(drink)
    setFormName(drink.name)
    setFormPrice(String(drink.price))
    setFormCategory(drink.category || 'Cold Drinks')
    setFormStock(String(drink.currentStock || 0))
    setFormUnit(drink.unit || 'bottle')
    setFormCost(String(drink.cost || 0))
    setIsEditDrinkModalOpen(true)
  }

  const openRestockModal = (drink: DrinkItem) => {
    setSelectedDrinkToRestock(drink)
    setRestockQty(12)
    setRestockNotes('')
    setIsRestockModalOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Bar with Sub-Tab Switcher & Actions */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setSubTab('POS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                subTab === 'POS'
                  ? 'bg-white text-gray-900 shadow-sm font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CupSoda className="w-3.5 h-3.5 text-primary" />
              Drinks Billing (POS)
            </button>
            <button
              onClick={() => setSubTab('INVENTORY')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                subTab === 'INVENTORY'
                  ? 'bg-white text-gray-900 shadow-sm font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
              Inventory & Restock
              <span className="ml-1 px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded-full text-[10px]">
                {drinks.length}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => {
              resetForm()
              setIsAddDrinkModalOpen(true)
            }}
            className="gap-1.5 h-9 bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Drink
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDrinks(false)}
            disabled={loading}
            className="h-9 gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Tab Content */}
      {subTab === 'POS' ? (
        /* ======================================================== */
        /* DRINKS POS VIEW (Drink Catalog on Left + Bill Cart on Right) */
        /* ======================================================== */
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-y-auto max-w-[1600px] mx-auto w-full min-h-[600px]">
          {/* Left Side: Drinks Menu Grid */}
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Category Filter & Search Bar */}
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white">
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={activeCategory === cat ? "default" : "secondary"}
                    className={`cursor-pointer px-3 py-1 text-xs ${
                      activeCategory === cat
                        ? 'bg-primary hover:bg-primary/90 text-white font-bold'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
              <div className="relative w-full sm:w-60 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Drinks Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#F8F8F7]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-sm font-medium text-gray-600">Loading drinks catalog...</p>
                </div>
              ) : drinks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                  <CupSoda className="w-14 h-14 text-gray-300 mb-3" />
                  <h3 className="font-bold text-gray-800 text-base">No drinks added yet</h3>
                  <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
                    Get started by adding individual beverages or populate popular cafe drinks in one click!
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => setIsAddDrinkModalOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Custom Drink
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleAddPopularPresets}
                      className="border-primary text-primary hover:bg-primary/5 font-semibold text-xs"
                    >
                      <Sparkles className="w-4 h-4 mr-1" /> Add 8 Popular Drinks
                    </Button>
                  </div>
                </div>
              ) : filteredDrinks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-gray-400">
                  <Search className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium">No drinks match "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDrinks.map(drink => {
                    const cartItem = cart.find(item => item.drinkId === drink._id)
                    const quantity = cartItem ? cartItem.quantity : 0
                    const isOutOfStock = drink.currentStock <= 0
                    const isLowStock = drink.currentStock > 0 && drink.currentStock <= (drink.minStock || 5)

                    return (
                      <Card
                        key={drink._id}
                        className={`hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden relative border-gray-200 ${
                          isOutOfStock ? 'opacity-65 bg-gray-50' : 'bg-white shadow-xs'
                        }`}
                      >
                        <CardContent className="p-3.5 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                              {drink.category || 'Drinks'}
                            </span>
                            {/* Stock Indicator Badge */}
                            {isOutOfStock ? (
                              <Badge variant="destructive" className="text-[9px] py-0 px-1.5 h-4 bg-red-500 font-bold">
                                Out of Stock
                              </Badge>
                            ) : isLowStock ? (
                              <Badge className="text-[9px] py-0 px-1.5 h-4 bg-amber-500 hover:bg-amber-600 font-bold text-white">
                                Low: {drink.currentStock} {drink.unit || ''}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4 bg-emerald-100 text-emerald-800 font-bold">
                                Stock: {drink.currentStock}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mt-1">
                            {drink.name}
                          </h3>
                          <p className="font-extrabold text-base text-gray-900 mt-2">
                            ₹{drink.price}
                          </p>
                        </CardContent>

                        {/* Card Footer Actions */}
                        <div className="p-3 pt-0">
                          {isOutOfStock ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRestockModal(drink)}
                              className="w-full text-xs h-8 border-orange-300 text-orange-700 hover:bg-orange-50 font-semibold gap-1"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              Restock Drink
                            </Button>
                          ) : quantity === 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(drink)}
                              className="w-full text-xs h-8 hover:bg-primary hover:text-white transition-colors font-semibold"
                            >
                              Add to Bill
                            </Button>
                          ) : (
                            <div className="flex items-center justify-between bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(drink._id, -1)}
                                className="p-1 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold text-gray-900">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(drink._id, 1)}
                                className="p-1 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Drinks Bill & Checkout Panel */}
          <div className="w-full lg:w-96 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col shrink-0">
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-2">
                <CupSoda className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-sm">Drinks Bill</h3>
                <span className="px-2 py-0.5 bg-orange-100 text-primary text-xs font-bold rounded-full">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setIsEditFinalBillModalOpen(true)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <FileEdit className="w-3.5 h-3.5" /> Edit Bill
                </button>
              )}
            </div>

            {/* Customer Inputs (Optional) */}
            <div className="p-3 border-b border-gray-100 space-y-2 bg-white">
              <Input
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Customer Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[180px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                  <ShoppingBag className="w-10 h-10 mb-2 text-gray-300" />
                  <p className="text-xs font-medium">No drinks added to bill.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click drinks on the left to add.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.drinkId} className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-semibold text-xs text-gray-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-gray-500">₹{item.unitPrice} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs w-12 text-right">₹{item.lineTotal.toFixed(2)}</span>
                      <div className="flex items-center bg-gray-100 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.drinkId, -1)}
                          className="p-1 hover:bg-gray-200 rounded-l-md text-gray-600 transition-colors"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.drinkId, 1)}
                          className="p-1 hover:bg-gray-200 rounded-r-md text-gray-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pricing Summary & Editable Controls */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2.5">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                {/* Editable Discount Row */}
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1">Discount (₹)</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    className="h-6 w-20 text-right text-xs bg-white"
                  />
                </div>

                {/* Tax Option Selector */}
                <div className="flex items-center justify-between text-gray-600">
                  <span>GST / Tax Rate</span>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="h-6 px-1.5 text-xs bg-white border border-gray-300 rounded font-medium text-gray-700"
                  >
                    <option value={5}>5% GST (2.5% + 2.5%)</option>
                    <option value={0}>0% (No Tax)</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                  </select>
                </div>

                {taxRate > 0 && (
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>CGST ({taxRate / 2}%) + SGST ({taxRate / 2}%)</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Final Net Total */}
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-900">Total Payable</span>
                <span className="font-extrabold text-2xl text-primary font-mono">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'UPI', label: 'UPI', icon: Smartphone },
                  { id: 'CARD', label: 'Card', icon: CreditCard }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setDrinkPaymentMethod(method.id as any)}
                    className={`py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                      paymentMethod === method.id 
                        ? 'border-primary bg-orange-50 text-primary' 
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <method.icon className="w-3.5 h-3.5" />
                    {method.label}
                  </button>
                ))}
              </div>

              {/* Final Bill Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditFinalBillModalOpen(true)}
                    disabled={cart.length === 0}
                    className="flex-1 text-xs font-semibold gap-1 h-9 border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <FileEdit className="w-3.5 h-3.5" /> Edit Final Bill
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCart([])}
                    disabled={cart.length === 0}
                    className="w-20 text-xs h-9 text-gray-600"
                  >
                    Clear
                  </Button>
                </div>

                <Button
                  size="default"
                  onClick={handleGenerateAndPrintBill}
                  disabled={cart.length === 0 || isProcessingSale}
                  className="w-full font-bold text-sm h-11 bg-primary hover:bg-primary/90 text-white shadow-md gap-2"
                >
                  {isProcessingSale ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Print & Settle Drinks Bill
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* DRINKS INVENTORY & RESTOCK VIEW */
        /* ======================================================== */
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
            {/* Inventory Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" /> Drinks Inventory & Stock Management
                </h2>
                <p className="text-xs text-gray-500">Track current stock levels, restock items, or edit drink prices</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-white"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm()
                    setIsAddDrinkModalOpen(true)
                  }}
                  className="h-9 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Drink
                </Button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#F8F8F7]">
              {drinks.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <PackagePlus className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="font-bold text-gray-800">Your Drinks Inventory is Empty</h3>
                  <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
                    Add beverages and their stock to begin tracking inventory and generating bills.
                  </p>
                  <Button size="sm" onClick={handleAddPopularPresets} className="font-semibold text-xs gap-1.5">
                    <Sparkles className="w-4 h-4" /> Add 8 Popular Cafe Drinks
                  </Button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-3">Drink Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3">Cost Price</th>
                        <th className="p-3 text-center">Current Stock</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Quick Restock</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {drinks
                        .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(drink => {
                          const isOutOfStock = drink.currentStock <= 0
                          const isLowStock = drink.currentStock > 0 && drink.currentStock <= (drink.minStock || 5)

                          return (
                            <tr key={drink._id} className="hover:bg-gray-50/70 transition-colors">
                              <td className="p-3 font-semibold text-gray-900">
                                {drink.name}
                                <span className="block text-[10px] text-gray-400 font-normal">Unit: {drink.unit || 'bottle'}</span>
                              </td>
                              <td className="p-3 text-gray-600">
                                <Badge variant="outline" className="text-[10px] bg-gray-50">
                                  {drink.category || 'Drinks'}
                                </Badge>
                              </td>
                              <td className="p-3 font-bold text-gray-900">
                                ₹{drink.price}
                              </td>
                              <td className="p-3 text-gray-500">
                                ₹{drink.cost || 0}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-sm">
                                <span className={isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-emerald-700'}>
                                  {drink.currentStock} {drink.unit || 'units'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {isOutOfStock ? (
                                  <Badge variant="destructive" className="text-[10px] bg-red-500">Out of Stock</Badge>
                                ) : isLowStock ? (
                                  <Badge className="text-[10px] bg-amber-500 text-white">Low Stock</Badge>
                                ) : (
                                  <Badge className="text-[10px] bg-emerald-100 text-emerald-800">In Stock</Badge>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex gap-1">
                                  {[6, 12, 24].map(qty => (
                                    <button
                                      key={qty}
                                      onClick={() => handleQuickRestock(drink._id, qty)}
                                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold transition-colors"
                                      title={`Quick restock +${qty}`}
                                    >
                                      +{qty}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openRestockModal(drink)}
                                    className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium px-2 gap-1"
                                  >
                                    <PackagePlus className="w-3 h-3" /> Restock
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditModal(drink)}
                                    className="h-7 text-xs text-gray-700 hover:bg-gray-100 px-2"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteDrink(drink)}
                                    className="h-7 text-xs text-red-600 hover:bg-red-50 border-red-200 px-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT DRINK MODAL */}
      {/* ======================================================== */}
      {(isAddDrinkModalOpen || isEditDrinkModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CupSoda className="w-4 h-4 text-primary" />
                {selectedDrinkToEdit ? 'Edit Drink Item' : 'Add New Drink'}
              </h3>
              <button 
                onClick={() => {
                  setIsAddDrinkModalOpen(false)
                  setIsEditDrinkModalOpen(false)
                  resetForm()
                }}
                className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDrink} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Drink Name *</label>
                <Input
                  required
                  placeholder="e.g. Coca Cola 330ml Can"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Selling Price (₹) *</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    placeholder="e.g. 40"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Cost Price (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 30"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-9 px-2 text-xs border border-gray-300 rounded-md bg-white text-gray-800"
                  >
                    <option value="Cold Drinks">Cold Drinks</option>
                    <option value="Energy Drinks">Energy Drinks</option>
                    <option value="Water">Water</option>
                    <option value="Coffee & Tea">Coffee & Tea</option>
                    <option value="Juices">Juices</option>
                    <option value="Mocktails">Mocktails</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Unit of Measurement</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full h-9 px-2 text-xs border border-gray-300 rounded-md bg-white text-gray-800"
                  >
                    <option value="can">Can</option>
                    <option value="bottle">Bottle</option>
                    <option value="glass">Glass</option>
                    <option value="cup">Cup</option>
                    <option value="pcs">Pcs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {selectedDrinkToEdit ? 'Current Stock Level' : 'Initial Stock Quantity'}
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 24"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="h-9 text-xs font-mono font-bold"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Number of available units in your fridge or beverage shelf.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddDrinkModalOpen(false)
                    setIsEditDrinkModalOpen(false)
                    resetForm()
                  }}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingForm || !formName || !formPrice}
                  className="h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white px-5 shadow-sm"
                >
                  {isSubmittingForm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Drink Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: RESTOCK MODAL */}
      {/* ======================================================== */}
      {isRestockModalOpen && selectedDrinkToRestock && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50">
              <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-emerald-600" />
                Restock {selectedDrinkToRestock.name}
              </h3>
              <button 
                onClick={() => {
                  setIsRestockModalOpen(false)
                  setSelectedDrinkToRestock(null)
                }}
                className="w-7 h-7 rounded-full hover:bg-emerald-100 flex items-center justify-center text-emerald-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalRestock} className="p-5 space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Current Stock</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {selectedDrinkToRestock.currentStock} {selectedDrinkToRestock.unit || 'units'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">After Restock</span>
                  <span className="font-bold text-emerald-600 text-sm font-mono">
                    {selectedDrinkToRestock.currentStock + Number(restockQty || 0)} {selectedDrinkToRestock.unit || 'units'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Quantity to Add</label>
                <div className="flex items-center gap-2 mb-2">
                  {[6, 12, 24, 48].map(qty => (
                    <button
                      type="button"
                      key={qty}
                      onClick={() => setRestockQty(qty)}
                      className={`flex-1 py-1 rounded border text-xs font-bold transition-colors ${
                        restockQty === qty
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
                <Input
                  required
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Restock Notes (Optional)</label>
                <Input
                  placeholder="e.g. Received shipment from beverage supplier"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isRestocking || restockQty <= 0}
                  className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-5 shadow-sm"
                >
                  {isRestocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Stock Addition'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: INTERACTIVE FINAL BILL EDITOR MODAL */}
      {/* ======================================================== */}
      {isEditFinalBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-orange-50/60">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Edit Final Drinks Bill</h3>
                  <p className="text-[11px] text-gray-500">Edit quantities, custom item prices, discount, or tax before printing</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditFinalBillModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Editable Items Table */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2 uppercase text-[11px] tracking-wide">
                  Bill Line Items ({cart.length})
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 text-[11px]">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 w-24 text-center">Qty</th>
                        <th className="p-2.5 w-28 text-right">Price (₹)</th>
                        <th className="p-2.5 w-24 text-right">Total (₹)</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cart.map(item => (
                        <tr key={item.drinkId} className="hover:bg-gray-50/50">
                          <td className="p-2">
                            <Input
                              value={item.name}
                              onChange={(e) => updateCartItemName(item.drinkId, e.target.value)}
                              className="h-7 text-xs font-medium"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1 bg-gray-100 rounded p-0.5">
                              <button
                                onClick={() => updateQuantity(item.drinkId, -1)}
                                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.drinkId, 1)}
                                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateCartItemPrice(item.drinkId, Number(e.target.value))}
                              className="h-7 text-xs text-right font-mono"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-gray-900 font-mono">
                            ₹{item.lineTotal.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => removeCartItem(item.drinkId)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Custom / One-Off Item Row */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <span className="font-bold text-gray-700 text-[11px] block">+ Add Custom Charge or Item</span>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                  <Input
                    placeholder="Custom Item Name (e.g. Ice Bucket, Extra Cups)"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="h-8 text-xs flex-2"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(Math.max(1, Number(e.target.value)))}
                    className="h-8 text-xs w-16 text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Price (₹)"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    className="h-8 text-xs w-24 text-right"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addCustomItemToCart}
                    disabled={!customItemName.trim()}
                    className="h-8 text-xs font-semibold shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Customer & Adjustments Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Customer Name (Optional)</label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Customer Phone (Optional)</label>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Discount Amount (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">GST / Tax Option</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full h-8 px-2 text-xs border border-gray-300 rounded-md bg-white font-medium text-gray-800"
                  >
                    <option value={5}>5% GST (2.5% CGST + 2.5% SGST)</option>
                    <option value={0}>0% (No Tax applied)</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                  </select>
                </div>
              </div>

              {/* Live Recalculated Bill Totals */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>CGST ({taxRate / 2}%) + SGST ({taxRate / 2}%)</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-sm font-bold text-gray-900">
                  <span>Final Net Payable</span>
                  <span className="text-xl text-primary font-mono font-extrabold">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer with One-Click Settle & Print */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditFinalBillModalOpen(false)}
                className="h-9 px-4 text-xs font-medium"
              >
                Close Editor
              </Button>

              <Button
                size="sm"
                onClick={handleGenerateAndPrintBill}
                disabled={cart.length === 0 || isProcessingSale}
                className="gap-2 h-9 px-6 font-bold text-xs bg-primary hover:bg-primary/90 text-white shadow-md"
              >
                {isProcessingSale ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Confirm & Print Bill
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
