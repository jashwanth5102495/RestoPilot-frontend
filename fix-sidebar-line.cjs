const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

// Find line 377 index (</aside>)
let asideIdx = lines.findIndex((l, idx) => idx > 350 && l.trim() === "</aside>");
console.log("asideIdx:", asideIdx);

if (asideIdx !== -1) {
  const qrSidebarBtn = [
    "",
    "        <button",
    "          onClick={() => { setActiveTab('QR_TABLES'); fetchQrTableOrders(true); }}",
    "          className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${",
    "            activeTab === 'QR_TABLES' ",
    "              ? 'bg-primary/10 text-primary scale-110' ",
    "              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'",
    "          }`}",
    '          title="QR Orders"',
    "        >",
    '          <QrCode className="w-6 h-6" />',
    '          <span className="text-[10px] font-bold">QR Orders</span>',
    "          {pendingQrOrdersCount > 0 && (",
    '            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">',
    "              {pendingQrOrdersCount}",
    "            </span>",
    "          )}",
    "        </button>"
  ];
  lines.splice(asideIdx, 0, ...qrSidebarBtn);
}

// Find mobile header container index
let mobileHeaderEndIdx = lines.findIndex((l, idx) => idx > 380 && l.includes("Online Orders Management") || l.includes("Point of Sale"));
let mobileHeaderDivIdx = lines.findIndex((l, idx) => idx > 390 && idx < 440 && l.trim() === "</button>" && lines[idx+1] && lines[idx+1].trim() === "</div>");
console.log("mobileHeaderDivIdx:", mobileHeaderDivIdx);

if (mobileHeaderDivIdx !== -1) {
  const qrMobileBtn = [
    "            <button ",
    "              onClick={() => { setActiveTab('QR_TABLES'); fetchQrTableOrders(true); }}",
    "              className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'QR_TABLES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}",
    "            >",
    "              QR Orders",
    "              {pendingQrOrdersCount > 0 && (",
    '                <span className="inline-block ml-1 px-1 bg-orange-500 text-white rounded-full text-[9px]">',
    "                  {pendingQrOrdersCount}",
    "                </span>",
    "              )}",
    "            </button>"
  ];
  lines.splice(mobileHeaderDivIdx + 1, 0, ...qrMobileBtn);
}

// Save back
fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
console.log("Insertion complete!");
