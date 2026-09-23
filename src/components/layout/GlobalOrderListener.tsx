import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { getApiBaseUrl } from '@/lib/api'

export default function GlobalOrderListener() {
  const { toast } = useToast()
  const navigate = useNavigate()
  // Store the time we started listening
  const lastCheckRef = useRef(new Date().toISOString())
  const billRequestsRef = useRef<Set<string>>(new Set())

  const showBillRequest = (order: any) => {
    const tableName = order.tableId?.name || `Table ${order.tableId?.tableNumber || ''}`.trim()
    toast({
      title: 'Bill request received',
      description: `${tableName} requested a final bill (${order.billRequestedPaymentMethod || 'payment mode selected'}).`,
      duration: 15000,
      className: 'bg-emerald-600 border-emerald-700 text-white shadow-lg',
      action: (
        <ToastAction altText="Open tables" onClick={() => navigate('/tables')}>
          Open Tables
        </ToastAction>
      ),
    })
  }

  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (!token) return

    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')
    if (!user || !['OWNER', 'MANAGER'].includes(user.role)) return

    const checkBillRequests = async () => {
      try {
        const res = await api.get('/orders')
        const pendingOrders = (res.data?.data || []).filter((order: any) => order.billRequestStatus === 'REQUESTED')

        for (const order of pendingOrders) {
          if (!billRequestsRef.current.has(order._id)) {
            billRequestsRef.current.add(order._id)
            showBillRequest(order)
          }
        }

        const pendingIds = new Set(pendingOrders.map((order: any) => order._id))
        billRequestsRef.current.forEach(orderId => {
          if (!pendingIds.has(orderId)) billRequestsRef.current.delete(orderId)
        })
      } catch (err) {
        // The polling fallback is intentionally silent when the owner session is unavailable.
      }
    }

    checkBillRequests()
    const billInterval = setInterval(checkBillRequests, 10000)

    const socket = io(getApiBaseUrl().replace('/api/v1', ''), {
      auth: { token },
    })
    socket.on('bill_requested', (data: any) => {
      const order = data?.order
      if (!order || billRequestsRef.current.has(order._id)) return
      billRequestsRef.current.add(order._id)
      showBillRequest(order)
    })

    // Poll every 15 seconds
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/orders?source=ONLINE&since=` + encodeURIComponent(lastCheckRef.current))
        const newOrders = res.data?.data || []
        
        if (newOrders.length > 0) {
          // Update last check time
          lastCheckRef.current = new Date().toISOString()

          toast({
            title: "New Online Order!",
            description: `You have ${newOrders.length} new online order(s).`,
            duration: 10000,
            className: "bg-white border-orange-200 shadow-lg",
          })

          // Dispatch custom event to let Topbar or OnlineOrders tab know
          window.dispatchEvent(new CustomEvent('new-online-order'))
        }
      } catch (err) {
        // Ignore 401s or polling errors silently to not spam console
      }
    }, 15000)

    return () => {
      clearInterval(interval)
      clearInterval(billInterval)
      socket.disconnect()
    }
  }, [navigate, toast])

  return null
}
