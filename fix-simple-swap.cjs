const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

// 1. Line 640 change `) : (` to `) : activeTab === 'QR_TABLES' ? (`
let l640 = lines.findIndex((l, i) => i > 620 && i < 650 && l.trim() === ") : (");
if (l640 !== -1) {
  lines[l640] = "          ) : activeTab === 'QR_TABLES' ? (";
}

// 2. Line 756 change `)}` to `) : (`
let l756 = lines.findIndex((l, i) => i > 740 && i < 770 && l.trim() === ")}");
if (l756 !== -1) {
  lines[l756] = "          ) : (";
}

// 3. Remove `{activeTab === 'QR_TABLES' && (` at line 759
let l759 = lines.findIndex((l, i) => i > 750 && i < 780 && l.includes("activeTab === 'QR_TABLES' &&"));
if (l759 !== -1) {
  lines.splice(l759, 1);
}

fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
console.log("3-step ternary swap successful!");
