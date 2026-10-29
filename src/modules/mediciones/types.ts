// Módulo: App Medición (PWA)
// Tipos específicos del módulo de mediciones

import type { IMosquiteroConfig } from "./lib/mosquiteros"

export type TipoCortina =
  | "Tradicional"
  | "Roller"
  | "Bandas verticales"
  | "Aluminio"
  | "Roller Noche total"
  | "Noche total" // compatibilidad con registros previos
  | "Mosquera"
  | "Motorizada"

export type SubtipoMotorizada =
  | "Tradicional Mot"
  | "Tradicional Mot y Tradicional"
  | "Tradicional Mot y Roller"
  | "Tradicional Mot y Roller Mot"
  | "Roller Mot"
  | "Roller Mot y Roller"
  | "Roller Mot y Tradicional"
  | "Bandas Verticales y Roller Mot"

export type MarcaMotor = "Somfy" | "Tube"
export type ModeloMotorRollerSomfy = "LSN 6/28R" | "LTN 10/28R" | "Li-ion"
export type ModeloMotorRollerTube = "6/28R 40mm" | "5/28R 50mm" | "li-ion"
export type CanalesControl = 1 | 4 | 15 | 16

export type TipoRiel = "Normal" | "Curvo"

export type TipoCapaGaza = "Tradicional" | "Roller" | "Bandas verticales" | "Tradicional Mot" | "Roller Mot"
export type TipoCapaBO = "Tradicional" | "Roller" | "Bandas verticales" | "Tradicional Mot" | "Roller Mot"

export interface IConfigMotor {
  marca: MarcaMotor
  modelo: string
  control: boolean
  canales?: CanalesControl
}

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

export type PerfileriaRoller = "Blanco" | "Negro" | "Gris" | "Beige"

export type PerfileriaBandas = "Blanco" | "Negro" | "Gris" | "Beige"

export type TipoLaminaAluminio = "16 mm" | "25 mm" | "Perforado"

export type ColorAluminio =
  | "Blanco"
  | "Beige"
  | "Natural"
  | "Aluminio"
  | "Congo"
  | "Negro"

export type TipoSujecion =
  | "Techo"
  | "Pared"
  | "Moldura"
  | "Sócalo" // compatibilidad con registros previos
  | "Aire"
  | "Abertura"

/** Aviso para administración: la medición cambió después de presupuestar / generar comanda */
export interface IAvisoMedidaModificada {
  anterior: { ancho: number; alto: number }
  modificadaEn: string // ISO
}

export function serializarAvisoMedida(
  medidaAnterior: unknown,
  medidaModificadaEn: Date | null | undefined
): IAvisoMedidaModificada | null {
  if (!medidaModificadaEn) return null
  const a = (medidaAnterior || {}) as { ancho?: number; alto?: number }
  return {
    anterior: { ancho: Number(a.ancho || 0), alto: Number(a.alto || 0) },
    modificadaEn: medidaModificadaEn.toISOString(),
  }
}

export type ModoCortina = "Normal" | "Solo tela" | "Solo riel"

export const MODOS_CORTINA: ModoCortina[] = ["Normal", "Solo tela", "Solo riel"]

/** Devuelve el modo de cada cortina de una capa, leyendo el formato nuevo o el booleano legado. */
export function obtenerModosCapa(
  modos: ModoCortina[] | undefined | null,
  soloTela: boolean[] | undefined | null
): ModoCortina[] {
  if (modos && modos.length > 0) return modos
  return (soloTela || []).map((v) => (v ? "Solo tela" : "Normal"))
}

/** Lista legible de las cortinas que NO están en modo Normal (ej: "Gaza C2: SÓLO TELA"). */
export function describirModosEspeciales(
  carac: Pick<
    ICaracteristicasItem,
    "modosPanosGaza" | "modosTramosBO" | "soloTelaPanosGaza" | "soloTelaTramosBO" | "gaza" | "bo"
  > | null | undefined
): string[] {
  if (!carac) return []
  const res: string[] = []
  const agregar = (capa: string, modos: ModoCortina[], total: number) => {
    modos.slice(0, total).forEach((m, i) => {
      if (m && m !== "Normal") {
        const etiqueta = total > 1 ? `${capa} C${i + 1}` : capa
        res.push(`${etiqueta}: ${m === "Solo tela" ? "SÓLO TELA" : "SÓLO RIEL"}`)
      }
    })
  }
  if (carac.gaza?.activa) {
    agregar("Gaza", obtenerModosCapa(carac.modosPanosGaza, carac.soloTelaPanosGaza), carac.gaza.panos || 1)
  }
  if (carac.bo?.activa) {
    agregar("B.O.", obtenerModosCapa(carac.modosTramosBO, carac.soloTelaTramosBO), carac.bo.tramos || 1)
  }
  return res
}

export type LadoMando = "Izquierda" | "Derecha" | "Izquierdo" | "Derecho" | "Sin mando"

export type TipoCaida = "Por delante" | "Por detrás"

export type MarcaCortina = "HD" | "RS" | "MG"

export type TipoModeloSoporte = "Grampa" | "Kent"
export type VarianteSoporte = "Simple" | "Doble"
export type TipoSoporteRoller = "Común" | "Extendido"

// ─── Telas de la lista de precios (selector en capas RS) ──────────────────────

/** Tela de la lista de precios para elegir al medir (sin precios: la tablet no ve costos) */
export interface ITelaMedicion {
  id: string
  descripcion: string
  colores: string[]
  categoria: "TELA" | "BANDAS_VERTICALES"
}

// ─── Estructuras para Capas de Telas ──────────────────────────────────────────

