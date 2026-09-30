import { Preferences } from "@capacitor/preferences"
import type { IMedicionOffline } from "@/modules/mediciones/types"
import type { IClienteCache } from "@/modules/mediciones/lib/offline-storage"

const DB_NAME = "erp_rr_mediciones_mobile"
const DB_VERSION = 1
const STORE_MEDICIONES = "mediciones"
const STORE_CLIENTES = "clientes"

export interface MobileConfig {
  erpUrl: string
  apiKey: string
  ultimoSync: string | null
}

const DEFAULT_CONFIG: MobileConfig = {
  erpUrl: "https://erp-rr.vercel.app",
  apiKey: "",
  ultimoSync: null,
}

// ─── Inicialización de Base de Datos Local IndexedDB ─────────────────────────

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB no está disponible en este dispositivo"))
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_MEDICIONES)) {
        const storeMed = db.createObjectStore(STORE_MEDICIONES, {
          keyPath: "idLocal",
        })
        storeMed.createIndex("sincronizado", "sincronizado", { unique: false })
        storeMed.createIndex("guardadoEn", "guardadoEn", { unique: false })
      }

      if (!db.objectStoreNames.contains(STORE_CLIENTES)) {
        const storeCli = db.createObjectStore(STORE_CLIENTES, { keyPath: "id" })
        storeCli.createIndex("nombre", "nombre", { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ─── Mediciones Locales ───────────────────────────────────────────────────────

export async function obtenerMedicionesLocales(): Promise<IMedicionOffline[]> {
  try {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEDICIONES, "readonly")
      const store = tx.objectStore(STORE_MEDICIONES)
      const request = store.getAll()

      request.onsuccess = () => {
        const items: IMedicionOffline[] = request.result || []
        items.sort(
          (a, b) =>
            new Date(b.guardadoEn).getTime() - new Date(a.guardadoEn).getTime()
        )
        resolve(items)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error("Error al obtener mediciones locales:", err)
    return []
  }
}

export async function obtenerMedicionLocalPorId(
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

export async function guardarMedicionLocal(
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

export async function eliminarMedicionLocal(idLocal: string): Promise<void> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDICIONES, "readwrite")
    const store = tx.objectStore(STORE_MEDICIONES)
    const request = store.delete(idLocal)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function marcarMedicionSincronizadaLocal(
  idLocal: string,
  idServidor: string
): Promise<void> {
  const med = await obtenerMedicionLocalPorId(idLocal)
  if (!med) return
  med.sincronizado = true
  med.idServidor = idServidor
  await guardarMedicionLocal(med)
}

// ─── Clientes Cacheados ──────────────────────────────────────────────────────

export async function obtenerClientesLocales(): Promise<IClienteCache[]> {
  try {
    const db = await abrirDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CLIENTES, "readonly")
      const store = tx.objectStore(STORE_CLIENTES)
      const request = store.getAll()

      request.onsuccess = () => {
        const items: IClienteCache[] = request.result || []
        items.sort((a, b) => a.nombre.localeCompare(b.nombre))
        resolve(items)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error("Error al obtener clientes locales:", err)
    return []
  }
}

export async function guardarClientesLocales(
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

export async function agregarClienteExpressLocal(
  cliente: IClienteCache
): Promise<void> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CLIENTES, "readwrite")
    const store = tx.objectStore(STORE_CLIENTES)
    const request = store.put(cliente)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ─── Configuración de la App (Capacitor Preferences) ──────────────────────────

export async function obtenerConfiguracion(): Promise<MobileConfig> {
  try {
    const { value: erpUrl } = await Preferences.get({ key: "erp_url" })
    const { value: apiKey } = await Preferences.get({ key: "api_key" })
    const { value: ultimoSync } = await Preferences.get({ key: "ultimo_sync" })

    return {
      erpUrl: erpUrl || DEFAULT_CONFIG.erpUrl,
      apiKey: apiKey || DEFAULT_CONFIG.apiKey,
      ultimoSync: ultimoSync || null,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

export async function guardarConfiguracion(
  config: Partial<MobileConfig>
): Promise<void> {
  if (config.erpUrl !== undefined) {
    await Preferences.set({ key: "erp_url", value: config.erpUrl.trim() })
  }
  if (config.apiKey !== undefined) {
    await Preferences.set({ key: "api_key", value: config.apiKey.trim() })
  }
  if (config.ultimoSync !== undefined) {
    await Preferences.set({
      key: "ultimo_sync",
      value: config.ultimoSync || "",
    })
  }
}
