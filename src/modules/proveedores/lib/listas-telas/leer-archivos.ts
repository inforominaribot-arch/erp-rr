// Módulo: Proveedores
// Lectura de los archivos de listas de precios que mandan los proveedores:
//  - Excel (.xlsx): primera hoja como filas de celdas (se lee el XML del archivo con jszip).
//  - PDF: renglones de texto armados con la posición de cada palabra en la página.
// Sin imports con "@/": lo usa también el script de carga inicial (node).

import JSZip from "jszip"

export type Celda = string | number | null

const decodificar = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")

/** Texto de un nodo <si> / <is> (puede venir partido en varios <t>). */
function textoDeNodo(xml: string): string {
  const partes = [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1])
  return decodificar(partes.join(""))
}

/** Índice de columna desde la referencia "AB12" → 27 */
function indiceColumna(ref: string): number {
  const letras = ref.replace(/\d+/g, "")
  let n = 0
  for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64)
  return n - 1
}

/** Filas de la primera hoja de un .xlsx (la fila i del array es la fila i+1 de Excel). */
export async function leerFilasXlsx(datos: ArrayBuffer | Uint8Array): Promise<Celda[][]> {
  const zip = await JSZip.loadAsync(datos)
  const compartidos: string[] = []
  const ss = zip.file("xl/sharedStrings.xml")
  if (ss) {
    const xml = await ss.async("string")
    for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) compartidos.push(textoDeNodo(m[1]))
  }

  // Primera hoja según el libro (no siempre es sheet1.xml)
  let rutaHoja = "xl/worksheets/sheet1.xml"
  const libro = zip.file("xl/workbook.xml")
  const rels = zip.file("xl/_rels/workbook.xml.rels")
  if (libro && rels) {
    const xmlLibro = await libro.async("string")
    const xmlRels = await rels.async("string")
    const rid = xmlLibro.match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1]
    const destino = rid
      ? xmlRels.match(new RegExp(`<Relationship\\b[^>]*Id="${rid}"[^>]*Target="([^"]+)"`))?.[1] ??
        xmlRels.match(new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${rid}"`))?.[1]
      : undefined
    if (destino) rutaHoja = destino.startsWith("/") ? destino.slice(1) : `xl/${destino.replace(/^\.\//, "")}`
  }
  const hoja = zip.file(rutaHoja) ?? zip.file(/xl\/worksheets\/sheet\d+\.xml/)[0]
  if (!hoja) throw new Error("El Excel no tiene hojas.")
  const xml = await hoja.async("string")

  const filas: Celda[][] = []
  for (const mFila of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const nro = Number(mFila[1].match(/\br="(\d+)"/)?.[1] ?? filas.length + 1)
    const fila: Celda[] = []
    for (const mCelda of mFila[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = mCelda[1]
      const interior = mCelda[2] ?? ""
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1]
      const tipo = attrs.match(/\bt="([^"]+)"/)?.[1]
      const v = interior.match(/<v>([\s\S]*?)<\/v>/)?.[1]
      let valor: Celda = null
      if (tipo === "s" && v !== undefined) valor = compartidos[Number(v)] ?? null
      else if (tipo === "inlineStr") valor = textoDeNodo(interior)
      else if (tipo === "str" || tipo === "e") valor = v !== undefined ? decodificar(v) : null
      else if (tipo === "b") valor = v === "1" ? "TRUE" : "FALSE"
      else if (v !== undefined) valor = Number.isFinite(Number(v)) ? Number(v) : decodificar(v)
      const col = ref ? indiceColumna(ref) : fila.length
      fila[col] = valor
    }
    for (let i = 0; i < fila.length; i++) if (fila[i] === undefined) fila[i] = null
    filas[nro - 1] = fila
  }
  for (let i = 0; i < filas.length; i++) if (!filas[i]) filas[i] = []
  return filas
}

/**
 * Renglones de texto de un PDF: las palabras a la misma altura forman un renglón, de izquierda a derecha.
 * Las celdas se separan con dos espacios si hay un hueco grande entre ellas.
 */
export async function leerRenglonesPdf(datos: ArrayBuffer | Uint8Array): Promise<string[]> {
  const { getDocumentProxy } = await import("unpdf")
  // pdf.js no acepta Buffer de Node: siempre una copia como Uint8Array común
  const bytes = datos instanceof Uint8Array ? new Uint8Array(datos) : new Uint8Array(datos)
  const pdf = await getDocumentProxy(bytes)
  const renglones: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const pagina = await pdf.getPage(p)
    const contenido = await pagina.getTextContent()
    const palabras: { x: number; y: number; ancho: number; alto: number; texto: string }[] = []
    for (const it of contenido.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number }>) {
      if (!it.str || !it.transform || !it.str.trim()) continue
      palabras.push({
        x: it.transform[4],
        y: it.transform[5],
        ancho: it.width ?? 0,
        alto: it.height || Math.abs(it.transform[3]) || 8,
        texto: it.str,
      })
    }
    // Agrupar por altura (de arriba hacia abajo); tolerancia: un tercio del alto de letra
    palabras.sort((a, b) => b.y - a.y || a.x - b.x)
    const grupos: (typeof palabras)[] = []
    for (const w of palabras) {
      const g = grupos.find((gr) => Math.abs(gr[0].y - w.y) <= Math.max(2, gr[0].alto / 3))
      if (g) g.push(w)
      else grupos.push([w])
    }
    grupos.sort((a, b) => b[0].y - a[0].y)
    for (const g of grupos) {
      g.sort((a, b) => a.x - b.x)
      let linea = ""
      let finAnterior: number | null = null
      for (const w of g) {
        if (finAnterior !== null) linea += w.x - finAnterior > w.alto * 1.2 ? "  " : w.x - finAnterior > 0.5 ? " " : ""
        linea += w.texto
        finAnterior = w.x + w.ancho
      }
      const limpia = linea.replace(/\s+$/, "")
      if (limpia.trim()) renglones.push(limpia)
    }
  }
  return renglones
}
