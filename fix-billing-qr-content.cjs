const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

// -- 1. Add QR table selected order state -----------------------------------
content = content.replace(
  "  const [selectedOnlineOrder, setSelectedOnlineOrder] = useState<any>(null)",
  `  const [selectedOnlineOrder, setSelectedOnlineOrder] = useState<any>(null)
  const [selectedQrOrder, setSelectedQrOrder] = useState<any>(null)`
);

// -- 2. filteredQrOrders computed var (after filteredOnlineOrders) ---------
content = content.replace(
  "  const filteredOnlineOrders = onlineOrders.filter(order => {",
  `  const filteredQrOrders = qrTableOrders.filter(order => {
    if (!qrTableSearch) return true;
    const s = qrTableSearch.toLowerCase();
    return (
      (order.orderNumber || '').toLowerCase().includes(s) ||
      (order.tableId?.name || '').toLowerCase().includes(s) ||
      String(order.tableId?.tableNumber || '').includes(s)
    );
  });

  const filteredOnlineOrders = onlineOrders.filter(order => {`
);

// -- 3. Add QR Tables content section before the right-side panel ----------
const qrSection = `
          {/* -- QR Tables Tab -------------------------------------------- */}
          {activeTab === 'QR_TABLES' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row gap-3 justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-orange-500" />
                  <h2 className="font-bold text-gray-900">QR Table Orders</h2>
                  {pendingQrOrdersCount > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                      {pendingQrOrdersCount} active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search table name or order #..."
                      value={qrTableSearch}
                      onChange={(e) => setQrTableSearch(e.target.value)}
                      className="pl-9 h-9 bg-white"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchQrTableOrders(true)} className="gap-1 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F8F7]">
                {filteredQrOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                    <QrCode className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No QR table orders yet</p>
                    <p className="text-xs text-gray-400 mt-1">Orders placed by customers scanning QR codes will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredQrOrders.map(order => {
                      const isSelected = selectedQrOrder?._id === order._id;
                      const isCompleted = order.orderStatus === 'COMPLETED';
                      const tableName = order.tableId?.name || (order.tableId?.tableNumber ? \`Table \${order.tableId.tableNumber}\` : 'Unknown Table');
                      return (
                        <Card
                          key={order._id}
                          onClick={() => setSelectedQrOrder(order)}
                          className={\`cursor-pointer transition-all hover:shadow-md \${
                            isSelected
                              ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30'
                              : isCompleted
                                ? 'border-gray-200 bg-white opacity-85'
                                : 'border-orange-200 bg-white'
                          }\`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-bold text-base text-gray-900">{tableName}</span>
                                <p className="text-xs text-gray-500">
                                  {order.orderNumber} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <Badge className={\`text-[10px] uppercase font-bold \${
                                  isCompleted
                                    ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                    : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                                }\`}>
                                  {order.orderStatus}
                                </Badge>
                                <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-semibold">?? QR</span>
                              </div>
                            </div>

                            <div className="text-xs text-gray-500 my-2">
                              {order.items?.length || 0} item(s) • Total: <span className="font-bold text-gray-900 text-sm">?{Number(order.total).toFixed(2)}</span>
                            </div>

                            <ul className="text-xs text-gray-600 space-y-0.5 mb-3">
                              {(order.items || []).slice(0, 3).map((item: any, i: number) => (
                                <li key={i} className="flex justify-between">
                                  <span className="truncate pr-2">{item.quantity}x {item.dishName}</span>
                                  <span className="font-medium">?{item.lineTotal}</span>
                                </li>
                              ))}
                              {(order.items || []).length > 3 && (
                                <li className="text-gray-400">+{order.items.length - 3} more items</li>
                              )}
                            </ul>

                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className={\`w-full text-xs h-8 \${!isCompleted ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : ''}\`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQrOrder(order);
                              }}
                            >
                              {isSelected ? 'Selected' : (isCompleted ? 'View' : 'Settle Bill')}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

`;

// Insert QR section before the right-side panel comment
content = content.replace(
  "          {/* Right side: Cart / Table / Online Order Summary */}",
  qrSection + "          {/* Right side: Cart / Table / Online Order Summary */}"
);

// -- 4. Update right-side header to handle QR_TABLES tab ------------------
content = content.replace(
  `                  {activeTab === 'FAST_BILLING' 
                    ? 'Current Order' 
                    : activeTab === 'TABLES' 
                      ? (selectedTable ? \`Table: \${selectedTable.name}\` : 'Select a table')
                      : (selectedOnlineOrder ? \`Online: \${selectedOnlineOrder.orderNumber}\` : 'Select an online order')}`,
  `                  {activeTab === 'FAST_BILLING'
                    ? 'Current Order'
                    : activeTab === 'TABLES'
                      ? (selectedTable ? \`Table: \${selectedTable.name}\` : 'Select a table')
                      : activeTab === 'QR_TABLES'
                        ? (selectedQrOrder ? (selectedQrOrder.tableId?.name || \`Table \${selectedQrOrder.tableId?.tableNumber}\`) : 'Select a QR order')
                        : (selectedOnlineOrder ? \`Online: \${selectedOnlineOrder.orderNumber}\` : 'Select an online order')}`
);

content = content.replace(
  `                  {activeTab === 'FAST_BILLING' 
                    ? 'Fast Billing' 
                    : activeTab === 'TABLES' 
                      ? (selectedTable ? 'Table Bill' : 'Waiting for selection')
                      : (selectedOnlineOrder ? 'Online Order Details' : 'Waiting for selection')}`,
  `                  {activeTab === 'FAST_BILLING'
                    ? 'Fast Billing'
                    : activeTab === 'TABLES'
                      ? (selectedTable ? 'Table Bill' : 'Waiting for selection')
                      : activeTab === 'QR_TABLES'
                        ? (selectedQrOrder ? 'QR Table Order' : 'Waiting for selection')
                        : (selectedOnlineOrder ? 'Online Order Details' : 'Waiting for selection')}`
);

// -- 5. Add QR order badge in right panel header ---------------------------
content = content.replace(
  `              {activeTab === 'ONLINE' && selectedOnlineOrder && (
                <Badge variant="outline" className={\`border-0 \${selectedOnlineOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}\`}>
                  {selectedOnlineOrder.paymentStatus || 'PENDING'}
                </Badge>
              )}`,
  `              {activeTab === 'ONLINE' && selectedOnlineOrder && (
                <Badge variant="outline" className={\`border-0 \${selectedOnlineOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}\`}>
                  {selectedOnlineOrder.paymentStatus || 'PENDING'}
                </Badge>
              )}
              {activeTab === 'QR_TABLES' && selectedQrOrder && (
                <Badge variant="outline" className={\`border-0 \${selectedQrOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}\`}>
                  {selectedQrOrder.paymentStatus || 'PENDING'}
                </Badge>
              )}`
);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("QR tab content done");
