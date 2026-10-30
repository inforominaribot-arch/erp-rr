// Módulo: Comandas
// Arma el Excel de la orden de trabajo de Rollershade sobre la plantilla original
// (public/plantillas/orden-trabajo-rollershade.xlsx). Se edita el XML de la hoja "ORD. DE TRABAJO 2"
// celda por celda para no perder nada del archivo original (dibujos, llaves, óvalos, formatos).
// La hoja "ORD. DE TRABAJO 1" queda tal cual.

import JSZip from "jszip"
import type { IFilaOrdenRS, SistemaFilaRS } from "./orden-pedido"

export const RUTA_PLANTILLA_RS = "/plantillas/orden-trabajo-rollershade.xlsx"
const HOJA = "xl/worksheets/sheet2.xml"

// Filas de datos de la plantilla (7 a 12); si hay más cortinas se agregan filas
const PRIMERA_FILA = 7
const FILAS_PLANTILLA = 6
// Estilos de la plantilla: N° de fila, celda con dato, celda vacía, observación (rosa, R:T combinadas)
const ESTILO_NUMERO = "60"
const ESTILO_DATO = "61"
const ESTILO_VACIO = "62"
const ESTILOS_OBS = ["71", "73", "74"]

const COLUMNA_SISTEMA: Record<SistemaFilaRS, string> = {
  RS: "C",
  MAXI: "D",
  SUPER_MAXI: "E",
  PANEL: "F",
  BANDAS: "G",
}

const COLUMNAS = "ABCDEFGHIJKLMNOPQRST".split("")

const escaparXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** Fecha de Excel (días desde 30/12/1899) del día en Argentina */
function serialExcel(fecha: Date): number {
  const [d, m, a] = fecha
    .toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })
    .split("/")
    .map(Number)
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(1899, 11, 30)) / 86_400_000)
}

type Valor = string | number | null | undefined

function xmlCelda(ref: string, valor: Valor, estilo: string): string {
  if (valor === null || valor === undefined || valor === "") return `<c r="${ref}" s="${estilo}"/>`
  if (typeof valor === "number") return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`
  return `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${escaparXml(valor)}</t></is></c>`
}

/** Reemplaza una celda existente; conserva su estilo si no se indica otro. */
function ponerCelda(xml: string, ref: string, valor: Valor, estilo?: string): string {
  const re = new RegExp(`<c r="${ref}"([^>]*?)(/>|>.*?</c>)`, "s")
  if (!re.test(xml)) throw new Error(`La plantilla no tiene la celda ${ref}`)
  return xml.replace(re, (_m, attrs: string) => xmlCelda(ref, valor, estilo ?? attrs.match(/s="(\d+)"/)?.[1] ?? ESTILO_VACIO))
}

/** Corre hacia abajo las filas desde `desde` (inclusive) `n` lugares: celdas, combinaciones y dibujos. */
function correrFilas(xml: string, desde: number, n: number): string {
  const mover = (r: number) => (r >= desde ? r + n : r)
  return xml
    .replace(/<row r="(\d+)"/g, (_m, r) => `<row r="${mover(Number(r))}"`)
    .replace(/<c r="([A-Z]+)(\d+)"/g, (_m, col, r) => `<c r="${col}${mover(Number(r))}"`)
}

function correrDibujo(xml: string, desde: number, n: number): string {
  // En los dibujos las filas empiezan en 0
  return xml.replace(/<xdr:row>(\d+)<\/xdr:row>/g, (_m, r) => {
    const fila = Number(r) + 1
    return `<xdr:row>${fila >= desde ? Number(r) + n : r}</xdr:row>`
  })
}

export interface DatosOrdenRS {
  filas: IFilaOrdenRS[]
  numeroOrden: number
  fecha: Date
  cliente: string
}

export async function generarExcelRollershade(datos: DatosOrdenRS): Promise<Blob> {
  const resp = await fetch(RUTA_PLANTILLA_RS)
  if (!resp.ok) throw new Error("No se pudo abrir la plantilla de Rollershade.")
  const zip = await JSZip.loadAsync(await resp.arrayBuffer())
  let xml = await zip.file(HOJA)!.async("string")

  // Más cortinas que filas en la plantilla: agregar filas (copia de la última fila vacía)
  const extra = Math.max(0, datos.filas.length - FILAS_PLANTILLA)
  if (extra > 0) {
    const ultima = PRIMERA_FILA + FILAS_PLANTILLA - 1
    const filaModelo = xml.match(new RegExp(`<row r="${ultima}"[^>]*>.*?</row>`, "s"))?.[0]
    if (!filaModelo) throw new Error("La plantilla no tiene la fila de datos esperada.")
    xml = correrFilas(xml, ultima + 1, extra)
    const nuevas = Array.from({ length: extra }, (_, i) => {
      const r = ultima + 1 + i
      return filaModelo
        .replace(`<row r="${ultima}"`, `<row r="${r}"`)
        .replace(new RegExp(`(<c r="[A-Z]+)${ultima}"`, "g"), `$1${r}"`)
    }).join("")
    xml = xml.replace(filaModelo, filaModelo + nuevas)
    const rutaDibujo = "xl/drawings/drawing2.xml"
    const dibujo = zip.file(rutaDibujo)
    if (dibujo) zip.file(rutaDibujo, correrDibujo(await dibujo.async("string"), ultima + 1, extra))
  }

  // Cabecera: fecha de pedido y N° de orden de trabajo del día; cliente en el recuadro amarillo
  xml = ponerCelda(xml, "M2", serialExcel(datos.fecha))
  xml = ponerCelda(xml, "S2", datos.numeroOrden)
  xml = ponerCelda(xml, `K${13 + extra}`, datos.cliente.trim().toUpperCase())

  const combinadas: string[] = []
  datos.filas.forEach((f, i) => {
    const r = PRIMERA_FILA + i
    const valores: Record<string, Valor> = {
      A: i + 1,
      B: f.cantidad,
      [COLUMNA_SISTEMA[f.sistema]]: "X",
      H: f.tela,
      I: f.color,
      J: f.ancho,
      K: f.alto,
      L: f.cadena,
      M: f.mando,
      N: f.caida,
      O: f.recoge,
      P: f.cenefa,
      Q: f.zocalo,
      R: f.cajon,
      S: f.guia,
      T: f.motor,
    }
    // Observación: como en la planilla, ocupa Cajón + Guía + Motor (R:T combinadas, en rosa)
    const obs = f.observaciones.trim()
    if (obs) {
      valores.R = [f.cajon, f.guia, f.motor, obs].map((v) => v.trim()).filter(Boolean).join(" · ")
      valores.S = null
      valores.T = null
    }
    for (const col of COLUMNAS) {
      const v = valores[col]
      let estilo = col === "A" ? ESTILO_NUMERO : v === null || v === undefined || v === "" ? ESTILO_VACIO : ESTILO_DATO
      if (obs && (col === "R" || col === "S" || col === "T")) estilo = ESTILOS_OBS["RST".indexOf(col)]
      xml = ponerCelda(xml, `${col}${r}`, v, estilo)
    }
    if (obs) combinadas.push(`R${r}:T${r}`)
  })

  if (combinadas.length > 0) {
    const merge = `<mergeCells count="${combinadas.length}">${combinadas.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>`
    xml = xml.replace("</sheetData>", `</sheetData>${merge}`)
  }

  zip.file(HOJA, xml)
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    compression: "DEFLATE",
  })
}
