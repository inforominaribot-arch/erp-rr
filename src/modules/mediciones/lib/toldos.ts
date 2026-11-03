// Módulo: Mediciones
// Toldos PRINTEMPS (marca PT): dos subtipos, Vertical y de Proyección. Al medir se cargan las opciones de
// estructura, mecanismo, cubre toldo y tela; los accesorios fijos (tapas) se agregan solos según la barra frente.
// La tela se elige de los catálogos Sembra (vinílicas) y Sauleda / Printemps / Muaari (acrílicas).

export const SUBTIPOS_TOLDO = [
  { subtipo: "VERTICAL", nombre: "Toldo Vertical" },
  { subtipo: "PROYECCION", nombre: "Toldo de Proyección" },
] as const
export type SubtipoToldo = (typeof SUBTIPOS_TOLDO)[number]["subtipo"]

export const COLORES_PERFILERIA_TOLDO = ["Blanco", "Negro"] as const
export const CANOS_TOLDO = ["70", "80"] as const
export const BARRAS_FRENTE_TOLDO = ["TP1", "TP2"] as const
/** Largo de los brazos del TP2 (m) */
export const BRAZOS_TP2 = ["0,8", "1,2", "1,4", "1,6", "1,8"] as const
export const TIPOS_PROYECCION = ["Punta a Punta", "Barra Cuadra"] as const
export const MECANISMOS_TOLDO = ["Manual", "Motorizado"] as const
export const MAQUINAS_TOLDO = ["Máquina importada polifuncional", "Máquina importada súper"] as const
export const MOTORES_TOLDO = ["Tube", "Somfy", "Oximo"] as const
export const CANALES_TOLDO = [1, 3, 5, 15, 16] as const
export const TELAS_TOLDO = ["Acrílica", "Vinílica"] as const

export const TIPOS_TELA_ACRILICA = ["x1,20", "x1,53", "x2"] as const
export const TIPOS_TELA_VINILICA = ["Sembra 7000", "Sembra 11000", "Screen Exterior", "Microperforado", "Blackout"] as const

export type ColorPerfileriaToldo = (typeof COLORES_PERFILERIA_TOLDO)[number]
export type CanoToldo = (typeof CANOS_TOLDO)[number]
export type BarraFrenteToldo = (typeof BARRAS_FRENTE_TOLDO)[number]
export type BrazoTP2 = (typeof BRAZOS_TP2)[number]
export type TipoProyeccion = (typeof TIPOS_PROYECCION)[number]
export type MecanismoToldo = (typeof MECANISMOS_TOLDO)[number]
export type MaquinaToldo = (typeof MAQUINAS_TOLDO)[number]
export type MotorToldo = (typeof MOTORES_TOLDO)[number]
export type CanalesToldo = (typeof CANALES_TOLDO)[number]
export type TelaToldo = (typeof TELAS_TOLDO)[number]

/** Configuración del toldo guardada en la medición (caracteristicas.toldo). Ancho y alto/proyección van en el ítem. */
export interface IToldoConfig {
  subtipo: SubtipoToldo
  /** Rige el color de plásticos y accesorios */
  colorPerfileria: ColorPerfileriaToldo
  cano: CanoToldo

  // Vertical
  barraFrente?: BarraFrenteToldo
  /** TP1 */
  tensor?: boolean
  /** TP1 */
  brazoCaputa?: boolean
  /** TP1 */
  sujecionPiso?: number
  /** TP2 */
  brazos?: BrazoTP2

  // Proyección
  tipoProyeccion?: TipoProyeccion
  pollerita?: boolean

  mecanismo: MecanismoToldo
  /** Vertical manual */
  maquina?: MaquinaToldo
  /** Vertical (manual y motorizado) */
  soportePlano?: number
  escuadra?: number
  /** Manual */
  manijas?: number
  /** Motorizado (Oximo solo con TP1) */
  motor?: MotorToldo
  control?: boolean
  cantidadControles?: number
  /** Solo si lleva control */
  canales?: CanalesToldo
  domotica?: boolean

  cubreToldo: boolean
  anchoCubreToldo?: number
  perchas?: number

