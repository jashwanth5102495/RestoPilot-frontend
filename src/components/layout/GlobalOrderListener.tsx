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
  const lastCheckRef = useRef(new Date().toISOString())
  
  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (!token) return

    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')
    if (!user || !['OWNER', 'MANAGER'].includes(user.role)) return

    const socket = io(getApiBaseUrl().replace('/api/v1', ''), {
      auth: { token },
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
      socket.disconnect()
    }
  }, [navigate, toast])

  return null
}
