const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

let idx = lines.findIndex((l, i) => i > 820 && i < 830 && l.trim() === ")}");
if (idx !== -1) {
  lines.splice(idx, 1);
  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Duplicate ) } removed!");
}
