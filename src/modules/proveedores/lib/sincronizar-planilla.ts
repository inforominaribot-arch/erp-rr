// Módulo: Proveedores & Compras
// Copia en la base los precios de la planilla de Google Sheets del proveedor.
// - Precio nuevo distinto al guardado → se guarda el anterior y la fecha del cambio.
// - Renglón que ya no está en la planilla → queda inactivo (no se borra).
// - Si Google no responde se conserva la última copia y se anota el error.

import { prisma } from "@/lib/prisma"
import { filasDePlanilla, urlCsvPlanilla } from "./planilla-precios"

export interface IResultadoSyncPlanilla {
  total: number
  nuevos: number
  cambiados: number
  quitados: number
}

/** Horas que se considera "reciente" la copia al presupuestar o al abrir el proveedor */
export const HORAS_COPIA_RECIENTE = 6

export async function sincronizarPlanillaProveedor(proveedorId: string): Promise<IResultadoSyncPlanilla> {
  const proveedor = await prisma.proveedor.findUnique({
    where: { id: proveedorId },
    select: { planillaPreciosUrl: true },
  })
  const url = proveedor?.planillaPreciosUrl ? urlCsvPlanilla(proveedor.planillaPreciosUrl) : null
  if (!url) throw new Error("El proveedor no tiene un link de planilla de Google Sheets válido.")

  try {
    const resp = await fetch(url, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(20_000) })
    const tipo = resp.headers.get("content-type") ?? ""
    if (!resp.ok || !tipo.includes("text/csv")) {
      throw new Error(
        resp.status === 404
          ? "No se encontró la planilla (¿cambió el link?)."
          : "No se pudo leer la planilla: tiene que estar compartida como \"Cualquier persona con el enlace\"."
      )
    }
    const filas = filasDePlanilla(await resp.text())
    if (filas.length === 0) throw new Error("La planilla no tiene renglones con precio.")

    const existentes = await prisma.precioPlanillaItem.findMany({ where: { proveedorId } })
    const porClave = new Map(existentes.map((e) => [`${e.seccion}|${e.descripcion}`, e]))
    const ahora = new Date()
    const vistos = new Set<string>()
    const nuevos: typeof filas = []
    const cambios: Array<{ id: string; data: Record<string, unknown> }> = []
    // El orden se corre cuando el proveedor agrega renglones: se actualiza todo junto en una sola consulta
    const ordenes: Array<{ id: string; orden: number }> = []
    let cambiados = 0

    for (const f of filas) {
      const clave = `${f.seccion}|${f.descripcion}`
      vistos.add(clave)
      const e = porClave.get(clave)
      if (!e) {
        nuevos.push(f)
        continue
      }
      const precioCambio = Number(e.precio) !== f.precio
      if (precioCambio) cambiados++
      if (precioCambio || !e.activo) {
        cambios.push({
          id: e.id,
          data: {
            precio: f.precio,
            activo: true,
            ...(precioCambio ? { precioAnterior: e.precio, cambiadoEn: ahora } : {}),
          },
        })
      }
      if (e.orden !== f.orden) ordenes.push({ id: e.id, orden: f.orden })
    }
    const quitar = existentes.filter((e) => e.activo && !vistos.has(`${e.seccion}|${e.descripcion}`)).map((e) => e.id)

    await prisma.$transaction(
      async (tx) => {
        if (nuevos.length > 0) {
          await tx.precioPlanillaItem.createMany({
            data: nuevos.map((f) => ({ proveedorId, ...f })),
            skipDuplicates: true,
          })
        }
        for (const c of cambios) {
          await tx.precioPlanillaItem.update({ where: { id: c.id }, data: c.data })
        }
        if (ordenes.length > 0) {
          await tx.$executeRaw`
            UPDATE precios_planilla AS p SET orden = v.orden
            FROM (SELECT unnest(${ordenes.map((o) => o.id)}::text[]) AS id, unnest(${ordenes.map((o) => o.orden)}::int[]) AS orden) AS v
            WHERE p.id = v.id`
        }
        if (quitar.length > 0) {
          await tx.precioPlanillaItem.updateMany({ where: { id: { in: quitar } }, data: { activo: false } })
        }
        await tx.proveedor.update({
          where: { id: proveedorId },
          data: { planillaSincronizadaEn: ahora, planillaErrorSync: null },
        })
      },
      { timeout: 60_000 }
    )

    return { total: filas.length, nuevos: nuevos.length, cambiados, quitados: quitar.length }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error al leer la planilla."
    await prisma.proveedor.update({ where: { id: proveedorId }, data: { planillaErrorSync: mensaje } })
    throw new Error(mensaje)
  }
}

/** Sincroniza solo si la copia tiene más de `horas` (o nunca se bajó). No tira error: deja la copia anterior. */
export async function asegurarPlanillaReciente(proveedorId: string, horas = HORAS_COPIA_RECIENTE): Promise<void> {
  const p = await prisma.proveedor.findUnique({
    where: { id: proveedorId },
    select: { planillaPreciosUrl: true, planillaSincronizadaEn: true },
  })
  if (!p?.planillaPreciosUrl) return
  const vieja = !p.planillaSincronizadaEn || Date.now() - p.planillaSincronizadaEn.getTime() > horas * 3_600_000
  if (!vieja) return
  try {
    await sincronizarPlanillaProveedor(proveedorId)
  } catch (error) {
    console.error(`No se pudo actualizar la planilla del proveedor ${proveedorId}:`, error)
  }
}

/** Todos los proveedores activos con planilla (lo usa la tarea diaria). */
export async function sincronizarTodasLasPlanillas(): Promise<Array<{ proveedorId: string; ok: boolean; detalle: string }>> {
  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true, planillaPreciosUrl: { not: null } },
    select: { id: true },
  })
  const resultados: Array<{ proveedorId: string; ok: boolean; detalle: string }> = []
  for (const p of proveedores) {
    try {
      const r = await sincronizarPlanillaProveedor(p.id)
      resultados.push({ proveedorId: p.id, ok: true, detalle: `${r.total} precios, ${r.cambiados} cambiados` })
    } catch (error) {
      resultados.push({ proveedorId: p.id, ok: false, detalle: error instanceof Error ? error.message : "Error" })
    }
  }
  return resultados
}
