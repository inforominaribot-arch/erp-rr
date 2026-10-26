// Módulo: Presupuestos
// Alternativas por cortina: agrupación de opciones ("Riel" / "Barral") y totales por opción.
// La opción principal es la que suma al total guardado del presupuesto.

export interface ItemConOpcion {
  id?: string
  grupoAlternativa?: string | null
  nombreOpcion?: string | null
  esOpcionPrincipal?: boolean
  subtotal: number
}

export interface CortinaConOpciones<T> {
  clave: string
  principal: T
  /** Todas las opciones, la principal primero */
  opciones: T[]
}

export const esPrincipal = (it: { esOpcionPrincipal?: boolean }) => it.esOpcionPrincipal !== false

/** Agrupa los ítems por cortina respetando el orden de aparición. */
export function agruparCortinas<T extends ItemConOpcion>(items: T[]): CortinaConOpciones<T>[] {
  const grupos = new Map<string, T[]>()
  items.forEach((it, idx) => {
    const clave = it.grupoAlternativa || `__solo_${it.id ?? idx}`
    const lista = grupos.get(clave) ?? []
    lista.push(it)
    grupos.set(clave, lista)
  })
  return [...grupos.entries()].map(([clave, lista]) => {
    const principal = lista.find(esPrincipal) ?? lista[0]
    return {
      clave,
      principal,
      opciones: [principal, ...lista.filter((o) => o !== principal)],
    }
  })
}

/** Suma de las opciones principales (lo que se guarda como subtotal del presupuesto). */
export function subtotalPrincipales(items: ItemConOpcion[]): number {
  const suma = items.filter(esPrincipal).reduce((acc, it) => acc + (it.subtotal || 0), 0)
  return Math.round(suma * 100) / 100
}

export interface TotalPorOpcion {
  nombre: string
  subtotal: number
  total: number
}

const normalizar = (s: string | null | undefined) => (s || "").trim().toLowerCase()

/**
 * Si todas las cortinas con alternativas tienen los mismos nombres de opción,
 * devuelve el total con cada opción (las cortinas sin esa opción suman su principal).
 * Si no hay alternativas o los nombres no coinciden, devuelve null.
 */
export function calcularTotalesPorOpcion(
  items: ItemConOpcion[],
  descuentoPorc: number
): TotalPorOpcion[] | null {
  const cortinas = agruparCortinas(items)
  const conAlternativas = cortinas.filter((c) => c.opciones.length > 1)
  if (conAlternativas.length === 0) return null

  const firma = (c: CortinaConOpciones<ItemConOpcion>) =>
    c.opciones.map((o) => normalizar(o.nombreOpcion)).sort().join("|")
  const firmaBase = firma(conAlternativas[0])
  if (conAlternativas.some((c) => firma(c) !== firmaBase)) return null

  return conAlternativas[0].opciones.map((opcionBase) => {
    const clave = normalizar(opcionBase.nombreOpcion)
    const subtotal =
      Math.round(
        cortinas.reduce((acc, c) => {
          const elegida = c.opciones.find((o) => normalizar(o.nombreOpcion) === clave) ?? c.principal
          return acc + (elegida.subtotal || 0)
        }, 0) * 100
      ) / 100
    const total = Math.max(0, subtotal - Math.round(subtotal * (descuentoPorc / 100) * 100) / 100)
    return { nombre: opcionBase.nombreOpcion?.trim() || "Opción", subtotal, total }
  })
}

/** Texto de una cortina con sus opciones, ej: "Riel $480.000 / Barral $520.000". */
export function etiquetaOpcion(it: { nombreOpcion?: string | null }, idx: number): string {
  return it.nombreOpcion?.trim() || (idx === 0 ? "Principal" : `Opción ${idx + 1}`)
}

/** Descripción con el nombre de la opción, ej: "Ventanal (Barral)". */
export function descripcionConOpcion(it: {
  descripcion: string
  grupoAlternativa?: string | null
  nombreOpcion?: string | null
}): string {
  return it.grupoAlternativa && it.nombreOpcion?.trim()
    ? `${it.descripcion} (${it.nombreOpcion.trim()})`
    : it.descripcion
}

/**
 * Ítems aprobados de un presupuesto aceptado: la opción elegida de cada cortina.
 * En aceptación total sin marcas (datos anteriores) se toman las opciones principales.
 */
export function itemsAprobados<T extends { aceptado: boolean; esOpcionPrincipal?: boolean }>(
  items: T[],
  estado: string
): T[] {
  const marcados = items.filter((it) => it.aceptado)
  return estado === "ACEPTADO_TOTAL" && marcados.length === 0 ? items.filter(esPrincipal) : marcados
}
