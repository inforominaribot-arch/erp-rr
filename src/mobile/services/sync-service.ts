import {
  obtenerConfiguracion,
  guardarConfiguracion,
  obtenerMedicionesLocales,
  marcarMedicionSincronizadaLocal,
  guardarClientesLocales,
} from "./storage-service"
import type { IMedicionOffline } from "@/modules/mediciones/types"
import type { IClienteCache } from "@/modules/mediciones/lib/offline-storage"

export interface ResultadoSync {
  exito: boolean
  mensaje: string
  medicionesSincronizadas: number
  clientesDescargados: number
  error?: string
}

export async function sincronizarTodo(): Promise<ResultadoSync> {
  const config = await obtenerConfiguracion()
  const erpBaseUrl = config.erpUrl.replace(/\/+$/, "")

  let medicionesSincronizadas = 0
  let clientesDescargados = 0

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

    return {
      exito: true,
      mensaje:
        pendientes.length > 0
          ? `¡Sincronización completa! Se subieron ${medicionesSincronizadas} mediciones y se actualizaron ${clientesDescargados} clientes.`
          : `Catálogo de clientes actualizado (${clientesDescargados} clientes disponibles en la tablet).`,
      medicionesSincronizadas,
      clientesDescargados,
    }
  } catch (error: any) {
    console.error("Fallo durante la sincronización móvil:", error)
    return {
      exito: false,
      mensaje: "No se pudo conectar con el servidor ERP.",
      error: error?.message || "Fallo de conexión de red",
      medicionesSincronizadas: 0,
      clientesDescargados: 0,
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
