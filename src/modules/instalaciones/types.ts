// Módulo: Agenda & Instalación
// Tipos TypeScript de dominio

import type { EstadoInstalacion, Rol } from "@/types"

export type { EstadoInstalacion }

export interface IInstalador {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo?: boolean
}

export interface IBloqueoAgenda {
  id: string
  usuarioId: string | null
  usuario?: IInstalador | null
  fecha: string // ISO string YYYY-MM-DD
  horaInicio: string // "10:00"
  horaFin: string // "12:00"
  motivo: string
  creadoEn?: string
}

export interface IItemComandaInstalacion {
  id: string
  descripcion: string
  ambiente: string | null
  ancho: number
  alto: number
  cantidad: number
  tipo: string
  caracteristicas?: Record<string, unknown> | null
  observaciones?: string | null
  completado: boolean
}

export interface IClienteInstalacion {
  id: string
  nombre: string
  telefono: string | null
  direccion: string | null
  localidad: string | null
  email?: string | null
  notas?: string | null
}

export interface IComandaInstalacion {
  id: string
  numero: number
  estado: string
  notas?: string | null
  fechaEntrega?: string | null
  cliente: IClienteInstalacion
  items: IItemComandaInstalacion[]
}

export interface IInstalacion {
  id: string
  comandaId: string
  fecha: string // ISO date
  horaInicio: string | null
  horaFin: string | null
  estado: EstadoInstalacion
  notas: string | null
  materialesListos: boolean
  creadoEn: string
  actualizadoEn: string
  comanda: IComandaInstalacion
  instaladores: Array<{
    id: string
    usuarioId: string
    usuario: IInstalador
  }>
}

export interface IComandaPendienteAgenda {
  id: string
  numero: number
  estado: string
  notas: string | null
  fechaEntrega: string | null
  cliente: {
    id: string
    nombre: string
    telefono: string | null
    direccion: string | null
    localidad: string | null
  }
  totalItems: number
  itemsListos: number
  items: Array<{
    id: string
    descripcion: string
    ambiente: string | null
    ancho: number
    alto: number
    cantidad: number
  }>
}

export interface FiltrosInstalaciones {
  fechaDesde?: string
  fechaHasta?: string
  instaladorId?: string
  estado?: EstadoInstalacion | "TODOS"
  busqueda?: string
}

export interface MetricasInstalaciones {
  totalMes: number
  hoy: number
  manana: number
  materialesPendientesManana: number
  completadasMes: number
  bloqueosSemana: number
}

// Formateador de fechas para vistas
export function formatearFechaAgenda(fechaStr: string | Date): string {
  const d = typeof fechaStr === "string" ? new Date(fechaStr) : fechaStr
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

export function formatearFechaCompleta(fechaStr: string | Date): string {
  const d = typeof fechaStr === "string" ? new Date(fechaStr) : fechaStr
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

export function formatearHorario(horaInicio?: string | null, horaFin?: string | null): string {
  if (!horaInicio && !horaFin) return "Horario a convenir"
  if (horaInicio && !horaFin) return `${horaInicio} hs`
  return `${horaInicio} a ${horaFin} hs`
}