  tela: TelaToldo
  tipoTela: string
  colorTela: string
  /** Línea del color (Sauleda, Printemps, Muaari Lisas…) */
  lineaTela?: string
}

// ─── Catálogo de telas ──────────────────────────────────────────────────────

export interface IColorTelaToldo {
  nombre: string
  linea: string
  /** Tipos de acrílica en los que viene (vacío = todos) */
  anchos?: string[]
}

const COLORES_VINILICAS: Record<string, string[]> = {
  "Sembra 7000": [
    "Aguamarina", "Amarillo Pastel", "Azul Claro", "Azul Oscuro", "Azul Fuerza Aérea", "Blanco", "Durazno",
    "Granate", "Gris Azulado", "Gris Claro", "Gris", "Mostaza", "Natural", "Naranja", "Negro", "Teja",
    "Verde Claro", "Verde Militar", "Verde Oscuro",
  ],
  "Sembra 11000": [
    "Amarillo", "Azul Claro", "Azul Oscuro", "Blanco", "Gris", "Naranja", "Negro", "Rojo", "Verde Claro", "Verde Oscuro",
  ],
  "Screen Exterior": ["Blanco", "Gris", "Beige", "Marrón Beige", "Negro Gris", "Marrón Negro"],
  Microperforado: ["Gris", "Negro", "Verde Oscuro", "Azul Fuerza Aérea", "Natural", "Marrón", "Mostaza", "Teja"],
  Blackout: ["Blanco"],
}

const A120 = ["x1,20"]
const A153 = ["x1,20", "x1,53"]
const A2 = ["x1,20", "x1,53", "x2"]

// Sauleda: [nombre y código, anchos en que viene]
const SAULEDA: Array<[string, string[]]> = [
  ["Amarillo 2013", A153], ["Amarillo N 2015", A120], ["Antártida 3014", A120], ["Azul 2018", A153],
  ["Azul Real 2235", A2], ["Azul Real N 2359", A120], ["Beige 2038", A2], ["Beige X 2275", A120],
  ["Berna 2041", A120], ["Blanco 2042", A2], ["Botella 2245", A2], ["Botella N 2640", A120],
  ["Cactus 1537", A120], ["Café 2316", A120], ["Canigó 2079", A120], ["Capri 2063", A120],
  ["Carbón X 1478", A120], ["Crema 2322", A120], ["Generation Red 1473", A120], ["Granate 2101", A2],
  ["Gris 2102", A2], ["Integral 2838", A153], ["Integral X 2681", A120], ["Jade 2892", A153],
  ["Jamaica 2701", A120], ["Madeira 2568", A120], ["Maíz 2141", A120], ["Marfil 2143", A2],
  ["Marino 2145", A2], ["Marrón 2146", A153], ["Marte 2121", A120], ["Máster 2160", A120],
  ["Mexico 2151", A120], ["Monaco 2154", A120], ["Naranja 2050", A120], ["Negro 2170", A2],
  ["Negro N 2171", A120], ["Piedra 3605", A153], ["Piedra X 2682", A120], ["Plutón 2179", A120],
  ["Reno 2210", A120], ["Rioja 2210", A153], ["Rojo 2211", A153], ["Rojo N 2212", A120],
  ["Sand X 1476", A120], ["Shell 1469", A120], ["Siena 2223", A120], ["Silver 2821", A2],
  ["Sol 2126", A120], ["Támesis 2231", A120], ["Teja 2065", A153], ["Toast 1470", A120],
  ["Tweed Pearl 2681", A120], ["Veleta 22676", A120], ["Venus 2659", A120], ["Verde 2242", A153],
  ["Verde N 2248", A120], ["Viena 2251", A120], ["Violeta 2252", A120], ["Windsor 2146", A120],
]

const PRINTEMPS = [
  "Cobre 2690", "Coco 3601", "Derby 2008", "Grafito 3602", "Hormigón 1072", "Jalisco 1484", "Neptuno 3022",
  "New York 2174", "Praliné 3010", "Regata 3002", "Tweed Avena 3580", "Tweed Gris Claro 3581",
  "Tweed Negro 3582", "Tweed Rojo 3583", "Tweed Verde 8573", "Volcán 3609",
]

