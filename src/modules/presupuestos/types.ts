// Módulo: Presupuestos
// Tipos específicos del módulo de presupuestos

import type { EstadoPresupuesto, EstadoCliente } from "@/types"

// ─── Interfaces de Entidades ──────────────────────────────────────────────────

export interface IItemPresupuesto {
  id: string
  presupuestoId: string
  itemMedicionId: string | null
  descripcion: string
  ambiente: string | null
  ancho: number
  alto: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  aceptado: boolean
  creadoEn: Date | string
}

export interface IPresupuestoCliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  localidad: string | null
  estado: EstadoCliente
}

export interface IPresupuestoComandaResumen {
  id: string
  numero: number
  estado: string
}

export interface IPresupuesto {
  id: string
  clienteId: string
  numero: number
  estado: EstadoPresupuesto
  subtotal: number
  descuento: number // porcentaje
  total: number
  notas: string | null
  validezDias: number
  creadoEn: Date | string
  actualizadoEn: Date | string
  cliente?: IPresupuestoCliente
  items?: IItemPresupuesto[]
  comanda?: IPresupuestoComandaResumen | null
}

export interface IPresupuestoDetalle extends IPresupuesto {
  cliente: IPresupuestoCliente
  items: IItemPresupuesto[]
  comanda: IPresupuestoComandaResumen | null
}

// ─── Agrupación por Ambiente (para visualización comercial y presupuestos) ───

export interface IAmbientePresupuestoGrupo {
  ambiente: string
  items: IItemPresupuesto[]
  subtotalAmbiente: number
}

// ─── Métricas del Dashboard de Presupuestos ──────────────────────────────────

export interface IMetricasPresupuestos {
  totalPresupuestos: number
  borradores: number
  enviados: number
  aceptados: number
  rechazados: number
  montoTotalPresupuestado: number
  montoTotalAceptado: number
  tasaConversion: number // porcentaje
}

// ─── Constantes del Módulo ───────────────────────────────────────────────────

export const VALIDEZ_DIAS_DEFAULT = 14
export const CONDICIONES_PAGO_DEFAULT =
  "50% de seña y 50% contra entrega e instalación de la mercadería."
export const PLAZO_ENTREGA_DEFAULT = "25 días a partir de la aprobación."

export const DATOS_EMPRESA_DEFAULT = {
  nombre: "ROMINA RIBOT Cortinados",
  subtitulo: "Fábrica de Cortinas y Toldos a Medida",
  direccion: "P. Marcos Sastre 823",
  localidad: "Santa Fe, Argentina",
  telefono: "0342-154-064334",
  email: "ventas@cortinadosrr.com.ar",
}

export const ESTADO_PRESUPUESTO_COLORES: Record<
  EstadoPresupuesto,
  {
    bg: string
    text: string
    border: string
    dot: string
  }
> = {
  BORRADOR: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  ENVIADO: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  ACEPTADO_TOTAL: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  ACEPTADO_PARCIAL: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  RECHAZADO: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
}

// ─── Utilidades de Formato ───────────────────────────────────────────────────

export function formatearNumeroPresupuesto(numero: number | string): string {
  const n = typeof numero === "string" ? parseInt(numero, 10) : numero
  if (isNaN(n)) return "#PRE-0000"
  return `#PRE-${String(n).padStart(4, "0")}`
}

export function calcularDiasRestantesValidez(
  creadoEn: Date | string,
  validezDias: number
): { diasRestantes: number; vencido: boolean } {
  const fechaCreacion = new Date(creadoEn)
  const fechaVencimiento = new Date(fechaCreacion)
  fechaVencimiento.setDate(fechaVencimiento.getDate() + validezDias)

  const hoy = new Date()
  const diferenciaMs = fechaVencimiento.getTime() - hoy.getTime()
  const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24))

  return {
    diasRestantes,
    vencido: diasRestantes < 0,
  }
}

// ─── Tipos para Importación de Mediciones ────────────────────────────────────

export interface MedicionImportableItem {
  id: string
  descripcion: string
  ancho: number
  alto: number
  cantidad: number
  caracteristicas: Record<string, unknown> | null
  observaciones: string | null
}

export interface MedicionImportableAmbiente {
  id: string
  nombre: string
  items: MedicionImportableItem[]
}

export interface MedicionImportable {
  id: string
  creadoEn: Date | string
  observaciones: string | null
  ambientes: MedicionImportableAmbiente[]
}
