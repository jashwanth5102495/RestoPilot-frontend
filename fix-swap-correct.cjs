const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

let l640 = lines.findIndex((l, i) => i > 620 && i < 650 && l.trim() === ") : (");
let l759 = lines.findIndex((l, i) => i > 740 && i < 780 && l.includes("activeTab === 'QR_TABLES' &&"));
let rightSideIdx = lines.findIndex(l => l.includes("Right side: Cart / Table"));

// l827 is the line right before rightSideIdx
let l827 = rightSideIdx - 1;
while (l827 > l759 && lines[l827].trim() !== ")}") {
  l827--;
}

console.log("l640:", l640, "l759:", l759, "l827:", l827, "rightSideIdx:", rightSideIdx);

if (l640 !== -1 && l759 !== -1 && l827 !== -1) {
  const onlineBlock = lines.slice(l640 + 1, l759 - 1);
  const qrInnerBlock = lines.slice(l759 + 1, l827);

  const newTernaryContent = [
    "          ) : activeTab === 'QR_TABLES' ? (",
    ...qrInnerBlock,
    "          ) : (",
    ...onlineBlock,
    "          )}"
  ];

  lines.splice(l640, rightSideIdx - l640, ...newTernaryContent, "");
  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Correct swap executed!");
}