// Muaari: van en cualquier ancho de acrílica
const MUAARI_LISAS = ["Azul Claro", "Azul Marino", "Blanco", "Gris", "Natural", "Negro Azabache", "Verde", "Verde Botella"]
const MUAARI_RAYADAS = [
  "Aida", "Butterfly", "Carmen", "Fausto", "Fígaro", "Isolda", "Macbeth", "Norma", "Orfeo", "Otello",
  "Rigoletto", "Rusalka", "Salomé", "Tosca", "Traviata", "Turandot", "Valquiria",
]

const COLORES_ACRILICAS: IColorTelaToldo[] = [
  ...SAULEDA.map(([nombre, anchos]) => ({ nombre, linea: "Sauleda", anchos })),
  ...PRINTEMPS.map((nombre) => ({ nombre, linea: "Sauleda by Printemps", anchos: A120 })),
  ...MUAARI_LISAS.map((nombre) => ({ nombre, linea: "Muaari Lisas" })),
  ...MUAARI_RAYADAS.map((nombre) => ({ nombre, linea: "Muaari Rayadas" })),
]

/** Tipos de tela según acrílica / vinílica. El toldo de proyección solo lleva acrílicas. */
export function tiposDeTela(tela: TelaToldo | null | undefined): readonly string[] {
  if (tela === "Acrílica") return TIPOS_TELA_ACRILICA
  if (tela === "Vinílica") return TIPOS_TELA_VINILICA
  return []
}

export function telasPermitidas(subtipo: SubtipoToldo | null | undefined): readonly TelaToldo[] {
  return subtipo === "PROYECCION" ? ["Acrílica"] : TELAS_TOLDO
}

/** Colores disponibles para el tipo de tela (las acrílicas Sauleda / Printemps se filtran por ancho). */
export function coloresDeTela(tela: TelaToldo | null | undefined, tipoTela: string | null | undefined): IColorTelaToldo[] {
  if (!tela || !tipoTela) return []
  if (tela === "Vinílica") {
    return (COLORES_VINILICAS[tipoTela] ?? []).map((nombre) => ({ nombre, linea: tipoTela }))
  }
  return COLORES_ACRILICAS.filter((c) => !c.anchos || c.anchos.includes(tipoTela))
}

/** Búsqueda sin tildes ni mayúsculas, por nombre / código o línea. */
export function buscarColoresTela(colores: IColorTelaToldo[], texto: string): IColorTelaToldo[] {
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  const palabras = norm(texto).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return colores
  return colores.filter((c) => {
    const t = norm(`${c.nombre} ${c.linea}`)
    return palabras.every((p) => t.includes(p))
  })
}

// ─── Reglas ─────────────────────────────────────────────────────────────────

/** Motores disponibles: el Oximo solo va con barra frente TP1 (toldo vertical). */
export function motoresDisponibles(t: Partial<Pick<IToldoConfig, "subtipo" | "barraFrente">>): readonly MotorToldo[] {
  return t.subtipo === "VERTICAL" && t.barraFrente === "TP1" ? MOTORES_TOLDO : ["Tube", "Somfy"]
}

/** Accesorios que se agregan solos (no se preguntan): tapas según la barra frente. */
export function accesoriosAutomaticosToldo(t: Partial<IToldoConfig> | null | undefined): string[] {
  if (!t || t.subtipo !== "VERTICAL") return []
  if (t.barraFrente === "TP1") return [t.tensor ? "Tapa TP1 con pasa cable" : "Tapa TP1 simple"]
  if (t.barraFrente === "TP2") return ["Tapa Frente"]
  return []
}

