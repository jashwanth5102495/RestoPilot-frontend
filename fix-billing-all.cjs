const fs = require("fs");
let c = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

// 1. Add QrCode to lucide imports
c = c.replace(
  `import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Loader2, UtensilsCrossed, RefreshCw, Globe, MapPin, Phone, User, Printer } from "lucide-react"`,
  `import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Loader2, UtensilsCrossed, RefreshCw, Globe, MapPin, Phone, User, Printer, QrCode } from "lucide-react"`
);

// 2. Extend tab type
c = c.replace(
  `const [activeTab, setActiveTab] = useState<'FAST_BILLING' | 'TABLES' | 'ONLINE'>('FAST_BILLING')`,
  `const [activeTab, setActiveTab] = useState<'FAST_BILLING' | 'TABLES' | 'ONLINE' | 'QR_TABLES'>('FAST_BILLING')`
);

// 3. Add QR state and selectedQrOrder after selectedOnlineOrder
c = c.replace(
  `  const [selectedOnlineOrder, setSelectedOnlineOrder] = useState<any>(null)`,
  `  const [selectedOnlineOrder, setSelectedOnlineOrder] = useState<any>(null)
  const [qrTableOrders, setQrTableOrders] = useState<any[]>([])
  const [selectedQrOrder, setSelectedQrOrder] = useState<any>(null)
  const [qrTableSearch, setQrTableSearch] = useState('')
  const prevQrPendingCountRef = useRef<number>(0)`
);

// 4. Add fetchQrTableOrders before useEffect
const markerFetch = `  useEffect(() => {
    const fetchData = async () => {`;
const qrFetchFn = `  const fetchQrTableOrders = async (silent = false) => {
    try {
      const res = await axios.get(\`\${API_URL}/public/billing/\${slug}/qr-table-orders\`)
      const orders = res.data.data || []
      setQrTableOrders(orders)
      const pendingCount = orders.filter((o: any) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length
      if (!silent && pendingCount > prevQrPendingCountRef.current && prevQrPendingCountRef.current !== 0) {
        toast({ title: "New QR Table Order!", description: "A customer ordered from their table." })
      }
      prevQrPendingCountRef.current = pendingCount
    } catch (err) { console.error('Failed to fetch QR orders', err) }
  }

  `;
c = c.replace(markerFetch, qrFetchFn + markerFetch);

// 5. Fetch QR orders in initial load after fetchOnlineOrders
c = c.replace(
  `        await fetchOnlineOrders(true)
      } catch (err: any) {`,
  `        await fetchOnlineOrders(true)
        await fetchQrTableOrders(true)
      } catch (err: any) {`
);

// 6. Poll QR orders in interval
c = c.replace(
  `      fetchOnlineOrders(false)
      if (activeTab === 'TABLES') {`,
  `      fetchOnlineOrders(false)
      fetchQrTableOrders(false)
      if (activeTab === 'TABLES') {`
);

// 7. Add handleSettleQrOrder after handleSettleOnlineOrder
const afterSettleOnline = `  const handleUpdateOnlineStatus = async (status: string) => {`;
const settleQrFn = `  const handleSettleQrOrder = async () => {
    if (!selectedQrOrder) return
    setIsProcessing(true)
    try {
      const res = await axios.post(\`\${API_URL}/public/billing/\${slug}/qr-table-orders/\${selectedQrOrder._id}/settle\`, { paymentMethod })
      toast({ title: "QR Table Order Settled", description: "Order completed and bill printed." })
      printReceipt(res.data.data, restaurantData?.name, restaurantData?.address, restaurantData?.phone, restaurantData?.gstNumber)
      setSelectedQrOrder(res.data.data)
      fetchQrTableOrders(true)
    } catch (err: any) {
      toast({ title: "Failed to settle QR order", description: err.response?.data?.message || 'Error', variant: 'destructive' })
    } finally { setIsProcessing(false) }
  }

  const handleUpdateOnlineStatus = async (status: string) => {`;
c = c.replace(afterSettleOnline, settleQrFn);

// 8. Add pendingQrOrdersCount computed var after pendingOnlineOrdersCount  
c = c.replace(
  `  const pendingOnlineOrdersCount = onlineOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length`,
  `  const pendingOnlineOrdersCount = onlineOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length
  const pendingQrOrdersCount = qrTableOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length
  const filteredQrOrders = qrTableOrders.filter(order => {
    if (!qrTableSearch) return true
    const s = qrTableSearch.toLowerCase()
    return (order.orderNumber || '').toLowerCase().includes(s) || (order.tableId?.name || '').toLowerCase().includes(s) || String(order.tableId?.tableNumber || '').includes(s)
  })`
);

