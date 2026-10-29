import { Preferences } from "@capacitor/preferences"
import type { IMedicionOffline, ITelaMedicion } from "@/modules/mediciones/types"
import type { ICeldaMosquitero } from "@/modules/mediciones/lib/mosquiteros"
import type { IClienteCache } from "@/modules/mediciones/lib/offline-storage"

const DB_NAME = "erp_rr_mediciones_mobile"
const DB_VERSION = 1
const STORE_MEDICIONES = "mediciones"
const STORE_CLIENTES = "clientes"

export interface MobileConfig {
  erpUrl: string
  apiKey: string
  ultimoSync: string | null
  /** Marca de tiempo del servidor de la última descarga de mediciones */
  ultimaDescarga: string | null
}

const DEFAULT_CONFIG: MobileConfig = {
  erpUrl: "https://erp-rr.vercel.app",
  apiKey: "",
  ultimoSync: null,
  ultimaDescarga: null,
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
  med.errorSync = null
  await guardarMedicionLocal(med)
}

/** Deja la medición pendiente y guarda el motivo por el que el ERP la rechazó. */
export async function marcarErrorSyncLocal(idLocal: string, error: string): Promise<void> {
  const med = await obtenerMedicionLocalPorId(idLocal)
  if (!med) return
  med.errorSync = error
  await guardarMedicionLocal(med)
}

/**
 * Incorpora las mediciones bajadas del ERP.
 * Si la tablet tiene cambios SIN sincronizar en esa medición, se conserva la versión
 * de la tablet (gana la tablet); si no, se reemplaza por la versión del ERP.
 * Devuelve cuántas mediciones se actualizaron o agregaron.
 */
