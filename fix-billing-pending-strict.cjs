const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

content = content.replace(
  `const pendingCount = orders.filter((o: any) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length`,
  `const pendingCount = orders.filter((o: any) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'DRAFT' && (o.items?.length || 0) > 0).length`
);

content = content.replace(
  `const pendingQrOrdersCount = qrTableOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length`,
  `const pendingQrOrdersCount = qrTableOrders.filter(o => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'DRAFT' && (o.items?.length || 0) > 0).length`
);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("PublicBilling pending count strict filter updated!");
