import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'

export function NetworkStatusNotifier() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [showRestored, setShowRestored] = useState<boolean>(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowRestored(true)
      const timer = setTimeout(() => setShowRestored(false), 4000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowRestored(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !showRestored) return null

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] transition-all animate-in slide-in-from-top duration-300 pointer-events-none">
      {!isOnline ? (
        <div className="bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-amber-400">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>Weak Connection / Offline — Retrying in Background...</span>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        </div>
      ) : showRestored ? (
        <div className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-emerald-500">
          <Wifi className="w-4 h-4" />
          <span>Connection Restored — Live Sync Active</span>
        </div>
      ) : null}
    </div>
  )
}
