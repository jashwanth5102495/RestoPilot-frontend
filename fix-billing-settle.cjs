const fs = require("fs");
let content = fs.readFileSync("src/pages/PublicBilling.tsx", "utf8");

// Add handleSettleQrOrder after handleSettleOnlineOrder
const settleOnlineFn = `  const handleUpdateOnlineStatus = async (status: string) => {`;
const newSettleQrFn = `  const handleSettleQrOrder = async () => {
    if (!selectedQrOrder) return
    setIsProcessing(true)
    try {
      const res = await axios.post(\`\${API_URL}/public/billing/\${slug}/qr-table-orders/\${selectedQrOrder._id}/settle\`, {
        paymentMethod
      })
      toast({
        title: "QR Table Order Settled",
        description: \`Order from \${selectedQrOrder.tableId?.name || 'table'} completed.\`,
      })
      printReceipt(res.data.data, restaurantData?.name, restaurantData?.address, restaurantData?.phone, restaurantData?.gstNumber)
      setSelectedQrOrder(res.data.data)
      fetchQrTableOrders(true)
    } catch (err: any) {
      toast({
        title: "Failed to settle order",
        description: err.response?.data?.message || 'Error completing order',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateOnlineStatus = async (status: string) => {`;

content = content.replace(settleOnlineFn, newSettleQrFn);

fs.writeFileSync("src/pages/PublicBilling.tsx", content);
console.log("settle done");
