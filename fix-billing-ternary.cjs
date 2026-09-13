const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

// Find line 640 index: `          ) : (`
let line640Idx = lines.findIndex((l, idx) => idx > 620 && idx < 660 && l.trim() === ") : (");
console.log("line640Idx:", line640Idx);

// Find line 756 index: `          )}`
let line756Idx = lines.findIndex((l, idx) => idx > 740 && idx < 780 && l.trim() === ")}");
console.log("line756Idx:", line756Idx);

if (line640Idx !== -1 && line756Idx !== -1) {
  // Extract QR Tables Panel block (lines line759 to end of QR block)
  let qrStartIdx = lines.findIndex((l, idx) => idx >= line756Idx && l.includes("QR Tables Tab Content"));
  let qrEndIdx = lines.findIndex((l, idx) => idx > qrStartIdx && l.trim() === ")}");
  console.log("qrStartIdx:", qrStartIdx, "qrEndIdx:", qrEndIdx);

  if (qrStartIdx !== -1 && qrEndIdx !== -1) {
    const qrBlock = lines.slice(qrStartIdx - 1, qrEndIdx + 1); // include header comment & closing `)}`
    
    // Convert QR block closing `)}` to `) : (`
    qrBlock[qrBlock.length - 1] = "          ) : (";

    // Remove old QR block from after Online block
    lines.splice(qrStartIdx - 1, qrEndIdx - qrStartIdx + 2);

    // Replace `) : (` at line640Idx with `) : activeTab === 'QR_TABLES' ? (` + qrBlock
    lines.splice(line640Idx, 1, "          ) : activeTab === 'QR_TABLES' ? (", ...qrBlock.slice(1));
    
    fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
    console.log("Ternary structure fixed cleanly!");
  }
}
