import { Outlet, useNavigate, NavLink, Navigate } from 'react-router-dom'
import { Store, LogOut, ShieldAlert, Database, FileText, Users, MessageSquare } from 'lucide-react'

export default function AdminLayout() {
  const navigate = useNavigate()
  const isAdminAuth = sessionStorage.getItem('adminAuth') === 'true'

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    navigate('/admin/login')
  }

  if (!isAdminAuth) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-full">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <ShieldAlert className="text-orange-500 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">Super Admin</h1>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <NavLink to="/admin" end className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-slate-800/50 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
            <Store className="w-5 h-5" />
            Restaurants
          </NavLink>
          <NavLink to="/admin/backup" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-slate-800/50 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
            <Database className="w-5 h-5" />
            Data Backup
          </NavLink>
          <NavLink to="/admin/requests" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-slate-800/50 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
            <FileText className="w-5 h-5" />
            Data Requests
          </NavLink>
          <NavLink to="/admin/agents" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-slate-800/50 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
            <Users className="w-5 h-5" />
            Manage Agents
          </NavLink>
          <NavLink to="/admin/notifications" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-slate-800/50 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
            <MessageSquare className="w-5 h-5" />
            WhatsApp Setup
          </NavLink>
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors px-4 py-2 w-full text-left">
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
