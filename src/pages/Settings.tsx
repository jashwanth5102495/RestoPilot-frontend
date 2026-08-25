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

  // Staff States
  const [staffList, setStaffList] = useState<any[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [staffForm, setStaffForm] = useState({ name: '', role: 'WAITER', loginId: '', password: '' })

  // Table States
  const [tables, setTables] = useState<any[]>([])
  const [tableCount, setTableCount] = useState<number>(0)
  const [tableLoading, setTableLoading] = useState(false)
  const [editingTable, setEditingTable] = useState<any>(null)
  const [editingTableName, setEditingTableName] = useState("")

  const fetchTables = async () => {
    setTableLoading(true)
    try {
      const res = await api.get('/tables')
      setTables(res.data.data)
      setTableCount(res.data.data.length)
    } catch (error) {
      console.error('Failed to fetch tables:', error)
    } finally {
      setTableLoading(false)
    }
  }

  const fetchStaff = async () => {
    setStaffLoading(true)
    try {
      const res = await api.get('/staff')
      setStaffList(res.data.data)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    } finally {
      setStaffLoading(false)
    }
  }

  const handleSaveStaff = async () => {
    try {
      if (editingStaff) {
        await api.patch(`/staff/${editingStaff._id}`, { name: staffForm.name, role: staffForm.role })
        toast({ title: 'Staff updated successfully' })
      } else {
        await api.post('/staff', staffForm)
        toast({ title: 'Staff created successfully' })
      }
      setShowStaffModal(false)
      setEditingStaff(null)
      setStaffForm({ name: '', role: 'WAITER', loginId: '', password: '' })
      fetchStaff()
    } catch (err: any) {
      toast({ title: 'Error saving staff', description: err.response?.data?.message, variant: 'destructive' })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/staff/${id}`, { status })
      toast({ title: `Staff status updated to ${status}` })
      fetchStaff()
    } catch (err: any) {
      toast({ title: 'Error updating status', variant: 'destructive' })
    }
  }

  const handleResetPin = async (id: string) => {
    const pin = prompt('Enter new PIN for this staff member:')
    if (!pin) return
    try {
      await api.patch(`/staff/${id}/reset-pin`, { pin })
      toast({ title: 'PIN reset successfully' })
    } catch (err: any) {
      toast({ title: 'Error resetting PIN', variant: 'destructive' })
    }
  }

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
    fetchStaff()
    fetchTables()
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

  const handleUpdateTableCount = async () => {
    try {
      await api.patch('/tables/count', { count: tableCount })
      toast({ title: 'Table count updated successfully' })
      fetchTables()
    } catch (err: any) {
      toast({ title: 'Error updating tables', description: err.response?.data?.message, variant: 'destructive' })
    }
  }

  const handleRenameTable = async (id: string) => {
    if (!editingTableName.trim()) return;
    try {
      await api.patch(`/tables/${id}`, { name: editingTableName })
      toast({ title: 'Table renamed successfully' })
      setEditingTable(null)
      fetchTables()
    } catch (err: any) {
      toast({ title: 'Error renaming table', description: err.response?.data?.message, variant: 'destructive' })
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
            <TabsTrigger value="tables">Tables</TabsTrigger>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage staff access and roles.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/waiter/login');
                    toast({ title: 'Staff Portal link copied to clipboard' });
                  }}>Copy Staff Portal Link</Button>
                  <Button onClick={() => setShowStaffModal(true)}>Add Staff</Button>
                </div>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
                ) : (
                  <div className="space-y-4">
                    {staffList.map((staff: any) => (
                      <div key={staff._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-sm text-gray-500">
                            Role: {staff.role} | Login ID: {staff.loginId || 'N/A'} | Status: {staff.status}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingStaff(staff)
                            setShowStaffModal(true)
                          }}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(staff._id, staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>
                            {staff.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleResetPin(staff._id)}>Reset PIN</Button>
                        </div>
                      </div>
                    ))}
                    {staffList.length === 0 && <div className="text-center text-gray-500 py-4">No staff members found.</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables">
            <Card>
              <CardHeader>
                <CardTitle>Table Configuration</CardTitle>
                <CardDescription>Manage your restaurant tables and layout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-end gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tableCount">Number of Tables</Label>
                    <Input 
                      id="tableCount" 
                      type="number" 
                      min="0"
                      value={tableCount}
                      onChange={(e: any) => setTableCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Button onClick={handleUpdateTableCount}>Update Count</Button>
                </div>
                
                {tableLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                    {tables.map((table: any) => (
                      <div key={table._id} className="border p-4 rounded-lg flex flex-col items-center justify-center space-y-2 relative">
                        {editingTable === table._id ? (
                          <div className="flex flex-col gap-2 w-full">
                            <Input 
                              value={editingTableName} 
                              onChange={(e) => setEditingTableName(e.target.value)} 
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleRenameTable(table._id)} className="w-full">Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingTable(null)} className="w-full">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="text-xl font-bold">{table.name || `Table ${table.tableNumber}`}</span>
                            <span className="text-xs text-gray-500">#{table.tableNumber}</span>
                            <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-6 px-2 text-xs" onClick={() => {
                              setEditingTable(table._id)
                              setEditingTableName(table.name || `Table ${table.tableNumber}`)
                            }}>Edit</Button>
                          </>
                        )}
                      </div>
                    ))}
                    {tables.length === 0 && <div className="col-span-full text-center text-gray-500 py-4">No tables configured. Update the count above to create tables.</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>{editingStaff ? 'Edit Staff' : 'Add Staff'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select 
                  className="w-full border rounded-md p-2" 
                  value={staffForm.role} 
                  onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                >
                  <option value="WAITER">Waiter</option>
                  <option value="KITCHEN">Kitchen</option>
                  <option value="BILLING">Billing</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Login ID</Label>
                <Input disabled={!!editingStaff} value={staffForm.loginId} onChange={e => setStaffForm({...staffForm, loginId: e.target.value})} placeholder="e.g. ravi01" />
              </div>
              {!editingStaff && (
                <div className="space-y-2">
                  <Label>PIN / Password</Label>
                  <Input type="password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} />
                </div>
              )}
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => {
                  setShowStaffModal(false)
                  setEditingStaff(null)
                }}>Cancel</Button>
                <Button onClick={handleSaveStaff}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
