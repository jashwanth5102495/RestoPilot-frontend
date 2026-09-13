const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

let idx = lines.findIndex(l => l.includes("{activeTab === 'QR_TABLES' && ("));
if (idx !== -1) {
  lines.splice(idx, 1); // remove line 642
  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Line 642 removed!");
}
