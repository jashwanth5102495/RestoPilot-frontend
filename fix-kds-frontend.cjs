const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicKds.tsx", "utf8");

const oldKdsCardHeader = `          {orders.map(order => {
            const isOnline = order.orderSource === 'ONLINE';
            const isTableQr = order.orderSource === 'TABLE_QR';
            const tableInfo = order.tableId
              ? (order.tableId.name || \`Table \${order.tableId.tableNumber}\`)
              : null;
            return (
            <Card key={order._id} className={order.orderStatus === 'PREPARING' ? 'border-orange-500 shadow-md ring-1 ring-orange-500' : 'border-gray-200 shadow-sm'}>
              <CardHeader className="flex flex-row items-center justify-between bg-white border-b px-4 py-3">
                <div>
                  <CardTitle className="text-base font-bold text-gray-800">
                    {tableInfo ? tableInfo : \`Order #\${order.orderNumber}\`}
                  </CardTitle>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {isOnline && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                        ONLINE ORDER
                      </span>
                    )}
                    {isTableQr && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                        ?? QR ORDER
                      </span>
                    )}
                  </div>
                </div>`;

const newKdsCardHeader = `          {orders.map(order => {
            const isOnline = order.orderSource === 'ONLINE';
            const isTableQr = order.orderSource === 'TABLE_QR' || Boolean(order.tableId);
            const tableName = order.tableId
              ? (order.tableId.name || (order.tableId.tableNumber ? \`Table \${order.tableId.tableNumber}\` : 'Table Order'))
              : null;
            return (
            <Card key={order._id} className={order.orderStatus === 'PREPARING' ? 'border-orange-500 shadow-md ring-1 ring-orange-500' : 'border-gray-200 shadow-sm'}>
              <CardHeader className="flex flex-row items-center justify-between bg-white border-b px-4 py-3">
                <div>
                  <CardTitle className="text-base font-bold text-gray-800">
                    {tableName ? tableName : \`Order #\${order.orderNumber}\`}
                  </CardTitle>
                  {tableName && (
                    <p className="text-xs text-gray-500 font-medium">Order #{order.orderNumber}</p>
                  )}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {isOnline && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                        ONLINE ORDER
                      </span>
                    )}
                    {isTableQr && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                        ?? QR TABLE ORDER
                      </span>
                    )}
                  </div>
                </div>`;

content = content.replace(oldKdsCardHeader, newKdsCardHeader);

fs.writeFileSync("src/pages/PublicKds.tsx", content);
console.log("PublicKds.tsx updated successfully!");
