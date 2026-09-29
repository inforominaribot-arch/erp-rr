// Módulo: Clientes & CRM
// Tipos específicos del módulo

import type { EstadoCliente } from "@/types"

// ─── Tipos de entidades ────────────────────────────────────────────────────────

export interface ICliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  localidad: string | null
  notas: string | null
  estado: EstadoCliente
  creadoEn: Date
  actualizadoEn: Date
}

// Cliente con conteo de trabajos (para la tabla/listado)
export interface IClienteConConteo extends ICliente {
  _count: {
    mediciones: number
    presupuestos: number
  }
}

// Cliente con historial completo (para la vista detalle)
export interface IClienteDetalle extends ICliente {
  mediciones: IMedicionResumen[]
  presupuestos: IPresupuestoResumen[]
}

export interface IMedicionResumen {
  id: string
  creadoEn: Date
  observaciones: string | null
  sincronizado: boolean
  _count: {
    ambientes: number
  }
}

export interface IPresupuestoResumen {
  id: string
  numero: number
  estado: string
  total: number | string
  creadoEn: Date
  comanda: {
    id: string
    numero: number
    estado: string
  } | null
}

// ─── Tipos para Pipeline/Kanban ───────────────────────────────────────────────

export interface IColumnaKanban {
  estado: EstadoCliente
  clientes: IClienteConConteo[]
}

// ─── Tipos para importación CSV ───────────────────────────────────────────────

export interface IFilaCSV {
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  localidad?: string
  notas?: string
}

export interface IResultadoImportacion {
  importados: number
  errores: IErrorImportacion[]
}

export interface IErrorImportacion {
  fila: number
  nombre: string
  error: string
}

// ─── Constantes de UI ─────────────────────────────────────────────────────────

export const ESTADOS_CLIENTE_ORDEN: EstadoCliente[] = [
  "MEDICION_TOMADA",
  "PRESUPUESTO_ENVIADO",
  "PRESUPUESTO_ACEPTADO",
  "EN_PRODUCCION",
  "INSTALADO",
]

export const ESTADO_CLIENTE_COLORES: Record<EstadoCliente, {
  bg: string
  text: string
  border: string
  dot: string
}> = {
  MEDICION_TOMADA: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  PRESUPUESTO_ENVIADO: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-400",
  },
  PRESUPUESTO_ACEPTADO: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-400",
  },
  EN_PRODUCCION: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-400",
  },
  INSTALADO: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-400",
  },
}
