// Módulo: Presupuestos
// Precio del Toldo de Proyección completo (PRINTEMPS, método PT_PROYECCION): insumos de la planilla del proveedor
// (precios_planilla) + lo que se carga a mano. Precio = insumos × 1,5 + domótica × 2 + confección + instalación.
//
//  - Sistema brazo escondido (Barra Cuadra o Punta Punta, según la medición) del origen (Italiano, Italmec o Nacional)
//    y la medida de brazo elegidos, sin compensador. Ancho del sistema: el ancho redondeado para arriba; de 5,01 a
//    5,50 m va el de 5 m. Ya incluye brazos, soportes y pernos
//  - Manual: máquina importada 11:1 sin escuadra + manija nacional de la medida elegida × cantidad (0 = sin manija)
//  - Motorizado: motor y control a mano (van con los insumos). Domótica a mano, × 2
//  - Tubo 70 u 80 ⌈ancho⌉ m y calotas como en el Vertical · Frente TP2 ⌈ancho⌉ m · Tapas frente TP2 (color perfilería)
//  - Enganche terminal: italiano con brazo italiano, reforzado con Italmec y nacional
//  - Tela: (proyección + 0,6 con pollerita o + 0,4 sin) × ⌈ancho ÷ ancho de tela⌉
//  - Spaghetti fino 3 × ancho · Spaghetti grueso del frente 3 × ancho
//  - Cubre toldo: cubre techo ⌈ancho del cubre toldo + 0,10⌉ ml + 1 soporte por percha (el de Barra Cuadra o el común)
//    + 1 juego de tapas de cubre techo

import {
  ANCHO_MAX_PROYECCION,
  ORIGENES_BRAZO_PROYECCION,
  anchoSistemaPrecio,
  descripcionMotorToldo,
  errorMedidasProyeccion,
  modeloMotorValido,
  modelosDeMotorToldo,
  normalizarMotorToldo,
  opcionesBrazoProyeccion,
  type IToldoConfig,
  type OrigenBrazoProyeccion,
  type TipoProyeccion,
} from "@/modules/mediciones/lib/toldos"
import type { LineaDesglose, OpcionesCalculo, ResultadoCalculoRS } from "./lista-precios-rs"
import { FACTOR_INSUMOS_TOLDO, buscarInsumoPT, metrosCubreTecho, telasPosibles, type IPrecioInsumoPT } from "./toldo-pergola"
import { FACTOR_DOMOTICA_TOLDO, INSUMOS as INSUMOS_VERTICAL, MANIJAS } from "./toldo-vertical"

