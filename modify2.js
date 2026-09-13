const fs = require('fs');
let content = fs.readFileSync('src/pages/Tables.tsx', 'utf8');

content = content.replace(
  'import { printReceipt } from "@/lib/printReceipt"',
  'import { printReceipt } from "@/lib/printReceipt"\nimport { QRCodeSVG } from "qrcode.react"\nimport { QrCode, Printer } from "lucide-react"'
);

content = content.replace(
  'const [waiterSlug, setWaiterSlug] = useState(\'\')',
  'const [waiterSlug, setWaiterSlug] = useState(\'\')\n  const [isTableQrEnabled, setIsTableQrEnabled] = useState(false)\n  const [tableQrSlug, setTableQrSlug] = useState(\'\')'
);

content = content.replace(
  'setIsWaiterEnabled(restaurant.isWaiterOrderingEnabled || false)',
  'setIsWaiterEnabled(restaurant.isWaiterOrderingEnabled || false)\n        setIsTableQrEnabled(restaurant.isTableQrEnabled || false)'
);

content = content.replace(
  'setWaiterSlug(restaurant.waiterSlug || \'\')',
  'setWaiterSlug(restaurant.waiterSlug || \'\')\n        setTableQrSlug(restaurant.tableQrSlug || \'\')'
);

const handleQrToggle = 
  const handleQrToggle = async (checked: boolean) => {
    try {
      const res = await api.post('/public/settings/table-qr', { enabled: checked })
      setIsTableQrEnabled(res.data.data.isTableQrEnabled)
      setTableQrSlug(res.data.data.tableQrSlug || '')
      
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.restaurant) {
        user.restaurant.isTableQrEnabled = res.data.data.isTableQrEnabled
        user.restaurant.tableQrSlug = res.data.data.tableQrSlug
        localStorage.setItem('user', JSON.stringify(user))
      }

      toast({
        title: checked ? "Table QR Ordering Enabled" : "Table QR Ordering Disabled",
        description: checked ? "Customers can now scan QR codes." : "QR ordering is now inactive.",
      })
    } catch (error: any) {
      console.error(error)
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to update QR settings', 
        variant: 'destructive' 
      })
    }
  }
;

content = content.replace('const copyLink = () => {', handleQrToggle + '\n  const copyLink = () => {');

const qrToggleCard = 
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-500" />
                Customer Table QR Ordering
              </CardTitle>
              <CardDescription>
                Enable customers to scan QR codes placed on tables to order directly from their phone.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{isTableQrEnabled ? 'Active' : 'Disabled'}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isTableQrEnabled} onChange={(e) => handleQrToggle(e.target.checked)} disabled={settingsLoading} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </CardHeader>
      </Card>
;

content = content.replace('<Card>\n        <CardHeader>\n          <div className="flex items-center justify-between">\n            <div>\n              <CardTitle>Table Configuration</CardTitle>', qrToggleCard + '\n      <Card>\n        <CardHeader>\n          <div className="flex items-center justify-between">\n            <div>\n              <CardTitle>Table Configuration</CardTitle>');

fs.writeFileSync('src/pages/Tables.tsx', content);
