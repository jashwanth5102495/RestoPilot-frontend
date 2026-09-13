const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

// Remove lines from line 766 (index 766) down to line 825 (index 825)
let startIdx = lines.findIndex((l, idx) => idx > 755 && l.includes("Search table name..."));
let endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes("Right side: Cart / Table"));

console.log("startIdx:", startIdx, "endIdx:", endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx - 1, endIdx - startIdx + 1); // remove orphan block
  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Orphan QR block removed!");
}
