"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Ruler,
  Trash2,
  Edit2,
  CalendarPlus,
  ExternalLink,
} from "lucide-react"
import type { IVisitaConRelaciones } from "../types"
import {
  formatearFechaVisita,
  formatearHorarioVisita,
  generarLinkWhatsAppVisita,
  generarLinkGoogleMaps,
  generarGoogleCalendarUrl,
} from "../types"
import { VisitaEstadoBadge } from "./visita-estado-badge"
import { VisitaTipoBadge } from "./visita-tipo-badge"
import { eliminarVisitaAction } from "../actions"

interface VisitasTablaProps {
  visitas: IVisitaConRelaciones[]
  onEditarVisita?: (visita: IVisitaConRelaciones) => void
  onCambiarEstadoVisita?: (visita: IVisitaConRelaciones) => void
}

export function VisitasTabla({
  visitas,
  onEditarVisita,
  onCambiarEstadoVisita,
}: VisitasTablaProps) {
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  async function handleEliminar(id: string, clienteNombre: string) {
    if (!confirm(`¿Estás seguro de que querés eliminar la visita agendada para ${clienteNombre}?`)) {
      return
    }

    setEliminandoId(id)
    try {
      await eliminarVisitaAction(id)
    } finally {
      setEliminandoId(null)
    }
  }

  if (visitas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">No hay visitas para mostrar</p>
        <p className="text-xs text-slate-400 mt-0.5">Probá cambiando los filtros o agendá una nueva visita.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto touch-scroll">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 px-4">Fecha y Horario</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Dirección / Obra</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visitas.map((v) => {
              const whatsappUrl = generarLinkWhatsAppVisita(
                v.cliente.telefono,
                v.cliente.nombre,
                v.fecha,
                v.horaInicio,
                v.direccion,
                v.localidad
              )
              const mapsUrl = generarLinkGoogleMaps(v.direccion, v.localidad)
              const calUrl = generarGoogleCalendarUrl({
                titulo: `Medición: ${v.cliente.nombre}`,
                direccion: v.direccion,
                localidad: v.localidad,
                fecha: v.fecha,
                horaInicio: v.horaInicio,
                horaFin: v.horaFin,
                descripcion: v.notas,
              })

              return (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Fecha y Horario */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">
                      {formatearFechaVisita(v.fecha)}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-indigo-500" />
                      {formatearHorarioVisita(v.horaInicio, v.horaFin)}
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="py-3 px-4">
                    <Link
                      href={`/clientes/${v.cliente.id}`}
                      className="font-bold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    >
                      {v.cliente.nombre}
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </Link>
                    {v.cliente.telefono && (
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {v.cliente.telefono}
                      </span>
                    )}
                  </td>

                  {/* Dirección */}
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-1 text-slate-700 max-w-xs">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">
                        {v.direccion}
                        {v.localidad ? ` (${v.localidad})` : ""}
                      </span>
                    </div>
                    {v.notas && (
                      <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5 pl-4">
                        {v.notas}
                      </p>
                    )}
                  </td>

                  {/* Tipo */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <VisitaTipoBadge tipo={v.tipoVisita} />
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onCambiarEstadoVisita && onCambiarEstadoVisita(v)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      title="Hacé clic para cambiar estado"
                    >
                      <VisitaEstadoBadge estado={v.estado} />
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Iniciar Medición */}
                      <Link
                        href={`/mediciones/nueva?clienteId=${v.cliente.id}`}
                        className="rounded-lg bg-indigo-50 border border-indigo-200 p-1.5 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        title="Iniciar Medición en Obra"
                      >
                        <Ruler className="h-3.5 w-3.5" />
                      </Link>

                      {/* WhatsApp */}
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-emerald-50 border border-emerald-200 p-1.5 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}

                      {/* Maps */}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-sky-50 border border-sky-200 p-1.5 text-sky-700 hover:bg-sky-100 transition-colors"
                        title="Ver en Google Maps"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                      </a>

                      {/* Google Calendar */}
                      <a
                        href={calUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
                        title="Guardar en Google Calendar"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                      </a>

                      {/* Editar */}
                      {onEditarVisita && (
                        <button
                          type="button"
                          onClick={() => onEditarVisita(v)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
                          title="Modificar visita"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Eliminar */}
                      <button
                        type="button"
                        disabled={eliminandoId === v.id}
                        onClick={() => handleEliminar(v.id, v.cliente.nombre)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Eliminar visita"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
