const fs = require("fs");
let content = fs.readFileSync("src/pages/CustomerTableOrder.tsx", "utf8");

// Add tableInfo state
content = content.replace(
  "const [restaurant, setRestaurant] = useState<any>(null)",
  "const [restaurant, setRestaurant] = useState<any>(null)\n  const [tableInfo, setTableInfo] = useState<any>(null)"
);

// Populate tableInfo in fetchMenu
content = content.replace(
  "setRestaurant(res.data.data.restaurant)",
  "setRestaurant(res.data.data.restaurant)\n        setTableInfo(res.data.data.table)"
);

// Update success screen
content = content.replace(
  "<p className=\"text-green-700 max-w-md\">Your order has been sent to the kitchen. It will be served at your table shortly.</p>",
  "<p className=\"text-green-700 max-w-md\">Your order for <strong className=\"underline\">{tableInfo ? (tableInfo.name || `Table \${tableInfo.tableNumber}`) : 'your table'}</strong> has been sent to the kitchen. It will be served shortly!</p>"
);

// Update header
const oldHeader = `<div className="bg-slate-900 text-white px-6 py-12 text-center md:text-left shadow-md">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
              <Utensils className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{restaurant?.name}</h1>
              <p className="text-slate-400 mt-1">Order for your table directly to the kitchen</p>
            </div>
          </div>
        </div>`;

const newHeader = `<div className="bg-slate-900 text-white px-6 py-8 text-center md:text-left shadow-md">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <Utensils className="w-8 h-8 text-orange-500" />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{restaurant?.name}</h1>
                {tableInfo && (
                  <span className="bg-orange-500 text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                    {tableInfo.name || \`Table \${tableInfo.tableNumber}\`}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Digital Ordering for <strong className="text-white font-semibold">{tableInfo ? (tableInfo.name || \`Table \${tableInfo.tableNumber}\`) : 'your table'}</strong>
              </p>
            </div>
          </div>
        </div>`;

content = content.replace(oldHeader, newHeader);

// Update submit button
content = content.replace(
  "{isSubmitting ? 'Processing...' : 'Place Order for this Table'}",
  `{isSubmitting ? 'Processing...' : \`Place Order for \${tableInfo ? (tableInfo.name || 'Table ' + tableInfo.tableNumber) : 'this Table'}\`}`
);

fs.writeFileSync("src/pages/CustomerTableOrder.tsx", content);
console.log("CustomerTableOrder updated successfully");