export async function incorporarMedicionesDelServidor(
  delServidor: Array<{
    idServidor: string
    clienteId: string
    clienteNombre: string
    clienteTelefono?: string | null
    clienteDireccion?: string | null
    clienteLocalidad?: string | null
    observaciones?: string | null
    creadoEn: string
    actualizadoEn: string
    bloqueada: boolean
    ambientes: Array<{
      id: string
      nombre: string
      orden: number
      items: Array<{
        id: string
        descripcion: string
        ancho: number
        alto: number
        cantidad: number
        caracteristicas: IMedicionOffline["ambientes"][number]["items"][number]["caracteristicas"]
        observaciones?: string | null
      }>
    }>
  }>
): Promise<number> {
  const locales = await obtenerMedicionesLocales()
  const porIdServidor = new Map(
    locales.filter((m) => m.idServidor).map((m) => [m.idServidor as string, m])
  )

  let cambios = 0
  for (const srv of delServidor) {
    const local = porIdServidor.get(srv.idServidor)
    if (local && !local.sincronizado) continue // cambios pendientes en la tablet: gana la tablet

    const med: IMedicionOffline = {
      idLocal: local?.idLocal || `srv_${srv.idServidor}`,
      idServidor: srv.idServidor,
      clienteId: srv.clienteId,
      clienteNombre: srv.clienteNombre,
      clienteTelefono: srv.clienteTelefono ?? null,
      clienteDireccion: srv.clienteDireccion ?? null,
      clienteLocalidad: srv.clienteLocalidad ?? null,
      observaciones: srv.observaciones ?? null,
      sincronizado: true,
      guardadoEn: local?.guardadoEn || srv.creadoEn,
      actualizadoEnServidor: srv.actualizadoEn,
      bloqueada: srv.bloqueada,
      errorSync: null,
      ambientes: srv.ambientes.map((a) => ({
        id: a.id,
        idLocal: a.id,
        nombre: a.nombre,
        orden: a.orden,
        items: a.items.map((it) => ({
          id: it.id,
          idLocal: it.id,
          descripcion: it.descripcion,
          ancho: it.ancho,
          alto: it.alto,
          cantidad: it.cantidad,
          caracteristicas: it.caracteristicas,
          observaciones: it.observaciones ?? null,
        })),
      })),
    }
    await guardarMedicionLocal(med)
    cambios++
  }
  return cambios
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

/**
 * Guarda los clientes bajados del ERP. No pisa los que tienen cambios de la tablet
 * pendientes de subir. Después refresca los datos del cliente en las mediciones locales.
 */
export async function guardarClientesLocales(
  clientes: IClienteCache[]
): Promise<void> {
  if (!clientes || clientes.length === 0) return
  const pendientes = new Set((await obtenerClientesPendientesSync()).map((c) => c.id))
  const aGuardar = clientes.filter((c) => !pendientes.has(c.id))
  const db = await abrirDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_CLIENTES, "readwrite")
    const store = tx.objectStore(STORE_CLIENTES)

    for (const c of aGuardar) {
      store.put(c)
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  await refrescarClienteEnMediciones(aGuardar)
}

/**
 * Las mediciones guardan una copia del nombre/teléfono/dirección del cliente para mostrarla.
 * La actualiza con los datos vigentes del cliente (editado en la web o en la tablet).
 */
async function refrescarClienteEnMediciones(clientes: IClienteCache[]): Promise<void> {
  if (clientes.length === 0) return
  const porId = new Map(clientes.map((c) => [c.id, c]))
  const mediciones = await obtenerMedicionesLocales()
  for (const med of mediciones) {
    const c = porId.get(med.clienteId)
    if (!c) continue
    const nuevos = {
      clienteNombre: c.nombre,
      clienteTelefono: c.telefono ?? null,
      clienteDireccion: c.direccion ?? null,
      clienteLocalidad: c.localidad ?? null,
    }
    const cambio =
      med.clienteNombre !== nuevos.clienteNombre ||
      (med.clienteTelefono ?? null) !== nuevos.clienteTelefono ||
      (med.clienteDireccion ?? null) !== nuevos.clienteDireccion ||
      (med.clienteLocalidad ?? null) !== nuevos.clienteLocalidad
    if (cambio) await guardarMedicionLocal({ ...med, ...nuevos })
  }
}

/**
 * Guarda los datos del cliente editados en la tablet.
 * Los clientes que ya existen en el ERP quedan pendientes de subir; los dados de alta
 * sin internet (id temporal) viajan con su medición, que se actualiza acá mismo.
 */
export async function actualizarClienteLocal(cliente: IClienteCache): Promise<IClienteCache> {
  const editado: IClienteCache = {
    ...cliente,
    pendienteSync: !cliente.id.startsWith("cli_offline_"),
  }
  await agregarClienteExpressLocal(editado)
  await refrescarClienteEnMediciones([editado])
  return editado
}

export async function obtenerClientesPendientesSync(): Promise<IClienteCache[]> {
  const clientes = await obtenerClientesLocales()
  return clientes.filter((c) => c.pendienteSync)
}

export async function marcarClientesSincronizados(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const set = new Set(ids)
  const clientes = (await obtenerClientesLocales()).filter((c) => set.has(c.id))
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CLIENTES, "readwrite")
    const store = tx.objectStore(STORE_CLIENTES)
    for (const c of clientes) store.put({ ...c, pendienteSync: false })
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
    const { value: ultimaDescarga } = await Preferences.get({ key: "ultima_descarga" })

    return {
      erpUrl: erpUrl || DEFAULT_CONFIG.erpUrl,
      apiKey: apiKey || DEFAULT_CONFIG.apiKey,
      ultimoSync: ultimoSync || null,
      ultimaDescarga: ultimaDescarga || null,
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
  if (config.ultimaDescarga !== undefined) {
    await Preferences.set({
      key: "ultima_descarga",
      value: config.ultimaDescarga || "",
    })
  }
  if (config.ultimoSync !== undefined) {
    await Preferences.set({
      key: "ultimo_sync",
      value: config.ultimoSync || "",
    })
  }
}

// ─── Telas de la lista de precios (selector de tela en capas RS) ──────────────

const KEY_TELAS = "telas_lista"

/** Telas bajadas del ERP en la última sincronización (para elegir sin señal). */
export async function obtenerTelasLocales(): Promise<ITelaMedicion[]> {
  try {
    const { value } = await Preferences.get({ key: KEY_TELAS })
    const datos = value ? JSON.parse(value) : []
    return Array.isArray(datos) ? (datos as ITelaMedicion[]) : []
  } catch (err) {
    console.error("Error al leer las telas locales:", err)
    return []
  }
}

export async function guardarTelasLocales(telas: ITelaMedicion[]): Promise<void> {
  await Preferences.set({ key: KEY_TELAS, value: JSON.stringify(telas) })
}

// ─── Medidas de los mosquiteros MagicRoll (modelos disponibles según la medida) ─

const KEY_MOSQUITEROS = "mosquiteros_medidas"

export async function obtenerCeldasMosquiteroLocales(): Promise<ICeldaMosquitero[]> {
  try {
    const { value } = await Preferences.get({ key: KEY_MOSQUITEROS })
    const datos = value ? JSON.parse(value) : []
    return Array.isArray(datos) ? (datos as ICeldaMosquitero[]) : []
  } catch (err) {
    console.error("Error al leer las medidas de mosquiteros locales:", err)
    return []
  }
}

export async function guardarCeldasMosquiteroLocales(celdas: ICeldaMosquitero[]): Promise<void> {
  await Preferences.set({ key: KEY_MOSQUITEROS, value: JSON.stringify(celdas) })
}
