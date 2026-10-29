// Módulo: Mediciones
// Roller Noche Total MagicRoll (marca MG): Black Out con guías y cajón. Dos sistemas (a Resorte y a Cadena
// plástica con tensor), cada uno con su tabla ancho × alto en mm (págs. 25 a 27 de la lista). Se entra con el
// ancho y el alto tal cual. Al medir solo se ofrecen los sistemas que se fabrican en la medida de todas las
// cortinas de la abertura; el cajón sale de la celda (a Resorte: si entra en la tabla del cajón 40 y la del 54,
// se toma el 40, que es el más barato).

import { celdaParaMedida, type ICeldaMosquitero } from "./mosquiteros"

export const SISTEMAS_NOCHE_TOTAL = [
  { sistema: "NOCHE_TOTAL_RESORTE", nombre: "Sistema a Resorte" },
  { sistema: "NOCHE_TOTAL_CADENA", nombre: "Sistema a Cadena Plástica con Tensor" },
] as const

export type SistemaNocheTotal = (typeof SISTEMAS_NOCHE_TOTAL)[number]["sistema"]
export const CODIGOS_SISTEMA_NOCHE_TOTAL = SISTEMAS_NOCHE_TOTAL.map((s) => s.sistema) as [
  SistemaNocheTotal,
  ...SistemaNocheTotal[],
]

/** Colores de la tela Black Out y de la cadena plástica */
export const COLORES_NOCHE_TOTAL = ["Blanco", "Negro", "Gris", "Beige"] as const
export type ColorNocheTotal = (typeof COLORES_NOCHE_TOTAL)[number]

/** Configuración de la Noche Total guardada en la medición (caracteristicas.nocheTotal) */
export interface INocheTotalConfig {
  sistema: SistemaNocheTotal
  colorTela: ColorNocheTotal | null
  /** Solo a Cadena (el lado de cada cortina va en bo.mandosRoller) */
  colorCadena?: ColorNocheTotal | null
  /** Cajón de cada cortina según la tabla */
  cajones?: Array<string | null>
}

export const nombreSistemaNocheTotal = (sistema: string | null | undefined) =>
  SISTEMAS_NOCHE_TOTAL.find((s) => s.sistema === sistema)?.nombre ?? sistema ?? ""

export const esNocheTotalACadena = (sistema: string | null | undefined) => sistema === "NOCHE_TOTAL_CADENA"

/** Celda de la tabla del sistema para una cortina (la del cajón más chico si entra en dos tablas). */
export function celdaNocheTotal<T extends ICeldaMosquitero>(
  celdas: T[],
  sistema: string,
  anchoMetros: number,
  altoMetros: number
): T | null {
  return celdaParaMedida(celdas, sistema, anchoMetros, altoMetros)
}

/** Sistemas que se fabrican en la medida de todas las cortinas (anchos de cada una, alto compartido). */
export function sistemasNocheTotalDisponibles(
  celdas: ICeldaMosquitero[],
  anchosMetros: number[],
  altoMetros: number
): Array<(typeof SISTEMAS_NOCHE_TOTAL)[number]> {
  if (anchosMetros.length === 0) return []
  return SISTEMAS_NOCHE_TOTAL.filter((s) =>
    anchosMetros.every((a) => celdaNocheTotal(celdas, s.sistema, a, altoMetros))
  )
}

/** Texto corto: "Sistema a Cadena Plástica con Tensor · Tela Blanco · Cadena Negro · Cajón 62,5" */
export function textoNocheTotal(n: INocheTotalConfig | null | undefined): string {
  if (!n?.sistema) return ""
  const cajones = [...new Set((n.cajones ?? []).filter(Boolean))]
  return [
    nombreSistemaNocheTotal(n.sistema),
    n.colorTela ? `Tela ${n.colorTela}` : null,
    n.colorCadena ? `Cadena ${n.colorCadena}` : null,
    cajones.length > 0 ? `Cajón ${cajones.join(" / ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}
