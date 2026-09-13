const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

// 1. Sidebar QR Orders button
const oldSidebarEnd = `          {pendingOnlineOrdersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {pendingOnlineOrdersCount}
            </span>
          )}
        </button>
      </aside>`;

const newSidebarEnd = `          {pendingOnlineOrdersCount > 0 && (
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
          title="QR Orders"
        >
          <QrCode className="w-6 h-6" />
          <span className="text-[10px] font-bold">QR Orders</span>
          {pendingQrOrdersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {pendingQrOrdersCount}
            </span>
          )}
        </button>
      </aside>`;

content = content.replace(oldSidebarEnd, newSidebarEnd);

// 2. Mobile header QR Orders button
const oldMobileHeader = `            <button 
              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
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
        </header>`;

const newMobileHeader = `            <button 
              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
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
              QR Orders
              {pendingQrOrdersCount > 0 && (
                <span className="inline-block ml-1 px-1 bg-orange-500 text-white rounded-full text-[9px]">
                  {pendingQrOrdersCount}
                </span>
              )}
            </button>
          </div>
        </header>`;

content = content.replace(oldMobileHeader, newMobileHeader);

// 3. Desktop header top bar tabs
const oldDesktopHeader = `<header className="bg-white border-b px-6 py-4 items-center justify-between hidden sm:flex shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurantData?.name}</h1>
            <p className="text-sm text-gray-500">
              {activeTab === 'FAST_BILLING' 
                ? 'Point of Sale (Fast Billing)' 
                : activeTab === 'TABLES' 
                  ? 'Table Bills Management' 
                  : 'Online Orders Management'}
            </p>
          </div>
        </header>`;

const newDesktopHeader = `<header className="bg-white border-b px-6 py-4 items-center justify-between hidden sm:flex shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurantData?.name}</h1>
            <p className="text-sm text-gray-500">
              {activeTab === 'FAST_BILLING' 
                ? 'Point of Sale (Fast Billing)' 
                : activeTab === 'TABLES' 
                  ? 'Table Bills Management' 
                  : activeTab === 'QR_TABLES'
                    ? 'Customer QR Orders Management'
                    : 'Online Orders Management'}
            </p>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
            <button 
              onClick={() => setActiveTab('FAST_BILLING')}
              className={\`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all \${activeTab === 'FAST_BILLING' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              POS
            </button>
            <button 
              onClick={() => { setActiveTab('TABLES'); refreshTables(); }}
              className={\`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all \${activeTab === 'TABLES' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              Tables
            </button>
            <button 
              onClick={() => { setActiveTab('ONLINE'); fetchOnlineOrders(true); }}
              className={\`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all \${activeTab === 'ONLINE' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              Online
              {pendingOnlineOrdersCount > 0 && (
                <span className="inline-block ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-[10px]">
                  {pendingOnlineOrdersCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('QR_TABLES'); fetchQrTableOrders(true); }}
              className={\`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all \${activeTab === 'QR_TABLES' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              QR Orders
              {pendingQrOrdersCount > 0 && (
                <span className="inline-block ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-[10px]">
                  {pendingQrOrdersCount}
                </span>
              )}
            </button>
          </div>
        </header>`;

content = content.replace(oldDesktopHeader, newDesktopHeader);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("PublicBilling navigation tabs updated successfully!");
