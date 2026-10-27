// Módulo: Presupuestos
// El presupuesto se arma por cortina física (una fila por paño / tramo de cada capa), pero el taller
// y la instalación trabajan por abertura. Esto une las filas aprobadas de una misma abertura en un solo ítem
// y desactiva en la especificación las capas que el cliente no aceptó.

import { cortinasFisicas, nombreCapa, type CapaCortina } from "@/modules/mediciones/lib/cortinas-fisicas"
import type { ICaracteristicasItem } from "@/modules/mediciones/types"

export interface FilaAbertura {
  id: string
  itemMedicionId: string | null
  descripcion: string
  ambiente: string | null
  ancho: unknown
  alto: unknown
  cantidad: number
  caracteristicas: unknown
  capa: string | null
  tipoFila: string | null
  grupoAlternativa: string | null
  nombreOpcion: string | null
  itemMedicion?: {
    descripcion: string
    ancho: unknown
    alto: unknown
    cantidad: number
    caracteristicas: unknown
    observaciones?: string | null
    productoId?: string | null
  } | null
}

export interface AberturaUnida<T extends FilaAbertura> {
  /** Fila representativa (la primera) */
  base: T
  filas: T[]
  descripcion: string
  ancho: number
  alto: number
  cantidad: number
  caracteristicas: Record<string, unknown> | null
  /** Capas de la medición que no se aceptaron (se desactivan en la especificación) */
  capasExcluidas: CapaCortina[]
  /** Ej: "Solo B.O." cuando no se aceptaron todas las capas */
  nota: string | null
}

/** Desactiva capas en la especificación y deja registro para que no se reactiven al cambiar la medición. */
export function excluirCapas(
  carac: Record<string, unknown> | null,
  capas: CapaCortina[]
): Record<string, unknown> | null {
  if (!carac || capas.length === 0) return carac
  const copia: Record<string, unknown> = { ...carac, capasExcluidas: capas }
  for (const capa of capas) {
    const clave = capa === "GAZA" ? "gaza" : "bo"
    const config = copia[clave] as Record<string, unknown> | undefined
    if (config) copia[clave] = { ...config, activa: false }
  }
  return copia
}

/**
 * Agrupa por abertura las filas de cortinas físicas (capa) y los cargadores de esa abertura.
 * Las filas libres, controles y datos anteriores (sin capa) quedan como están, una por fila.
 */
export function unirFilasPorAbertura<T extends FilaAbertura>(filas: T[]): AberturaUnida<T>[] {
  const grupos = new Map<string, T[]>()
  const orden: string[] = []
  for (const f of filas) {
    const unible = Boolean(f.itemMedicionId) && (Boolean(f.capa) || f.tipoFila === "CARGADOR")
    const clave = unible ? `abertura:${f.itemMedicionId}` : `fila:${f.id}`
    if (!grupos.has(clave)) {
      grupos.set(clave, [])
      orden.push(clave)
    }
    grupos.get(clave)!.push(f)
  }

  return orden.map((clave) => {
    const grupo = grupos.get(clave)!
    const base = grupo[0]
    const filasCapa = grupo.filter((f) => f.capa)
    const medicion = base.itemMedicion

    if (filasCapa.length === 0) {
      // Fila suelta (o solo un cargador): se usa tal cual
      return {
        base,
        filas: grupo,
        descripcion: base.descripcion,
        ancho: Number(base.ancho) || 0,
        alto: Number(base.alto) || 0,
        cantidad: base.cantidad || 1,
        caracteristicas:
          ((base.caracteristicas ?? medicion?.caracteristicas) as Record<string, unknown> | null) || null,
        capasExcluidas: [],
        nota: null,
      }
    }

    // Especificación: la de una alternativa elegida (si la hay) o la de la medición
    const conPropia = filasCapa.find((f) => f.caracteristicas != null)
    const carac = ((conPropia?.caracteristicas ?? medicion?.caracteristicas) as Record<string, unknown> | null) || null
    const ancho = Number(medicion?.ancho ?? base.ancho) || 0
    const alto = Number(medicion?.alto ?? base.alto) || 0

    const aceptadas = new Set(filasCapa.map((f) => f.capa as CapaCortina))
    const cortinas = cortinasFisicas(carac as unknown as ICaracteristicasItem, ancho, alto)
    const capasMedicion = [...new Set(cortinas.map((k) => k.capa))]
    const capasExcluidas = capasMedicion.filter((c) => !aceptadas.has(c))
    const cargadores = grupo
      .filter((f) => f.tipoFila === "CARGADOR")
      .reduce((acc, f) => acc + (f.cantidad || 0), 0)
    const nota =
      [
        capasExcluidas.length > 0
          ? `Solo ${capasMedicion
              .filter((c) => aceptadas.has(c))
              .map((c) => nombreCapa(c, cortinas.find((k) => k.capa === c)?.tipoCapa))
              .join(" y ")}`
          : null,
        cargadores > 0 ? `${cargadores} cargador(es) Li-ion` : null,
      ]
        .filter(Boolean)
        .join(" · ") || null

    const opciones = [...new Set(filasCapa.map((f) => f.nombreOpcion?.trim()).filter(Boolean))]
    const descBase = medicion?.descripcion || base.descripcion
    return {
      base,
      filas: grupo,
      descripcion: opciones.length > 0 ? `${descBase} (${opciones.join(" / ")})` : descBase,
      ancho,
      alto,
      cantidad: medicion?.cantidad || base.cantidad || 1,
      caracteristicas: excluirCapas(carac, capasExcluidas),
      capasExcluidas,
      nota,
    }
  })
}
