// Módulo: Presupuestos
// Precio del Toldo Pérgola Barrio (PRINTEMPS): insumos de la planilla de Google Sheets del proveedor
// (copiada en precios_planilla) + precios propios (puente de media, alambre y ménsulas de stock) + madera
// (precio a mano de la maderera). Precio = insumos × 1,5 + instalación + confección (a mano).
//
// Con X = divisiones del ancho + 1:
//  - Tela: paños = ⌈(ancho + 0,15) ÷ ancho de la tela⌉; metros = paños × (largo + 0,20)
//  - Pitón cerrado del 10: 2 × X + 3 (los "pitones abiertos" van con el cerrado) · Tensor M8: X · Ojal zincado 25: X
//  - Soga nylon con alma 6 mm: ⌈2 × largo + 1,5 × alto desde el piso⌉ m · Roldana simple y doble n° 4: 1 c/u
//  - Puente de media: 1 · Madera listón 3 × 1,5: se compran "ancho" metros (precio total a mano) · Ata soga reforzado: 1 · Alambre: (largo + 0,20) × X m
//  - Cubre toldo: cubre techo aluminio (ancho + 0,10) ml + ménsulas (cantidad de la medición)

import type { IToldoConfig } from "@/modules/mediciones/lib/toldos"
import type { LineaDesglose, OpcionesCalculo, ResultadoCalculoRS } from "./lista-precios-rs"

/** Precio de un insumo de la planilla del proveedor */
export interface IPrecioInsumoPT {
  descripcion: string
  precio: number
}

export const FACTOR_INSUMOS_TOLDO = 1.5
/** Precios propios por defecto (se pueden cambiar en la calculadora) */
export const PRECIO_PUENTE_MEDIA = 920
export const PRECIO_ALAMBRE_METRO = 500
export const PRECIO_MENSULA = Math.round((53539 / 24) * 100) / 100

// Insumos de la planilla de PRINTEMPS (se buscan por el comienzo del texto, sin tildes ni mayúsculas)
const INSUMOS = {
  piton: "PITON CERRADO PARA TARUGO DEL 10",
  tensor: "TENSOR M 8",
  ojal: "OJAL ZINCADO Nº 25 X UNIDAD",
  soga: "SOGA NYLON CON ALMA 6 mm",
  roldanaSimple: "ROLDANA SIMPLE Nº 4",
  roldanaDoble: "ROLDANA DOBLE Nº 4",
  ataSoga: "ATA SOGA REFORZADO",
  cubreTecho: "CUBRE TECHO ALUMINIO PARA TOLDOS X ML",
}

interface TelaPlanilla {
  ancho: number
  insumo: string
}

/** Telas por metro de la planilla según la tela de la medición */
const TELAS_ACRILICA: Record<string, TelaPlanilla> = {
  "x1,20": { ancho: 1.2, insumo: "telas ACRILICA SAULEDA X 1,20" },
  "x1,53": { ancho: 1.5, insumo: "telas ACRILICA SAULEDA X 1,50" },
  x2: { ancho: 2, insumo: "telas ACRILICA SAULEDA X 2,00" },
}
const TELAS_VINILICA: Record<string, TelaPlanilla> = {
  "Sembra 7000": { ancho: 2.2, insumo: "telas VINILICA SEMBRA 7.000 x 2,20" },
  "Sembra 11000": { ancho: 1.5, insumo: "telas VINILICA SEMBRA 11.000 x 1,50" },
  "Screen Exterior": { ancho: 3.1, insumo: "SEMBRA SCREEN EXTERIOR X 3,10" },
  Blackout: { ancho: 2.5, insumo: "telas BLACKOUT EXTERIOR X 2,50" },
}
/** Microperforado: viene en varios anchos (no todos los colores en todos) */
const MICROPERFORADO: TelaPlanilla[] = [
  { ancho: 1.5, insumo: "telas MICROPERFORADA SEMBRA X 1,50" },
  { ancho: 3, insumo: "telas MICROPERFORADA SEMBRA X 3,00" },
  { ancho: 3.1, insumo: "telas MICROPERFORADA SEMBRA X 3,10" },
]
const MICROPERFORADO_SOLO_ANCHO = ["Azul Fuerza Aérea", "Natural", "Marrón", "Mostaza", "Teja"]
const MEDIA_SOMBRA: TelaPlanilla = { ancho: 4.2, insumo: "MEDIA SOMBRA AGRIPLAS X 4,20" }

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

