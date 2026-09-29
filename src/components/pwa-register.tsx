"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registrado correctamente:", reg.scope)
          })
          .catch((err) => {
            console.warn("[PWA] Error registrando Service Worker:", err)
          })
      })
    }
  }, [])

  return null
}