// Insumos de la planilla de PRINTEMPS (se buscan por el comienzo del texto, sin tildes ni mayúsculas)
const INSUMOS = {
  maquina: "MAQUINA IMPORTADA 11:1 SIN ESCUADRA",
  frente: "FRENTE TP 2 para toldo",
  tapasBlancas: "JUEGO DE TAPAS FRENTE DE TOLDO TP 2 BLANCAS",
  tapasNegras: "JUEGO DE TAPAS FRENTE DE TOLDO TP 2 NEGRAS",
  engancheItaliano: "JUEGO DE ENGANCHE TERMINAL ITALIANO",
  engancheReforzado: "JUEGO DE ENGANCHE TERMINAL REFORZADO",
  soporteCubreBarraCuadra: "SOPORTE CUBRE TECHO PARA BARRA CUADRA",
  soporteCubre: "SOPORTE CUBRE TECHO X UNIDAD",
  tapaCubreTecho: "JUEGO DE TAPA CUBRE TECHO",
}

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`
const fmtM = (n: number) => (Math.round(n * 100) / 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })
const r2 = (n: number) => Math.round(n * 100) / 100
const metroEntero = (n: number) => Math.ceil(n - 1e-9)
const mayus = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
/** "1,60" → 1.6 */
const aNumero = (s: string) => parseFloat(s.replace(",", "."))

export interface EntradaProyeccion {
  toldo: Partial<IToldoConfig> | null | undefined
  ancho: number
  /** Proyección (el alto del ítem) */
  alto: number
}

/**
 * Renglón "SISTEMA BRAZO ESCONDIDO <BARRA CUADRA | PUNTA PUNTA> <ORIGEN> DE <ancho> m CON BRAZO DE <brazo> m" sin
 * compensador. Se lee el texto (los renglones de la planilla no tienen un formato parejo: "05,00 m", "3,000 m").
 */
export function buscarSistemaBrazo(
  precios: IPrecioInsumoPT[],
  tipo: TipoProyeccion,
  origen: OrigenBrazoProyeccion,
  anchoSistema: number,
  brazo: number
): IPrecioInsumoPT | null {
  const comienzo = `SISTEMA BRAZO ESCONDIDO ${tipo === "Barra Cuadra" ? "BARRA CUADRA" : "PUNTA PUNTA"} ${mayus(origen)} DE `
  for (const p of precios) {
    const d = mayus(p.descripcion)
    if (!d.startsWith(comienzo) || d.includes("COMPENS") || !(p.precio > 0)) continue
    const a = d.slice(comienzo.length).match(/^(\d+)[,.](\d+)/)
    const b = d.match(/BRAZO DE (\d+[,.]\d+)/)
    if (!a || !b) continue
    if (Math.abs(parseFloat(`${a[1]}.${a[2]}`) - anchoSistema) < 0.001 && Math.abs(aNumero(b[1]) - brazo) < 0.001) return p
  }
  return null
}

export function calcularToldoProyeccion(
  entrada: EntradaProyeccion,
  opcionesElegidas: OpcionesCalculo,
  precios: IPrecioInsumoPT[]
): ResultadoCalculoRS {
  const t = entrada.toldo ?? {}
  const { ancho, alto } = entrada
  const avisos: string[] = []
  const desglose: LineaDesglose[] = []
  let insumos = 0

  // Origen y brazo: los de la calculadora o los de la medición
  const origenElegido = opcionesElegidas.origenBrazo ?? t.origenBrazo
  const origen = ORIGENES_BRAZO_PROYECCION.find((o) => o === origenElegido)
  const brazo = opcionesElegidas.brazoProyeccion ?? t.brazoProyeccion ?? undefined

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
    origenBrazo: origen ?? null,
    brazoProyeccion: brazo ?? null,
    anchoTela: tela?.ancho ?? null,
    precioMotor: opcionesElegidas.precioMotor ?? 0,
    precioDomotica: opcionesElegidas.precioDomotica ?? 0,
    instalacion: opcionesElegidas.instalacion ?? 0,
    confeccion: opcionesElegidas.confeccion ?? 0,
  }

  const agregar = (concepto: string, cantidad: number, unidad: string, precio: number, detalleExtra = "") => {
    const importe = r2(cantidad * precio)
    insumos += importe
    desglose.push({
      concepto: concepto.slice(0, 80),
      detalle: `${fmtM(cantidad)} ${unidad} × ${fmt$(precio)}${detalleExtra ? ` · ${detalleExtra}` : ""}`.slice(0, 200),
      importe,
    })
  }
  const dePlanilla = (concepto: string, insumo: string, cantidad: number, unidad: string, detalle = "") => {
    const item = buscarInsumoPT(precios, insumo)
    if (!item) avisos.push(`No está en la planilla: "${insumo}" (va en $0).`.slice(0, 200))
    agregar(concepto, cantidad, unidad, item?.precio ?? 0, detalle)
  }
  const aMano = (concepto: string, detalle: string, importe: number) => {
    insumos += importe
    desglose.push({ concepto, detalle: detalle.slice(0, 200), importe })
  }

  const errorMedidas = errorMedidasProyeccion(ancho, alto)
  if (errorMedidas) avisos.push(errorMedidas)

  // Sistema brazo escondido
  const tipo = t.tipoProyeccion
  const anchoSistema = anchoSistemaPrecio(Math.min(ancho, ANCHO_MAX_PROYECCION))
  if (!tipo) {
    avisos.push("Falta elegir el tipo (Punta a Punta o Barra Cuadra) en la medición.")
  } else if (!origen || !brazo) {
    avisos.push("Falta elegir el brazo (origen y medida): elegilo en la medición o en la calculadora.")
    aMano("Sistema brazo escondido", "falta elegir el brazo", 0)
  } else {
    if (!opcionesBrazoProyeccion(tipo, origen, ancho).includes(brazo)) {
      avisos.push(`El brazo de ${brazo} m no está entre las medidas del ${tipo} ${origen} para ${fmtM(ancho)} m de ancho.`)
    }
    const sistema = buscarSistemaBrazo(precios, tipo, origen, anchoSistema, aNumero(brazo))
    const nombre = `Sistema ${tipo} ${origen} ${anchoSistema} m · brazo ${brazo}`
    if (!sistema) {
      avisos.push(`No está en la planilla el sistema brazo escondido ${tipo} ${origen} de ${anchoSistema} m con brazo de ${brazo} m (va en $0).`.slice(0, 200))
    }
    agregar(nombre, 1, "u", sistema?.precio ?? 0, `ancho ${fmtM(ancho)} → sistema de ${anchoSistema} m`)
  }

  // Mecanismo
  if (t.mecanismo === "Manual") {
    dePlanilla("Máquina importada 11:1", INSUMOS.maquina, 1, "u", "sin escuadra")
    if ((t.manijas ?? 1) > 0) {
      if (t.medidaManija) dePlanilla(`Manija nacional x${t.medidaManija}`, MANIJAS[t.medidaManija], t.manijas ?? 1, "u")
      else avisos.push("Falta elegir la medida de la manija en la medición (va en $0).")
    }
  } else if (t.mecanismo === "Motorizado") {
    const motor = normalizarMotorToldo(t.motor)
    aMano("Motor y control", `${descripcionMotorToldo(t)} · a mano`, opciones.precioMotor ?? 0)
    if (!opciones.precioMotor) avisos.push(`Falta el precio del motor: ${descripcionMotorToldo(t)}.`.slice(0, 200))
    if (!motor) avisos.push("Falta elegir el motor en la medición.")
    else if (modelosDeMotorToldo(motor).length > 0 && !modeloMotorValido(t)) {
      avisos.push("Falta elegir el modelo del motor en la medición.")
    }
  } else {
    avisos.push("Falta elegir el mecanismo en la medición.")
  }

  // Tubo, calotas, frente, tapas y enganche
  const metros = metroEntero(ancho)
  if (t.cano === "80") {
    dePlanilla("Tubo 80 nervado", INSUMOS_VERTICAL.tubo80, metros, "m", `ancho ${fmtM(ancho)} redondeado`)
    dePlanilla("Calotas para tubo 80", INSUMOS_VERTICAL.calotaAcople, 2, "u", "cuadrada y redonda")
  } else {
    if (!t.cano) avisos.push("Falta elegir el caño en la medición (se calcula con tubo 70).")
    dePlanilla("Tubo 70 nervado", INSUMOS_VERTICAL.tubo70, metros, "m", `ancho ${fmtM(ancho)} redondeado`)
    dePlanilla("Calota cuadrada tubo 70", INSUMOS_VERTICAL.calotaCuadrada, 1, "u")
    dePlanilla("Calota redonda tubo 70", INSUMOS_VERTICAL.calotaRedonda, 1, "u")
  }
  dePlanilla("Frente TP2", INSUMOS.frente, metros, "m", `ancho ${fmtM(ancho)} redondeado`)
  const negra = t.colorPerfileria === "Negro"
  dePlanilla(`Tapas frente TP2 ${negra ? "negras" : "blancas"}`, negra ? INSUMOS.tapasNegras : INSUMOS.tapasBlancas, 1, "juego")
  if (origen) {
    const italiano = origen === "Italiano"
    dePlanilla(
      `Enganche terminal ${italiano ? "italiano" : "reforzado"}`,
      italiano ? INSUMOS.engancheItaliano : INSUMOS.engancheReforzado,
      1,
      "juego"
    )
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
      `${tela.panos} paño(s) de ${fmtM(tela.ancho)} m × (proyección ${fmtM(alto)} + ${fmtM(extraTela)}${t.pollerita ? " con pollerita" : ""})`
    )
  }
  dePlanilla("Spaghetti fino", INSUMOS_VERTICAL.spaghetti, r2(3 * ancho), "m", "3 × ancho")
  dePlanilla("Spaghetti grueso frente", INSUMOS_VERTICAL.spaghettiGrueso, r2(3 * ancho), "m", "3 × ancho")

  // Cubre toldo
  if (t.cubreToldo) {
    const anchoCubre = t.anchoCubreToldo || ancho
    dePlanilla("Cubre techo aluminio", INSUMOS_VERTICAL.cubreTecho, metrosCubreTecho(anchoCubre), "ml", `⌈${fmtM(anchoCubre)} + 0,10⌉`)
    const barraCuadra = tipo === "Barra Cuadra"
    dePlanilla(
      barraCuadra ? "Soporte cubre techo barra cuadra" : "Soporte cubre techo",
      barraCuadra ? INSUMOS.soporteCubreBarraCuadra : INSUMOS.soporteCubre,
      t.perchas ?? 0,
      "u",
      "1 por percha"
    )
    dePlanilla("Tapas cubre techo", INSUMOS.tapaCubreTecho, 1, "juego")
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
    desglose: desglose.slice(0, 30),
    formula: "insumos × 1,5 + domótica × 2 + confección + instalación",
    avisos: avisos.slice(0, 10),
    opciones,
  }
}
