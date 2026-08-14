import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Setup from './pages/Setup'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDataBackup from './pages/admin/AdminDataBackup'
import AdminDataRequests from './pages/admin/AdminDataRequests'
import AdminLogin from './pages/admin/AdminLogin'
import { Toaster } from './components/ui/toaster'

import Billing from './pages/Billing'
import Orders from './pages/Orders'
import OnlineOrders from './pages/OnlineOrders'
import CustomerOrder from './pages/CustomerOrder'
import Menu from './pages/Menu'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Purchases from './pages/Purchases'
import Suppliers from './pages/Suppliers'
import Recipes from './pages/Recipes'
import Subscription from './pages/Subscription'
import DataArchive from './pages/DataArchive'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup" element={<Setup />} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="backup" element={<AdminDataBackup />} />
          <Route path="requests" element={<AdminDataRequests />} />
        </Route>
        
        <Route path="/order/:slug" element={<CustomerOrder />} />
        
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/online-orders" element={<OnlineOrders />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/archive" element={<DataArchive />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
