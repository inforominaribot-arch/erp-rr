// Módulo: Presupuestos
// Lógica de cálculo de explosión de materiales (Rieles, Telas, Accesorios) y cruce contra Stock

import type { ICaracteristicasItem } from "@/modules/mediciones/types"
import { tipoDeCapa, type CapaCortina } from "@/modules/mediciones/lib/cortinas-fisicas"

export interface IDesgloseRiel {
  cantidadTramos: number
  medidaPorTramo: number // en metros (múltiplo de 0.20)
  totalMetrosLineales: number
  capas: number // 1 si es simple, 2 si es doble (ej: Gasa + BO)
  descripcionRiel: string
}

export interface INecesidadMaterial {
  tipo: "RIEL" | "TELA" | "ACCESORIO"
  nombre: string
  unidadMedida: "metro" | "unidad" | "metro2"
  cantidadRequerida: number
  stockActual: number
  faltante: number
  tieneStockSuficiente: boolean
  detalles: string
  productoId?: string
}

export interface IReporteDisponibilidadStock {
  materiales: INecesidadMaterial[]
  hayFaltantes: boolean
  totalFaltantes: number
  resumenRieles: string[]
  resumenTelas: string[]
}

/**
 * Regla de negocio de Rieles:
 * - Vienen en múltiplos de 0.20m hacia arriba (ej: 2.30m -> 2.40m).
 * - Máximo de un riel continuo: 4.60m.
 * - Si el ancho supera 4.60m: se divide en 2 partes iguales, y cada mitad se redondea al múltiplo de 0.20m superior.
 *   Ejemplo: 4.80m -> 2 partes de 2.40m.
 *   Ejemplo: 5.00m -> 2 partes de 2.50m -> se redondean a 2.60m cada una.
 */
export function calcularCorteRiel(anchoMetros: number): {
  cantidadTramos: number
  medidaPorTramo: number
  totalMetros: number
} {
  const ancho = Math.max(0.1, Number(anchoMetros) || 0)

  // Redondear un número hacia arriba al múltiplo de 0.20
  const redondearMultiplo20cm = (val: number): number => {
    return Number((Math.ceil(Number((val * 10).toFixed(4)) / 2) * 0.2).toFixed(2))
  }

  if (ancho <= 4.6) {
    const medidaTramo = redondearMultiplo20cm(ancho)
    return {
      cantidadTramos: 1,
      medidaPorTramo: medidaTramo,
      totalMetros: medidaTramo,
    }
  } else {
    // Si supera los 4.60m, se divide en 2 tramos iguales
    const mitad = ancho / 2
    const medidaTramo = redondearMultiplo20cm(mitad)
    return {
      cantidadTramos: 2,
      medidaPorTramo: medidaTramo,
      totalMetros: Number((medidaTramo * 2).toFixed(2)),
    }
  }
}

const NOMBRE_CAPA_SOPORTE: Record<CapaCortina, string> = { GAZA: "Gasa", BO: "Black Out" }
const fmtM = (n: number) => `${n.toFixed(2)}m`

/** Capas que van colgadas de riel o barral: cada una lleva el suyo, separado de la otra. */
function capasConSoporte(c: ICaracteristicasItem): CapaCortina[] {
  return (["GAZA", "BO"] as CapaCortina[]).filter((capa) => {
    const t = tipoDeCapa(c, capa)
    return t === "Tradicional" || (t === "Tradicional Mot" && c.sistema === "Riel")
  })
}

/**
 * Texto de rieles o barrales de la comanda, contando cada capa por separado:
 * "Riel: 2 de 2.60m (Gasa y Black Out)", "Riel: 2 tramos de 2.60m", "Barral: 1 de 3.00m (sin corte)".
 * Null si la cortina no lleva riel ni barral.
 */
