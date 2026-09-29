"use client"

import { useState, useEffect } from "react"

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [hasChecked, setHasChecked] = useState<boolean>(false)

  useEffect(() => {
    // Inicializar con el estado actual del navegador
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine)
      setHasChecked(true)

      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  return { isOnline, hasChecked }
}
