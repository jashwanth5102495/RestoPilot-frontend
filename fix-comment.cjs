const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

let idx = lines.findIndex(l => l.includes("QR Tables Tab Content"));
if (idx !== -1) {
  lines.splice(idx, 1);
  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Removed comment line!");
}
