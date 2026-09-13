const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

// Find where the online settle button section ends and add QR section after it
// The online section ends with: </div> </div> </div> </div> </div> </div> ) }
// We add before the final closing of the right-side panel

// Add QR order items view in the right-panel after the online section ends
const afterOnlineSettle = `                    {selectedOnlineOrder && (
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
}`;

const afterOnlineSettleWithQr = `                    {selectedOnlineOrder && (
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

                {/* QR Tables order details in right panel */}
                {activeTab === 'QR_TABLES' && selectedQrOrder && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-orange-800 flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        {selectedQrOrder.tableId?.name || \`Table \${selectedQrOrder.tableId?.tableNumber}\`}
                      </p>
                      <p className="text-orange-600 text-xs mt-0.5">QR Order • {selectedQrOrder.orderNumber}</p>
                    </div>
                    <ul className="space-y-2">
                      {(selectedQrOrder.items || []).map((item: any, i: number) => (
                        <li key={i} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{item.dishName}</p>
                            <p className="text-xs text-gray-500">?{item.unitPrice} × {item.quantity}</p>
                          </div>
                          <span className="font-semibold text-sm text-gray-900">?{item.lineTotal}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">?{Number(selectedQrOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {activeTab === 'QR_TABLES' && !selectedQrOrder && (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <QrCode className="w-10 h-10 text-gray-200" />
                    <p className="text-sm">Select a QR order to settle</p>
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
}`;

content = content.replace(afterOnlineSettle, afterOnlineSettleWithQr);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("qr panel done");
