// Módulo: Presupuestos
// Cálculo de cortinas TRADICIONALES con las listas de las tiendas de telas (Alhambra, Bia Brem, Sirota)
// y los accesorios de barral de la lista de Rollershade (línea Black Point 1").
//
// Precio de la tela por metro = precio de lista × recargo del proveedor
//   (Alhambra × 1,5 · Bia Brem y Sirota × 1,21 × 1,5).
// Si la misma tela está en dos tiendas, se presupuesta con la más cara y se avisa (solo interno)
// dónde está más barata, para pedirla ahí.
//
// Estándar (alto ≤ 2,85 m), por capa: riel/barral + confección (por metro de ancho) + tela (ancho × frunce)
// + instalación; Paño invertido (alto > 2,85 m): paños = ⌈ancho × 2 / ancho del rollo⌉,
// metros = paños × (alto + 0,20).
// Con barral se suman: argollas, 2 terminales por barral (el más caro de la línea) y los soportes
// (Kent / Grampa, simple / doble, según la medición), todo a precio de lista × 1,5.

import { z } from "zod"
import { VALORES_DEFECTO_PRECIOS } from "./calculadora-precios"

/** Recargo de los accesorios de barral sobre la lista de Rollershade */
export const RECARGO_ACCESORIOS = 1.5
/** Sección de la lista de Rollershade de la que salen argollas, terminales y soportes */
export const SECCION_ACCESORIOS_BARRAL = 'Línea Black Point 1"'
/** Alto desde el que se arma con paños invertidos */
export const ALTO_MAX_ESTANDAR = 2.85

// ─── Catálogo de telas (lo arma el servidor con las tres listas) ─────────────

export interface IOpcionTelaTradicional {
  id: string
  proveedor: string
  nombre: string
  descripcion: string | null
  ancho: number | null
  precioLista: number
  /** Precio por metro con el recargo del proveedor */
  precio: number
}

export interface ITelaTradicional {
  /** Nombre normalizado: las telas con el mismo nombre en dos tiendas son una sola */
  clave: string
  nombre: string
  /** De la más cara a la más barata */
  opciones: IOpcionTelaTradicional[]
}

