// Módulo: Proveedores
// Interpretación de las listas de precios de las tiendas de telas (cortinas tradicionales) y de la
// lista de accesorios de Rollershade. Funciones puras (sin base ni "@/"): las usa también el script
// de carga inicial.
//
// Formatos de telas:
//  - ALHAMBRA (Excel): Rubro | Artículo | Descripción | Ancho | Precio (IVA INCLUIDO)        → recargo × 1,5
//  - BIA_BREM (Excel): ... | CODIGO | NOMBRE | DESCRIPCION | ANCHO | FINAL (secciones en filas sueltas) → × 1,21 × 1,5
//  - SIROTA  (PDF):    "130- 2470 - 01 al 23  Jaquard Tupungato IMP  1.40  poliester  $ 5.219,56" (más IVA) → × 1,21 × 1,5
// El Excel se lee por los títulos de las columnas, así que cualquier proveedor con una lista parecida funciona.

import type { Celda } from "./leer-archivos"

export type FormatoListaTelas = "ALHAMBRA" | "BIA_BREM" | "SIROTA"

export const FORMATOS_LISTA_TELAS: Record<
  FormatoListaTelas,
  { nombre: string; recargo: number; textoRecargo: string; archivo: string }
> = {
  ALHAMBRA: { nombre: "Alhambra", recargo: 1.5, textoRecargo: "× 1,5 (la lista ya trae IVA)", archivo: "Excel o PDF" },
  BIA_BREM: { nombre: "Bia Brem", recargo: 1.21 * 1.5, textoRecargo: "× 1,21 × 1,5", archivo: "Excel o PDF" },
  SIROTA: { nombre: "Sirota", recargo: 1.21 * 1.5, textoRecargo: "× 1,21 × 1,5", archivo: "PDF o Excel" },
}

export function esFormatoListaTelas(v: unknown): v is FormatoListaTelas {
  return v === "ALHAMBRA" || v === "BIA_BREM" || v === "SIROTA"
}

export interface FilaTela {
  nombre: string
  descripcion: string | null
  rubro: string | null
  codigo: string | null
  ancho: number | null
  precio: number
}

const normal = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()

const limpio = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim()

/** "$ 5.219,56" / "5219.56" / 5219.56 → 5219.56 */
export function leerPrecio(v: Celda | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (!v) return null
  let s = String(v).replace(/[^\d.,-]/g, "")
  if (!s) return null
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".")
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "")
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** "2,90 M." / "3.2M" / 2.5 → 2.9 / 3.2 / 2.5 (metros) */
export function leerAncho(v: Celda | undefined): number | null {
  if (typeof v === "number") return v > 0 && v < 10 ? v : null
  const m = String(v ?? "").match(/(\d+(?:[.,]\d+)?)/)
  if (!m) return null
  const n = Number(m[1].replace(",", "."))
  return n > 0 && n < 10 ? n : null
}

/** Si un nombre se repite dentro de la misma lista, se le agrega el ancho (y si no alcanza, la descripción). */
function nombresUnicos(filas: FilaTela[]): FilaTela[] {
  const cuenta = new Map<string, number>()
  for (const f of filas) cuenta.set(normal(f.nombre), (cuenta.get(normal(f.nombre)) ?? 0) + 1)
  const conAncho = filas.map((f) =>
    (cuenta.get(normal(f.nombre)) ?? 0) > 1 && f.ancho
      ? { ...f, nombre: `${f.nombre} (${f.ancho.toLocaleString("es-AR", { minimumFractionDigits: 2 })} m)` }
      : f
  )
  const vistos = new Map<string, number>()
  return conAncho.map((f) => {
    const clave = normal(f.nombre)
    const n = (vistos.get(clave) ?? 0) + 1
    vistos.set(clave, n)
    if (n === 1) return f
    const conDesc = f.descripcion ? `${f.nombre} – ${f.descripcion}` : `${f.nombre} #${n}`
    return { ...f, nombre: vistos.has(normal(conDesc)) ? `${conDesc} #${n}` : conDesc }
  })
}

// ─── Excel (por títulos de columna) ──────────────────────────────────────────

