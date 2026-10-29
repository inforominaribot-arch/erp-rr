// Módulo: Presupuestos
// Precio de cada cortina física RS a partir de la lista de precios de Rollershade (precios de lista, sin recargos).
//
// Base: ancho de cálculo = ancho real con mínimo 1 m; m² = ancho de cálculo × alto con mínimo 1 m².
//  - Roller normal:  (m² × tela + ancho × sistema) × 1,16025 + instalación
//    Sistema según m²: < 3 Soft RS · 3 a < 6 Maxi · 6 a 9 Super Maxi (variante zócalo Deco, cadena plástica).
//    Más de 9 m² no se calcula: debe ser motorizada.
//  - Solo tela:      (m² × tela + ancho × zócalo Decorativo / Guía) × 1,16025 + instalación
//  - Solo riel:      (ancho × sistema) × 1,16025 + instalación
//  - Roller Mot:     (ancho × caño + motor + m² × tela × 1,105) × 1,5 + instalación
//    Caño 40 / 50 mm a elección (Li-ion: siempre el caño de batería). Solo tela: el zócalo reemplaza caño + motor.
//  - Bandas RS:      (ancho × Sistema BV Esmalte Blanco + m² × tela BV) × 1,16025 + instalación
//  - Controles (por cliente, agrupados por marca y canales) y cargadores Li-ion (por abertura): lista × 1,5
//  - Mosquitero MagicRoll (MG): precio de la tabla ancho × alto (IVA incluido) × 1,25 (instalación incluida).
//    Plegable Importado doble: se entra a la tabla con la mitad del ancho y el precio va × 2.

import { z } from "zod"
import type { IConfigMotor, ModoCortina } from "@/modules/mediciones/types"
import type { TipoCapaFisica } from "@/modules/mediciones/lib/cortinas-fisicas"
import {
  celdaParaMedida,
  nombreModeloMosquitero,
  type ICeldaMosquitero,
  type PuertasMosquitero,
} from "@/modules/mediciones/lib/mosquiteros"
import { VALORES_DEFECTO_PRECIOS } from "./calculadora-precios"

// ─── Constantes ──────────────────────────────────────────────────────────────

export const COEFICIENTE_RS = VALORES_DEFECTO_PRECIOS.coeficienteComercialRS // 1.16025
export const FACTOR_TELA_MOTORIZADA = 1.105
export const FACTOR_MOTORIZADA = 1.5
export const FACTOR_CONTROL_CARGADOR = 1.5
export const INSTALACION_RS_DEFECTO = VALORES_DEFECTO_PRECIOS.precioInstalacionRS
export const M2_MAXIMO_ROLLER_MANUAL = 9
export const FACTOR_MOSQUITERO_MG = 1.25

