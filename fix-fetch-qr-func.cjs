const fs = require("fs");
let lines = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8").split(/\r?\n/);

let fetchOnlineIdx = lines.findIndex(l => l.includes("const fetchOnlineOrders = async"));
let fetchOnlineEndIdx = lines.findIndex((l, i) => i > fetchOnlineIdx && l.trim() === "}");

console.log("fetchOnlineIdx:", fetchOnlineIdx, "fetchOnlineEndIdx:", fetchOnlineEndIdx);

const fetchQrFunc = [
  "",
  "  const fetchQrTableOrders = async (silent = false) => {",
  "    try {",
  "      const res = await axios.get(`${API_URL}/public/billing/${slug}/qr-table-orders`)",
  "      const orders = res.data.data || []",
  "      setQrTableOrders(orders)",
  "      ",
  "      const pendingCount = orders.filter((o: any) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length",
  "      if (!silent && pendingCount > prevQrPendingCountRef.current && prevQrPendingCountRef.current !== 0) {",
  "        toast({",
  '          title: "New QR Table Order Received!",',
  "          description: `You have incoming QR table order(s). Check the QR Orders tab.`,",
  "        })",
  "      }",
  "      prevQrPendingCountRef.current = pendingCount",
  "    } catch (err) {",
  "      console.error('Failed to fetch QR table orders', err)",
  "    }",
  "  }"
];

lines.splice(fetchOnlineEndIdx + 1, 0, ...fetchQrFunc);

// Find `await fetchOnlineOrders(true)` in useEffect
let onlineCallIdx = lines.findIndex(l => l.includes("await fetchOnlineOrders(true)"));
if (onlineCallIdx !== -1) {
  lines.splice(onlineCallIdx + 1, 0, "        await fetchQrTableOrders(true)");
}

// Find `fetchOnlineOrders(false)` in setInterval
let intervalCallIdx = lines.findIndex(l => l.includes("fetchOnlineOrders(false)"));
if (intervalCallIdx !== -1) {
  lines.splice(intervalCallIdx + 1, 0, "      fetchQrTableOrders(false)");
}

fs.writeFileSync("src/pages/PublicBilling.tsx", lines.join("\n"));
console.log("fetchQrTableOrders function added and wired into useEffect & polling!");
