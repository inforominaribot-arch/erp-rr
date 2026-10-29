// Módulo: Comandas
// Datos de taller por capa de la abertura: caída, posición y mando de cada cortina, y si lleva ganchos
// (Tradicional común con riel: la cantidad la escribe el taller a mano en la comanda impresa).

import type { ICaracteristicasItem, LadoMando } from "@/modules/mediciones/types"
import { tipoDeCapa, type CapaCortina } from "@/modules/mediciones/lib/cortinas-fisicas"

export interface IDetalleCapaComanda {
  /** "Gasa" / "B.O." */
  capa: string
  tipo: string
  caida: string | null
  posicion: string | null
  /** Mando de cada cortina: "Derecha" o "C1 Izq · C2 Der" */
  mando: string | null
}

const corto = (m: LadoMando) => (m.startsWith("Izq") ? "Izq" : m.startsWith("Der") ? "Der" : m)

function textoMandos(mandos: LadoMando[] | undefined, total: number, prefijo: string): string | null {
  const lista = (mandos || []).slice(0, total).filter(Boolean)
  if (lista.length === 0) return null
  if (total <= 1) return lista[0]
  return lista.map((m, i) => `${prefijo}${i + 1} ${corto(m)}`).join(" · ")
}

/** ¿La Gasa va adelante? (como en el dibujo: por defecto Gasa adelante y B.O. atrás) */
function gazaAdelante(c: ICaracteristicasItem): boolean {
  if (c.tipo === "Aluminio" || c.tipo === "Roller Noche total" || c.tipo === "Noche total") return true
  if (c.posicionRollerBO === "Adelante") return false
  if (c.posicionRollerBO === "Atrás") return true
  if (c.posicionRoller === "Adelante") return true
  if (c.posicionRoller === "Atrás") return false
  return true
}

/** Caída, posición y mando de cada capa con cortinas (Gasa / B.O.). */
export function detalleCapasComanda(c: ICaracteristicasItem | null | undefined): IDetalleCapaComanda[] {
  if (!c?.tipo) return []
  const hayDos = Boolean(c.gaza?.activa) && Boolean(c.bo?.activa) && c.tipo !== "Aluminio"
  const resultado: IDetalleCapaComanda[] = []
  for (const capa of ["GAZA", "BO"] as CapaCortina[]) {
    const tipo = tipoDeCapa(c, capa)
    if (!tipo || tipo === "Aluminio" || tipo === "Mosquera") continue
    const esGaza = capa === "GAZA"
    const esRoller = tipo === "Roller" || tipo === "Roller Mot" || tipo === "Roller Noche total"
    const esTradicional = tipo === "Tradicional" || tipo === "Tradicional Mot"
    const total = esGaza ? Number(c.gaza?.panos) || 1 : Number(c.bo?.tramos) || 1
    const mando = esTradicional
      ? c.mando ?? null
      : textoMandos(esGaza ? c.mandosRollerGaza : c.mandosRollerBO ?? c.bo?.mandosRoller, total, "C")
    resultado.push({
      capa: esGaza ? "Gasa" : "B.O.",
      tipo,
      caida: esRoller ? ((esGaza ? c.caida : c.caidaBO) ?? "Por delante") : null,
      posicion: hayDos ? (gazaAdelante(c) === esGaza ? "Adelante" : "Atrás") : null,
      mando,
    })
  }
  return resultado.filter((d) => d.caida || d.posicion || d.mando)
}

/** Lleva ganchos: alguna capa Tradicional común (no motorizada) con riel. */
export function llevaGanchos(c: ICaracteristicasItem | null | undefined): boolean {
  if (!c?.tipo) return false
  const conTradicional = tipoDeCapa(c, "GAZA") === "Tradicional" || tipoDeCapa(c, "BO") === "Tradicional"
  return conTradicional && (c.sistema ?? "Riel") === "Riel"
}
