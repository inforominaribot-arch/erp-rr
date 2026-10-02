// Módulo: Agendar Visitas (Visitas de Medición y Asesoramiento en Obra)
// Tipos e Interfaces TypeScript

import type { TipoVisita, EstadoVisita } from "@/types"

export type { TipoVisita, EstadoVisita }

export interface IVisita {
  id: string
  clienteId: string
  usuarioId: string
  fecha: Date
  horaInicio: string // "15:00"
  horaFin: string    // "16:30"
  tipoVisita: TipoVisita
  estado: EstadoVisita
  direccion: string
  localidad: string | null
  notas: string | null
  googleEventId: string | null
  creadoEn: Date
  actualizadoEn: Date
}

export interface IClienteVisitaResumen {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  localidad: string | null
}

export interface IUsuarioVisitaResumen {
  id: string
  nombre: string
  email: string
}

export interface IVisitaConRelaciones extends IVisita {
  cliente: IClienteVisitaResumen
  usuario: IUsuarioVisitaResumen
}

export interface IVisitaFiltros {
  fechaDesde?: string
  fechaHasta?: string
  estado?: EstadoVisita | "TODOS"
  busqueda?: string
}

export interface IVisitasMetricas {
  totalHoy: number
  totalSemana: number
  confirmadas: number
  realizadasMes: number
}

// ─── Estilos y Badges ────────────────────────────────────────────────────────

export const ESTADO_VISITA_COLORES: Record<
  EstadoVisita,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  PROGRAMADA: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    label: "Programada",
  },
  CONFIRMADA: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Confirmada",
  },
  REALIZADA: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-500",
    label: "Realizada",
  },
  REPROGRAMADA: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Reprogramada",
  },
  CANCELADA: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    label: "Cancelada",
  },
}

export const TIPO_VISITA_CONFIG: Record<
  TipoVisita,
  { label: string; badgeClass: string; iconColor: string }
> = {
  PRIMERA_MEDICION: {
    label: "Primera medición",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    iconColor: "text-blue-600",
  },
  REMEDICION: {
    label: "Remedición",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    iconColor: "text-purple-600",
  },
  MUESTRA_TELAS: {
    label: "Muestra de telas",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
    iconColor: "text-pink-600",
  },
  ASESORAMIENTO: {
    label: "Asesoramiento comercial",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    iconColor: "text-slate-600",
  },
}

// ─── Utilidades de formateo y links externos ────────────────────────────────

export function formatearHorarioVisita(inicio: string, fin: string): string {
  if (!inicio && !fin) return "Horario a convenir"
  if (inicio && fin) return `${inicio} a ${fin} hs`
  return `${inicio || fin} hs`
}

export function formatearFechaVisita(fecha: Date | string): string {
  const d = new Date(fecha)
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function formatearFechaCompleta(fecha: Date | string): string {
  const d = new Date(fecha)
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Genera el enlace universal a Google Maps para navegación GPS directa
 */
export function generarLinkGoogleMaps(direccion: string, localidad?: string | null): string {
  const destino = localidad ? `${direccion}, ${localidad}` : direccion
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}`
}

/**
 * Genera el enlace de WhatsApp con mensaje prearmado personalizado
 */
export function generarLinkWhatsAppVisita(
  telefono: string | null | undefined,
  nombreCliente: string,
  fecha: Date | string,
  horaInicio: string,
  direccion: string,
  localidad?: string | null
): string | null {
  if (!telefono) return null

  // Limpiar caracteres no numéricos
  const limpio = telefono.replace(/\D/g, "")
  if (!limpio) return null

  // Prefijo Argentina si no lo tiene
  const numeroFinal = limpio.startsWith("54") ? limpio : `549${limpio}`

  const fechaStr = new Date(fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const ubicacion = localidad ? `${direccion} (${localidad})` : direccion

  const mensaje = `Hola ${nombreCliente.trim()}! Te escribo de Romina Ribot Cortinados para coordinar nuestra visita de medición agendada para el ${fechaStr} a las ${horaInicio} hs en ${ubicacion}. Nos vemos ahí!`

  return `https://wa.me/${numeroFinal}?text=${encodeURIComponent(mensaje)}`
}

/**
 * Genera el deep-link para agregar el evento directamente a Google Calendar en 1 clic
 */
export function generarGoogleCalendarUrl(params: {
  titulo: string
  descripcion?: string | null
  direccion: string
  localidad?: string | null
  fecha: Date | string
  horaInicio: string // "15:00"
  horaFin: string    // "16:30"
}): string {
  const f = new Date(params.fecha)
  const yyyy = f.getFullYear()
  const mm = String(f.getMonth() + 1).padStart(2, "0")
  const dd = String(f.getDate()).padStart(2, "0")

  // Armar timestamps en formato YYYYMMDDTHHmmSS
  const parseTime = (timeStr: string) => {
    const [h, m] = (timeStr || "10:00").split(":").map((x) => x.padStart(2, "0"))
    return `${h || "10"}${m || "00"}00`
  }

  const startStr = `${yyyy}${mm}${dd}T${parseTime(params.horaInicio)}`
  const endStr = `${yyyy}${mm}${dd}T${parseTime(params.horaFin || params.horaInicio)}`

  const location = params.localidad
    ? `${params.direccion}, ${params.localidad}`
    : params.direccion

  const url = new URL("https://calendar.google.com/calendar/render")
  url.searchParams.set("action", "TEMPLATE")
  url.searchParams.set("text", params.titulo)
  url.searchParams.set("dates", `${startStr}/${endStr}`)
  if (params.descripcion) {
    url.searchParams.set("details", params.descripcion)
  }
  url.searchParams.set("location", location)

  return url.toString()
}
