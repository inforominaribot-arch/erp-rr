// Módulo: Presupuestos
// Textos que se muestran al cliente: "Gasa" con s (en los datos la capa sigue siendo "GAZA")
// y el nombre de la tela de cada línea.

import type { ICaracteristicasItem } from "@/modules/mediciones/types"
import { capasConTela, configTradicionalSchema, textoTelasTradicional } from "./tradicional"

/** Reemplaza "Gaza" por "Gasa" respetando mayúsculas. */
export function conGasa(texto: string): string {
  return texto.replace(/Gaza/g, "Gasa").replace(/GAZA/g, "GASA").replace(/gaza/g, "gasa")
}

/** Configuración de la tradicional guardada en la fila (o null si la fila no se calculó así). */
function tradicionalDeFila(calculoPrecio: unknown) {
  const calc = calculoPrecio as { metodo?: string; tradicional?: unknown } | null | undefined
  if (calc?.metodo !== "TRADICIONAL" || !calc.tradicional) return null
  const r = configTradicionalSchema.safeParse(calc.tradicional)
  return r.success ? r.data : null
}

/**
 * Tela (con su color) de la capa de una fila del presupuesto: la elegida en la calculadora (tradicionales)
 * o, si no, la de su especificación / la medición.
 */
export function telaDeFila(it: {
  capa: string | null
  tipoFila?: string | null
  caracteristicas: ICaracteristicasItem | null
  itemMedicion?: { caracteristicas: unknown } | null
  calculoPrecio?: unknown
}): string | null {
  if (it.tipoFila && it.tipoFila !== "CORTINA") return null
  const trad = tradicionalDeFila(it.calculoPrecio)
  const deCalculo = trad ? textoTelasTradicional(trad) : null
  if (deCalculo) return conGasa(deCalculo)
  if (!it.capa) return null
  const carac = it.caracteristicas ?? (it.itemMedicion?.caracteristicas as ICaracteristicasItem | null | undefined)
  const config = it.capa === "GAZA" ? carac?.gaza : carac?.bo
  const nombre = config?.nombreTela?.trim()
  if (!nombre) return null
  const color = config?.colorTela?.trim()
  const texto = color && !nombre.toLowerCase().includes(color.toLowerCase()) ? `${nombre} ${color}` : nombre
  return conGasa(texto)
}

/** Solo interno: dónde está más barata la tela de una tradicional (para pedirla ahí). */
export function telasMasBaratasDeFila(calculoPrecio: unknown): string | null {
  const trad = tradicionalDeFila(calculoPrecio)
  if (!trad) return null
  const fm = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`
  const partes = capasConTela(trad)
    .filter((c) => c.tela.masBaratas.length > 0)
    .map(
      (c) =>
        `${c.tela.nombre}: más barata en ${c.tela.masBaratas
          .map((o) => `${o.proveedor} ${fm(o.precio)}/m${o.ancho ? ` (ancho ${o.ancho.toLocaleString("es-AR")} m)` : ""}`)
          .join(", ")} — presupuestada con ${c.tela.proveedor}${c.tela.ancho ? ` (ancho ${c.tela.ancho.toLocaleString("es-AR")} m)` : ""}`
    )
  return partes.length > 0 ? partes.join(" · ") : null
}