// 9. Add QR Tables button in sidebar BEFORE </aside>
c = c.replace(
  `          title="Online Orders"
        >
          <Globe className="w-6 h-6" />
          <span className="text-[10px] font-bold">Online</span>
          {pendingOnlineOrdersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {pendingOnlineOrdersCount}
            </span>
          )}
        </button>
      </aside>`,
  `          title="Online Orders"
        >
          <Globe className="w-6 h-6" />
          <span className="text-[10px] font-bold">Online</span>
          {pendingOnlineOrdersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {pendingOnlineOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('QR_TABLES'); fetchQrTableOrders(true); }}
          className={\`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all \${
            activeTab === 'QR_TABLES'
              ? 'bg-primary/10 text-primary scale-110'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }\`}
          title="QR Table Orders"
        >
          <QrCode className="w-6 h-6" />
          <span className="text-[10px] font-bold">QR Tables</span>
          {pendingQrOrdersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {pendingQrOrdersCount}
            </span>
          )}
        </button>
      </aside>`
);

// 10. Add QR Tables button in mobile header (after Online button)
c = c.replace(
  `              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
              className={\`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors \${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}\`}
            >
              Online
              {pendingOnlineOrdersCount > 0 && (
                <span className="inline-block ml-1 px-1 bg-orange-500 text-white rounded-full text-[9px]">
                  {pendingOnlineOrdersCount}
                </span>
              )}
            </button>
          </div>
        </header>`,
  `              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
              className={\`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors \${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}\`}
            >
              Online
              {pendingOnlineOrdersCount > 0 && (
                <span className="inline-block ml-1 px-1 bg-orange-500 text-white rounded-full text-[9px]">
                  {pendingOnlineOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('QR_TABLES'); fetchQrTableOrders(true); }}
              className={\`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors \${activeTab === 'QR_TABLES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}\`}
            >
              QR Tables
              {pendingQrOrdersCount > 0 && (
                <span className="inline-block ml-1 px-1 bg-orange-500 text-white rounded-full text-[9px]">
                  {pendingQrOrdersCount}
                </span>
              )}
            </button>
          </div>
        </header>`
);

// 11. Add QR Tables content panel – insert BEFORE right-side panel
const rightPanelMarker = `          {/* Right side: Cart / Table / Online Order Summary */}`;
const qrTabContent = `          {/* ── QR Tables Tab Content ─────────────────────────────── */}
          {activeTab === 'QR_TABLES' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row gap-3 justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-orange-500" />
                  <h2 className="font-bold text-gray-900">QR Table Orders</h2>
                  {pendingQrOrdersCount > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">{pendingQrOrdersCount} active</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search table name..." value={qrTableSearch} onChange={(e) => setQrTableSearch(e.target.value)} className="pl-9 h-9 bg-white" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchQrTableOrders(true)} className="gap-1 shrink-0"><RefreshCw className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F8F7]">
                {filteredQrOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                    <QrCode className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No QR table orders yet</p>
                    <p className="text-xs text-gray-400 mt-1">Orders from customer QR scans appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredQrOrders.map(order => {
                      const isSelected = selectedQrOrder?._id === order._id
                      const isCompleted = order.orderStatus === 'COMPLETED'
                      const tableName = order.tableId?.name || (order.tableId?.tableNumber ? \`Table \${order.tableId.tableNumber}\` : 'Unknown Table')
                      return (
                        <Card key={order._id} onClick={() => setSelectedQrOrder(order)}
                          className={\`cursor-pointer transition-all hover:shadow-md \${isSelected ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30' : isCompleted ? 'border-gray-200 bg-white opacity-85' : 'border-orange-200 bg-white'}\`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-bold text-base text-gray-900">{tableName}</span>
                                <p className="text-xs text-gray-500">{order.orderNumber} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <Badge className={\`text-[10px] uppercase font-bold \${isCompleted ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-orange-100 text-orange-700 hover:bg-orange-100'}\`}>{order.orderStatus}</Badge>
                                <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-semibold">📱 QR</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 my-2">{order.items?.length || 0} item(s) • Total: <span className="font-bold text-gray-900 text-sm">₹{Number(order.total).toFixed(2)}</span></div>
                            <ul className="text-xs text-gray-600 space-y-0.5 mb-3">
                              {(order.items || []).slice(0, 3).map((item: any, i: number) => (
                                <li key={i} className="flex justify-between">
                                  <span className="truncate pr-2">{item.quantity}x {item.dishName}</span>
                                  <span className="font-medium">₹{item.lineTotal}</span>
                                </li>
                              ))}
                              {(order.items || []).length > 3 && <li className="text-gray-400">+{order.items.length - 3} more items</li>}
                            </ul>
                            <Button size="sm" variant={isSelected ? "default" : "outline"}
                              className={\`w-full text-xs h-8 \${!isCompleted ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : ''}\`}
                              onClick={(e) => { e.stopPropagation(); setSelectedQrOrder(order); }}>
                              {isSelected ? 'Selected' : (isCompleted ? 'View' : 'Settle Bill')}
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          `;
c = c.replace(rightPanelMarker, qrTabContent + rightPanelMarker);

