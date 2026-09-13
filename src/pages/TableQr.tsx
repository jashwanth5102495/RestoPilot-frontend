import { useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, QrCode, Printer, Download, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react"

export default function TableQr() {
  const { toast } = useToast()

  const [tables, setTables] = useState<any[]>([])
  const [tableLoading, setTableLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)

  const [isTableQrEnabled, setIsTableQrEnabled] = useState(false)
  const [tableQrSlug, setTableQrSlug] = useState("")
  const [restaurantName, setRestaurantName] = useState("")

  const canvasRefs = useRef<{ [id: string]: HTMLCanvasElement | null }>({})

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  const getTableQrUrl = (tableId: string) =>
    tableQrSlug ? `${baseUrl}/table/${tableQrSlug}/${tableId}` : ""

  const fetchTables = async () => {
    setTableLoading(true)
    try {
      const res = await api.get("/tables")
      setTables(res.data.data || [])
    } catch (err) {
      console.error("Failed to fetch tables:", err)
    } finally {
      setTableLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get("/auth/me")
      const restaurant = res.data?.data?.user?.restaurant
      if (restaurant) {
        setIsTableQrEnabled(restaurant.isTableQrEnabled || false)
        setTableQrSlug(restaurant.tableQrSlug || "")
        setRestaurantName(restaurant.name || "Restaurant")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
    fetchSettings()
  }, [])

  const handleQrToggle = async (checked: boolean) => {
    try {
      const res = await api.post("/public/settings/table-qr", { enabled: checked })
      setIsTableQrEnabled(res.data.data.isTableQrEnabled)
      setTableQrSlug(res.data.data.tableQrSlug || "")

      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (user.restaurant) {
        user.restaurant.isTableQrEnabled = res.data.data.isTableQrEnabled
        user.restaurant.tableQrSlug = res.data.data.tableQrSlug
        localStorage.setItem("user", JSON.stringify(user))
      }

      toast({
        title: checked ? "Table QR Ordering Enabled" : "Table QR Ordering Disabled",
        description: checked
          ? "Customers can now scan QR codes to order from their table."
          : "QR ordering is now inactive.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update QR settings",
        variant: "destructive",
      })
    }
  }

  const handlePrintSingle = (table: any) => {
    const qrUrl = getTableQrUrl(table._id)
    if (!qrUrl) return
    const canvas = canvasRefs.current[table._id]
    if (!canvas) return

    const dataUrl = canvas.toDataURL("image/png")
    const tableName = table.name || `Table ${table.tableNumber}`
    const win = window.open("", "_blank", "width=400,height=600")
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html><head><title>QR - ${tableName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
.card{width:300px;border:2px solid #e5e7eb;border-radius:16px;padding:28px 20px;text-align:center}
.rest{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px}
.tbl{font-size:26px;font-weight:800;color:#111827;margin-bottom:18px}
.qr{background:#f9fafb;border-radius:12px;padding:14px;display:inline-block;margin-bottom:18px}
.scan{font-size:14px;color:#374151;font-weight:600;margin-bottom:4px}
.sub{font-size:11px;color:#9ca3af}
hr{border:none;border-top:1px solid #e5e7eb;margin:14px 0}
.url{font-size:8px;color:#d1d5db;word-break:break-all}
</style></head>
<body><div class="card">
<p class="rest">${restaurantName}</p>
<h1 class="tbl">${tableName}</h1>
<div class="qr"><img src="${dataUrl}" width="200" height="200" /></div>
<p class="scan">Scan to Order</p>
<p class="sub">Point your phone camera at the QR code to view the menu and place your order.</p>
<hr/><p class="url">${qrUrl}</p>
</div>
<script>window.onload=()=>{window.print();window.close()}</script>
</body></html>`)
    win.document.close()
  }

  const handlePrintAll = () => {
    if (!tableQrSlug) return
    let cards = ""
    tables.forEach((table) => {
      const canvas = canvasRefs.current[table._id]
      if (!canvas) return
      const dataUrl = canvas.toDataURL("image/png")
      const tableName = table.name || `Table ${table.tableNumber}`
      const qrUrl = getTableQrUrl(table._id)
      cards += `<div class="card">
<p class="rest">${restaurantName}</p>
<h1 class="tbl">${tableName}</h1>
<div class="qr"><img src="${dataUrl}" width="180" height="180" /></div>
<p class="scan">Scan to Order</p>
<p class="sub">Point your phone camera at the QR code.</p>
<hr/><p class="url">${qrUrl}</p>
</div>`
    })

    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html><head><title>All QR Codes - ${restaurantName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;background:#fff;padding:20px}
.grid{display:flex;flex-wrap:wrap;gap:20px;justify-content:center}
.card{width:220px;border:2px solid #e5e7eb;border-radius:12px;padding:18px 14px;text-align:center;page-break-inside:avoid}
.rest{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px}
.tbl{font-size:19px;font-weight:800;color:#111827;margin-bottom:12px}
.qr{background:#f9fafb;border-radius:10px;padding:10px;display:inline-block;margin-bottom:10px}
.scan{font-size:11px;color:#374151;font-weight:600;margin-bottom:2px}
.sub{font-size:9px;color:#9ca3af}
hr{border:none;border-top:1px solid #e5e7eb;margin:10px 0}
.url{font-size:7px;color:#d1d5db;word-break:break-all}
@media print{.card{page-break-inside:avoid}}
</style></head>
<body><div class="grid">${cards}</div>
<script>window.onload=()=>{window.print();window.close()}</script>
</body></html>`)
    win.document.close()
  }

  const handleDownload = (table: any) => {
    const canvas = canvasRefs.current[table._id]
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `QR-${table.name || "Table-" + table.tableNumber}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Table QR Ordering</h1>
        <p className="text-gray-500">
          Enable QR-based ordering so customers scan a code at their table and order directly from
          their phone. Orders appear in billing and KDS tagged to the correct table.
        </p>
      </div>

      {/* Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-500" />
                Customer QR Ordering
              </CardTitle>
              <CardDescription>
                When enabled, each table gets a unique QR code customers can scan to place orders.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {isTableQrEnabled ? "Active" : "Disabled"}
              </span>
              {isTableQrEnabled ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isTableQrEnabled}
                  onChange={(e) => handleQrToggle(e.target.checked)}
                  disabled={settingsLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
              </label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* QR Grid */}
      {isTableQrEnabled && tableQrSlug ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Table QR Codes</CardTitle>
                <CardDescription>
                  Print these and place them on tables. Each code links uniquely to that table so
                  orders are tagged correctly in billing and KDS.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={fetchTables}>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                {tables.length > 0 && (
                  <Button
                    size="sm"
                    className="gap-2 bg-orange-500 hover:bg-orange-600"
                    onClick={handlePrintAll}
                  >
                    <Printer className="w-4 h-4" />
                    Print All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tableLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <QrCode className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-700 mb-1">No tables configured yet.</p>
                <p className="text-sm">
                  Go to the <strong>Tables</strong> page to add tables first. Then come back here to
                  generate QR codes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tables.map((table: any) => {
                  const qrUrl = getTableQrUrl(table._id)
                  const tableName = table.name || `Table ${table.tableNumber}`
                  return (
                    <div
                      key={table._id}
                      className="border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                        {restaurantName}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 text-center">{tableName}</h3>

                      {/* Hidden canvas for PNG export */}
                      <div style={{ position: "absolute", left: -9999, top: -9999 }}>
                        <QRCodeCanvas
                          value={qrUrl}
                          size={256}
                          level="H"
                          includeMargin
                          ref={(el: any) => {
                            canvasRefs.current[table._id] = el
                          }}
                        />
                      </div>

                      {/* Visible SVG */}
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <QRCodeSVG value={qrUrl} size={160} level="H" includeMargin />
                      </div>

                      <p className="text-xs text-gray-400 text-center">
                        📱 Scan to order from this table
                      </p>

                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-xs"
                          onClick={() => handleDownload(table)}
                        >
                          <Download className="w-3 h-3" />
                          Save PNG
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 gap-1 text-xs bg-orange-500 hover:bg-orange-600"
                          onClick={() => handlePrintSingle(table)}
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </Button>
                      </div>

                      <p className="text-[9px] text-gray-300 break-all text-center leading-tight">
                        {qrUrl}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : !settingsLoading && !isTableQrEnabled ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <QrCode className="w-16 h-16 text-gray-200" />
          <p className="font-semibold text-gray-600 text-lg">QR Ordering is Disabled</p>
          <p className="text-sm text-gray-400 max-w-sm text-center">
            Enable the toggle above to generate unique QR codes for each of your tables.
          </p>
        </div>
      ) : null}
    </div>
  )
}
