// Módulo: Presupuestos
// Precio del Toldo Vertical con barra frente TP1 (PRINTEMPS): insumos de la planilla del proveedor (precios_planilla)
// + lo que se carga a mano. Precio = insumos × 1,5 + domótica × 2 + confección + instalación.
//
//  - Manual: máquina (polifuncional 7:1 con escuadra o súper 11:1) + manija nacional de la medida elegida × cantidad
//  - Motorizado: motor y control a mano (van con los insumos); Oximo con el precio de la planilla. Domótica a mano, × 2
//  - Tubo 70 u 80: ⌈ancho⌉ m · Frente TP1: ⌈ancho⌉ m, al largo que tenga precio (5 m se cobra como 6)
//  - Calotas: 1 cuadrada y 1 redonda del tubo 70; para tubo 80, las dos al precio de la de acople del tubo 70
//  - Por sujeción al piso: fijación rebatible + mosquetón perita Nº8 + mosquetón con cadena (incluye tornillo y tuerca)
//  - Tapa TP1 simple (sin tensor) o con pasacable (con tensor)
//  - Con tensor: soporte de fijación del cable, cable 2,5 mm (alto + 0,2) × 2 y 2 prensa linga 5 mm
//  - Tela: (alto + 0,6 con pollerita o + 0,4 sin) × ⌈ancho ÷ ancho de tela⌉ · Spaghetti fino: 3 × ancho
//  - Soporte plano y escuadra: pares de la medición · Brazo Caduta: a mano (con los insumos)
//  - Cubre toldo: cubre techo ⌈ancho del cubre toldo + 0,10⌉ ml + perchas al precio de la ménsula
//
// Solo tela (Vertical TP1 y TP2, Proyección; método PT_SOLO_TELA): tela + spaghetti, y con TP1 lo que se haya elegido:
// tensor (soporte, cable, prensas y tapa con pasacable) y sujeción al piso. Precio = insumos × 1,5 + confección + instalación.

import {
  descripcionMotorToldo,
  modeloMotorValido,
  modelosDeMotorToldo,
  normalizarMotorToldo,
  type IToldoConfig,
  type MaquinaToldo,
  type MedidaManijaToldo,
} from "@/modules/mediciones/lib/toldos"
import type { LineaDesglose, OpcionesCalculo, ResultadoCalculoRS } from "./lista-precios-rs"
import {
  FACTOR_INSUMOS_TOLDO,
  PRECIO_MENSULA,
  buscarInsumoPT,
  metrosCubreTecho,
  telasPosibles,
  type IPrecioInsumoPT,
} from "./toldo-pergola"

export const FACTOR_DOMOTICA_TOLDO = 2
/** Metros de frente TP1 que se venden en barra; más largo se cobra por metro */
const LARGOS_FRENTE_TP1 = [2, 3, 4, 5, 6]

// Insumos de la planilla de PRINTEMPS (se buscan por el comienzo del texto, sin tildes ni mayúsculas)
const INSUMOS = {
  tubo70: "TUBO 70 NERVADO",
  tubo80: "TUBO 80 NERVADO",
  frente: "FRENTE TP1 PARA CORTINA VERTICAL",
  calotaCuadrada: "CALOTA CUADRADA PARA TUBO 70",
  calotaRedonda: "CALOTA REDONDA PARA TUBO 70",
  calotaAcople: "CALOTA DE ACOPLE PARA TUBO 70",
  fijacionPiso: "FIJACION REB, A PISO",
  perita: "MOSQUETON PERITA Nº8",
  mosquetonCadena: "MOSQUETON CON CADENA",
  tapaSimple: "TAPAS TP1",
  tapaPasacable: "Tapa Frente TP1 - Con Pasacable",
  soporteCable: "SOPORTE PARA FIJACION CABLE DE ACERO",
  cable: "CABLE DE ACERO 2,5 mm x ml",
  prensa: "PRENSA LINGA 5 mm",
  spaghetti: "SPAGUETTI FINO TUBO NERVADO",
  soportePlano: "JUEGO DE ESCUADRAS PLANAS",
  escuadra: "JUEGO DE ESCUADRAS BLANCAS O NEGRAS",
  cubreTecho: "CUBRE TECHO ALUMINIO PARA TOLDOS X ML",
  oximo: "MOTOR OXIMO ANTI ENGANCHE",
}

