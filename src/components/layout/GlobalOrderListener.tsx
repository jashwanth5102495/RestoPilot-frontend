import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { BellRing } from 'lucide-react'

export default function GlobalOrderListener() {
  const { toast } = useToast()
  // Store the time we started listening
  const lastCheckRef = useRef(new Date().toISOString())

  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem('accessToken')
    if (!token) return

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

    return () => clearInterval(interval)
  }, [toast])

  return null
}
