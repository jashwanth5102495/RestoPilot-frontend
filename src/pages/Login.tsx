import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Utensils, BarChart3, Receipt, Package, Truck, Store } from 'lucide-react'
import { api } from '@/lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [_error, setError] = useState('')
  const [_loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('accessToken', response.data.data.accessToken)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login')
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

      {/* Right Section - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white relative">
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="lg:hidden w-[calc(100%+4rem)] -mx-8 -mt-8 mb-8 bg-[url('/b.webp')] bg-cover bg-center text-white p-8 pb-12 rounded-b-[40px] shadow-sm relative">
            <div className="absolute inset-0 bg-black/50 rounded-b-[40px]"></div>
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

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome <span className="text-primary">Back!</span></h2>
            <p className="text-gray-500">Enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot Password?</a>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
              <Label htmlFor="remember" className="font-normal cursor-pointer text-gray-600">Remember me</Label>
            </div>

            {_error && <div className="text-red-500 text-sm">{_error}</div>}
            <Button type="submit" disabled={_loading} className="w-full h-12 text-base font-medium">
              {_loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-500">
              Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register your restaurant</Link>
            </p>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-400">OR</span>
              </div>
            </div>

            <Link to="/register" className="block">
              <Button variant="outline" className="w-full h-12 text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-50">
                <Store className="w-5 h-5 mr-2" />
                Create New Restaurant
              </Button>
            </Link>
            
            <div className="pt-4">
               <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center justify-center mx-auto gap-1">
                  Skip for testing <span aria-hidden="true">&rarr;</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
