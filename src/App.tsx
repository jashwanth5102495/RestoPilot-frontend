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
import AdminAgents from './pages/admin/AdminAgents'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminLogin from './pages/admin/AdminLogin'
import { Toaster } from './components/ui/toaster'

import Billing from './pages/Billing'
import Orders from './pages/Orders'
import OnlineOrders from './pages/OnlineOrders'
import CustomerOrder from './pages/CustomerOrder'
import Menu from './pages/Menu'
import Tables from './pages/Tables'
import PublicWaiter from './pages/PublicWaiter'
import PublicBilling from './pages/PublicBilling'
import PublicKds from './pages/PublicKds'
import PublicInventory from './pages/PublicInventory'
import Kitchen from './pages/Kitchen'
import Inventory from './pages/Inventory'
import InventoryCheck from './pages/InventoryCheck'
import InventoryCheckHistory from './pages/InventoryCheckHistory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Purchases from './pages/Purchases'
import Suppliers from './pages/Suppliers'
import Branches from './pages/Branches'
import Recipes from './pages/Recipes'
import Subscription from './pages/Subscription'
import DataArchive from './pages/DataArchive'
import Notifications from './pages/Notifications'


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
          <Route path="agents" element={<AdminAgents />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
        
        <Route path="/order/:slug" element={<CustomerOrder />} />
        <Route path="/waiter-pos/:slug" element={<PublicWaiter />} />
        <Route path="/billing/:slug" element={<PublicBilling />} />
        <Route path="/kds/:slug" element={<PublicKds />} />
        <Route path="/public-inventory/:slug" element={<PublicInventory />} />
        
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/online-orders" element={<OnlineOrders />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/check" element={<InventoryCheck />} />
          <Route path="/inventory/history" element={<InventoryCheckHistory />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/archive" element={<DataArchive />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