export function textoRielesBarrales(
  c: ICaracteristicasItem | null | undefined,
  anchoFila: number,
  cantidadFila: number = 1
): string | null {
  const barral = c?.sistema === "Barral"
  const nombre = barral ? "Barral" : "Riel"
  // Cuánto lleva cada capa: el riel de más de 4,60 m va en 2 tramos; el barral va entero
  const deCapa = (ancho: number) => {
    if (barral) return { cantidad: 1, medida: ancho }
    const corte = calcularCorteRiel(ancho)
    return { cantidad: corte.cantidadTramos, medida: corte.medidaPorTramo }
  }
  const unidad = (cantidad: number, enTramos: boolean) => (enTramos ? `${cantidad} tramos` : String(cantidad))

  // Fila sin especificación: la cantidad cargada son cortinas iguales
  if (!c?.tipo) {
    const d = deCapa(anchoFila)
    const enTramos = d.cantidad > 1
    return `${nombre}: ${unidad(d.cantidad * (cantidadFila || 1), enTramos)} de ${fmtM(d.medida)}${barral ? " (sin corte)" : ""}`
  }

  const capas = capasConSoporte(c).map((capa) => {
    const config = capa === "GAZA" ? c.gaza : c.bo
    return { capa, ...deCapa(Number(config?.ancho) || anchoFila) }
  })
  if (capas.length === 0) return null

  const nombres = capas.map((k) => NOMBRE_CAPA_SOPORTE[k.capa]).join(" y ")
  const iguales = capas.every((k) => k.medida === capas[0].medida && k.cantidad === capas[0].cantidad)
  if (iguales) {
    const total = capas.reduce((acc, k) => acc + k.cantidad, 0)
    const aclaracion = capas.length > 1 ? ` (${nombres})` : barral ? " (sin corte)" : ""
    return `${nombre}: ${unidad(total, capas[0].cantidad > 1)} de ${fmtM(capas[0].medida)}${aclaracion}`
  }
  return `${nombre}: ${capas
    .map((k) => `${unidad(k.cantidad, k.cantidad > 1)} de ${fmtM(k.medida)} (${NOMBRE_CAPA_SOPORTE[k.capa]})`)
    .join(" + ")}`
}

/**
 * Analiza un ítem de presupuesto y sus características de medición (si las tiene)
 * para calcular los rieles necesarios y sus capas (simple o doble).
 */
export function analizarRielesItem(
  descripcion: string,
  ancho: number,
  cantidadCortinas: number = 1,
  caracteristicas?: any
): IDesgloseRiel | null {
  const descLower = descripcion.toLowerCase()

  // Si es Roller, Aluminio, Bandas, Mosquera o Hunter Douglas, no lleva riel tradicional
  if (
    descLower.includes("roller") &&
    !descLower.includes("tradicional") &&
    !descLower.includes("riel")
  ) {
    return null
  }
  if (
    descLower.includes("aluminio") ||
    descLower.includes("mosquera") ||
    descLower.includes("toldo") ||
    descLower.includes("hunter")
  ) {
    return null
  }

  // La especificación manda sobre la descripción: con Barral no se consumen rieles
  // (ej: alternativa "Barral" de una cortina descripta como "Tradicional")
  if (caracteristicas?.sistema === "Barral") {
    return null
  }

  // Verificar si lleva riel
  const tieneRiel =
    descLower.includes("riel") ||
    descLower.includes("tradicional") ||
    descLower.includes("gasa") ||
    descLower.includes("gaza") ||
    caracteristicas?.sistema === "Riel" ||
    !caracteristicas?.sistema // por defecto tradicional suele usar riel

  if (!tieneRiel && caracteristicas?.sistema === "Barral") {
    return null // si especifica Barral, no consume rieles
  }

  // Detectar si es doble capa (Gasa + Blackout)
  let capas = 1
  if (caracteristicas?.tipo) {
    // Solo las capas que cuelgan de riel (un B.O. roller, por ejemplo, no lleva)
    capas = capasConSoporte(caracteristicas).length
    if (capas === 0) return null
  } else if (caracteristicas) {
    const gazaActiva = Boolean(caracteristicas.gaza?.activa)
    const boActiva = Boolean(caracteristicas.bo?.activa)
    if (gazaActiva && boActiva) {
      capas = 2
    }
  } else {
    // Si no tiene ficha técnica pero la descripción dice "doble" o menciona gasa y blackout
    if (
      descLower.includes("doble") ||
      ((descLower.includes("gasa") || descLower.includes("gaza")) &&
        descLower.includes("blackout")) ||
      ((descLower.includes("gasa") || descLower.includes("gaza")) &&
        descLower.includes("bo"))
    ) {
      capas = 2
    }
  }

  const calculoBase = calcularCorteRiel(ancho)
  const cantidadTotalTramos = calculoBase.cantidadTramos * capas * cantidadCortinas
  const totalMetrosLineales = Number(
    (calculoBase.medidaPorTramo * cantidadTotalTramos).toFixed(2)
  )

  let descripcionRiel = ""
  if (calculoBase.cantidadTramos === 1) {
    descripcionRiel = `${cantidadTotalTramos} riel(es) de ${calculoBase.medidaPorTramo.toFixed(2)}m (${capas === 2 ? "Doble capa" : "Simple"})`
  } else {
    descripcionRiel = `${cantidadTotalTramos} rieles de ${calculoBase.medidaPorTramo.toFixed(2)}m (ancho ${ancho}m dividido en 2 mitades${capas === 2 ? " x 2 capas" : ""})`
  }

  return {
    cantidadTramos: cantidadTotalTramos,
    medidaPorTramo: calculoBase.medidaPorTramo,
    totalMetrosLineales,
    capas,
    descripcionRiel,
  }
}