/** Deja solo los campos que corresponden a lo elegido (al cambiar de subtipo, barra o mecanismo). */
export function limpiarToldo(t: Partial<IToldoConfig>): Partial<IToldoConfig> {
  const vertical = t.subtipo === "VERTICAL"
  const tp1 = vertical && t.barraFrente === "TP1"
  const tp2 = vertical && t.barraFrente === "TP2"
  const manual = t.mecanismo === "Manual"
  const motorizado = t.mecanismo === "Motorizado"
  const motores = motoresDisponibles(t)
  const tela = t.tela && telasPermitidas(t.subtipo).includes(t.tela) ? t.tela : undefined
  const tipoTela = tela && t.tipoTela && tiposDeTela(tela).includes(t.tipoTela) ? t.tipoTela : undefined
  const colorValido = tipoTela && coloresDeTela(tela, tipoTela).some((c) => c.nombre === t.colorTela && c.linea === t.lineaTela)
  const r: Partial<IToldoConfig> = {
    subtipo: t.subtipo,
    colorPerfileria: t.colorPerfileria,
    cano: t.cano,
    ...(vertical ? { barraFrente: t.barraFrente } : { tipoProyeccion: t.tipoProyeccion, pollerita: t.pollerita ?? false }),
    ...(tp1 ? { tensor: t.tensor, brazoCaputa: t.brazoCaputa, sujecionPiso: t.sujecionPiso ?? 0 } : {}),
    ...(tp2 ? { brazos: t.brazos } : {}),
    mecanismo: t.mecanismo,
    ...(vertical && manual ? { maquina: t.maquina } : {}),
    ...(vertical && (manual || motorizado) ? { soportePlano: t.soportePlano ?? 0, escuadra: t.escuadra ?? 0 } : {}),
    ...(manual ? { manijas: t.manijas ?? 1 } : {}),
    ...(motorizado
      ? {
          motor: t.motor && motores.includes(t.motor) ? t.motor : undefined,
          control: t.control ?? false,
          ...(t.control ? { cantidadControles: t.cantidadControles ?? 1, canales: t.canales } : {}),
          domotica: t.domotica ?? false,
        }
      : {}),
    cubreToldo: t.cubreToldo ?? false,
    ...(t.cubreToldo ? { anchoCubreToldo: t.anchoCubreToldo, perchas: t.perchas } : {}),
    tela,
    tipoTela,
    ...(colorValido ? { colorTela: t.colorTela, lineaTela: t.lineaTela } : {}),
  }
  // Sin claves undefined (el JSON queda limpio)
  return Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined)) as Partial<IToldoConfig>
}

/** Qué falta completar (null si está todo). */
export function validarToldo(t: Partial<IToldoConfig> | null | undefined, ancho: number, alto: number): string | null {
  if (!t?.subtipo) return "Elegí el subtipo de toldo (Vertical o de Proyección)."
  const vertical = t.subtipo === "VERTICAL"
  if (!t.colorPerfileria) return "Elegí el color de perfilería e insumos."
  if (!t.cano) return "Elegí el caño galvanizado (70 u 80)."
  if (!(ancho > 0)) return "Ingresá el ancho del toldo."
  if (!(alto > 0)) return vertical ? "Ingresá el alto del toldo." : "Ingresá la proyección del toldo."
  if (vertical) {
    if (!t.barraFrente) return "Elegí la barra frente (TP1 o TP2)."
    if (t.barraFrente === "TP1") {
      if (t.tensor === undefined) return "Elegí si la barra TP1 va con tensor o sin tensor."
      if (t.brazoCaputa === undefined) return "Elegí si lleva brazo Caputa importado."
    }
    if (t.barraFrente === "TP2" && !t.brazos) return "Elegí el largo de los brazos del TP2."
  } else if (!t.tipoProyeccion) {
    return "Elegí el tipo (Punta a Punta o Barra Cuadra)."
  }
  if (!t.mecanismo) return "Elegí el mecanismo (Manual o Motorizado)."
  if (t.mecanismo === "Manual") {
    if (vertical && !t.maquina) return "Elegí la máquina."
    if (!t.manijas || t.manijas < 1) return "Ingresá la cantidad de manijas."
  } else {
    if (!t.motor) return "Elegí el tipo de motor."
    if (t.control) {
      if (!t.cantidadControles || t.cantidadControles < 1) return "Ingresá la cantidad de controles."
      if (!t.canales) return "Elegí los canales del control."
    }
  }
  if (t.cubreToldo) {
    if (!t.anchoCubreToldo || t.anchoCubreToldo <= 0) return "Ingresá el ancho del cubre toldo."
    if (!t.perchas || t.perchas < 1) return "Ingresá la cantidad de perchas del cubre toldo."
  }
  if (!t.tela) return "Elegí la tela (Acrílica o Vinílica)."
  if (!t.tipoTela) return "Elegí el tipo de tela."
  if (!t.colorTela) return "Elegí el color de la tela."
  return null
}

