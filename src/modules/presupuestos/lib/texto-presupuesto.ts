// Módulo: Presupuestos
// Textos que se muestran al cliente: "Gasa" con s (en los datos la capa sigue siendo "GAZA")
// y el nombre de la tela de cada línea.

import type { ICaracteristicasItem } from "@/modules/mediciones/types"

/** Reemplaza "Gaza" por "Gasa" respetando mayúsculas. */
export function conGasa(texto: string): string {
  return texto.replace(/Gaza/g, "Gasa").replace(/GAZA/g, "GASA").replace(/gaza/g, "gasa")
}

/** Tela (con su color) de la capa de una fila del presupuesto, según su especificación o la de la medición. */
export function telaDeFila(it: {
  capa: string | null
  tipoFila?: string | null
  caracteristicas: ICaracteristicasItem | null
  itemMedicion?: { caracteristicas: unknown } | null
}): string | null {
  if (!it.capa || (it.tipoFila && it.tipoFila !== "CORTINA")) return null
  const carac = it.caracteristicas ?? (it.itemMedicion?.caracteristicas as ICaracteristicasItem | null | undefined)
  const config = it.capa === "GAZA" ? carac?.gaza : carac?.bo
  const nombre = config?.nombreTela?.trim()
  if (!nombre) return null
  const color = config?.colorTela?.trim()
  const texto = color && !nombre.toLowerCase().includes(color.toLowerCase()) ? `${nombre} ${color}` : nombre
  return conGasa(texto)
}
