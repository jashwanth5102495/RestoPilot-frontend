const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

let headerIdx = lines.findIndex(l => l.includes('<header className="bg-white border-b px-6 py-4 items-center justify-between hidden sm:flex shrink-0">'));
console.log("headerIdx:", headerIdx);

if (headerIdx !== -1) {
  let endHeaderIdx = lines.findIndex((l, idx) => idx > headerIdx && l.trim() === "</header>");
  console.log("endHeaderIdx:", endHeaderIdx);

  const newHeaderLines = [
    '        <header className="bg-white border-b px-6 py-4 items-center justify-between hidden sm:flex shrink-0">',
    "          <div>",
    '            <h1 className="text-xl font-bold text-gray-900">{restaurantData?.name}</h1>',
    '            <p className="text-sm text-gray-500">',
    "              {activeTab === 'FAST_BILLING' ",
    "                ? 'Point of Sale (Fast Billing)' ",
    "                : activeTab === 'TABLES' ",
    "                  ? 'Table Bills Management' ",
    "                  : activeTab === 'QR_TABLES'",
    "                    ? 'Customer QR Orders Management'",
    "                    : 'Online Orders Management'}",
    "            </p>",
    "          </div>",
    '          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">',
    "            <button ",
    "              onClick={() => setActiveTab('FAST_BILLING')}",
    "              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'FAST_BILLING' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}",
    "            >",
    "              POS",
    "            </button>",
    "            <button ",
    "              onClick={() => { setActiveTab('TABLES'); refreshTables(); }}",
    "              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'TABLES' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}",
    "            >",
    "              Tables",
    "            </button>",
    "            <button ",
    "              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}",
    "              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}",
    "            >",
    "              Online",
    "              {pendingOnlineOrdersCount > 0 && (",
    '                <span className="inline-block ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-[10px]">',
    "                  {pendingOnlineOrdersCount}",
    "                </span>",
    "              )}",
    "            </button>",
    "            <button ",
    "              onClick={() => { setActiveTab('QR_TABLES'); fetchQrTableOrders(true); }}",
    "              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'QR_TABLES' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}",
    "            >",
    "              QR Orders",
    "              {pendingQrOrdersCount > 0 && (",
    '                <span className="inline-block ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-[10px]">',
    "                  {pendingQrOrdersCount}",
    "                </span>",
    "              )}",
    "            </button>",
    "          </div>",
    "        </header>"
  ];

  lines.splice(headerIdx, endHeaderIdx - headerIdx + 1, ...newHeaderLines);
  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Desktop header updated!");
}
