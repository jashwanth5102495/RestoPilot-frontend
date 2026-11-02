import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Printer, 
  RefreshCw, 
  Eye, 
  History, 
  Receipt, 
  Calendar, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  X, 
  FileText,
  CupSoda,
  UtensilsCrossed,
  Globe,
  ShoppingBag
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { printReceipt } from '@/lib/printReceipt'

interface HistoryTabProps {
  slug: string
  restaurantData: any
}

export default function HistoryTab({ slug, restaurantData }: HistoryTabProps) {
  const { toast } = useToast()
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'POS' | 'DRINKS' | 'TABLES' | 'ONLINE'>('ALL')
  const [selectedBill, setSelectedBill] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchHistory = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get(`/public/billing/${slug}/history`)
      setBills(res.data.data || [])
    } catch (err: any) {
      console.error('Failed to fetch billing history', err)
      if (!silent && err.response?.status !== 404) {
        toast({
          title: 'Error loading history',
          description: err.response?.data?.message || 'Could not load bills history.',
          variant: 'destructive'
        })
      }
      setBills([])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [slug])

  // Determine source type of bill
  const getBillSource = (bill: any): 'DRINKS' | 'ONLINE' | 'TABLES' | 'POS' => {
    if (bill.orderSource === 'ONLINE') return 'ONLINE'
    if (bill.tableName || bill.tableId) return 'TABLES'
    const isDrinkBill = bill.items?.some((i: any) => {
      const name = (i.dishName || i.name || '').toLowerCase()
      return name.includes('cola') || name.includes('coke') || name.includes('soda') || 
             name.includes('drink') || name.includes('water') || name.includes('coffee') ||
             name.includes('tea') || name.includes('juice') || name.includes('beer') ||
             name.includes('bull') || name.includes('sprite') || name.includes('can') ||
             name.includes('bottle')
    })
    const orderNumberStr = String(bill.orderNumber || '')
    if (orderNumberStr.startsWith('DRK-') || (isDrinkBill && bill.items?.length <= 4)) {
      return 'DRINKS'
    }
    return 'POS'
  }

  const filteredBills = bills.filter(bill => {
    const billSource = getBillSource(bill)
    if (sourceFilter === 'POS' && billSource !== 'POS') return false
    if (sourceFilter === 'DRINKS' && billSource !== 'DRINKS') return false
    if (sourceFilter === 'ONLINE' && billSource !== 'ONLINE') return false
    if (sourceFilter === 'TABLES' && billSource !== 'TABLES') return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const matchBillNo = String(bill.billNumber || '').toLowerCase().includes(q)
    const matchOrderNo = String(bill.orderNumber || '').toLowerCase().includes(q)
    const matchCustomer = String(bill.customerInfo?.name || '').toLowerCase().includes(q) ||
                          String(bill.customerInfo?.phone || '').toLowerCase().includes(q)
    const matchItems = bill.items?.some((item: any) => 
      String(item.dishName || item.name || '').toLowerCase().includes(q)
    )
    return matchBillNo || matchOrderNo || matchCustomer || matchItems
  })

  const handlePrintBill = (bill: any) => {
    try {
      printReceipt(
        bill,
        restaurantData?.name,
        restaurantData?.address,
        restaurantData?.phone,
        restaurantData?.gstNumber
      )
      toast({
        title: 'Printing Receipt',
        description: `Sending Bill ${bill.billNumber || bill.orderNumber} to printer...`
      })
    } catch (err) {
      toast({
        title: 'Print Failed',
        description: 'Unable to trigger print receipt. Please check printer settings.',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A'
    const d = new Date(dateString)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getPaymentIcon = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-blue-600" />
      case 'CARD':
        return <CreditCard className="w-3.5 h-3.5 text-purple-600" />
      case 'CASH':
      default:
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />
    }
  }

  const getSourceBadge = (source: 'DRINKS' | 'ONLINE' | 'TABLES' | 'POS') => {
    switch (source) {
      case 'DRINKS':
        return (
          <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200 flex items-center gap-1 font-semibold text-[11px]">
            <CupSoda className="w-3 h-3" /> Drinks
          </Badge>
        )
      case 'TABLES':
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 flex items-center gap-1 font-semibold text-[11px]">
            <UtensilsCrossed className="w-3 h-3" /> Dine In
          </Badge>
        )
      case 'ONLINE':
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 flex items-center gap-1 font-semibold text-[11px]">
            <Globe className="w-3 h-3" /> Online
          </Badge>
        )
      case 'POS':
      default:
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 flex items-center gap-1 font-semibold text-[11px]">
            <ShoppingBag className="w-3 h-3" /> POS Sale
          </Badge>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-full">
      {/* Top Header & Search Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Bill History & Receipts
          </h2>
          <p className="text-xs text-gray-500">View past sales, inspect itemized bills, and reprint customer receipts</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search bill #, order #, item, phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white text-xs"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchHistory(false)} 
            disabled={loading}
            className="gap-1.5 h-9 shrink-0 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 overflow-x-auto bg-white shrink-0">
        <span className="text-xs font-semibold text-gray-500 mr-1">Filter:</span>
        {[
          { id: 'ALL', label: `All Bills (${bills.length})` },
          { id: 'POS', label: 'POS' },
          { id: 'DRINKS', label: 'Drinks' },
          { id: 'TABLES', label: 'Dine In' },
          { id: 'ONLINE', label: 'Online' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSourceFilter(tab.id as any)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              sourceFilter === tab.id
                ? 'bg-primary text-white shadow-sm font-semibold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bills Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#F8F8F7]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-gray-600">Loading previous bills...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400">
            <Receipt className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700">No bills found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm text-center">
              {searchQuery ? 'No bills match your search criteria. Try a different term.' : 'Completed bills will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBills.map((bill, index) => {
              const source = getBillSource(bill)
              const itemsCount = bill.items?.reduce((sum: number, it: any) => sum + Number(it.quantity || 1), 0) || 0
              const itemsListPreview = bill.items?.slice(0, 3).map((it: any) => `${it.dishName || it.name || 'Item'} (×${it.quantity})`).join(', ')
              const hasMoreItems = (bill.items?.length || 0) > 3

              return (
                <Card 
                  key={bill._id || index}
                  className="hover:shadow-md transition-shadow border-gray-200 bg-white overflow-hidden"
                >
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Bill Identification & Source */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 text-primary">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {bill.billNumber || bill.orderNumber || `Bill #${index + 1}`}
                          </span>
                          {bill.orderNumber && bill.orderNumber !== bill.billNumber && (
                            <span className="text-xs text-gray-500 font-mono">
                              ({bill.orderNumber})
                            </span>
                          )}
                          {getSourceBadge(source)}
                          {bill.tableName && (
                            <Badge variant="outline" className="text-[10px] bg-gray-50">
                              Table: {bill.tableName}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(bill.createdAt)}
                          {bill.customerInfo?.name && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="font-medium text-gray-700">{bill.customerInfo.name}</span>
                            </>
                          )}
                        </p>

                        <div className="text-xs text-gray-600 mt-2 truncate max-w-xl">
                          <span className="font-medium text-gray-700">{itemsCount} item{itemsCount !== 1 ? 's' : ''}: </span>
                          <span className="text-gray-500">
                            {itemsListPreview || 'No items listed'}
                            {hasMoreItems && ` +${bill.items.length - 3} more`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Amount & Payment Method */}
                    <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 gap-1 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[11px] text-gray-500 block uppercase font-medium">Total Paid</span>
                        <span className="text-lg font-bold text-primary font-mono">
                          ₹{Number(bill.total || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        {getPaymentIcon(bill.paymentMethod)}
                        <span className="font-medium">{bill.paymentMethod || 'Cash'}</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBill(bill)
                          setIsDetailModalOpen(true)
                        }}
                        className="gap-1.5 text-xs h-9 border-gray-300 hover:bg-gray-100 text-gray-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePrintBill(bill)}
                        className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Bill
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      {isDetailModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900 text-base">
                  Bill {selectedBill.billNumber || selectedBill.orderNumber}
                </h3>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Metadata details */}
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="text-gray-800 font-medium">{formatDate(selectedBill.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="text-gray-800 font-medium flex items-center gap-1">
                    {getPaymentIcon(selectedBill.paymentMethod)} {selectedBill.paymentMethod || 'Cash'}
                  </span>
                </div>
                {selectedBill.orderNumber && (
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Order Number</span>
                    <span className="text-gray-800 font-mono font-medium">{selectedBill.orderNumber}</span>
                  </div>
                )}
                {selectedBill.tableName && (
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Table</span>
                    <span className="text-gray-800 font-medium">{selectedBill.tableName}</span>
                  </div>
                )}
                {selectedBill.customerInfo?.name && (
                  <div className="col-span-2 pt-1 border-t border-gray-200/60">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Customer</span>
                    <span className="text-gray-800 font-medium">
                      {selectedBill.customerInfo.name} {selectedBill.customerInfo.phone && `(${selectedBill.customerInfo.phone})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2 uppercase text-[11px] tracking-wide">Ordered Items</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedBill.items?.map((item: any, idx: number) => {
                        const name = item.dishName || item.name || 'Item'
                        const qty = Number(item.quantity || 1)
                        const price = Number(item.unitPrice || item.price || 0)
                        const total = Number(item.lineTotal || (price * qty))
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2.5 font-medium text-gray-800">{name}</td>
                            <td className="p-2.5 text-center text-gray-600">{qty}</td>
                            <td className="p-2.5 text-right text-gray-600">₹{price.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-semibold text-gray-900">₹{total.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-gray-200 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{Number(selectedBill.subtotal || 0).toFixed(2)}</span>
                </div>
                {Number(selectedBill.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{Number(selectedBill.discount).toFixed(2)}</span>
                  </div>
                )}
                {selectedBill.cgst !== undefined && Number(selectedBill.cgst) > 0 && (
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>CGST</span>
                    <span>₹{Number(selectedBill.cgst).toFixed(2)}</span>
                  </div>
                )}
                {selectedBill.sgst !== undefined && Number(selectedBill.sgst) > 0 && (
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>SGST</span>
                    <span>₹{Number(selectedBill.sgst).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Total Tax</span>
                  <span>₹{Number(selectedBill.tax || 0).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-xl text-primary font-mono">₹{Number(selectedBill.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDetailModalOpen(false)}
                className="h-9 px-4"
              >
                Close
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  handlePrintBill(selectedBill)
                  setIsDetailModalOpen(false)
                }}
                className="gap-2 h-9 px-5 font-bold shadow-md bg-primary hover:bg-primary/90 text-white"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
