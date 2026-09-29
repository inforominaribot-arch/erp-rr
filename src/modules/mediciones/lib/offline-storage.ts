// Módulo: App Medición (PWA)
// Capa de Almacenamiento Local Offline-First con IndexedDB nativo (Zero Dependencias)

import type { IMedicionOffline } from "../types"

const DB_NAME = "erp_rr_mediciones_pwa"
const DB_VERSION = 1
const STORE_MEDICIONES = "mediciones_offline"
const STORE_CLIENTES = "clientes_cache"

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB no está disponible en este entorno"))
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Store para mediciones guardadas offline
      if (!db.objectStoreNames.contains(STORE_MEDICIONES)) {
        const storeMed = db.createObjectStore(STORE_MEDICIONES, {
          keyPath: "idLocal",
        })
        storeMed.createIndex("sincronizado", "sincronizado", { unique: false })
        storeMed.createIndex("clienteId", "clienteId", { unique: false })
        storeMed.createIndex("guardadoEn", "guardadoEn", { unique: false })
      }

      // Store para clientes cacheados (para selector offline)
      if (!db.objectStoreNames.contains(STORE_CLIENTES)) {
        db.createObjectStore(STORE_CLIENTES, { keyPath: "id" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ─── Mediciones Offline ───────────────────────────────────────────────────────

export async function guardarMedicionOffline(
  medicion: IMedicionOffline
): Promise<string> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICIONES, "readwrite")
    const store = tx.objectStore(STORE_MEDICIONES)

    const request = store.put(medicion)

    request.onsuccess = () => resolve(medicion.idLocal)
    request.onerror = () => reject(request.error)
  })
}

export async function obtenerMedicionesOffline(): Promise<IMedicionOffline[]> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICIONES, "readonly")
    const store = tx.objectStore(STORE_MEDICIONES)
    const request = store.getAll()

    request.onsuccess = () => {
      // Ordenar por fecha descendente
      const lista: IMedicionOffline[] = request.result || []
      lista.sort(
        (a, b) =>
          new Date(b.guardadoEn).getTime() - new Date(a.guardadoEn).getTime()
      )
      resolve(lista)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function obtenerMedicionOfflinePorId(
  idLocal: string
): Promise<IMedicionOffline | null> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICIONES, "readonly")
    const store = tx.objectStore(STORE_MEDICIONES)
    const request = store.get(idLocal)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function eliminarMedicionOffline(idLocal: string): Promise<void> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICIONES, "readwrite")
    const store = tx.objectStore(STORE_MEDICIONES)
    const request = store.delete(idLocal)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function marcarMedicionSincronizada(
  idLocal: string,
  idServidor: string
): Promise<void> {
  const medicion = await obtenerMedicionOfflinePorId(idLocal)
  if (!medicion) return

  medicion.sincronizado = true
  medicion.idServidor = idServidor
  await guardarMedicionOffline(medicion)
}

// ─── Caché de Clientes para el Modo Offline ───────────────────────────────────

export interface IClienteCache {
  id: string
  nombre: string
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  localidad?: string | null
  estado?: string
}

export async function guardarClientesCache(
  clientes: IClienteCache[]
): Promise<void> {
  if (!clientes || clientes.length === 0) return
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CLIENTES, "readwrite")
    const store = tx.objectStore(STORE_CLIENTES)

    for (const c of clientes) {
      store.put(c)
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function obtenerClientesCache(): Promise<IClienteCache[]> {
  try {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CLIENTES, "readonly")
      const store = tx.objectStore(STORE_CLIENTES)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch {
    return []
  }
}