/** Insumo de la planilla cuyo texto empieza así (si hay varios, el de texto más corto: el precio por metro, no el rollo). */
export function buscarInsumoPT(precios: IPrecioInsumoPT[], comienzo: string): IPrecioInsumoPT | null {
  const c = norm(comienzo)
  return (
    precios
      .filter((p) => norm(p.descripcion).startsWith(c))
      .sort((a, b) => a.descripcion.length - b.descripcion.length)[0] ?? null
  )
}

/** Anchos de tela posibles para la tela del toldo (más de uno solo en el microperforado). */
export function telasPosibles(toldo: Partial<IToldoConfig> | null | undefined): TelaPlanilla[] {
  if (!toldo?.tela) return []
  if (toldo.tela === "Media sombra") return [MEDIA_SOMBRA]
  if (toldo.tela === "Acrílica") {
    if (toldo.lineaTela === "Muaari Lisas") return [{ ancho: 1.6, insumo: "telas MUAARI LISA X 1,60" }]
    if (toldo.lineaTela === "Muaari Rayadas") return [{ ancho: 1.2, insumo: "telas MUAARI FANTASIA X 1,20" }]
    const t = TELAS_ACRILICA[toldo.tipoTela ?? ""]
    return t ? [t] : []
  }
  if (toldo.tipoTela === "Microperforado") {
    return toldo.colorTela && MICROPERFORADO_SOLO_ANCHO.includes(toldo.colorTela)
      ? MICROPERFORADO.filter((m) => m.ancho >= 3)
      : MICROPERFORADO
  }
  const t = TELAS_VINILICA[toldo.tipoTela ?? ""]
  return t ? [t] : []
}

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`
const fmtM = (n: number) => (Math.round(n * 100) / 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })
const r2 = (n: number) => Math.round(n * 100) / 100

export interface EntradaPergola {
  toldo: Partial<IToldoConfig> | null | undefined
  ancho: number
  /** Largo del toldo (el alto del ítem) */
  largo: number
}

/** Tela elegida: la de la opción (microperforado) o la más barata para la medida. */
function telaParaCalculo(entrada: EntradaPergola, opciones: OpcionesCalculo, precios: IPrecioInsumoPT[]) {
  const posibles = telasPosibles(entrada.toldo)
  const calcular = (t: TelaPlanilla) => {
    const panos = Math.ceil((entrada.ancho + 0.15) / t.ancho - 1e-9)
    const metros = r2(panos * (entrada.largo + 0.2))
    const item = buscarInsumoPT(precios, t.insumo)
    return { ...t, panos, metros, item, importe: item ? metros * item.precio : Infinity }
  }
  const candidatas = posibles.map(calcular)
  const elegida =
    candidatas.find((c) => opciones.anchoTela !== undefined && opciones.anchoTela !== null && c.ancho === opciones.anchoTela) ??
    [...candidatas].sort((a, b) => a.importe - b.importe)[0]
  return { elegida: elegida ?? null, candidatas }
}

export function calcularToldoPergola(
  entrada: EntradaPergola,
  opcionesElegidas: OpcionesCalculo,
  precios: IPrecioInsumoPT[]
): ResultadoCalculoRS & { metrosMadera: number; anchosTela: number[] } {
  const t = entrada.toldo ?? {}
  const X = (t.divisiones?.length ?? 1) + 1
  const largo = entrada.largo
  const ancho = entrada.ancho
  const altoPiso = t.altoPiso ?? 0
  const avisos: string[] = []
  const desglose: LineaDesglose[] = []
  let insumos = 0

  const { elegida, candidatas } = telaParaCalculo(entrada, opcionesElegidas, precios)
  const opciones: OpcionesCalculo = {
    ...opcionesElegidas,
    anchoTela: elegida?.ancho ?? null,
    precioPuente: opcionesElegidas.precioPuente ?? PRECIO_PUENTE_MEDIA,
    precioAlambre: opcionesElegidas.precioAlambre ?? PRECIO_ALAMBRE_METRO,
    precioMensula: opcionesElegidas.precioMensula ?? PRECIO_MENSULA,
    precioMadera: opcionesElegidas.precioMadera ?? 0,
    instalacion: opcionesElegidas.instalacion ?? 0,
    confeccion: opcionesElegidas.confeccion ?? 0,
  }

  const agregar = (concepto: string, cantidad: number, unidad: string, precio: number, detalleExtra = "") => {
    const importe = r2(cantidad * precio)
    insumos += importe
    desglose.push({
      concepto,
      detalle: `${fmtM(cantidad)} ${unidad} × ${fmt$(precio)}${detalleExtra ? ` · ${detalleExtra}` : ""}`.slice(0, 200),
      importe,
    })
  }
  const dePlanilla = (concepto: string, insumo: string, cantidad: number, unidad: string, detalle = "") => {
    const item = buscarInsumoPT(precios, insumo)
    if (!item) avisos.push(`No está en la planilla: "${insumo}" (va en $0).`)
    agregar(concepto, cantidad, unidad, item?.precio ?? 0, detalle)
  }

  // Tela
  if (!elegida) {
    avisos.push("La tela de la medición no tiene precio en la planilla (falta elegir la tela).")
  } else {
    if (!elegida.item) avisos.push(`No está en la planilla: "${elegida.insumo}" (va en $0).`)
    agregar(
      "Tela",
      elegida.metros,
      "m",
      elegida.item?.precio ?? 0,
      `${elegida.panos} paño(s) de ${fmtM(elegida.ancho)} m × (largo ${fmtM(largo)} + 0,20)`
    )
  }

  dePlanilla("Pitón cerrado del 10", INSUMOS.piton, 2 * X + 3, "u", `2 × ${X} + 3`)
  dePlanilla("Tensor M8", INSUMOS.tensor, X, "u")
  dePlanilla("Ojal zincado n° 25", INSUMOS.ojal, X, "u")
  const metrosSoga = Math.ceil(2 * largo + 1.5 * altoPiso - 1e-9)
  dePlanilla("Soga nylon con alma 6 mm", INSUMOS.soga, metrosSoga, "m", `2 × ${fmtM(largo)} + 1,5 × ${fmtM(altoPiso)}`)
  dePlanilla("Roldana simple n° 4", INSUMOS.roldanaSimple, 1, "u")
  dePlanilla("Roldana doble n° 4", INSUMOS.roldanaDoble, 1, "u")
  agregar("Puente de media", 1, "u", opciones.precioPuente ?? PRECIO_PUENTE_MEDIA)
  // La madera se carga con el precio total que pasa la maderera
  const madera = opciones.precioMadera ?? 0
  insumos += madera
  desglose.push({ concepto: "Madera listón 3 × 1,5", detalle: `comprar ${fmtM(ancho)} m · precio total de la maderera`, importe: madera })
  dePlanilla("Ata soga reforzado", INSUMOS.ataSoga, 1, "u")
  const metrosAlambre = r2((largo + 0.2) * X)
  agregar("Alambre", metrosAlambre, "m", opciones.precioAlambre ?? PRECIO_ALAMBRE_METRO, `(${fmtM(largo)} + 0,20) × ${X}`)

  if (t.cubreToldo) {
    const color = t.colorCubreToldo ? ` ${t.colorCubreToldo.toLowerCase()}` : ""
    dePlanilla(`Cubre techo aluminio${color}`, INSUMOS.cubreTecho, r2(ancho + 0.1), "ml", `ancho + 0,10`)
    agregar(`Ménsula soportes escuadra 20x25${color}`, t.mensulasCubreToldo ?? 0, "u", opciones.precioMensula ?? PRECIO_MENSULA)
  }

  insumos = r2(insumos)
  const conGanancia = r2(insumos * FACTOR_INSUMOS_TOLDO)
  const instalacion = opciones.instalacion ?? 0
  const confeccion = opciones.confeccion ?? 0
  desglose.push({ concepto: "Insumos × 1,5", detalle: `${fmt$(insumos)} × 1,5`, importe: r2(conGanancia - insumos) })
  if (confeccion > 0) desglose.push({ concepto: "Confección", detalle: "a mano", importe: confeccion })
  if (instalacion > 0) desglose.push({ concepto: "Instalación", detalle: "a mano", importe: instalacion })

  if (!opciones.precioMadera) avisos.push(`Falta el precio de la madera (comprar ${fmtM(ancho)} m de listón 3 × 1,5).`)
  if (!confeccion) avisos.push("Falta cargar la confección.")
  if (!instalacion) avisos.push("Falta cargar la instalación.")

  return {
    precio: Math.round(conGanancia + instalacion + confeccion),
    desglose,
    formula: "insumos × 1,5 + confección + instalación",
    avisos: avisos.slice(0, 10),
    opciones,
    metrosMadera: ancho,
    anchosTela: candidatas.map((c) => c.ancho),
  }
}
