const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

// Find line 640 index (`) : (`)
let l640 = lines.findIndex((l, i) => i > 620 && i < 650 && l.trim() === ") : (");
// Find line 756 index (`) }`)
let l756 = lines.findIndex((l, i) => i > 740 && i < 770 && l.trim() === ")}");
// Find line 759 index (`{activeTab === 'QR_TABLES' && (`)
let l759 = lines.findIndex((l, i) => i > 750 && i < 780 && l.includes("activeTab === 'QR_TABLES' &&"));

console.log("l640:", l640, "l756:", l756, "l759:", l759);

if (l640 !== -1 && l756 !== -1 && l759 !== -1) {
  // Change l640 to `) : activeTab === 'QR_TABLES' ? (`
  // But wait! We want QR Tables panel FIRST!
  // To have QR Tables FIRST, swap the two panel blocks!
  
  // Extract Online block (lines l640+1 to l756-1)
  const onlineBlock = lines.slice(l640 + 1, l756);
  
  // Extract QR block inner (lines l759+1 to 826)
  let l827 = lines.findIndex((l, i) => i > l759 && l.trim() === ")}");
  const qrInnerBlock = lines.slice(l759 + 1, l827);

  // Replace from l640 to l827 with clean structure
  const newTernaryContent = [
    "          ) : activeTab === 'QR_TABLES' ? (",
    ...qrInnerBlock,
    "          ) : (",
    ...onlineBlock,
    "          )}"
  ];

  lines.splice(l640, l827 - l640 + 1, ...newTernaryContent);

  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Panels swapped successfully!");
}
