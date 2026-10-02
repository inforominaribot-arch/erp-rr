"use client"

import Link from "next/link"
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Navigation,
  Ruler,
  CalendarPlus,
  MoreVertical,
  CheckCircle2,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import type { IVisitaConRelaciones } from "../types"
import {
  formatearHorarioVisita,
  formatearFechaVisita,
  generarLinkWhatsAppVisita,
  generarLinkGoogleMaps,
  generarGoogleCalendarUrl,
} from "../types"
import { VisitaEstadoBadge } from "./visita-estado-badge"
import { VisitaTipoBadge } from "./visita-tipo-badge"

interface VisitaCardProps {
  visita: IVisitaConRelaciones
  onCambiarEstado?: (visita: IVisitaConRelaciones) => void
  onEditar?: (visita: IVisitaConRelaciones) => void
}

export function VisitaCard({
  visita,
  onCambiarEstado,
  onEditar,
}: VisitaCardProps) {
  const whatsappUrl = generarLinkWhatsAppVisita(
    visita.cliente.telefono,
    visita.cliente.nombre,
    visita.fecha,
    visita.horaInicio,
    visita.direccion,
    visita.localidad
  )

  const mapsUrl = generarLinkGoogleMaps(visita.direccion, visita.localidad)

  const googleCalUrl = generarGoogleCalendarUrl({
    titulo: `Medición: ${visita.cliente.nombre} (${visita.localidad || "Obra"})`,
    descripcion: `Cliente: ${visita.cliente.nombre}\nTeléfono: ${visita.cliente.telefono || "Sin tel"}\nTipo: ${visita.tipoVisita}\nNotas: ${visita.notas || "Ninguna"}`,
    direccion: visita.direccion,
    localidad: visita.localidad,
    fecha: visita.fecha,
    horaInicio: visita.horaInicio,
    horaFin: visita.horaFin,
  })

  const linkIniciarMedicion = `/mediciones/nueva?clienteId=${visita.cliente.id}`

  const esHoy = () => {
    const f = new Date(visita.fecha)
    const hoy = new Date()
    return (
      f.getDate() === hoy.getDate() &&
      f.getMonth() === hoy.getMonth() &&
      f.getFullYear() === hoy.getFullYear()
    )
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      {/* Cabecera de la tarjeta: Fecha, Horario y Badges */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-900">
              <Clock className="h-4 w-4 text-indigo-600" />
              {formatearHorarioVisita(visita.horaInicio, visita.horaFin)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              • {formatearFechaVisita(visita.fecha)}
            </span>
            {esHoy() && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider animate-pulse">
                Hoy
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <VisitaTipoBadge tipo={visita.tipoVisita} />
            <VisitaEstadoBadge estado={visita.estado} />
          </div>
        </div>

        {/* Datos del Cliente y Obra */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <Link
              href={`/clientes/${visita.cliente.id}`}
              className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors group flex items-center gap-1"
            >
              {visita.cliente.nombre}
              <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            {onEditar && (
              <button
                type="button"
                onClick={() => onEditar(visita)}
                className="text-xs text-slate-500 hover:text-indigo-600 p-1"
                title="Editar visita"
              >
                Editar
              </button>
            )}
          </div>

          {/* Dirección con icono de mapa */}
          <div className="flex items-start gap-1.5 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              {visita.direccion}
              {visita.localidad && (
                <span className="text-slate-500 font-medium">
                  {" "}
                  ({visita.localidad})
                </span>
              )}
            </span>
          </div>

          {/* Teléfono */}
          {visita.cliente.telefono && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{visita.cliente.telefono}</span>
            </div>
          )}

          {/* Notas de acceso o muestras de tela */}
          {visita.notas && (
            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              <span className="font-semibold text-slate-700">Notas de obra: </span>
              {visita.notas}
            </div>
          )}
        </div>
      </div>

      {/* Botonera Mobile-First de Acciones Rápidas en la Calle */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
        {/* Fila 1: Botón prioritario "Iniciar Medición" */}
        <Link
          href={linkIniciarMedicion}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.99] transition-all min-h-[44px]"
        >
          <Ruler className="h-4 w-4" />
          <span>Iniciar Medición en Obra</span>
        </Link>

        {/* Fila 2: WhatsApp + Cómo llegar (Google Maps) */}
        <div className="grid grid-cols-2 gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors min-h-[44px]"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed min-h-[44px]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Sin Teléfono</span>
            </button>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors min-h-[44px]"
          >
            <Navigation className="h-4 w-4 text-sky-600" />
            <span>Cómo llegar</span>
          </a>
        </div>

        {/* Fila 3: Google Calendar + Cambiar Estado */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[40px]"
            title="Guardar cita en Google Calendar"
          >
            <CalendarPlus className="h-3.5 w-3.5 text-slate-500" />
            <span className="truncate">Google Calendar</span>
          </a>

          {onCambiarEstado && (
            <button
              type="button"
              onClick={() => onCambiarEstado(visita)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[40px]"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Cambiar Estado</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