export function parsearExcelTelas(filas: Celda[][]): FilaTela[] {
  let h = -1
  let col = { nombre: -1, desc: -1, ancho: -1, precio: -1, rubro: -1, codigo: -1 }
  for (let i = 0; i < Math.min(filas.length, 40) && h < 0; i++) {
    const t = (filas[i] ?? []).map(normal)
    const idx = (re: RegExp) => t.findIndex((c) => re.test(c))
    const nombre = idx(/^nombre$/)
    const descripcion = idx(/^descripcion$/)
    const precio = [idx(/^final$/), idx(/iva incluido/), idx(/^\(?iva/), idx(/precio/), idx(/p\/ ?cortes/)].find((n) => n >= 0) ?? -1
    if ((nombre >= 0 || descripcion >= 0) && precio >= 0) {
      h = i
      col = {
        nombre: nombre >= 0 ? nombre : descripcion,
        desc: nombre >= 0 ? descripcion : -1,
        ancho: idx(/^ancho/),
        precio,
        rubro: idx(/^rubro/),
        codigo: idx(/^(codigo|articulo|art\b|art\.)/),
      }
    }
  }
  if (h < 0) throw new Error("No encontré la fila de títulos (Nombre / Descripción y Precio / Final) en el Excel.")

  const res: FilaTela[] = []
  // La primera sección puede estar justo arriba de los títulos (Bia Brem: "GASA Y TUSOR")
  const arriba = (filas[h - 1] ?? []).map(limpio).filter(Boolean)
  let seccion: string | null = arriba.length === 1 ? arriba[0] : null
  for (let i = h + 1; i < filas.length; i++) {
    const f = filas[i] ?? []
    const nombre = limpio(f[col.nombre])
    const precio = leerPrecio(f[col.precio])
    if (!nombre && !f.some((c) => limpio(c))) continue
    if (!nombre || precio === null || precio <= 0) {
      // Fila de sección ("BLACK OUT", "CORTINERIA"...): el primer texto de la fila
      const titulo = f.map(limpio).find((c) => c && !/^\d+([.,]\d+)?$/.test(c))
      if (titulo && normal(titulo) !== "nombre" && normal(titulo) !== "descripcion") seccion = titulo
      continue
    }
    const codigo =
      col.codigo >= 0
        ? f
            .slice(col.codigo, col.codigo < col.nombre ? col.nombre : col.codigo + 1)
            .map((c) => (typeof c === "number" ? String(c) : limpio(c)))
            .filter(Boolean)
            .join(" ") || null
        : null
    res.push({
      nombre,
      descripcion: col.desc >= 0 ? limpio(f[col.desc]) || null : null,
      rubro: col.rubro >= 0 ? limpio(f[col.rubro]) || seccion : seccion,
      codigo,
      ancho: col.ancho >= 0 ? leerAncho(f[col.ancho]) : null,
      precio: Math.round(precio * 100) / 100,
    })
  }
  if (res.length === 0) throw new Error("El Excel no tiene telas con precio debajo de los títulos.")
  return nombresUnicos(res)
}

// ─── PDF (renglones del estilo Sirota) ───────────────────────────────────────

const RE_RENGLON_PDF =
  /^\s*\d+\s*-\s*(\d{3,5})\s*-?\s*(.+?)\s+(\d[.,]\d{1,2})\s+([^\s$]+(?:\s[^\s$]+)?)\s*\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*\$?\s*$/

export function parsearPdfTelas(renglones: string[]): FilaTela[] {
  const res: FilaTela[] = []
  for (const r of renglones) {
    const m = r.replace(/\s+/g, " ").match(RE_RENGLON_PDF)
    if (!m) continue
    // "01 al 23 Jaquard Tupungato IMP" → "Jaquard Tupungato IMP"
    const nombre = m[2]
      .replace(/^\d+\s*(?:al|a|AL)\s*\d+\s*,?\s*/i, "")
      .replace(/^\d+\s+/, "")
      .trim()
    const precio = leerPrecio(m[5])
    if (!nombre || !precio) continue
    res.push({
      nombre,
      descripcion: m[4].trim() || null,
      rubro: null,
      codigo: m[1],
      ancho: leerAncho(m[3]),
      precio,
    })
  }
  if (res.length === 0) throw new Error("No encontré telas con precio en el PDF (¿es la lista de precios del proveedor?).")
  return nombresUnicos(res)
}

// ─── Accesorios Rollershade (PDF) ────────────────────────────────────────────

export interface SeccionAccesoriosPdf {
  titulo: string
  items: { descripcion: string; precio: number }[]
}

const RE_ITEM_ACCESORIO = /^(.*?)\s*\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*$/

/** Secciones y renglones con precio de la lista "Rieles y cosas" (en el orden del PDF). */
export function parsearPdfAccesorios(renglones: string[]): SeccionAccesoriosPdf[] {
  const secciones: SeccionAccesoriosPdf[] = []
  for (const r of renglones) {
    const linea = r.replace(/\s+/g, " ").trim()
    const m = linea.match(RE_ITEM_ACCESORIO)
    if (m) {
      const precio = leerPrecio(m[2])
      if (precio === null) continue
      if (secciones.length === 0) secciones.push({ titulo: "", items: [] })
      const descripcion = m[1]
        .replace(/\s+(TIRA\s*\d+\s*MT?S?|UNI|MTS?|MT|ROLLO|M MTS)\s*$/i, "")
        .trim()
      secciones[secciones.length - 1].items.push({ descripcion, precio })
      continue
    }
    const n = normal(linea)
    if (!n || n.startsWith("descripcion") || n.startsWith("lista de accesorios")) continue
    secciones.push({ titulo: linea, items: [] })
  }
  return secciones.filter((s) => s.items.length > 0)
}

/** Primera palabra significativa (para comprobar que el renglón del PDF es el mismo ítem de la base). */
export function palabraClave(s: string): string {
  return normal(s).replace(/[^a-z0-9 ]/g, " ").trim().split(" ")[0] ?? ""
}

/** Distancia de edición (para tolerar errores de tipeo del PDF, ej: "TEMRINAL"). */
export function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