const MAQUINAS: Record<MaquinaToldo, string> = {
  "Máquina importada polifuncional": "MAQUINA POLIFUNCIONAL IMPORTADA 7:1 CON ESCUADRA",
  "Máquina importada súper": "MAQUINA SUPER 11:1 SIN ESCUADRAS",
}

const MANIJAS: Record<MedidaManijaToldo, string> = {
  "1": "MANIJA DE 1,00 m, NEGRA / BLANCA NACIONAL",
  "1,25": "MANIJA DE 1,25 m. NEGRA / BLANCA NACIONAL",
  "1,5": "MANIJA DE 1,50 m. NEGRA / BLANCA NACIONAL",
  "1,75": "MANIJA DE 1,75 m. NEGRA / BLANCA NACIONAL",
  "2": "MANIJA DE 2,00 m. NEGRA / BLANCA NACIONAL",
  "2,5": "MANIJA DE 2,50 m. NEGRA / BLANCA NACIONAL",
}

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`
const fmtM = (n: number) => (Math.round(n * 100) / 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })
const r2 = (n: number) => Math.round(n * 100) / 100
/** Al metro entero de arriba (sin que un 3,00 guardado como 3,0000001 pase a 4) */
const metroEntero = (n: number) => Math.ceil(n - 1e-9)

export interface EntradaVerticalTP1 {
  toldo: Partial<IToldoConfig> | null | undefined
  ancho: number
  alto: number
}

/**
 * Frente TP1: el largo más corto con precio en la planilla que cubra el ancho (no hay barra de 5 m: va la de 6).
 * Hasta 1 m y más de 6 m se cobra por metro.
 */
function frenteTP1(ancho: number, precios: IPrecioInsumoPT[]) {
  const metros = metroEntero(ancho)
  for (const largo of metros > 1 ? LARGOS_FRENTE_TP1 : []) {
    if (largo < metros) continue
    const barra = buscarInsumoPT(precios, `${INSUMOS.frente} x ${largo},00 m`)
    if (barra) return { metros: largo, importe: barra.precio, detalle: `${fmtM(ancho)} m → barra de ${largo} m`, encontrado: true }
  }
  const porMetro = buscarInsumoPT(precios, INSUMOS.frente)
  return {
    metros,
    importe: metros * (porMetro?.precio ?? 0),
    detalle: `${metros} m × ${fmt$(porMetro?.precio ?? 0)}`,
    encontrado: Boolean(porMetro),
  }
}

export function calcularToldoVerticalTP1(
  entrada: EntradaVerticalTP1,
  opcionesElegidas: OpcionesCalculo,
  precios: IPrecioInsumoPT[]
): ResultadoCalculoRS {
  const t = entrada.toldo ?? {}
  const completo = !t.soloTela
  const { ancho, alto } = entrada
  const avisos: string[] = []
  const desglose: LineaDesglose[] = []
  let insumos = 0

  // Tela: la de la opción (microperforado) o la más barata para la medida
  const extraTela = t.pollerita ? 0.6 : 0.4
  const telas = telasPosibles(t).map((tela) => {
    const panos = Math.ceil(ancho / tela.ancho - 1e-9)
    const metros = r2(panos * (alto + extraTela))
    const item = buscarInsumoPT(precios, tela.insumo)
    return { ...tela, panos, metros, item, importe: item ? metros * item.precio : Infinity }
  })
  const tela =
    telas.find((c) => opcionesElegidas.anchoTela !== undefined && opcionesElegidas.anchoTela !== null && c.ancho === opcionesElegidas.anchoTela) ??
    [...telas].sort((a, b) => a.importe - b.importe)[0]

  const opciones: OpcionesCalculo = {
    ...opcionesElegidas,
    anchoTela: tela?.ancho ?? null,
    precioMensula: opcionesElegidas.precioMensula ?? PRECIO_MENSULA,
    precioMotor: opcionesElegidas.precioMotor ?? 0,
    precioDomotica: opcionesElegidas.precioDomotica ?? 0,
    precioBrazoCaduta: opcionesElegidas.precioBrazoCaduta ?? 0,
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
  const aMano = (concepto: string, detalle: string, importe: number) => {
    insumos += importe
    desglose.push({ concepto, detalle: detalle.slice(0, 200), importe })
  }

  // Mecanismo
  if (!completo) {
    // Solo tela: no lleva mecanismo
  } else if (t.mecanismo === "Manual") {
    if (t.maquina) dePlanilla(t.maquina, MAQUINAS[t.maquina], 1, "u")
    else avisos.push("Falta elegir la máquina en la medición.")
    if (t.medidaManija) dePlanilla(`Manija nacional x${t.medidaManija}`, MANIJAS[t.medidaManija], t.manijas ?? 1, "u")
    else avisos.push("Falta elegir la medida de la manija en la medición (va en $0).")
  } else if (t.mecanismo === "Motorizado") {
    const motor = normalizarMotorToldo(t.motor)
    if (motor === "Oximo") {
      dePlanilla("Motor Oximo", INSUMOS.oximo, 1, "u", "incluye el control")
    } else {
      aMano("Motor y control", `${descripcionMotorToldo(t)} · a mano`, opciones.precioMotor ?? 0)
      if (!opciones.precioMotor) avisos.push(`Falta el precio del motor: ${descripcionMotorToldo(t)}.`.slice(0, 200))
      if (!motor) avisos.push("Falta elegir el motor en la medición.")
      else if (modelosDeMotorToldo(motor).length > 0 && !modeloMotorValido(t)) {
        avisos.push("Falta elegir el modelo del motor en la medición.")
      }
    }
  } else {
    avisos.push("Falta elegir el mecanismo en la medición.")
  }

  // Tubo, calotas y frente
  if (completo) {
    const metrosTubo = metroEntero(ancho)
    if (t.cano === "80") {
      dePlanilla("Tubo 80 nervado", INSUMOS.tubo80, metrosTubo, "m", `ancho ${fmtM(ancho)} redondeado`)
      dePlanilla("Calotas para tubo 80", INSUMOS.calotaAcople, 2, "u", "cuadrada y redonda")
    } else {
      if (!t.cano) avisos.push("Falta elegir el caño en la medición (se calcula con tubo 70).")
      dePlanilla("Tubo 70 nervado", INSUMOS.tubo70, metrosTubo, "m", `ancho ${fmtM(ancho)} redondeado`)
      dePlanilla("Calota cuadrada tubo 70", INSUMOS.calotaCuadrada, 1, "u")
      dePlanilla("Calota redonda tubo 70", INSUMOS.calotaRedonda, 1, "u")
    }
    const frente = frenteTP1(ancho, precios)
    if (!frente.encontrado) avisos.push(`No está en la planilla: "${INSUMOS.frente}" (va en $0).`)
    aMano("Frente TP1", frente.detalle, r2(frente.importe))
  }

  // Sujeción al piso
  const sujeciones = t.sujecionPiso ?? 0
  if (sujeciones > 0) {
    dePlanilla("Fijación rebatible a piso", INSUMOS.fijacionPiso, sujeciones, "u", "por sujeción")
    dePlanilla("Mosquetón perita Nº8", INSUMOS.perita, sujeciones, "u", "por sujeción")
    dePlanilla("Mosquetón con cadena", INSUMOS.mosquetonCadena, sujeciones, "u", "incluye tornillo y tuerca")
  }

  // Tapa y tensor
  if (t.tensor) {
    dePlanilla("Tapa TP1 con pasacable", INSUMOS.tapaPasacable, 1, "par")
    dePlanilla("Soporte fijación cable de acero", INSUMOS.soporteCable, 1, "par")
    const metrosCable = r2((alto + 0.2) * 2)
    dePlanilla("Cable de acero 2,5 mm", INSUMOS.cable, metrosCable, "m", `(${fmtM(alto)} + 0,20) × 2`)
    dePlanilla("Prensa linga 5 mm", INSUMOS.prensa, 2, "u")
  } else if (completo) {
    dePlanilla("Tapa TP1 simple", INSUMOS.tapaSimple, 1, "par")
  }

  // Tela y spaghetti
  if (!tela) {
    avisos.push("La tela de la medición no tiene precio en la planilla (falta elegir la tela).")
  } else {
    if (!tela.item) avisos.push(`No está en la planilla: "${tela.insumo}" (va en $0).`)
    agregar(
      "Tela",
      tela.metros,
      "m",
      tela.item?.precio ?? 0,
      `${tela.panos} paño(s) de ${fmtM(tela.ancho)} m × (${completo ? "alto" : "largo"} ${fmtM(alto)} +${fmtM(extraTela)}${t.pollerita ? " con pollerita" : ""})`
    )
  }
  dePlanilla("Spaghetti fino", INSUMOS.spaghetti, r2(3 * ancho), "m", "3 × ancho")

  // Adicionales de la medición
  if ((t.soportePlano ?? 0) > 0) dePlanilla("Soporte plano", INSUMOS.soportePlano, t.soportePlano ?? 0, "par")
  if ((t.escuadra ?? 0) > 0) dePlanilla("Escuadra", INSUMOS.escuadra, t.escuadra ?? 0, "par")
  if (t.brazoCaputa) {
    aMano("Brazo Caduta", "a mano", opciones.precioBrazoCaduta ?? 0)
    if (!opciones.precioBrazoCaduta) avisos.push("Falta el precio del brazo Caduta.")
  }
  if (t.cubreToldo) {
    const anchoCubre = t.anchoCubreToldo || ancho
    dePlanilla("Cubre techo aluminio", INSUMOS.cubreTecho, metrosCubreTecho(anchoCubre), "ml", `⌈${fmtM(anchoCubre)} + 0,10⌉`)
    agregar("Perchas (ménsulas)", t.perchas ?? 0, "u", opciones.precioMensula ?? PRECIO_MENSULA)
  }

  insumos = r2(insumos)
  const conGanancia = r2(insumos * FACTOR_INSUMOS_TOLDO)
  const lleveDomotica = t.mecanismo === "Motorizado" && Boolean(t.domotica)
  const domotica = lleveDomotica ? r2((opciones.precioDomotica ?? 0) * FACTOR_DOMOTICA_TOLDO) : 0
  const instalacion = opciones.instalacion ?? 0
  const confeccion = opciones.confeccion ?? 0
  desglose.push({ concepto: "Insumos × 1,5", detalle: `${fmt$(insumos)} × 1,5`, importe: r2(conGanancia - insumos) })
  if (domotica > 0) desglose.push({ concepto: "Domótica × 2", detalle: `${fmt$(opciones.precioDomotica ?? 0)} × 2`, importe: domotica })
  if (confeccion > 0) desglose.push({ concepto: "Confección", detalle: "a mano", importe: confeccion })
  if (instalacion > 0) {
    desglose.push({ concepto: "Instalación", detalle: t.cubreToldo ? "a mano · incluye cubre techo" : "a mano", importe: instalacion })
  }

  if (lleveDomotica && !opciones.precioDomotica) avisos.push("Falta el precio de la domótica.")
  if (!confeccion) avisos.push("Falta cargar la confección.")
  if (!instalacion) avisos.push("Falta cargar la instalación.")

  return {
    precio: Math.round(conGanancia + domotica + instalacion + confeccion),
    desglose,
    formula: completo ? "insumos × 1,5 + domótica × 2 + confección + instalación" : "insumos × 1,5 + confección + instalación",
    avisos: avisos.slice(0, 10),
    opciones,
  }
}

/** Solo tela: Vertical (TP1 o TP2) y Proyección. Suma solo lo elegido en la medición. */
export function calcularToldoSoloTela(
  entrada: EntradaVerticalTP1,
  opciones: OpcionesCalculo,
  precios: IPrecioInsumoPT[]
): ResultadoCalculoRS {
  return calcularToldoVerticalTP1({ ...entrada, toldo: { ...entrada.toldo, soloTela: true } }, opciones, precios)
}
