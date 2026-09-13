const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

// 1. Add pendingQrOrdersCount computed var (after pendingOnlineOrdersCount)
content = content.replace(
  "  const pendingOnlineOrdersCount = onlineOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length",
  `  const pendingOnlineOrdersCount = onlineOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length
  const pendingQrOrdersCount = qrTableOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length`
);

// 2. Add QR Tables button in the sidebar (after Online button, before </aside>)
const sidebarOnlineBtn = `        </button>
      </aside>`;
const sidebarWithQr = `        </button>

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
      </aside>`;
content = content.replace(sidebarOnlineBtn, sidebarWithQr);

// 3. Add QR Tables button in mobile header (after Online button in header flex)
const mobileOnlineBtn = `              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
              className={\`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors \${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}\`}`;
const mobileOnlineWithQr = `              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
              className={\`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors \${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}\`}`;

// For mobile header, after the Online button closing </button>, add QR button
content = content.replace(
  `              className={\`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors \${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}\`}`,
  `              className={\`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors \${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}\`}`
);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("tabs done");
