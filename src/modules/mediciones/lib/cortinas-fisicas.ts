// Módulo: Mediciones
// Cortinas físicas de una abertura: cada capa (Gaza / B.O.) separada en sus paños o tramos.
// Ej: una abertura con Gaza Roller de 2 paños + B.O. Roller de 1 tramo = 3 cortinas físicas.
// Se usa para presupuestar cada cortina por separado (cada capa tiene su forma de calcular el precio).

import {
  obtenerModosCapa,
  type ICaracteristicasItem,
  type IConfigMotor,
  type MarcaCortina,
  type ModoCortina,
} from "../types"

export type CapaCortina = "GAZA" | "BO"

export type TipoCapaFisica =
  | "Roller"
  | "Roller Mot"
  | "Bandas verticales"
  | "Tradicional"
  | "Tradicional Mot"
  | "Aluminio"
  | "Roller Noche total"
  | "Mosquera"

export interface ICortinaFisica {
  capa: CapaCortina
  /** Paño / tramo dentro de la capa (desde 0) */
  indice: number
  /** Cantidad de cortinas de la capa */
  total: number
  tipoCapa: TipoCapaFisica
  marca: MarcaCortina | null
  modo: ModoCortina
  ancho: number
  alto: number
  nombreTela: string
  telaId: string | null
  colorTela: string | null
  motor: IConfigMotor | null
}

/** Tipo de cortina de cada capa según el tipo y subtipo de la abertura. */
export function tipoDeCapa(c: ICaracteristicasItem, capa: CapaCortina): TipoCapaFisica | null {
  const tipo = c.tipo
  const sub = c.subtipoMotorizada
  if (capa === "GAZA") {
    if (!c.gaza?.activa) return null
    if (tipo === "Tradicional") return "Tradicional"
    if (tipo === "Roller" || tipo === "Bandas verticales") {
      return (c.tipoCapaGaza as TipoCapaFisica) || (tipo === "Bandas verticales" ? "Bandas verticales" : "Roller")
    }
    if (tipo === "Aluminio" || tipo === "Roller Noche total" || tipo === "Noche total") {
      return (c.tipoCapaGaza as TipoCapaFisica) || "Tradicional"
    }
    if (tipo === "Motorizada") {
      if (sub === "Bandas Verticales y Roller Mot") return "Bandas verticales"
      if (sub?.startsWith("Roller Mot")) return "Roller Mot"
      return "Tradicional Mot"
    }
    return null
  }

  if (tipo === "Aluminio") return "Aluminio"
  if (tipo === "Mosquera") return "Mosquera"
  if (tipo === "Roller Noche total" || tipo === "Noche total") return "Roller Noche total"
  if (!c.bo?.activa) return null
  if (tipo === "Tradicional") return c.formatoBO === "Roller" ? "Roller" : "Tradicional"
  if (tipo === "Roller" || tipo === "Bandas verticales") {
    return (c.tipoCapaBO as TipoCapaFisica) || (tipo === "Bandas verticales" ? "Bandas verticales" : "Roller")
  }
  if (tipo === "Motorizada") {
    switch (sub) {
      case "Tradicional Mot":
        return "Tradicional Mot"
      case "Tradicional Mot y Tradicional":
      case "Roller Mot y Tradicional":
        return "Tradicional"
      case "Tradicional Mot y Roller":
      case "Roller Mot y Roller":
        return "Roller"
      default:
        return "Roller Mot"
    }
  }
  return null
}

/** Las capas Tradicional y Aluminio son una sola cortina; el resto se separa por paño/tramo. */
function seSeparaPorPanos(tipoCapa: TipoCapaFisica): boolean {
  return tipoCapa !== "Tradicional" && tipoCapa !== "Tradicional Mot" && tipoCapa !== "Aluminio"
}

const r3 = (n: number) => Math.round(n * 1000) / 1000

function anchosDeCapa(total: number, anchos: number[] | undefined, anchoCapa: number): number[] {
  const lista = (anchos || []).slice(0, total).map((v) => Number(v) || 0)
  if (lista.length === total && lista.every((v) => v > 0)) return lista
  return Array.from({ length: total }, (_, i) => lista[i] || r3(anchoCapa / total))
}