const SECCION_SISTEMA = { RS: "Sistema Soft RS", MAXI: "Sistema Soft MAXI", SUPER_MAXI: "Sistema Soft SUPER MAXI" } as const
const VARIANTE_SISTEMA = "zocalo deco, cadena plastica"
const SECCION_ZOCALOS = "Zócalos"
const SECCION_CANOS = "Caño para motor"
const SECCION_BATERIA = "Motor a batería Tube"
const SECCION_SISTEMA_BV = "Sistema BV Rollershade"
const SISTEMA_BV = "Sistema BV Esmalte Blanco"
const SECCIONES_MOTOR: Record<string, string[]> = {
  Tube: ["Motores tubulares - Tube", SECCION_BATERIA],
  Somfy: ["Motores tubulares Somfy"],
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Ítem de la lista de precios que necesita el cálculo */
export interface IItemListaCalculo {
  id: string
  categoria: string
  seccion: string
  descripcion: string
  colores: string | null
  unidad: string
  precio: number
  vendemos: boolean
}

export type MetodoCalculoRS =
  | "RS_ROLLER"
  | "RS_ROLLER_MOT"
  | "RS_BANDAS"
  | "RS_CONTROL"
  | "RS_CARGADOR"
  | "MG_MOSQUITERO"

/** Celda de una tabla por medida con su precio (MagicRoll) */
export interface ICeldaPrecioMedida extends ICeldaMosquitero {
  id: string
  tabla: string
  precio: number
}

export const opcionesCalculoSchema = z.object({
  telaId: z.string().max(64).nullable().optional(),
  color: z.string().max(80).nullable().optional(),
  zocaloId: z.string().max(64).nullable().optional(),
  canoId: z.string().max(64).nullable().optional(),
  motorId: z.string().max(64).nullable().optional(),
  itemId: z.string().max(64).nullable().optional(), // control o cargador
  modelo: z.string().max(40).nullable().optional(), // mosquitero MG
  puertas: z.enum(["Simple", "Doble"]).nullable().optional(),
  instalacion: z.number().min(0).max(100_000_000).optional(),
})
export type OpcionesCalculo = z.infer<typeof opcionesCalculoSchema>

/** Datos de la cortina con los que se calcula (se guardan para poder recalcular) */
export const entradaCalculoSchema = z.object({
  tipoCapa: z.string().max(40).optional(),
  modo: z.enum(["Normal", "Solo tela", "Solo riel"]).optional(),
  nombreTelaMedicion: z.string().max(200).optional(),
  motor: z
    .object({ marca: z.string().max(20), modelo: z.string().max(60), control: z.boolean().optional() })
    .nullable()
    .optional(),
  marcaMotor: z.string().max(20).optional(),
  canales: z.number().int().optional(),
  // Mosquitero MG: modelo y puertas de la medición
  modelo: z.string().max(40).optional(),
  puertas: z.enum(["Simple", "Doble"]).optional(),
})
export type EntradaCalculo = z.infer<typeof entradaCalculoSchema>

export const lineaDesgloseSchema = z.object({
  concepto: z.string().max(80),
  detalle: z.string().max(200),
  importe: z.number(),
})
export type LineaDesglose = z.infer<typeof lineaDesgloseSchema>

export const calculoPrecioSchema = z.object({
  metodo: z.enum(["RS_ROLLER", "RS_ROLLER_MOT", "RS_BANDAS", "RS_CONTROL", "RS_CARGADOR", "MG_MOSQUITERO"]),
  entrada: entradaCalculoSchema.default({}),
  opciones: opcionesCalculoSchema.default({}),
  desglose: z.array(lineaDesgloseSchema).max(30).default([]),
  formula: z.string().max(300).optional(),
  precioCalculado: z.number().nullable().default(null),
  /** El precio unitario se corrigió a mano: no se actualiza con la lista */
  precioManual: z.boolean().default(false),
  avisos: z.array(z.string().max(200)).max(10).default([]),
  /** Último aviso del recálculo automático (ej: no se actualizó por precio corregido a mano) */
  avisoActualizacion: z.string().max(200).nullable().optional(),
  calculadoEn: z.string().max(40).optional(),
})
export type CalculoPrecio = z.infer<typeof calculoPrecioSchema>

export interface ResultadoCalculoRS {
  precio: number | null
  desglose: LineaDesglose[]
  formula: string
  avisos: string[]
  /** Opciones efectivamente usadas (incluye las elegidas por defecto) */
  opciones: OpcionesCalculo
}

// ─── Normalización y búsqueda en la lista ───────────────────────────────────

export function normalizarTexto(s: string | null | undefined): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(bv\)/g, " ")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/(\d+\.\d*?)0+\b/g, "$1")
    .replace(/(\d+)\.(?!\d)/g, "$1")
    .replace(/black\s*out/g, "blackout")
    .replace(/sun\s*screen/g, "sunscreen")
    .replace(/[^a-z0-9.%/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function buscarPorId(lista: IItemListaCalculo[], id: string | null | undefined) {
  return id ? lista.find((it) => it.id === id) ?? null : null
}

function buscarEnSeccion(
  lista: IItemListaCalculo[],
  seccion: string,
  contiene: string
): IItemListaCalculo | null {
  const sec = normalizarTexto(seccion)
  const txt = normalizarTexto(contiene)
  return (
    lista.find((it) => normalizarTexto(it.seccion) === sec && normalizarTexto(it.descripcion).includes(txt)) ??
    null
  )
}

export function coloresDe(item: Pick<IItemListaCalculo, "colores"> | null | undefined): string[] {
  return (item?.colores || "")
    .split("/")
    .map((c) => c.trim())
    .filter(Boolean)
}

/** Telas que se ofrecen para cada tipo de capa (las tildadas "vendemos"). */
export function telasParaCapa(lista: IItemListaCalculo[], tipoCapa: string | null | undefined) {
  const categoria = tipoCapa === "Bandas verticales" ? "BANDAS_VERTICALES" : "TELA"
  return lista.filter(
    (it) => it.categoria === categoria && it.vendemos && it.unidad.toLowerCase() === "m2"
  )
}

export interface ResultadoBusquedaTela {
  tela: IItemListaCalculo | null
  color: string | null
  /** true = coincidencia clara; false = hay que confirmarla */
  seguro: boolean
  sugerencia: IItemListaCalculo | null
}

/**
 * Busca la tela escrita a mano en la medición (mediciones anteriores al selector).
 * Es "segura" si el nombre completo de una sola tela aparece en el texto.
 */
export function buscarTelaPorNombre(
  texto: string | null | undefined,
  telas: IItemListaCalculo[]
): ResultadoBusquedaTela {
  const t = normalizarTexto(texto)
  if (!t) return { tela: null, color: null, seguro: false, sugerencia: null }
  const palabrasTexto = new Set(t.split(" "))

  const completas = telas
    .map((tela) => ({ tela, palabras: normalizarTexto(tela.descripcion).split(" ") }))
    .filter(({ palabras }) => palabras.every((p) => palabrasTexto.has(p)))
    .sort((a, b) => b.palabras.length - a.palabras.length)

  const colorDe = (tela: IItemListaCalculo) =>
    coloresDe(tela).find((c) => {
      const nc = normalizarTexto(c)
      return nc && (` ${t} `).includes(` ${nc} `)
    }) ?? null

  if (completas.length > 0) {
    const mejor = completas[0]
    const empatadas = completas.filter((c) => c.palabras.length === mejor.palabras.length)
    if (empatadas.length === 1) {
      return { tela: mejor.tela, color: colorDe(mejor.tela), seguro: true, sugerencia: mejor.tela }
    }
    return { tela: null, color: null, seguro: false, sugerencia: mejor.tela }
  }

  // Sin coincidencia completa: la que más palabras comparte, solo como sugerencia
  let sugerencia: IItemListaCalculo | null = null
  let mejorPuntaje = 0
  for (const tela of telas) {
    const palabras = normalizarTexto(tela.descripcion).split(" ")
    const puntaje = palabras.filter((p) => palabrasTexto.has(p)).length / palabras.length
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje
      sugerencia = tela
    }
  }
  return { tela: null, color: null, seguro: false, sugerencia: mejorPuntaje >= 0.5 ? sugerencia : null }
}

/** Sistema de roller según los m² de tela. */
export function sistemaPorM2(lista: IItemListaCalculo[], m2: number) {
  if (m2 > M2_MAXIMO_ROLLER_MANUAL) return null
  const seccion = m2 < 3 ? SECCION_SISTEMA.RS : m2 < 6 ? SECCION_SISTEMA.MAXI : SECCION_SISTEMA.SUPER_MAXI
  return buscarEnSeccion(lista, seccion, VARIANTE_SISTEMA)
}

export function zocalosOpciones(lista: IItemListaCalculo[]) {
  return lista.filter(
    (it) =>
      normalizarTexto(it.seccion) === normalizarTexto(SECCION_ZOCALOS) &&
      /decorativo|guia/.test(normalizarTexto(it.descripcion))
  )
}

export function zocaloPorDefecto(lista: IItemListaCalculo[]) {
  return buscarEnSeccion(lista, SECCION_ZOCALOS, "Zócalo Decorativo")
}

const esLiIon = (motor: { modelo?: string } | null | undefined) =>
  normalizarTexto(motor?.modelo).replace(/[^a-z]/g, "").includes("liion")

export function canosOpciones(lista: IItemListaCalculo[]) {
  return lista.filter(
    (it) =>
      normalizarTexto(it.seccion) === normalizarTexto(SECCION_CANOS) &&
      /\b(40|50) mm\b/.test(normalizarTexto(it.descripcion))
  )
}

export function canoBateria(lista: IItemListaCalculo[]) {
  return lista.find(
    (it) => normalizarTexto(it.seccion) === normalizarTexto(SECCION_BATERIA) && normalizarTexto(it.descripcion) === "cano"
  ) ?? null
}

/** Caño sugerido según el motor (6/28 → 40 mm; 5/28 y 10/28 → 50 mm). */
export function canoPorDefecto(lista: IItemListaCalculo[], motor: IItemListaCalculo | null) {
  const d = normalizarTexto(motor?.descripcion)
  const mm = /50 mm|5\/28|10\/28/.test(d) ? "50 mm" : "40 mm"
  return canosOpciones(lista).find((it) => normalizarTexto(it.descripcion).includes(mm)) ?? null
}

/** Motores de la lista (para elegir a mano si la medición no coincide). */
export function motoresOpciones(lista: IItemListaCalculo[]) {
  const secciones = Object.values(SECCIONES_MOTOR).flat().map(normalizarTexto)
  return lista.filter(
    (it) =>
      secciones.includes(normalizarTexto(it.seccion)) && normalizarTexto(it.descripcion).startsWith("motor")
  )
}

/** Motor de la medición en la lista (marca + modelo). */
export function buscarMotor(lista: IItemListaCalculo[], motor: Pick<IConfigMotor, "marca" | "modelo"> | null | undefined) {
  if (!motor?.modelo) return null
  const secciones = (SECCIONES_MOTOR[motor.marca] || []).map(normalizarTexto)
  const candidatos = lista.filter((it) => secciones.includes(normalizarTexto(it.seccion)))
  if (esLiIon(motor)) {
    return motor.marca === "Tube"
      ? candidatos.find((it) => normalizarTexto(it.descripcion).includes("motor tube n025")) ?? null
      : null
  }
  // "6/28R 40mm" → "6/28r"; "LSN 6/28R" → "lsn 6/28r"
  const modelo = normalizarTexto(motor.modelo).replace(/\b\d+ ?mm\b/g, "").trim()
  return (
    candidatos.find(
      (it) => normalizarTexto(it.descripcion).startsWith("motor") && normalizarTexto(it.descripcion).includes(modelo)
    ) ?? null
  )
}

/** Control remoto de la lista según la marca del motor y la cantidad de canales. */
export function buscarControl(lista: IItemListaCalculo[], marcaMotor: string, canales: number) {
  const secciones = (SECCIONES_MOTOR[marcaMotor] || []).map(normalizarTexto)
  const texto = `control remoto ${canales} canal`
  return (
    lista.find(
      (it) => secciones.includes(normalizarTexto(it.seccion)) && normalizarTexto(it.descripcion).startsWith(texto)
    ) ?? null
  )
}

export function buscarCargador(lista: IItemListaCalculo[]) {
  return buscarEnSeccion(lista, SECCION_BATERIA, "Cargador")
}

// ─── Cálculo de una cortina ─────────────────────────────────────────────────

export interface EntradaCortinaRS {
  tipoCapa: TipoCapaFisica | string
  modo: ModoCortina
  ancho: number
  alto: number
  nombreTelaMedicion?: string
  motor?: Pick<IConfigMotor, "marca" | "modelo"> | null
}

export function metodoParaCapa(tipoCapa: string | null | undefined): MetodoCalculoRS | null {
  if (tipoCapa === "Roller") return "RS_ROLLER"
  if (tipoCapa === "Roller Mot") return "RS_ROLLER_MOT"
  if (tipoCapa === "Bandas verticales") return "RS_BANDAS"
  return null
}

const fmtM = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 3 })
const fmt$ = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`

/** Ancho y m² de cálculo con los mínimos (1 m y 1 m²). */
export function medidasDeCalculo(ancho: number, alto: number) {
  const anchoCalc = Math.max(1, Number(ancho) || 0)
  const m2 = Math.max(1, anchoCalc * (Number(alto) || 0))
  return { anchoCalc, m2: Math.round(m2 * 1000) / 1000 }
}

/**
 * Calcula el precio unitario de una cortina física RS.
 * Las opciones vacías se completan por defecto (tela adivinada si es segura, sistema por m², zócalo Decorativo,
 * caño según el motor). Si falta algo para calcular, `precio` es null y `avisos` dice qué elegir.
 */
export function calcularCortinaRS(
  entrada: EntradaCortinaRS,
  opcionesElegidas: OpcionesCalculo,
  lista: IItemListaCalculo[]
): ResultadoCalculoRS {
  const metodo = metodoParaCapa(entrada.tipoCapa)
  const avisos: string[] = []
  const desglose: LineaDesglose[] = []
  const opciones: OpcionesCalculo = { ...opcionesElegidas }
  const instalacion = opciones.instalacion ?? INSTALACION_RS_DEFECTO
  opciones.instalacion = instalacion
  const { anchoCalc, m2 } = medidasDeCalculo(entrada.ancho, entrada.alto)
  const modo: ModoCortina = entrada.modo || "Normal"
  const llevaTela = modo !== "Solo riel"
  const llevaSistema = modo !== "Solo tela"

  if (!metodo) {
    return { precio: null, desglose, formula: "", avisos: ["Esta capa no se calcula con la lista RS."], opciones }
  }

  // ── Tela ──
  let tela: IItemListaCalculo | null = null
  if (llevaTela) {
    const telas = telasParaCapa(lista, entrada.tipoCapa)
    tela = buscarPorId(lista, opciones.telaId)
    if (!tela && !opciones.telaId) {
      const encontrada = buscarTelaPorNombre(entrada.nombreTelaMedicion, telas)
      if (encontrada.seguro && encontrada.tela) {
        tela = encontrada.tela
        opciones.telaId = tela.id
        opciones.color = opciones.color ?? encontrada.color
      }
    }
    if (!tela) {
      avisos.push(
        opciones.telaId
          ? "La tela elegida ya no está en la lista: elegí otra."
          : entrada.nombreTelaMedicion?.trim()
          ? `Elegí la tela ("${entrada.nombreTelaMedicion.trim()}" no coincide seguro con la lista).`
          : "Elegí la tela."
      )
    }
  }

  const sumarTela = (factor = 1) => {
    if (!tela) return 0
    const importe = m2 * tela.precio * factor
    desglose.push({
      concepto: "Tela",
      detalle: `${tela.descripcion}${opciones.color ? ` ${opciones.color}` : ""}: ${fmtM(m2)} m² × ${fmt$(tela.precio)}${factor !== 1 ? ` × ${factor}` : ""}`,
      importe: r2(importe),
    })
    return importe
  }
  const sumarPorMetro = (concepto: string, item: IItemListaCalculo) => {
    const importe = anchoCalc * item.precio
    desglose.push({
      concepto,
      detalle: `${item.descripcion}: ${fmtM(anchoCalc)} m × ${fmt$(item.precio)}`,
      importe: r2(importe),
    })
    return importe
  }
  const sumarZocalo = () => {
    let zocalo = buscarPorId(lista, opciones.zocaloId)
    if (!zocalo) {
      zocalo = zocaloPorDefecto(lista)
      opciones.zocaloId = zocalo?.id ?? null
    }
    if (!zocalo) {
      avisos.push("No se encontró el zócalo en la lista.")
      return null
    }
    return sumarPorMetro("Zócalo", zocalo)
  }

  let subtotal = 0
  let faltaAlgo = Boolean(llevaTela && !tela)
  let factor = COEFICIENTE_RS
  let formula = ""

  if (metodo === "RS_ROLLER") {
    if (llevaSistema) {
      if (m2 > M2_MAXIMO_ROLLER_MANUAL) {
        avisos.push(`Tiene ${fmtM(m2)} m² (más de ${M2_MAXIMO_ROLLER_MANUAL}): debe ser motorizada.`)
        return { precio: null, desglose, formula: "", avisos, opciones }
      }
      const sistema = sistemaPorM2(lista, m2)
      if (!sistema) {
        avisos.push("No se encontró el sistema en la lista.")
        faltaAlgo = true
      } else {
        subtotal += sumarPorMetro("Sistema", sistema)
      }
    } else {
      const z = sumarZocalo()
      if (z === null) faltaAlgo = true
      else subtotal += z
    }
    subtotal += sumarTela()
    formula =
      modo === "Solo tela"
        ? "(m² × tela + ancho × zócalo) × 1,16025 + instalación"
        : modo === "Solo riel"
        ? "(ancho × sistema) × 1,16025 + instalación"
        : "(m² × tela + ancho × sistema) × 1,16025 + instalación"
  } else if (metodo === "RS_BANDAS") {
    if (llevaSistema) {
      const sistema = buscarEnSeccion(lista, SECCION_SISTEMA_BV, SISTEMA_BV)
      if (!sistema) {
        avisos.push("No se encontró el Sistema BV Esmalte Blanco en la lista.")
        faltaAlgo = true
      } else {
        subtotal += sumarPorMetro("Sistema", sistema)
      }
    }
    subtotal += sumarTela()
    formula = "(ancho × sistema BV + m² × tela) × 1,16025 + instalación"
  } else {
    // Roller motorizado
    factor = FACTOR_MOTORIZADA
    if (llevaSistema) {
      let motor = buscarPorId(lista, opciones.motorId)
      if (!motor && !opciones.motorId) {
        motor = buscarMotor(lista, entrada.motor)
        opciones.motorId = motor?.id ?? null
      }
      const conBateria = esLiIon(entrada.motor) || normalizarTexto(motor?.descripcion).includes("n025")
      let cano = conBateria ? canoBateria(lista) : buscarPorId(lista, opciones.canoId)
      if (!cano && !conBateria) cano = canoPorDefecto(lista, motor)
      opciones.canoId = cano?.id ?? null

      if (!cano) {
        avisos.push("No se encontró el caño en la lista.")
        faltaAlgo = true
      } else {
        subtotal += sumarPorMetro("Caño", cano)
      }
      if (!motor) {
        avisos.push(
          entrada.motor?.modelo
            ? `Elegí el motor ("${entrada.motor.marca} ${entrada.motor.modelo}" no está en la lista RS).`
            : "Elegí el motor."
        )
        faltaAlgo = true
      } else {
        subtotal += motor.precio
        desglose.push({ concepto: "Motor", detalle: motor.descripcion, importe: motor.precio })
      }
    } else {
      const z = sumarZocalo()
      if (z === null) faltaAlgo = true
      else subtotal += z
    }
    subtotal += sumarTela(FACTOR_TELA_MOTORIZADA)
    formula =
      modo === "Solo tela"
        ? "(ancho × zócalo + m² × tela × 1,105) × 1,5 + instalación"
        : "(ancho × caño + motor + m² × tela × 1,105) × 1,5 + instalación"
  }

  if (faltaAlgo) {
    return { precio: null, desglose, formula, avisos, opciones }
  }

  const conFactor = subtotal * factor
  desglose.push({
    concepto: factor === COEFICIENTE_RS ? "Coeficiente" : "Factor",
    detalle: `${fmt$(subtotal)} × ${factor.toLocaleString("es-AR", { maximumFractionDigits: 5 })}`,
    importe: r2(conFactor - subtotal),
  })
  desglose.push({ concepto: "Instalación", detalle: "Por cortina", importe: instalacion })
  return { precio: Math.round(conFactor + instalacion), desglose, formula, avisos, opciones }
}

/** Precio de un control o cargador: lista × 1,5. */
export function calcularAccesorioMotorizado(item: IItemListaCalculo | null): ResultadoCalculoRS {
  if (!item) {
    return { precio: null, desglose: [], formula: "", avisos: ["No se encontró en la lista: elegilo."], opciones: {} }
  }
  const precio = Math.round(item.precio * FACTOR_CONTROL_CARGADOR)
  return {
    precio,
    desglose: [
      { concepto: "Lista", detalle: item.descripcion, importe: item.precio },
      { concepto: "Factor", detalle: `${fmt$(item.precio)} × 1,5`, importe: r2(precio - item.precio) },
    ],
    formula: "precio de lista × 1,5",
    avisos: [],
    opciones: { itemId: item.id },
  }
}

/** Precio de un mosquitero MagicRoll: celda de la tabla × 1,25 (× 2 si es Plegable Importado doble). */
export function calcularMosquiteroMG(
  entrada: { modelo?: string | null; puertas?: PuertasMosquitero | null; ancho: number; alto: number },
  opcionesElegidas: OpcionesCalculo,
  tabla: ICeldaPrecioMedida[]
): ResultadoCalculoRS {
  const modelo = opcionesElegidas.modelo ?? entrada.modelo ?? null
  const puertas: PuertasMosquitero | null =
    modelo === "PLEGABLE_IMPORTADO" ? (opcionesElegidas.puertas ?? entrada.puertas ?? "Simple") : null
  const opciones: OpcionesCalculo = { ...opcionesElegidas, modelo, puertas }
  const formula = "precio de la tabla (IVA incluido) × 1,25"
  if (!modelo) {
    return { precio: null, desglose: [], formula, avisos: ["Elegí el modelo de mosquitero."], opciones }
  }
  const celda = celdaParaMedida(tabla, modelo, entrada.ancho, entrada.alto, puertas)
  if (!celda) {
    return {
      precio: null,
      desglose: [],
      formula,
      avisos: [`${nombreModeloMosquitero(modelo)}: no se fabrica en esa medida.`],
      opciones,
    }
  }
  const multiplicador = puertas === "Doble" ? 2 : 1
  const base = celda.precio * multiplicador
  const precio = Math.round(base * FACTOR_MOSQUITERO_MG)
  const desglose: LineaDesglose[] = [
    {
      concepto: "Tabla",
      detalle: `${nombreModeloMosquitero(modelo)} (${celda.tabla}): ancho ${celda.anchoDesde}–${celda.anchoHasta} × alto ${celda.altoDesde}–${celda.altoHasta} mm${celda.cajon ? `, cajón ${celda.cajon}` : ""}`,
      importe: celda.precio,
    },
  ]
  if (multiplicador === 2) {
    desglose.push({ concepto: "Puerta doble", detalle: `${fmt$(celda.precio)} × 2 (mitad del ancho por puerta)`, importe: celda.precio })
  }
  desglose.push({ concepto: "Recargo", detalle: `${fmt$(base)} × 1,25 (instalación incluida)`, importe: r2(precio - base) })
  return {
    precio,
    desglose,
    formula: multiplicador === 2 ? "precio de la tabla × 2 puertas × 1,25" : formula,
    avisos: [],
    opciones,
  }
}

/** Arma el JSON de cálculo que se guarda en la fila. */
export function armarCalculoPrecio(
  metodo: MetodoCalculoRS,
  entrada: EntradaCalculo,
  resultado: ResultadoCalculoRS,
  precioManual = false
): CalculoPrecio {
  return {
    metodo,
    entrada,
    opciones: resultado.opciones,
    desglose: resultado.desglose,
    formula: resultado.formula,
    precioCalculado: resultado.precio,
    precioManual,
    avisos: resultado.avisos,
    avisoActualizacion: null,
    calculadoEn: new Date().toISOString(),
  }
}

/** Lee el JSON guardado (null si no es un cálculo con la lista). */
export function leerCalculoPrecio(valor: unknown): CalculoPrecio | null {
  if (!valor || typeof valor !== "object") return null
  const r = calculoPrecioSchema.safeParse(valor)
  return r.success ? r.data : null
}

/**
 * Recalcula una fila con la lista vigente usando lo que tiene guardado.
 * Devuelve null si la fila no se calcula con la lista.
 */
export function recalcularFila(
  fila: { ancho: number; alto: number; calculoPrecio: CalculoPrecio },
  lista: IItemListaCalculo[],
  tablaMG: ICeldaPrecioMedida[] = []
): ResultadoCalculoRS | null {
  const calc = fila.calculoPrecio
  if (calc.metodo === "MG_MOSQUITERO") {
    return calcularMosquiteroMG(
      { modelo: calc.entrada.modelo, puertas: calc.entrada.puertas, ancho: fila.ancho, alto: fila.alto },
      calc.opciones,
      tablaMG
    )
  }
  if (calc.metodo === "RS_CONTROL" || calc.metodo === "RS_CARGADOR") {
    let item = buscarPorId(lista, calc.opciones.itemId)
    if (!item && calc.metodo === "RS_CONTROL" && calc.entrada.marcaMotor && calc.entrada.canales) {
      item = buscarControl(lista, calc.entrada.marcaMotor, calc.entrada.canales)
    }
    if (!item && calc.metodo === "RS_CARGADOR") item = buscarCargador(lista)
    return calcularAccesorioMotorizado(item)
  }
  return calcularCortinaRS(
    {
      tipoCapa: calc.entrada.tipoCapa || "",
      modo: calc.entrada.modo || "Normal",
      ancho: fila.ancho,
      alto: fila.alto,
      nombreTelaMedicion: calc.entrada.nombreTelaMedicion,
      motor: calc.entrada.motor ? { marca: calc.entrada.motor.marca as IConfigMotor["marca"], modelo: calc.entrada.motor.modelo } : null,
    },
    calc.opciones,
    lista
  )
}