export interface IGazaConfig {
  activa: boolean
  ancho: number
  alto: number
  panos: 1 | 2 | 3 | 4 | 5
  anchosPanos: number[]
  nombreTela: string
  /** Tela elegida de la lista de precios (null = texto libre o medición anterior) */
  telaId?: string | null
  colorTela?: string | null
}

export interface IBOConfig {
  activa: boolean
  ancho: number
  alto: number
  tramos: 1 | 2 | 3 | 4 | 5
  anchosTramos: number[]
  nombreTela: string
  /** Tela elegida de la lista de precios (null = texto libre o medición anterior) */
  telaId?: string | null
  colorTela?: string | null
  mandosRoller?: LadoMando[]
}

// ─── JSON de Características Técnicas Guardado en ItemMedicion ─────────────────

export interface ICaracteristicasItem {
  tipo: TipoCortina
  subtipoMotorizada?: SubtipoMotorizada

  // Exclusivo para Aluminio
  aluminio?: {
    tipoLamina: TipoLaminaAluminio
    color: ColorAluminio
    mando: LadoMando
    tensor?: boolean
  }

  // Tipos específicos para Gaza / BO en combinaciones avanzadas y aluminio
  tipoCapaGaza?: TipoCapaGaza
  tipoCapaBO?: TipoCapaBO

  // Para Tradicional, Roller, Bandas, Roller Noche total, Mosquera, Motorizada
  sistema?: SistemaTradicional
  colorBarral?: ColorBarral
  perfileria?: string // PerfileriaNocheTotal | PerfileriaRoller | PerfileriaBandas
  tipoRiel?: TipoRiel // Normal | Curvo (para tradicional común y mot)

  sujecion?: TipoSujecion
  mando?: LadoMando
  caida?: TipoCaida
  posicionRoller?: "Adelante" | "Atrás"
  caidaBO?: TipoCaida
  posicionRollerBO?: "Adelante" | "Atrás"
  marca?: MarcaCortina

  // Formato y configuración de B.O. (Tradicional vs Roller)
  formatoBO?: "Tradicional" | "Roller"
  mandoBO?: LadoMando
  marcaBO?: MarcaCortina | null
  mandosRollerBO?: LadoMando[]
  mandosRollerGaza?: LadoMando[]

  // Marcas independientes por capa
  marcaGaza?: MarcaCortina | null

  // Configuración de Motorización
  motorGaza?: IConfigMotor
  motorBO?: IConfigMotor
  cantidadCargadores?: number

  // Modo por cortina/tramo (Roller y Bandas: Normal / Solo tela / Solo riel; Roller Mot: Normal / Solo tela)
  modosPanosGaza?: ModoCortina[]
  modosTramosBO?: ModoCortina[]
  // Legado: "Sólo tela" booleano (se sigue escribiendo para compatibilidad)
  soloTelaPanosGaza?: boolean[]
  soloTelaTramosBO?: boolean[]

  // Mosquitero MagicRoll (tipo "Mosquera"): modelo según la tabla de medidas, cajón, mando / sentido, puertas
  mosquitero?: IMosquiteroConfig

  // Telas
  gaza?: IGazaConfig
  bo?: IBOConfig

  // Soportes y cálculo
  tipoSoporte?: TipoModeloSoporte
  varianteSoporte?: VarianteSoporte
  cantidadSoportes?: number
  tipoSoporteRoller?: TipoSoporteRoller

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
  /** Fecha de la versión del servidor que tiene la tablet (para bajar cambios de la web) */
  actualizadoEnServidor?: string | null
  /** Mensaje del servidor si rechazó la última sincronización (ej: presupuesto aceptado) */
  errorSync?: string | null
  /** Tiene presupuesto aceptado: no se pueden agregar ni quitar cortinas */
  bloqueada?: boolean
  ambientes: Array<{
    id?: string | null // ID del servidor
    idLocal: string
    nombre: string
    orden: number
    items: Array<{
      id?: string | null // ID del servidor
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
  "Mosquera",
  "Motorizada",
]

export const SUBTIPOS_MOTORIZADA: SubtipoMotorizada[] = [
  "Tradicional Mot",
  "Tradicional Mot y Tradicional",
  "Tradicional Mot y Roller",
  "Tradicional Mot y Roller Mot",
  "Roller Mot",
  "Roller Mot y Roller",
  "Roller Mot y Tradicional",
  "Bandas Verticales y Roller Mot",
]

export const MODELOS_MOTOR_ROLLER_SOMFY: ModeloMotorRollerSomfy[] = [
  "LSN 6/28R",
  "LTN 10/28R",
  "Li-ion",
]

export const MODELOS_MOTOR_ROLLER_TUBE: ModeloMotorRollerTube[] = [
  "6/28R 40mm",
  "5/28R 50mm",
  "li-ion",
]

export const CANALES_CONTROL: CanalesControl[] = [1, 4, 15, 16]

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
  "Congo",
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
  tieneBO: boolean,
  formatoBO?: "Tradicional" | "Roller"
): VarianteSoporte {
  // Si el B.O. se confecciona como Roller, el soporte tradicional (Kent/Grampa) es solo para la Gaza (Simple)
  if (formatoBO === "Roller") return "Simple"
  if (tieneGaza && tieneBO) return "Doble"
  return "Simple"
}

/**
 * Calcula el ancho de confección para Gaza (+10 cm = +0.10 m)
 */
export function calcularAnchoConfeccionGaza(anchoMetros: number): number {
  if (!anchoMetros || anchoMetros <= 0) return 0
  return Number((anchoMetros + 0.1).toFixed(3))
}
