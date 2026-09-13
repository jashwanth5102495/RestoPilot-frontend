const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

// Find index of `) : (` at line 640
let line640Idx = lines.findIndex((l, idx) => idx > 620 && idx < 650 && l.trim() === ") : (");

// Find index of `{activeTab === 'QR_TABLES' && (` at line 759
let qrStartIdx = lines.findIndex((l, idx) => idx > 740 && idx < 780 && l.includes("activeTab === 'QR_TABLES' &&"));

// Find end of QR block (`</div>`) at line 826
let qrEndIdx = lines.findIndex((l, idx) => idx > qrStartIdx && idx < qrStartIdx + 75 && l.trim() === "</div>");

console.log("line640Idx:", line640Idx, "qrStartIdx:", qrStartIdx, "qrEndIdx:", qrEndIdx);

if (line640Idx !== -1 && qrStartIdx !== -1 && qrEndIdx !== -1) {
  // Extract QR block lines (without line 759 wrapper and without line 827 closing `)`)
  const qrInnerLines = lines.slice(qrStartIdx + 1, qrEndIdx + 1);

  // Remove the old QR block from after Online block (lines qrStartIdx-1 to qrEndIdx+1)
  lines.splice(qrStartIdx - 1, (qrEndIdx - qrStartIdx + 3));

  // Build new branch to place at line640Idx
  const newQrBranch = [
    "          ) : activeTab === 'QR_TABLES' ? (",
    ...qrInnerLines,
    "          ) : ("
  ];

  lines.splice(line640Idx, 1, ...newQrBranch);

  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Re-ordered panels in activeTab ternary cleanly!");
}
