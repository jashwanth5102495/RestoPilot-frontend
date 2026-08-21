import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Trash2, Loader2, Phone, MapPin, Notebook } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Suppliers() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [notes, setNotes] = useState('')

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers')
      setSuppliers(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search) ||
    (s.gstNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setSubmitting(true)
    try {
      await api.post('/suppliers', {
        name,
        phone,
        email,
        address,
        gstNumber,
        notes
      })

      toast({
        title: "Supplier Added",
        description: `Supplier "${name}" has been registered successfully.`
      })

      // Reset form states
      setName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setGstNumber('')
      setNotes('')
      setIsDialogOpen(false)

      fetchSuppliers()
    } catch (error: any) {
      toast({
        title: "Failed to add supplier",
        description: error.response?.data?.message || "Verify the details and try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return

    try {
      await api.delete(`/suppliers/${id}`)
      toast({
        title: "Supplier Deleted",
        description: "Supplier deleted successfully."
      })
      fetchSuppliers()
    } catch (error) {
      console.error(error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete supplier.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Suppliers</h1>
          <p className="text-gray-500">Manage your restaurant suppliers and vendors.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
              <DialogDescription>
                Register a new supplier to link ingredients purchases.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSupplier}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. ABC Foods" 
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="+91 98765 43210" 
                      value={phone}
                      onChange={(e: any) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="supplier@mail.com" 
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    placeholder="Guntur, AP" 
                    value={address}
                    onChange={(e: any) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input 
                    id="gst" 
                    placeholder="37AAAAA0000A1Z5" 
                    value={gstNumber}
                    onChange={(e: any) => setGstNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes / Products supplied</Label>
                  <Input 
                    id="notes" 
                    placeholder="Chicken, Dairy items, etc." 
                    value={notes}
                    onChange={(e: any) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Supplier'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search suppliers..." 
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50 text-gray-500">
              <TableRow>
                <TableHead className="pl-6 py-4">Supplier Name</TableHead>
                <TableHead>Phone / Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Products / Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <p>Loading suppliers...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers.map((s) => (
                <TableRow key={s._id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="pl-6 font-medium text-gray-900">{s.name}</TableCell>
                  <TableCell>
                    <div className="text-gray-900 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {s.phone || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{s.email || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-600"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {s.address || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.gstNumber || 'N/A'}</TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-1"><Notebook className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {s.notes || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSupplier(s._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p>No suppliers found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
