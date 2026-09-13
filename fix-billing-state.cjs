const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

// 1. Add QrCode to lucide imports
content = content.replace(
  "import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Loader2, UtensilsCrossed, RefreshCw, Globe, MapPin, Phone, User, Printer } from \"lucide-react\"",
  "import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag, Loader2, UtensilsCrossed, RefreshCw, Globe, MapPin, Phone, User, Printer, QrCode } from \"lucide-react\""
);

// 2. Extend tab type to include QR_TABLES
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'FAST_BILLING' | 'TABLES' | 'ONLINE'>('FAST_BILLING')",
  "const [activeTab, setActiveTab] = useState<'FAST_BILLING' | 'TABLES' | 'ONLINE' | 'QR_TABLES'>('FAST_BILLING')"
);

// 3. Add QR table orders state after online orders state
content = content.replace(
  "  const [onlineFilter, setOnlineFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')",
  `  const [qrTableOrders, setQrTableOrders] = useState<any[]>([])
  const [qrTableSearch, setQrTableSearch] = useState('')
  const prevQrPendingCountRef = useRef<number>(0)

  const [onlineFilter, setOnlineFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')`
);

// 4. Add fetchQrTableOrders function after fetchOnlineOrders
const fetchQrFn = `
  const fetchQrTableOrders = async (silent = false) => {
    try {
      const res = await axios.get(\`\${API_URL}/public/billing/\${slug}/qr-table-orders\`)
      const orders = res.data.data || []
      setQrTableOrders(orders)

      const pendingCount = orders.filter((o: any) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED').length
      if (!silent && pendingCount > prevQrPendingCountRef.current && prevQrPendingCountRef.current !== 0) {
        toast({
          title: "New QR Table Order!",
          description: "A customer has placed an order from their table.",
        })
      }
      prevQrPendingCountRef.current = pendingCount
    } catch (err) {
      console.error('Failed to fetch QR table orders', err)
    }
  }

`;

content = content.replace(
  "  useEffect(() => {\n    const fetchData = async () => {",
  fetchQrFn + "  useEffect(() => {\n    const fetchData = async () => {"
);

// 5. Fetch QR orders in initial load
content = content.replace(
  "        await fetchOnlineOrders(true)\n      } catch (err: any) {",
  "        await fetchOnlineOrders(true)\n        await fetchQrTableOrders(true)\n      } catch (err: any) {"
);

// 6. Poll QR orders every 10s
content = content.replace(
  "      fetchOnlineOrders(false)\n      if (activeTab === 'TABLES') {\n        refreshTables()\n      }",
  "      fetchOnlineOrders(false)\n      fetchQrTableOrders(false)\n      if (activeTab === 'TABLES') {\n        refreshTables()\n      }"
);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("state done");
