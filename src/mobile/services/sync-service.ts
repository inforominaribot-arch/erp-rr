import {
  obtenerConfiguracion,
  guardarConfiguracion,
  obtenerMedicionesLocales,
  marcarMedicionSincronizadaLocal,
  marcarErrorSyncLocal,
  incorporarMedicionesDelServidor,
  guardarClientesLocales,
} from "./storage-service"
import type { IMedicionOffline } from "@/modules/mediciones/types"
import type { IClienteCache } from "@/modules/mediciones/lib/offline-storage"

export interface ResultadoSync {
  exito: boolean
  mensaje: string
  medicionesSincronizadas: number
  medicionesDescargadas: number
  clientesDescargados: number
  /** Mediciones que el ERP no aceptó (quedan pendientes en la tablet con su motivo) */
  rechazadas: Array<{ idLocal: string; error: string }>
  error?: string
}

export async function sincronizarTodo(): Promise<ResultadoSync> {
  const config = await obtenerConfiguracion()
  const erpBaseUrl = config.erpUrl.replace(/\/+$/, "")

  let medicionesSincronizadas = 0
  let medicionesDescargadas = 0
  let clientesDescargados = 0
  let rechazadas: Array<{ idLocal: string; error: string }> = []

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (config.apiKey) {
    headers["x-sync-api-key"] = config.apiKey
  }

  try {
    // ── 1. Enviar Mediciones Pendientes de Sincronización ──
    const todasLasMediciones = await obtenerMedicionesLocales()
    const pendientes = todasLasMediciones.filter((m) => !m.sincronizado)

    if (pendientes.length > 0) {
      const respMediciones = await fetch(`${erpBaseUrl}/api/mediciones/sync`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mediciones: pendientes }),
      })

      if (!respMediciones.ok) {
        const errorText = await respMediciones.text()
        throw new Error(
          `Error en servidor al enviar mediciones (${respMediciones.status}): ${errorText}`
        )
      }

      const dataMed = await respMediciones.json()
      if (dataMed.success && Array.isArray(dataMed.sincronizadas)) {
        for (const item of dataMed.sincronizadas) {
          await marcarMedicionSincronizadaLocal(item.idLocal, item.idServidor)
        }
        medicionesSincronizadas = dataMed.sincronizadas.length
      }
      if (Array.isArray(dataMed.rechazadas)) {
        rechazadas = dataMed.rechazadas
        for (const r of rechazadas) {
          await marcarErrorSyncLocal(r.idLocal, r.error)
        }
      }
    }

    // ── 1b. Bajar mediciones modificadas en la web (después de subir: gana la tablet) ──
    const desde = config.ultimaDescarga
      ? `?desde=${encodeURIComponent(config.ultimaDescarga)}`
      : ""
    const respDescarga = await fetch(`${erpBaseUrl}/api/mediciones/descargar${desde}`, {
      method: "GET",
      headers,
    })
    if (respDescarga.ok) {
      const dataDesc = await respDescarga.json()
      if (dataDesc.success && Array.isArray(dataDesc.mediciones)) {
        medicionesDescargadas = await incorporarMedicionesDelServidor(dataDesc.mediciones)
        await guardarConfiguracion({ ultimaDescarga: dataDesc.servidorAhora })
      }
    } else {
      console.warn("No se pudieron bajar las mediciones del ERP:", respDescarga.status)
    }

    // ── 2. Descargar Catálogo Actualizado de Clientes ──
    const respClientes = await fetch(
      `${erpBaseUrl}/api/mediciones/clientes-sync`,
      {
        method: "GET",
        headers,
      }
    )

    if (respClientes.ok) {
      const dataClientes = await respClientes.json()
      if (dataClientes.success && Array.isArray(dataClientes.clientes)) {
        const formateados: IClienteCache[] = dataClientes.clientes.map(
          (c: any) => ({
            id: c.id,
            nombre: c.nombre,
            telefono: c.telefono,
            email: c.email,
            direccion: c.direccion,
            localidad: c.localidad,
            estado: c.estado,
          })
        )
        await guardarClientesLocales(formateados)
        clientesDescargados = formateados.length
      }
    }

    // ── 3. Actualizar Timestamp del Último Sync ──
    const ahoraIso = new Date().toISOString()
    await guardarConfiguracion({ ultimoSync: ahoraIso })

    const partes = [
      `Subidas: ${medicionesSincronizadas}`,
      `Bajadas del ERP: ${medicionesDescargadas}`,
      `Clientes: ${clientesDescargados}`,
    ]
    return {
      exito: rechazadas.length === 0,
      mensaje:
        rechazadas.length > 0
          ? `Sincronización con observaciones: ${rechazadas.length} medición(es) no se pudieron subir. ${rechazadas
              .map((r) => r.error)
              .join(" | ")}`
          : `¡Sincronización completa! ${partes.join(" • ")}.`,
      medicionesSincronizadas,
      medicionesDescargadas,
      clientesDescargados,
      rechazadas,
    }
  } catch (error: any) {
    console.error("Fallo durante la sincronización móvil:", error)
    return {
      exito: false,
      mensaje: "No se pudo conectar con el servidor ERP.",
      error: error?.message || "Fallo de conexión de red",
      medicionesSincronizadas: 0,
      medicionesDescargadas: 0,
      clientesDescargados: 0,
      rechazadas: [],
    }
  }
}

export async function probarConexionERP(
  url: string,
  apiKey?: string
): Promise<{ ok: boolean; mensaje: string; status?: number }> {
  try {
    const cleanUrl = url.replace(/\/+$/, "")
    const headers: Record<string, string> = {}
    if (apiKey) {
      headers["x-sync-api-key"] = apiKey
    }

    const resp = await fetch(`${cleanUrl}/api/mediciones/clientes-sync`, {
      method: "GET",
      headers,
    })

    if (resp.ok) {
      const json = await resp.json()
      return {
        ok: true,
        mensaje: `Conexión exitosa. Se detectaron ${json.total || 0} clientes en el ERP.`,
        status: resp.status,
      }
    }

    return {
      ok: false,
      mensaje: `El servidor respondió con código HTTP ${resp.status}`,
      status: resp.status,
    }
  } catch (err: any) {
    return {
      ok: false,
      mensaje: `No se pudo alcanzar el servidor: ${err?.message || "Sin respuesta"}`,
    }
  }
}
