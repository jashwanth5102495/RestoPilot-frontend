const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

// Find `) : (` at line 640
let line640Idx = lines.findIndex((l, idx) => idx > 620 && idx < 650 && l.trim() === ") : (");
// Find old `{activeTab === 'QR_TABLES' && (` at line 759
let oldQrIdx = lines.findIndex((l, idx) => idx > 740 && idx < 780 && l.includes("activeTab === 'QR_TABLES' &&"));

console.log("line640Idx:", line640Idx, "oldQrIdx:", oldQrIdx);

if (line640Idx !== -1 && oldQrIdx !== -1) {
  // Remove old QR block (lines oldQrIdx-1 down to lines end of QR block)
  let oldQrEndIdx = lines.findIndex((l, idx) => idx > oldQrIdx && idx < oldQrIdx + 80 && l.trim() === ")}");
  if (oldQrEndIdx !== -1) {
    lines.splice(oldQrIdx - 1, oldQrEndIdx - oldQrIdx + 2);
  }

  // Define new QR branch
  const qrBranch = [
    "          ) : activeTab === 'QR_TABLES' ? (",
    '            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">',
    '              <div className="p-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row gap-3 justify-between shrink-0">',
    '                <div className="flex items-center gap-2">',
    '                  <QrCode className="w-5 h-5 text-orange-500" />',
    '                  <h2 className="font-bold text-gray-900">QR Table Orders</h2>',
    '                  {pendingQrOrdersCount > 0 && (',
    '                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">{pendingQrOrdersCount} active</span>',
    '                  )}',
    '                </div>',
    '                <div className="flex items-center gap-2">',
    '                  <div className="relative flex-1 sm:w-64">',
    '                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />',
    '                    <Input placeholder="Search table name..." value={qrTableSearch} onChange={(e) => setQrTableSearch(e.target.value)} className="pl-9 h-9 bg-white" />',
    '                  </div>',
    '                  <Button variant="outline" size="sm" onClick={() => fetchQrTableOrders(true)} className="gap-1 shrink-0"><RefreshCw className="w-4 h-4" /></Button>',
    '                </div>',
    '              </div>',
    '              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F8F7]">',
    '                {filteredQrOrders.length === 0 ? (',
    '                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">',
    '                    <QrCode className="w-12 h-12 mb-3 text-gray-300" />',
    '                    <p className="font-medium text-gray-600">No active QR table orders</p>',
    '                    <p className="text-xs text-gray-400 mt-1">Orders from customer QR scans will appear here.</p>',
    '                  </div>',
    '                ) : (',
    '                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">',
    '                    {filteredQrOrders.map(order => {',
    '                      const isSelected = selectedQrOrder?._id === order._id;',
    '                      const tableName = order.tableId?.name || (order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : "Unknown Table");',
    '                      return (',
    '                        <Card key={order._id} onClick={() => setSelectedQrOrder(order)}',
    '                          className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30" : "border-orange-200 bg-white"}`}>',
    '                          <CardContent className="p-4">',
    '                            <div className="flex justify-between items-start mb-2">',
    '                              <div>',
    '                                <span className="font-bold text-base text-gray-900">{tableName}</span>',
    '                                <p className="text-xs text-gray-500">{order.orderNumber} • {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>',
    '                              </div>',
    '                              <div className="flex flex-col gap-1 items-end">',
    '                                <Badge className="text-[10px] uppercase font-bold bg-orange-100 text-orange-700 hover:bg-orange-100">{order.orderStatus}</Badge>',
    '                                <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-semibold">?? QR</span>',
    '                              </div>',
    '                            </div>',
    '                            <div className="text-xs text-gray-500 my-2">{order.items?.length || 0} item(s) • Total: <span className="font-bold text-gray-900 text-sm">?{Number(order.total).toFixed(2)}</span></div>',
    '                            <ul className="text-xs text-gray-600 space-y-0.5 mb-3">',
    '                              {(order.items || []).slice(0, 3).map((item: any, i: number) => (',
    '                                <li key={i} className="flex justify-between">',
    '                                  <span className="truncate pr-2">{item.quantity}x {item.dishName}</span>',
    '                                  <span className="font-medium">?{item.lineTotal}</span>',
    '                                </li>',
    '                              ))}',
    '                              {(order.items || []).length > 3 && <li className="text-gray-400">+{order.items.length - 3} more items</li>}',
    '                            </ul>',
    '                            <Button size="sm" variant={isSelected ? "default" : "outline"}',
    '                              className="w-full text-xs h-8 border-orange-300 text-orange-700 hover:bg-orange-50"',
    '                              onClick={(e) => { e.stopPropagation(); setSelectedQrOrder(order); }}>',
    '                              {isSelected ? "Selected" : "Settle Bill"}',
    '                            </Button>',
    '                          </CardContent>',
    '                        </Card>',
    '                      );',
    '                    })}',
    '                  </div>',
    '                )}',
    '              </div>',
    '            </div>',
    '          ) : ('
  ];

  lines.splice(line640Idx, 1, ...qrBranch);
  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Panels structured cleanly!");
}
