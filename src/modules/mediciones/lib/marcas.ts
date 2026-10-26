// Módulo: Mediciones
// Marca de proveedor de una cortina según sus capas activas (Gaza / B.O.).
// La marca "general" (caracteristicas.marca) se deriva de las capas: antes quedaba fija
// en el valor por defecto del B.O. (HD) aunque se eligiera otra marca para la Gaza.

import type { ICaracteristicasItem, MarcaCortina } from "../types"

type CaracMarca = Pick<
  ICaracteristicasItem,
  "tipo" | "marca" | "marcaGaza" | "marcaBO" | "gaza" | "bo"
>

/** Marcas por capa activa (las capas de taller propio no tienen marca). */
function marcasPorCapa(c: CaracMarca): Array<{ capa: string; marca: MarcaCortina }> {
  if (c.tipo === "Mosquera") return [{ capa: "Mosquera", marca: "MG" }]
  const partes: Array<{ capa: string; marca: MarcaCortina }> = []
  // El aluminio en sí es siempre HD
  if (c.tipo === "Aluminio") partes.push({ capa: "Aluminio", marca: "HD" })
  if (c.gaza?.activa && c.marcaGaza) partes.push({ capa: "Gaza", marca: c.marcaGaza })
  if (c.tipo !== "Aluminio" && c.bo?.activa && c.marcaBO) {
    partes.push({ capa: "B.O.", marca: c.marcaBO })
  }
  return partes
}

/** Marca general que se guarda en la cortina (la de la primera capa con marca). */
export function marcaPrincipalCortina(c: CaracMarca): MarcaCortina | undefined {
  if (c.tipo === "Tradicional") return undefined
  return marcasPorCapa(c)[0]?.marca
}

/**
 * Texto de la marca para mostrar: "RS", o "Gaza: RS • B.O.: HD" si las capas difieren.
 * Usa las marcas de cada capa; la marca general solo como respaldo (datos viejos).
 */
export function textoMarcaCortina(c: CaracMarca | null | undefined): string | null {
  if (!c) return null
  const partes = marcasPorCapa(c)
  if (partes.length === 0) return c.marca || null
  if (partes.every((p) => p.marca === partes[0].marca)) return partes[0].marca
  return partes.map((p) => `${p.capa}: ${p.marca}`).join(" • ")
}
