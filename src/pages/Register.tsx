import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Utensils, BarChart3, Receipt, Package, Truck, Store } from 'lucide-react'
import { api } from '@/lib/api'

export default function Register() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    restaurantType: 'casual',
    password: '',
    confirmPassword: ''
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)
    
    try {
      const response = await api.post('/auth/register', formData)
      
      // Auto-login or redirect to setup
      if (response.data?.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.data.accessToken)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        navigate('/setup')
      } else {
        // Fallback for demo purposes
        navigate('/setup')
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.error?.details && Array.isArray(responseData.error.details)) {
        // Zod validation error array
        const errorMessages = responseData.error.details.map((d: any) => d.message).join(', ');
        setError(`Validation failed: ${errorMessages}`);
      } else {
        setError(responseData?.message || 'Failed to register. Please try again later.');
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Section - Branding & Features */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-[url('/b.webp')] bg-cover bg-center relative overflow-hidden">
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary p-2 rounded-lg">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">RestoPilot</h1>
              <p className="text-xs text-orange-100 font-medium">By BluNet IT Services</p>
            </div>
          </div>
          <div className="w-12 h-1 bg-primary rounded-full mt-4 mb-8"></div>

          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Manage your restaurant,<br />
            simplify your <span className="text-primary">success.</span>
          </h2>
          <p className="text-white/80 text-lg max-w-md mb-12 leading-relaxed">
            RestoPilot helps you handle billing, inventory, recipes, purchases, and sales — all in one powerful platform.
          </p>

          <div className="grid grid-cols-2 gap-8 max-w-lg">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 backdrop-blur-sm flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Sales Dashboard</h3>
                <p className="text-sm text-white/70">Track restaurant performance.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 backdrop-blur-sm flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Smart Billing</h3>
                <p className="text-sm text-white/70">Create bills quickly.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Inventory</h3>
                <p className="text-sm text-white/70">Monitor ingredients and stock.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 backdrop-blur-sm flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Purchases</h3>
                <p className="text-sm text-white/70">Track stock purchases.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center mt-12 opacity-30">
            <Store className="w-32 h-32 text-white" />
        </div>
      </div>

      {/* Right Section - Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 lg:p-8 bg-[#F8FAFC] relative">
        <div className="w-full max-w-2xl">
          {/* Mobile Branding Header */}
          <div className="lg:hidden w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-8 bg-[url('/b.webp')] bg-cover bg-center text-white p-8 pb-12 rounded-b-[40px] shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-1">RestoPilot</h1>
              <p className="text-sm font-medium mb-4">By BluNet IT Services</p>
              <p className="text-sm text-orange-100 mb-8">Empowering Restaurant Businesses</p>
              
              <h2 className="text-3xl font-bold leading-tight mb-4">
                Manage your restaurant, <br /> grow your business.
              </h2>
              <p className="text-sm text-orange-100 leading-relaxed">
                The all-in-one platform for restaurants to track inventory, manage recipes, and drive sales effortlessly.
              </p>
            </div>
          </div>

          <div className="space-y-8 pt-4 pb-12">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Register Restaurant
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new restaurant account.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input 
                id="restaurantName" 
                placeholder="Sri Ram Fertilizers" 
                value={formData.restaurantName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input 
                id="ownerName" 
                placeholder="John Doe" 
                value={formData.ownerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel"
                placeholder="+91 9876543210" 
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="john@example.com" 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantType">Restaurant Type</Label>
              <select 
                id="restaurantType"
                value={formData.restaurantType}
                onChange={handleChange}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="casual">Casual Dining</option>
                <option value="fine_dine">Fine Dining</option>
                <option value="fast_food">Fast Food</option>
                <option value="cafe">Cafe</option>
                <option value="cloud_kitchen">Cloud Kitchen</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                placeholder="123 Market Street" 
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={formData.state} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={formData.pincode} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <hr className="my-4 border-gray-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

          </div>

          <div className="pt-2 md:col-span-2 w-full">
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-medium">
              {loading ? 'Processing...' : 'Complete Registration'}
            </Button>
          </div>
          
          <div className="space-y-2 md:col-span-2">
              <hr className="my-4 border-gray-200" />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
            </p>
          </div>
          
          <div className="pt-4 flex justify-center">
             <button type="button" onClick={() => navigate('/setup')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-md px-4 py-2 bg-white">
                Skip for testing
             </button>
          </div>
        </form>
      </div>
      </div>
    </div>
    </div>
  )
}
