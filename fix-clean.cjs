const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

content = content.replace(
  `          ) : activeTab === 'QR_TABLES' ? (\n          {/* -- QR Tables Tab Content ------------------------------- */}\n          {activeTab === 'QR_TABLES' && (`,
  `          ) : activeTab === 'QR_TABLES' ? (\n          {/* -- QR Tables Tab Content ------------------------------- */}`
);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("Cleaned extra condition!");