// 12. Update right-panel header for QR_TABLES
c = c.replace(
  `                  {activeTab === 'FAST_BILLING' \r\n                    ? 'Current Order' \r\n                    : activeTab === 'TABLES' \r\n                      ? (selectedTable ? \`Table: \${selectedTable.name}\` : 'Select a table')\r\n                      : (selectedOnlineOrder ? \`Online: \${selectedOnlineOrder.orderNumber}\` : 'Select an online order')}`,
  `                  {activeTab === 'FAST_BILLING' ? 'Current Order'
                    : activeTab === 'TABLES' ? (selectedTable ? \`Table: \${selectedTable.name}\` : 'Select a table')
                    : activeTab === 'QR_TABLES' ? (selectedQrOrder ? (selectedQrOrder.tableId?.name || \`Table \${selectedQrOrder.tableId?.tableNumber || ''}\`) : 'Select a QR table order')
                    : (selectedOnlineOrder ? \`Online: \${selectedOnlineOrder.orderNumber}\` : 'Select an online order')}`
);

c = c.replace(
  `                  {activeTab === 'FAST_BILLING' \r\n                    ? 'Fast Billing' \r\n                    : activeTab === 'TABLES' \r\n                      ? (selectedTable ? 'Table Bill' : 'Waiting for selection')\r\n                      : (selectedOnlineOrder ? 'Online Order Details' : 'Waiting for selection')}`,
  `                  {activeTab === 'FAST_BILLING' ? 'Fast Billing'
                    : activeTab === 'TABLES' ? (selectedTable ? 'Table Bill' : 'Waiting for selection')
                    : activeTab === 'QR_TABLES' ? (selectedQrOrder ? 'QR Table Bill' : 'Waiting for selection')
                    : (selectedOnlineOrder ? 'Online Order Details' : 'Waiting for selection')}`
);

// 13. Update settle button area to handle QR_TABLES
c = c.replace(
  `                  <Button className="w-full font-semibold text-base shadow-md" onClick={handleSettleTable} disabled={!selectedTable || isProcessing}>\r\n                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Bill & Print'}\r\n                    </Button>`,
  `                  {activeTab === 'QR_TABLES' ? (
                    <Button className="w-full font-semibold text-base shadow-md bg-orange-500 hover:bg-orange-600"
                      onClick={handleSettleQrOrder}
                      disabled={!selectedQrOrder || isProcessing || selectedQrOrder?.orderStatus === 'COMPLETED'}>
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Settle QR Order & Print'}
                    </Button>
                  ) : (
                    <Button className="w-full font-semibold text-base shadow-md" onClick={handleSettleTable} disabled={!selectedTable || isProcessing}>
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Bill & Print'}
                    </Button>
                  )}`
);

// 14. Show QR order items in right panel for QR_TABLES tab
// Add after: {activeTab === 'ONLINE' && selectedOnlineOrder?.customerInfo && (...)}
c = c.replace(
  `            {activeTab === 'ONLINE' && selectedOnlineOrder?.customerInfo && (`,
  `            {activeTab === 'QR_TABLES' && selectedQrOrder && (
              <div className="p-4 border-b border-gray-200 bg-orange-50/40 text-xs space-y-1">
                <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-orange-500" />
                  {selectedQrOrder.tableId?.name || \`Table \${selectedQrOrder.tableId?.tableNumber || ''}\`}
                </p>
                <p className="text-gray-500">QR Order • {selectedQrOrder.orderNumber}</p>
              </div>
            )}
            {activeTab === 'ONLINE' && selectedOnlineOrder?.customerInfo && (`
);

fs.writeFileSync("src/pages/PublicBilling.tsx", c);
console.log("all changes applied");
