// Módulo: Proveedores & Compras
// Lectura de la planilla de precios de Google Sheets de un proveedor (ej: PRINTEMPS, insumos de toldos).
// La planilla tiene el insumo en la columna A y el precio en la B ("$32.841"); los renglones sin precio
// son títulos de sección (en amarillo). Los renglones antes del primer título se ignoran (resumen de arriba).

export interface IFilaPlanilla {
  seccion: string
  descripcion: string
  precio: number
  orden: number
}

/** Link de la planilla → link de descarga en CSV (respeta la hoja del link, gid=…). Null si no es de Google Sheets. */
export function urlCsvPlanilla(url: string): string | null {
  const id = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1]
  if (!id) return null
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? "0"
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

/** CSV → filas de celdas (comillas dobles, comas y saltos de línea dentro de comillas). */
export function parsearCsv(texto: string): string[][] {
  const filas: string[][] = []
  let fila: string[] = []
  let celda = ""
  let entreComillas = false
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]
    if (entreComillas) {
      if (ch === '"' && texto[i + 1] === '"') {
        celda += '"'
        i++
      } else if (ch === '"') {
        entreComillas = false
      } else {
        celda += ch
      }
    } else if (ch === '"') {
      entreComillas = true
    } else if (ch === ",") {
      fila.push(celda)
      celda = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++
      fila.push(celda)
      filas.push(fila)
      fila = []
      celda = ""
    } else {
      celda += ch
    }
  }
  if (celda !== "" || fila.length > 0) {
    fila.push(celda)
    filas.push(fila)
  }
  return filas
}

/** "$32.841" → 32841 · "$1.234,50" → 1234.5 · "" → null */
export function parsearPrecio(texto: string | undefined): number | null {
  const limpio = (texto ?? "").replace(/[$\s]/g, "")
  if (!limpio || !/\d/.test(limpio)) return null
  const n = Number(limpio.replace(/\./g, "").replace(",", "."))
  return Number.isFinite(n) ? n : null
}

const normalizarEspacios = (s: string) => s.replace(/\s+/g, " ").trim()

/** Filas con precio, cada una con el título de sección que tiene arriba. Repetidas (misma sección y texto): la primera. */
export function filasDePlanilla(csv: string): IFilaPlanilla[] {
  const resultado: IFilaPlanilla[] = []
  const vistas = new Set<string>()
  let seccion: string | null = null
  for (const celdas of parsearCsv(csv)) {
    const descripcion = normalizarEspacios(celdas[0] ?? "")
    if (!descripcion) continue
    const precio = parsearPrecio(celdas[1])
    if (precio === null) {
      // Sin precio: título de sección (salvo el encabezado de columnas)
      if (descripcion.toLowerCase() !== "precio") seccion = descripcion
      continue
    }
    if (seccion === null) continue
    const clave = `${seccion}|${descripcion}`.toLowerCase()
    if (vistas.has(clave)) continue
    vistas.add(clave)
    resultado.push({ seccion, descripcion, precio, orden: resultado.length })
  }
  return resultado
}
