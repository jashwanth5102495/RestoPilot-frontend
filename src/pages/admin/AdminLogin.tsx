import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldAlert, Lock, User } from 'lucide-react'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuth', 'true')
        navigate('/admin')
      } else {
        setError('Invalid admin credentials')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 mb-4">
            <ShieldAlert className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin</h1>
          <p className="text-slate-400 mt-1 text-sm">Enter your credentials to continue</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="text-slate-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e: any) => setUsername(e.target.value)}
                  required
                  className="h-12 pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                  className="h-12 pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-medium bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  )
}
