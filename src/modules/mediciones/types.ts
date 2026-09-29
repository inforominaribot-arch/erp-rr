// Módulo: App Medición (PWA)
// Tipos específicos del módulo de mediciones

export type TipoCortina =
  | "Tradicional"
  | "Roller"
  | "Bandas verticales"
  | "Aluminio"
  | "Roller Noche total"
  | "Noche total" // compatibilidad con registros previos

export type SistemaTradicional = "Riel" | "Barral"

export type ColorBarral =
  | "Negro"
  | "Níquel Mate"
  | "Níquel Brilloso"
  | "Bronce Viejo"
  | "Blanco"

export type PerfileriaNocheTotal =
  | "Negro"
  | "Blanco"
  | "Bronce Colonial"
  | "Aluminio Anodizado"

export type PerfileriaRoller = "Blanco" | "Negro"

export type PerfileriaBandas = "Blanco" | "Negro"

export type TipoLaminaAluminio = "16 mm" | "25 mm" | "Perforado"

export type ColorAluminio =
  | "Blanco"
  | "Beige"
  | "Natural"
  | "Aluminio"
  | "Kongo"
  | "Negro"

export type TipoSujecion =
  | "Techo"
  | "Pared"
  | "Moldura"
  | "Sócalo" // compatibilidad con registros previos
  | "Aire"
  | "Abertura"

export type LadoMando = "Izquierda" | "Derecha" | "Izquierdo" | "Derecho"

export type TipoCaida = "Por delante" | "Por detrás"

export type MarcaCortina = "HD" | "RS" | "MG"

export type TipoModeloSoporte = "Grampa" | "Kent"
export type VarianteSoporte = "Simple" | "Doble"

// ─── Estructuras para Capas de Telas ──────────────────────────────────────────

export interface IGazaConfig {
  activa: boolean
  ancho: number
  alto: number
  panos: 1 | 2 | 3
  anchosPanos: number[]
  nombreTela: string
}

export interface IBOConfig {
  activa: boolean
  ancho: number
  alto: number
  tramos: 1 | 2 | 3
  anchosTramos: number[]
  nombreTela: string
  mandosRoller?: LadoMando[]
}

// ─── JSON de Características Técnicas Guardado en ItemMedicion ─────────────────

export interface ICaracteristicasItem {
  tipo: TipoCortina

  // Exclusivo para Aluminio
  aluminio?: {
    tipoLamina: TipoLaminaAluminio
    color: ColorAluminio
    mando: LadoMando
  }

  // Para Tradicional, Roller, Bandas, Roller Noche total
  sistema?: SistemaTradicional
  colorBarral?: ColorBarral
  perfileria?: string // PerfileriaNocheTotal | PerfileriaRoller | PerfileriaBandas

  sujecion?: TipoSujecion
  mando?: LadoMando
  caida?: TipoCaida
  marca?: MarcaCortina

  // Formato y configuración de B.O. (Tradicional vs Roller)
  formatoBO?: "Tradicional" | "Roller"
  mandoBO?: LadoMando
  marcaBO?: MarcaCortina
  mandosRollerBO?: LadoMando[]

  // Telas
  gaza?: IGazaConfig
  bo?: IBOConfig

  // Soportes y cálculo
  tipoSoporte?: TipoModeloSoporte
  varianteSoporte?: VarianteSoporte
  cantidadSoportes?: number

  // Argollas (calculadas exclusivamente para gaza)
  cantidadArgollas?: number

  // Ancho con los 10 cm adicionales para confección de taller (Gaza)
  anchoConfeccionGaza?: number
}

// ─── Entidades del Negocio ───────────────────────────────────────────────────

export interface IItemMedicion {
  id?: string
  idLocal?: string
  ambienteId?: string
  productoId?: string | null
  descripcion: string
  ancho: number
  alto: number
  cantidad: number
  caracteristicas: ICaracteristicasItem | null
  observaciones: string | null
  creadoEn: Date | string
}

export interface IAmbiente {
  id: string
  medicionId: string
  nombre: string
  orden: number
  creadoEn: Date | string
  items: IItemMedicion[]
}

export interface IMedicion {
  id: string
  clienteId: string
  usuarioId: string
  observaciones: string | null
  sincronizado: boolean
  creadoEn: Date | string
  actualizadoEn: Date | string
  cliente?: {
    id: string
    nombre: string
    telefono: string | null
    email: string | null
    direccion: string | null
    localidad: string | null
    estado?: string
  }
  usuario?: {
    id: string
    nombre: string
    email: string
    rol: string
  }
  ambientes: IAmbiente[]
}

