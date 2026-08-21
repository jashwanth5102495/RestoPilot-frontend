import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function Settings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState("")

  // Form states
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [email, setEmail] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [taxRate, setTaxRate] = useState("5")
  const [invoicePrefix, setInvoicePrefix] = useState("RP")

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me')
      const user = res.data.data.user
      const rest = user.restaurant || {}

      setRestaurantId(rest._id || "")
      setName(rest.name || "")
      setPhone(rest.phone || "")
      setAddress(rest.address || "")
      setEmail(rest.email || "")
      setGstNumber(rest.gstNumber || "")
      
      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(user))
    } catch (error) {
      console.error('Failed to fetch restaurant profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    if (!restaurantId) return

    setSaving(true)
    try {
      const res = await api.put(`/restaurants/${restaurantId}`, {
        name,
        phone,
        address,
        email,
        gstNumber
      })

      const updatedRest = res.data.data

      // Retrieve existing user data from localStorage and update its restaurant nested object
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      storedUser.restaurant = updatedRest
      localStorage.setItem('user', JSON.stringify(storedUser))

      toast({
        title: "Settings Saved",
        description: "Restaurant profile has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update restaurant profile details.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your restaurant preferences and configurations.</p>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
          <p>Loading settings...</p>
        </div>
      ) : (
        <Tabs defaultValue="restaurant" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="billing">Billing & Tax</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Profile</CardTitle>
                <CardDescription>Update your basic restaurant information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Restaurant Name</Label>
                    <Input 
                      id="name" 
                      value={name}
                      onChange={(e: any) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={phone}
                      onChange={(e: any) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      value={address}
                      onChange={(e: any) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input 
                      id="gst" 
                      value={gstNumber}
                      onChange={(e: any) => setGstNumber(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Configuration</CardTitle>
                <CardDescription>Set up taxes and invoice formatting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default GST Rate (%)</Label>
                    <Input 
                      id="taxRate" 
                      type="number" 
                      value={taxRate}
                      onChange={(e: any) => setTaxRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input 
                      id="invoicePrefix" 
                      value={invoicePrefix}
                      onChange={(e: any) => setInvoicePrefix(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={() => toast({ title: "Settings Saved", description: "Billing configurations updated successfully." })}>
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage staff access and roles.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  User management will be available in the next update.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