/** Separa la abertura en sus cortinas físicas. Devuelve [] si la medición no tiene capas. */
export function cortinasFisicas(
  c: ICaracteristicasItem | null | undefined,
  anchoAbertura: number,
  altoAbertura: number
): ICortinaFisica[] {
  if (!c?.tipo) return []
  const resultado: ICortinaFisica[] = []

  const agregarCapa = (capa: CapaCortina) => {
    const tipoCapa = tipoDeCapa(c, capa)
    if (!tipoCapa) return
    const config = capa === "GAZA" ? c.gaza : c.bo
    const marca =
      tipoCapa === "Aluminio"
        ? "HD"
        : tipoCapa === "Mosquera" || tipoCapa === "Roller Noche total"
        ? "MG" // los mosquiteros y la Noche Total son siempre MagicRoll
        : ((capa === "GAZA" ? c.marcaGaza : c.marcaBO) ?? c.marca ?? null)
    const motor = (capa === "GAZA" ? c.motorGaza : c.motorBO) ?? null
    const anchoCapa = Number(config?.ancho) || anchoAbertura
    const altoCapa = Number(config?.alto) || altoAbertura
    const comun = {
      capa,
      tipoCapa,
      marca,
      alto: altoCapa,
      nombreTela: config?.nombreTela || "",
      telaId: config?.telaId ?? null,
      colorTela: config?.colorTela ?? null,
      motor,
    }

    if (!seSeparaPorPanos(tipoCapa)) {
      resultado.push({ ...comun, indice: 0, total: 1, modo: "Normal", ancho: anchoCapa })
      return
    }

    const total =
      capa === "GAZA" ? Number(c.gaza?.panos) || 1 : Number(c.bo?.tramos) || 1
    const anchos = anchosDeCapa(
      total,
      capa === "GAZA" ? c.gaza?.anchosPanos : c.bo?.anchosTramos,
      anchoCapa
    )
    const modos =
      capa === "GAZA"
        ? obtenerModosCapa(c.modosPanosGaza, c.soloTelaPanosGaza)
        : obtenerModosCapa(c.modosTramosBO, c.soloTelaTramosBO)
    for (let i = 0; i < total; i++) {
      resultado.push({ ...comun, indice: i, total, modo: modos[i] || "Normal", ancho: anchos[i] })
    }
  }

  agregarCapa("GAZA")
  agregarCapa("BO")
  return resultado
}

/** Medidas de una cortina física (para trasladar cambios de la medición al presupuesto). */
export function medidasCortinaFisica(
  c: ICaracteristicasItem | null | undefined,
  anchoAbertura: number,
  altoAbertura: number,
  capa: CapaCortina,
  indice: number
): { ancho: number; alto: number } | null {
  const cortina = cortinasFisicas(c, anchoAbertura, altoAbertura).find(
    (k) => k.capa === capa && k.indice === indice
  )
  return cortina ? { ancho: cortina.ancho, alto: cortina.alto } : null
}

/** Nombre corto de la capa: "Gaza", "B.O.", "Aluminio", "Mosquera". */
export function nombreCapa(capa: CapaCortina, tipoCapa?: TipoCapaFisica | null): string {
  if (tipoCapa === "Aluminio" || tipoCapa === "Mosquera") return tipoCapa
  return capa === "GAZA" ? "Gaza" : "B.O."
}

/** Etiqueta de la cortina física, ej: "B.O. Roller T2" o "Gaza Tradicional". */
export function etiquetaCortinaFisica(k: Pick<ICortinaFisica, "capa" | "tipoCapa" | "indice" | "total">): string {
  const base = nombreCapa(k.capa, k.tipoCapa)
  const tipo = k.tipoCapa === "Aluminio" || k.tipoCapa === "Mosquera" ? "" : ` ${k.tipoCapa}`
  const sufijo = k.total > 1 ? ` ${k.capa === "GAZA" ? "C" : "T"}${k.indice + 1}` : ""
  return `${base}${tipo}${sufijo}`
}