// ─── Representación Offline (IndexedDB) ───────────────────────────────────────

export interface IMedicionOffline {
  idLocal: string // ID local temporal (uuid o timestamp)
  idServidor?: string // ID de prisma una vez sincronizado
  clienteId: string
  clienteNombre: string
  clienteTelefono?: string | null
  clienteDireccion?: string | null
  clienteLocalidad?: string | null
  observaciones?: string | null
  sincronizado: boolean
  guardadoEn: string // ISO date
  ambientes: Array<{
    idLocal: string
    nombre: string
    orden: number
    items: Array<{
      idLocal: string
      descripcion: string
      ancho: number
      alto: number
      cantidad: number
      caracteristicas: ICaracteristicasItem
      observaciones?: string | null
    }>
  }>
}

// ─── Constantes para UI ─────────────────────────────────────────────────────

export const TIPOS_CORTINA: TipoCortina[] = [
  "Tradicional",
  "Roller",
  "Bandas verticales",
  "Aluminio",
  "Roller Noche total",
]

export const FORMATOS_BO = ["Tradicional", "Roller"] as const

export const SISTEMAS_TRADICIONAL: SistemaTradicional[] = ["Riel", "Barral"]

export const COLORES_BARRAL: ColorBarral[] = [
  "Negro",
  "Níquel Mate",
  "Níquel Brilloso",
  "Bronce Viejo",
  "Blanco",
]

export const PERFILERIA_NOCHE_TOTAL: PerfileriaNocheTotal[] = [
  "Negro",
  "Blanco",
  "Bronce Colonial",
  "Aluminio Anodizado",
]

export const PERFILERIA_ROLLER: PerfileriaRoller[] = ["Blanco", "Negro"]

export const PERFILERIA_BANDAS: PerfileriaBandas[] = ["Blanco", "Negro"]

export const TIPOS_LAMINA_ALUMINIO: TipoLaminaAluminio[] = [
  "16 mm",
  "25 mm",
  "Perforado",
]

export const COLORES_ALUMINIO: ColorAluminio[] = [
  "Blanco",
  "Beige",
  "Natural",
  "Aluminio",
  "Kongo",
  "Negro",
]

export const TIPOS_SUJECION: TipoSujecion[] = [
  "Techo",
  "Pared",
  "Moldura",
  "Aire",
  "Abertura",
]

export const LADOS_MANDO: LadoMando[] = ["Izquierda", "Derecha"]

export const TIPOS_CAIDA: TipoCaida[] = ["Por delante", "Por detrás"]

export const MARCAS_CORTINA: MarcaCortina[] = ["HD", "RS", "MG"]

export const AMBIENTES_PREDETERMINADOS = [
  "Living",
  "Comedor",
  "Cocina",
  "Living-Comedor",
  "Dormitorio Principal",
  "Dormitorio 1",
  "Dormitorio 2",
  "Estar / Playroom",
  "Escritorio / Oficina",
  "Quincho",
  "Balcón",
  "Galería",
  "Lavadero",
  "Baño",
]

// ─── Funciones Auxiliares de Cálculo de Taller ────────────────────────────────

/**
 * Calcula la cantidad de argollas exclusivamente para la Gaza
 * Fórmula: ((anchoGazaMetros * 100 + 10) / 10) + 4
 */
export function calcularArgollasGaza(anchoGazaMetros: number): number {
  if (!anchoGazaMetros || anchoGazaMetros <= 0) return 0
  const anchoCmCon10 = anchoGazaMetros * 100 + 10
  return Math.ceil(anchoCmCon10 / 10) + 4
}

/**
 * Calcula la cantidad de soportes según el ancho total
 * Hasta 1.80m = 2 soportes, más de 1.80m = 3 soportes
 */
export function calcularCantidadSoportes(anchoMetros: number): number {
  if (!anchoMetros || anchoMetros <= 0) return 2
  return anchoMetros <= 1.8 ? 2 : 3
}

/**
 * Determina si el soporte es Simple o Doble
 * Solo Gaza o Solo BO -> Simple
 * Gaza y BO -> Doble
 */
export function determinarVarianteSoporte(
  tieneGaza: boolean,
  tieneBO: boolean
): VarianteSoporte {
  if (tieneGaza && tieneBO) return "Doble"
  return "Simple"
}

/**
 * Calcula el ancho de confección para Gaza (+10 cm = +0.10 m)
 */
export function calcularAnchoConfeccionGaza(anchoMetros: number): number {
  if (!anchoMetros || anchoMetros <= 0) return 0
  return Number((anchoMetros + 0.1).toFixed(2))
}
