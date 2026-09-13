const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

// Add QR settle button in the payment/settle section
// Find the "handleSettleTable" button and add QR button in the same area
content = content.replace(
  `                  <Button className="w-full font-semibold text-base shadow-md" onClick={handleSettleTable} disabled={!selectedTable || isProcessing}>`,
  `                  {activeTab === 'QR_TABLES' && (
                    <Button
                      className="w-full font-semibold text-base shadow-md bg-orange-500 hover:bg-orange-600"
                      onClick={handleSettleQrOrder}
                      disabled={!selectedQrOrder || isProcessing || selectedQrOrder?.orderStatus === 'COMPLETED'}
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Settle QR Order & Print'}
                    </Button>
                  )}
                  {activeTab !== 'QR_TABLES' && activeTab !== 'ONLINE' && (
                  <Button className="w-full font-semibold text-base shadow-md" onClick={handleSettleTable} disabled={!selectedTable || isProcessing}>`
);

// Close the extra conditional
content = content.replace(
  `                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Bill & Print'}
                    </Button>`,
  `                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Bill & Print'}
                    </Button>
                  )}`
);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("settle button done");