/** "Gasa Arrugada IMP" / "GASA ARRUGADA" → "gasa arrugada" */
export function claveTela(nombre: string | null | undefined): string {
  return (nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/black\s*out|b\.\s*out/g, "blackout")
    .replace(/[^a-z0-9.,]+/g, " ")
    .replace(/\bimp\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Agrupa las telas de las listas por nombre (la más cara primero). */
export function armarCatalogoTelas(opciones: IOpcionTelaTradicional[]): ITelaTradicional[] {
  const grupos = new Map<string, IOpcionTelaTradicional[]>()
  for (const o of opciones) {
    const k = claveTela(o.nombre)
    if (!k) continue
    grupos.set(k, [...(grupos.get(k) ?? []), o])
  }
  return [...grupos.entries()]
    .map(([clave, ops]) => {
      const orden = [...ops].sort((a, b) => b.precio - a.precio)
      return { clave, nombre: orden[0].nombre, opciones: orden }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}

/** Busca en el catálogo la tela escrita en la medición (nombre exacto, o el nombre más largo contenido). */
export function buscarTelaCatalogo(
  catalogo: ITelaTradicional[],
  nombre: string | null | undefined
): ITelaTradicional | null {
  const k = claveTela(nombre)
  if (!k) return null
  const exacta = catalogo.find((t) => t.clave === k)
  if (exacta) return exacta
  let mejor: ITelaTradicional | null = null
  for (const t of catalogo) {
    if (t.clave.length < 4) continue
    const re = new RegExp(`(^| )${t.clave.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`)
    if (re.test(k) && (!mejor || t.clave.length > mejor.clave.length)) mejor = t
  }
  return mejor
}

/** Sugerencias para el buscador: las que empiezan con lo escrito primero, después las que lo contienen. */
export function sugerirTelas(catalogo: ITelaTradicional[], texto: string, max = 12): ITelaTradicional[] {
  const k = claveTela(texto)
  if (!k) return []
  const palabras = k.split(" ")
  const empieza: ITelaTradicional[] = []
  const contiene: ITelaTradicional[] = []
  for (const t of catalogo) {
    if (t.clave.startsWith(k)) empieza.push(t)
    else if (palabras.every((p) => t.clave.includes(p))) contiene.push(t)
    if (empieza.length >= max) break
  }
  return [...empieza, ...contiene].slice(0, max)
}

// ─── Accesorios de barral (de la lista de Rollershade) ───────────────────────

export interface IAccesorioBarral {
  descripcion: string
  /** Precio de lista × 1,5 */
  precio: number
}

export interface IAccesoriosBarral {
  argolla: IAccesorioBarral | null
  /** El terminal más caro de la línea */
  terminal: IAccesorioBarral | null
  soportes: { tipo: "Kent" | "Grampa"; variante: "Simple" | "Doble"; item: IAccesorioBarral }[]
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function accesoriosBarral(
  lista: { seccion: string; descripcion: string; precio: number }[]
): IAccesoriosBarral {
  const items = lista
    .filter((it) => it.seccion === SECCION_ACCESORIOS_BARRAL)
    .map((it) => ({ d: norm(it.descripcion), it: { descripcion: it.descripcion, precio: Math.round(it.precio * RECARGO_ACCESORIOS) } }))
  const argolla = items.find((x) => x.d.startsWith("argolla"))?.it ?? null
  const terminal =
    items.filter((x) => x.d.startsWith("terminal")).sort((a, b) => b.it.precio - a.it.precio)[0]?.it ?? null
  const soportes: IAccesoriosBarral["soportes"] = []
  for (const x of items) {
    if (!x.d.startsWith("soporte")) continue
    const tipo = x.d.includes("kent") ? "Kent" : x.d.includes("grampa") ? "Grampa" : null
    const variante = x.d.includes("doble") ? "Doble" : x.d.includes("simple") ? "Simple" : null
    if (tipo && variante) soportes.push({ tipo, variante, item: x.it })
  }
  return { argolla, terminal, soportes }
}

/** Argollas de un barral (misma fórmula que la medición: ⌈(ancho cm + 10) / 10⌉ + 4). */
export function argollasPorBarral(ancho: number): number {
  if (!ancho || ancho <= 0) return 0
  return Math.ceil((ancho * 100 + 10) / 10) + 4
}

/** Soportes de la abertura (misma fórmula que la medición: hasta 1,80 m 2, más ancho 3). */
export function soportesPorAncho(ancho: number): number {
  return !ancho || ancho <= 1.8 ? 2 : 3
}

// ─── Configuración guardada en la fila (calculoPrecio.tradicional) ───────────

export const capaTelaSchema = z.object({
  lleva: z.boolean().default(false),
  /** Gasa ×2; Blackout ×1,5 o ×2 */
  frunce: z.number().min(1).max(4).default(2),
  /** Tela del catálogo (clave) y opción de la tienda con la que se calculó */
  clave: z.string().max(200).nullable().optional(),
  telaId: z.string().max(60).nullable().optional(),
  nombre: z.string().max(200).nullable().optional(),
  proveedor: z.string().max(60).nullable().optional(),
  /** Ancho del rollo en metros */
  ancho: z.number().nullable().optional(),
  /** Precio por metro con recargo (el que se usa en la cuenta) */
  precio: z.number().min(0).default(0),
  /** El precio se escribió a mano (tela que no está en las listas o precio corregido) */
  manual: z.boolean().default(false),
  /** Dónde está más barata la misma tela (solo para uso interno, al pedirla) */
  masBaratas: z
    .array(
      z.object({
        proveedor: z.string().max(60),
        nombre: z.string().max(200),
        ancho: z.number().nullable(),
        precio: z.number(),
      })
    )
    .max(5)
    .default([]),
})
export type CapaTela = z.infer<typeof capaTelaSchema>

export const accesoriosCalcSchema = z.object({
  argollas: z.number().int().min(0).max(999).default(0),
  precioArgolla: z.number().min(0).default(0),
  terminales: z.number().int().min(0).max(99).default(0),
  precioTerminal: z.number().min(0).default(0),
  nombreTerminal: z.string().max(120).nullable().optional(),
  soportes: z.number().int().min(0).max(99).default(0),
  precioSoporte: z.number().min(0).default(0),
  /** Ej: "Kent / York doble" */
  nombreSoporte: z.string().max(120).nullable().optional(),
})
export type AccesoriosCalc = z.infer<typeof accesoriosCalcSchema>

export const configTradicionalSchema = z.object({
  modo: z.enum(["ESTANDAR", "INVERTIDO"]).default("ESTANDAR"),
  // Estándar: una o dos capas
  gasa: capaTelaSchema.default({ lleva: false, frunce: 2, precio: 0, manual: false, masBaratas: [] }),
  bo: capaTelaSchema.default({ lleva: false, frunce: 1.5, precio: 0, manual: false, masBaratas: [] }),
  // Paño invertido: una tela
  tela: capaTelaSchema.default({ lleva: true, frunce: 2, precio: 0, manual: false, masBaratas: [] }),
  anchoRollo: z.number().min(0.5).max(6).default(VALORES_DEFECTO_PRECIOS.anchoRolloTelaDefault),
  sistema: z.enum(["Riel", "Barral"]).default("Riel"),
  precioRielMetro: z.number().min(0).default(VALORES_DEFECTO_PRECIOS.precioRielMetroTradicional),
  precioConfeccionMetro: z.number().min(0).default(VALORES_DEFECTO_PRECIOS.precioConfeccionMetroTradicional),
  precioInstalacion: z.number().min(0).default(VALORES_DEFECTO_PRECIOS.precioInstalacionTradicional),
  accesorios: accesoriosCalcSchema.nullable().default(null),
})
export type ConfigTradicional = z.infer<typeof configTradicionalSchema>

export interface ResultadoTradicional {
  precio: number | null
  desglose: { concepto: string; detalle: string; importe: number }[]
  formula: string
  avisos: string[]
}

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`
const fmtM = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 })

/** Capas que lleva la cortina (para mostrar la tela y para el pedido). */
export function capasConTela(cfg: ConfigTradicional): { capa: "Gasa" | "Blackout" | "Tela"; tela: CapaTela }[] {
  if (cfg.modo === "INVERTIDO") return [{ capa: "Tela", tela: cfg.tela }]
  const res: { capa: "Gasa" | "Blackout" | "Tela"; tela: CapaTela }[] = []
  if (cfg.gasa.lleva) res.push({ capa: "Gasa", tela: cfg.gasa })
  if (cfg.bo.lleva) res.push({ capa: "Blackout", tela: cfg.bo })
  return res
}

/** Metros de tela de una capa (para el pedido): estándar ancho × frunce; invertido paños × (alto + 0,20). */
export function metrosDeTela(cfg: ConfigTradicional, capa: CapaTela, ancho: number, alto: number): number {
  if (cfg.modo === "INVERTIDO") {
    const rollo = capa.ancho || cfg.anchoRollo
    const panos = Math.ceil((ancho * 2) / rollo) || 1
    return Math.round(panos * (alto + 0.2) * 100) / 100
  }
  return Math.round(ancho * capa.frunce * 100) / 100
}

export function calcularTradicional(ancho: number, alto: number, cfg: ConfigTradicional): ResultadoTradicional {
  const a = Math.max(0, Number(ancho) || 0)
  const h = Math.max(0, Number(alto) || 0)
  const desglose: ResultadoTradicional["desglose"] = []
  const avisos: string[] = []
  const nombreRiel = cfg.sistema === "Barral" ? "Barral" : "Riel"
  const capas = capasConTela(cfg)
  const cantCapas = cfg.modo === "INVERTIDO" ? 1 : capas.length || 1
  let faltaTela = false

  // Telas
  for (const { capa, tela } of capas) {
    const metros = metrosDeTela(cfg, tela, a, h)
    const nombre = tela.nombre ? `${tela.nombre}${tela.proveedor ? ` (${tela.proveedor})` : ""}` : "sin tela elegida"
    if (!tela.precio) {
      faltaTela = true
      avisos.push(`Falta el precio de la tela ${capa === "Tela" ? "" : `${capa === "Gasa" ? "de la Gasa" : "del Blackout"} `}(elegila en la calculadora).`)
    }
    const detalle =
      cfg.modo === "INVERTIDO"
        ? `${nombre}: ${Math.ceil((a * 2) / (tela.ancho || cfg.anchoRollo)) || 1} paños × (${fmtM(h)} + 0,20) = ${fmtM(metros)} m × ${fmt$(tela.precio)}`
        : `${nombre}: ${fmtM(a)} m × ${fmtM(tela.frunce)} = ${fmtM(metros)} m × ${fmt$(tela.precio)}`
    desglose.push({ concepto: `Tela ${capa === "Tela" ? "" : capa}`.trim(), detalle: detalle.slice(0, 200), importe: Math.round(metros * tela.precio) })
    // El rollo tiene que cubrir el alto en la cortina estándar
    if (cfg.modo === "ESTANDAR" && tela.ancho && tela.ancho < h + 0.2) {
      avisos.push(
        `${tela.nombre}: el rollo mide ${fmtM(tela.ancho)} m de ancho y la cortina ${fmtM(h)} m de alto (no alcanza sin unir paños).`
      )
    }
  }
  if (capas.length === 0) {
    faltaTela = true
    avisos.push("Elegí al menos una tela (Gasa o Blackout).")
  }

  // Riel / barral, confección e instalación
  desglose.push({
    concepto: nombreRiel,
    detalle: `${fmtM(a)} m × ${fmt$(cfg.precioRielMetro)}${cantCapas > 1 ? ` × ${cantCapas}` : ""}`,
    importe: Math.round(a * cfg.precioRielMetro * cantCapas),
  })
  desglose.push({
    concepto: "Confección",
    detalle: `${fmtM(a)} m × ${fmt$(cfg.precioConfeccionMetro)}${cantCapas > 1 ? ` × ${cantCapas}` : ""}`,
    importe: Math.round(a * cfg.precioConfeccionMetro * cantCapas),
  })

  // Accesorios del barral
  const acc = cfg.sistema === "Barral" ? cfg.accesorios : null
  if (acc) {
    if (acc.argollas > 0)
      desglose.push({ concepto: "Argollas", detalle: `${acc.argollas} × ${fmt$(acc.precioArgolla)}`, importe: Math.round(acc.argollas * acc.precioArgolla) })
    if (acc.terminales > 0)
      desglose.push({
        concepto: "Terminales",
        detalle: `${acc.terminales} × ${fmt$(acc.precioTerminal)}${acc.nombreTerminal ? ` (${acc.nombreTerminal})` : ""}`.slice(0, 200),
        importe: Math.round(acc.terminales * acc.precioTerminal),
      })
    if (acc.soportes > 0)
      desglose.push({
        concepto: "Soportes",
        detalle: `${acc.soportes} × ${fmt$(acc.precioSoporte)}${acc.nombreSoporte ? ` (${acc.nombreSoporte})` : ""}`.slice(0, 200),
        importe: Math.round(acc.soportes * acc.precioSoporte),
      })
    if (!acc.precioArgolla || !acc.precioTerminal || (acc.soportes > 0 && !acc.precioSoporte))
      avisos.push("Falta algún precio de accesorios del barral (lista de accesorios de Rollershade).")
  }

  desglose.push({
    concepto: "Instalación",
    detalle: `${fmt$(cfg.precioInstalacion)}${cantCapas > 1 ? ` × ${cantCapas}` : ""}`,
    importe: Math.round(cfg.precioInstalacion * cantCapas),
  })

  const total = desglose.reduce((s, l) => s + l.importe, 0)
  const formula = desglose.map((l) => `${l.concepto} ${fmt$(l.importe)}`).join(" + ")
  return { precio: faltaTela ? null : Math.round(total), desglose, formula: formula.slice(0, 300), avisos }
}

// ─── Elegir tela del catálogo ────────────────────────────────────────────────

/** Capa con la tela elegida del catálogo: precio de la más cara y aviso de las más baratas. */
export function capaConTelaCatalogo(capa: CapaTela, tela: ITelaTradicional): CapaTela {
  const [cara, ...resto] = tela.opciones
  return {
    ...capa,
    clave: tela.clave,
    telaId: cara.id,
    nombre: cara.nombre,
    proveedor: cara.proveedor,
    ancho: cara.ancho,
    precio: cara.precio,
    manual: false,
    masBaratas: resto
      .filter((o) => o.precio < cara.precio)
      .slice(0, 5)
      .map((o) => ({ proveedor: o.proveedor, nombre: o.nombre, ancho: o.ancho, precio: o.precio })),
  }
}

/** Actualiza la tela con el catálogo vigente (si se eligió de la lista y el precio no se tocó a mano). */
export function refrescarCapa(capa: CapaTela, catalogo: ITelaTradicional[]): CapaTela {
  if (capa.manual || !capa.clave || catalogo.length === 0) return capa
  const tela = catalogo.find((t) => t.clave === capa.clave)
  return tela ? capaConTelaCatalogo(capa, tela) : capa
}

// ─── Configuración inicial desde la medición ─────────────────────────────────

export interface DatosMedicionTradicional {
  capa: "GAZA" | "BO" | null
  nombreTela?: string | null
  sistema?: "Riel" | "Barral" | null
  tipoSoporte?: "Kent" | "Grampa" | null
  varianteSoporte?: "Simple" | "Doble" | null
  cantidadSoportes?: number | null
  /** La abertura lleva las dos capas tradicionales (los soportes dobles se cobran una vez, en la Gasa) */
  dosCapasTradicionales?: boolean
}

const capaVacia = (frunce: number): CapaTela => ({ lleva: false, frunce, precio: 0, manual: false, masBaratas: [] })

/** Accesorios por defecto de una fila con barral. */
export function accesoriosPorDefecto(
  ancho: number,
  cantBarrales: number,
  acc: IAccesoriosBarral,
  soporte: { tipo?: "Kent" | "Grampa" | null; variante?: "Simple" | "Doble" | null; cantidad?: number | null; cobrar: boolean }
): AccesoriosCalc {
  const tipo = soporte.tipo ?? "Kent"
  const variante = soporte.variante ?? (cantBarrales > 1 ? "Doble" : "Simple")
  const sop = acc.soportes.find((s) => s.tipo === tipo && s.variante === variante) ?? null
  return {
    argollas: argollasPorBarral(ancho) * cantBarrales,
    precioArgolla: acc.argolla?.precio ?? 0,
    terminales: 2 * cantBarrales,
    precioTerminal: acc.terminal?.precio ?? 0,
    nombreTerminal: acc.terminal?.descripcion ?? null,
    soportes: soporte.cobrar ? soporte.cantidad || soportesPorAncho(ancho) : 0,
    precioSoporte: sop?.item.precio ?? 0,
    nombreSoporte: `${tipo === "Kent" ? "Kent / York" : "Grampa"} ${variante.toLowerCase()}`,
  }
}

export function configDesdeMedicion(
  ancho: number,
  alto: number,
  datos: DatosMedicionTradicional,
  catalogo: ITelaTradicional[],
  acc: IAccesoriosBarral
): ConfigTradicional {
  const modo = alto > ALTO_MAX_ESTANDAR ? "INVERTIDO" : "ESTANDAR"
  const tela = buscarTelaCatalogo(catalogo, datos.nombreTela)
  const conTela = (c: CapaTela): CapaTela => {
    const lleva = { ...c, lleva: true }
    if (tela) return capaConTelaCatalogo(lleva, tela)
    return datos.nombreTela ? { ...lleva, nombre: datos.nombreTela } : lleva
  }
  const gasa = datos.capa !== "BO" ? conTela(capaVacia(2)) : capaVacia(2)
  const bo = datos.capa === "BO" ? conTela(capaVacia(2)) : capaVacia(1.5)
  const telaInv = conTela(capaVacia(2))
  const sistema = datos.sistema === "Barral" ? "Barral" : "Riel"
  return {
    modo,
    gasa,
    bo,
    tela: telaInv,
    anchoRollo: (modo === "INVERTIDO" ? telaInv.ancho : null) || VALORES_DEFECTO_PRECIOS.anchoRolloTelaDefault,
    sistema,
    precioRielMetro: VALORES_DEFECTO_PRECIOS.precioRielMetroTradicional,
    precioConfeccionMetro:
      modo === "INVERTIDO"
        ? VALORES_DEFECTO_PRECIOS.precioConfeccionMetroInvertido
        : VALORES_DEFECTO_PRECIOS.precioConfeccionMetroTradicional,
    precioInstalacion: VALORES_DEFECTO_PRECIOS.precioInstalacionTradicional,
    accesorios:
      sistema === "Barral"
        ? accesoriosPorDefecto(ancho, 1, acc, {
            tipo: datos.tipoSoporte,
            variante: datos.varianteSoporte,
            cantidad: datos.cantidadSoportes,
            // Soportes dobles: se cobran una sola vez (en la fila de la Gasa)
            cobrar: !(datos.capa === "BO" && datos.dosCapasTradicionales && datos.varianteSoporte === "Doble"),
          })
        : null,
  }
}

/** Texto de la tela para el cliente: "Gasa Bamboo" / "Gasa: Bamboo · Blackout: Wash". */
export function textoTelasTradicional(cfg: ConfigTradicional): string | null {
  const capas = capasConTela(cfg).filter((c) => c.tela.nombre)
  if (capas.length === 0) return null
  if (capas.length === 1) return capas[0].tela.nombre ?? null
  return capas.map((c) => `${c.capa}: ${c.tela.nombre}`).join(" · ")
}
