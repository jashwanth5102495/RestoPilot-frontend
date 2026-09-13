const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

let idx = lines.findIndex(l => l.trim() === ") : (");
if (idx !== -1) {
  lines.splice(idx, 1); // remove misplaced `) : (`
  let endOnlineIdx = lines.findIndex((l, i) => i > 740 && i < 765 && l.trim() === ")}");
  if (endOnlineIdx !== -1) {
    lines[endOnlineIdx] = "          ) : ("; // put `) : (` at the end of Online block
  }
  fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
  console.log("Fixed misplacement!");
}
