// Módulo: Mediciones
// Mosquiteros MagicRoll (marca MG): modelos, medidas disponibles según las tablas del proveedor y cajón.
// Las tablas son ancho × alto en mm (rangos con ambos extremos incluidos). Al medir se cargan ancho y alto
// y solo se ofrecen los modelos que tienen precio para esa medida.

export const MODELOS_MOSQUITERO = [
  { modelo: "VERTICAL_RESORTE", nombre: "Sistema a Resorte Vertical" },
  { modelo: "VERTICAL_CADENA", nombre: "Sistema a Cadena Para Puertas Vertical" },
  { modelo: "HORIZONTAL_NO_MANUAL", nombre: "Sistema a Resorte Horizontal NO Manual (puertas balcón)" },
  { modelo: "HORIZONTAL_MANUAL_1", nombre: "Sistema Horizontal Manual 1 puerta (puertas y ventanas)" },
  { modelo: "HORIZONTAL_MANUAL_2", nombre: "Sistema Horizontal Manual 2 puertas (puertas y ventanas)" },
  { modelo: "PLEGABLE_IMPORTADO", nombre: "Sistema Plegable Importado (puertas)" },
  { modelo: "PLEGABLE_NACIONAL", nombre: "Sistema Plegable Nacional (puertas)" },
] as const

export type ModeloMosquitero = (typeof MODELOS_MOSQUITERO)[number]["modelo"]
export const CODIGOS_MODELO_MOSQUITERO = MODELOS_MOSQUITERO.map((m) => m.modelo) as [
  ModeloMosquitero,
  ...ModeloMosquitero[],
]

export type LadoMosquitero = "Izquierda" | "Derecha"
export type PuertasMosquitero = "Simple" | "Doble"

/** Configuración del mosquitero guardada en la medición (caracteristicas.mosquitero) */
export interface IMosquiteroConfig {
  modelo: ModeloMosquitero
  /** Cajón que lleva según la tabla (null en plegables) */
  cajon: string | null
  /** Solo a Cadena */
  mando?: LadoMosquitero
  /** Solo horizontales: dónde va el cajón */
  sentidoApertura?: LadoMosquitero
  /** Solo Plegable Importado: la doble se cotiza × 2 con la mitad del ancho */
  puertas?: PuertasMosquitero
}

/** Celda de una tabla sin precio (lo que necesita la medición / la tablet) */
export interface ICeldaMosquitero {
  modelo: string
  cajon: string | null
  anchoDesde: number
  anchoHasta: number
  altoDesde: number
  altoHasta: number
}

export const nombreModeloMosquitero = (modelo: string | null | undefined) =>
  MODELOS_MOSQUITERO.find((m) => m.modelo === modelo)?.nombre ?? modelo ?? ""

export const esMosquiteroACadena = (modelo: string | null | undefined) => modelo === "VERTICAL_CADENA"

export const esMosquiteroHorizontal = (modelo: string | null | undefined) =>
  modelo === "HORIZONTAL_NO_MANUAL" || modelo === "HORIZONTAL_MANUAL_1" || modelo === "HORIZONTAL_MANUAL_2"

/** Perfil fijo (sin elegir color) de los plegables */
export const PERFIL_FIJO_MOSQUITERO: Partial<Record<ModeloMosquitero, string>> = {
  PLEGABLE_IMPORTADO: "Anodizado natural",
  PLEGABLE_NACIONAL: "Blanco",
}

const aMm = (metros: number) => Math.round((Number(metros) || 0) * 1000)

/** Ancho con el que se entra a la tabla: en el Plegable Importado doble, la mitad (precio por puerta). */
export function anchoTablaMm(modelo: string, anchoMetros: number, puertas?: PuertasMosquitero | null): number {
  const mm = aMm(anchoMetros)
  return modelo === "PLEGABLE_IMPORTADO" && puertas === "Doble" ? Math.round(mm / 2) : mm
}

const valorCajon = (c: string | null) => (c ? parseFloat(c.replace(",", ".")) : 0)

/**
 * Celda de la tabla para la medida. Si entra en más de una tabla del modelo (Vertical a resorte con
 * cajón 40 y 54), se toma la del cajón más chico.
 */
export function celdaParaMedida<T extends ICeldaMosquitero>(
  celdas: T[],
  modelo: string,
  anchoMetros: number,
  altoMetros: number,
  puertas?: PuertasMosquitero | null
): T | null {
  const ancho = anchoTablaMm(modelo, anchoMetros, puertas)
  const alto = aMm(altoMetros)
  if (ancho <= 0 || alto <= 0) return null
  return (
    celdas
      .filter(
        (c) =>
          c.modelo === modelo &&
          ancho >= c.anchoDesde &&
          ancho <= c.anchoHasta &&
          alto >= c.altoDesde &&
          alto <= c.altoHasta
      )
      .sort((a, b) => valorCajon(a.cajon) - valorCajon(b.cajon))[0] ?? null
  )
}

/** Modelos que tienen precio para la medida (el Plegable Importado entra si va simple o doble). */
export function modelosDisponibles(
  celdas: ICeldaMosquitero[],
  anchoMetros: number,
  altoMetros: number
): Array<(typeof MODELOS_MOSQUITERO)[number]> {
  return MODELOS_MOSQUITERO.filter(
    (m) =>
      celdaParaMedida(celdas, m.modelo, anchoMetros, altoMetros) ||
      (m.modelo === "PLEGABLE_IMPORTADO" && celdaParaMedida(celdas, m.modelo, anchoMetros, altoMetros, "Doble"))
  )
}

/** Plegable Importado: el alto de cada puerta debe superar al ancho en al menos 120 mm. */
export function avisoAlturaPlegableImportado(
  anchoMetros: number,
  altoMetros: number,
  puertas?: PuertasMosquitero | null
): string | null {
  const ancho = anchoTablaMm("PLEGABLE_IMPORTADO", anchoMetros, puertas)
  const alto = aMm(altoMetros)
  if (ancho <= 0 || alto <= 0 || alto >= ancho + 120) return null
  return `La altura de cada puerta debe ser al menos 120 mm mayor que el ancho${puertas === "Doble" ? " de cada puerta" : ""} (${alto} mm de alto, ${ancho} mm de ancho).`
}

/** Texto corto del mosquitero: "Sistema a Resorte Vertical · Cajón 40 · Mando Derecha" */
export function textoMosquitero(m: IMosquiteroConfig | null | undefined): string {
  if (!m?.modelo) return ""
  return [
    nombreModeloMosquitero(m.modelo),
    m.cajon ? `Cajón ${m.cajon}` : null,
    m.puertas ? `Puerta ${m.puertas.toLowerCase()}` : null,
    m.mando ? `Mando ${m.mando}` : null,
    m.sentidoApertura ? `Cajón a la ${m.sentidoApertura.toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}
