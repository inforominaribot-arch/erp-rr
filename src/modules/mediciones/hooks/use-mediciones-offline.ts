"use client"

import { useState, useEffect, useCallback } from "react"
import {
  obtenerMedicionesOffline,
  marcarMedicionSincronizada,
  eliminarMedicionOffline,
} from "../lib/offline-storage"
import { sincronizarMedicionOffline } from "../actions"
import { useNetworkStatus } from "./use-network-status"
import type { IMedicionOffline } from "../types"

export function useMedicionesOffline() {
  const { isOnline } = useNetworkStatus()
  const [medicionesOffline, setMedicionesOffline] = useState<IMedicionOffline[]>([])
  const [sincronizando, setSincronizando] = useState(false)
  const [errorSync, setErrorSync] = useState<string | null>(null)
  const [ultimoSync, setUltimoSync] = useState<Date | null>(null)

  const cargarOffline = useCallback(async () => {
    try {
      const lista = await obtenerMedicionesOffline()
      setMedicionesOffline(lista)
    } catch (err) {
      console.warn("No se pudieron cargar mediciones offline:", err)
    }
  }, [])

  useEffect(() => {
    cargarOffline()
  }, [cargarOffline])

  // Mediciones pendientes de sincronizar
  const pendientes = medicionesOffline.filter((m) => !m.sincronizado)

  // Sincronizar todas las pendientes
  const sincronizarPendientes = useCallback(async () => {
    if (!isOnline || sincronizando || pendientes.length === 0) return

    setSincronizando(true)
    setErrorSync(null)

    try {
      for (const med of pendientes) {
        const res = await sincronizarMedicionOffline(med)
        if (res.success) {
          await marcarMedicionSincronizada(med.idLocal, res.data.idServidor)
        } else {
          setErrorSync(res.error || "Error al sincronizar medición")
        }
      }
      setUltimoSync(new Date())
      await cargarOffline()
    } catch {
      setErrorSync("Ocurrió un fallo de conexión durante la sincronización.")
    } finally {
      setSincronizando(false)
    }
  }, [isOnline, sincronizando, pendientes, cargarOffline])

  // Sincronización automática opcional al recuperar conexión
  useEffect(() => {
    if (isOnline && pendientes.length > 0) {
      sincronizarPendientes()
    }
  }, [isOnline, pendientes.length, sincronizarPendientes])

  const descartarMedicionOffline = async (idLocal: string) => {
    await eliminarMedicionOffline(idLocal)
    await cargarOffline()
  }

  return {
    medicionesOffline,
    pendientes,
    cantidadPendientes: pendientes.length,
    sincronizando,
    errorSync,
    ultimoSync,
    sincronizarPendientes,
    recargarOffline: cargarOffline,
    descartarMedicionOffline,
  }
}