// ─── Textos ─────────────────────────────────────────────────────────────────

export const nombreSubtipoToldo = (subtipo: string | null | undefined) =>
  SUBTIPOS_TOLDO.find((s) => s.subtipo === subtipo)?.nombre ?? "Toldo"

/** Tela en una línea: "Acrílica x1,20 · Sauleda Beige 2038" */
export function textoTelaToldo(t: Partial<IToldoConfig> | null | undefined): string {
  if (!t?.tela) return ""
  const linea = t.lineaTela && t.lineaTela !== t.tipoTela ? `${t.lineaTela} ` : ""
  return [`${t.tela} ${t.tipoTela ?? ""}`.trim(), t.colorTela ? `${linea}${t.colorTela}` : null]
    .filter(Boolean)
    .join(" · ")
}

/** Detalle del toldo en renglones (para el resumen de la medición, comanda y pedido). */
export function lineasToldo(t: Partial<IToldoConfig> | null | undefined): string[] {
  if (!t?.subtipo) return []
  const vertical = t.subtipo === "VERTICAL"
  const n = (v: number | undefined) => v ?? 0
  const lineas: string[] = [
    `Perfilería e insumos ${t.colorPerfileria ?? "-"} · Caño galvanizado ${t.cano ?? "-"}`,
  ]
  if (vertical && t.barraFrente === "TP1") {
    lineas.push(
      [
        `Barra frente TP1 ${t.tensor ? "con tensor" : "sin tensor"}`,
        t.brazoCaputa ? "Brazo Caputa importado" : null,
        n(t.sujecionPiso) > 0 ? `Sujeción al piso × ${t.sujecionPiso}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    )
  } else if (vertical && t.barraFrente === "TP2") {
    lineas.push(`Barra frente TP2 · Brazos ${t.brazos ?? "-"} m`)
  } else if (!vertical && t.tipoProyeccion) {
    lineas.push(t.tipoProyeccion)
  }
  if (t.mecanismo === "Manual") {
    lineas.push(
      [
        "Manual",
        vertical ? t.maquina : null,
        `Manijas × ${t.manijas ?? 1}`,
      ]
        .filter(Boolean)
        .join(" · ")
    )
  } else if (t.mecanismo === "Motorizado") {
    lineas.push(
      [
        `Motor ${t.motor ?? "-"}`,
        t.control ? `Control × ${t.cantidadControles ?? 1}${t.canales ? ` (${t.canales} canal${t.canales > 1 ? "es" : ""})` : ""}` : "Sin control",
        t.domotica ? "Domótica" : null,
      ]
        .filter(Boolean)
        .join(" · ")
    )
  }
  if (vertical && (n(t.soportePlano) > 0 || n(t.escuadra) > 0)) {
    lineas.push(
      [n(t.soportePlano) > 0 ? `Soporte plano × ${t.soportePlano}` : null, n(t.escuadra) > 0 ? `Escuadra × ${t.escuadra}` : null]
        .filter(Boolean)
        .join(" · ")
    )
  }
  if (t.cubreToldo) {
    lineas.push(`Cubre toldo ${t.anchoCubreToldo ? `${String(t.anchoCubreToldo).replace(".", ",")} m` : ""} · Perchas × ${t.perchas ?? 0}`)
  }
  if (!vertical && t.pollerita) lineas.push("Con pollerita")
  const tela = textoTelaToldo(t)
  if (tela) lineas.push(`Tela ${tela}`)
  const acc = accesoriosAutomaticosToldo(t)
  if (acc.length > 0) lineas.push(`Accesorios: ${acc.join(", ")}`)
  return lineas
}

/** Texto corto: "Toldo Vertical · TP1 · Motorizado · Acrílica x1,20 · Beige 2038" */
export function textoToldo(t: Partial<IToldoConfig> | null | undefined): string {
  if (!t?.subtipo) return ""
  return [
    nombreSubtipoToldo(t.subtipo),
    t.subtipo === "VERTICAL" ? t.barraFrente : t.tipoProyeccion,
    t.mecanismo,
    textoTelaToldo(t),
  ]
    .filter(Boolean)
    .join(" · ")
}
