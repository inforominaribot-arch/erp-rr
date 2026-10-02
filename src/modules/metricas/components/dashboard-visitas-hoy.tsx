"use client"

import Link from "next/link"
import {
  CalendarCheck,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Ruler,
  ArrowRight,
  Plus,
} from "lucide-react"

interface VisitaHoyDashboard {
  id: string
  clienteId: string
  clienteNombre: string
  clienteTelefono: string | null
  horaInicio: string
  horaFin: string
  direccion: string
  localidad: string | null
  tipoVisita: string
  estado: string
  notas: string | null
}

interface DashboardVisitasHoyProps {
  visitas?: VisitaHoyDashboard[]
}

export function DashboardVisitasHoy({ visitas = [] }: DashboardVisitasHoyProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Visitas de Medición para Hoy
            </h2>
            <p className="text-xs text-slate-500">
              {visitas.length === 0
                ? "Sin visitas agendadas para hoy"
                : `${visitas.length} ${
                    visitas.length === 1 ? "cita coordinada" : "citas coordinadas"
                  }`}
            </p>
          </div>
        </div>

        <Link
          href="/visitas"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Ver agenda completa
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4">
        {visitas.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-slate-500">
              No tenés visitas de obra programadas para el día de hoy.
            </p>
            <Link
              href="/visitas"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Agendar nueva visita
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visitas.map((v) => {
              const telLimpio = v.clienteTelefono?.replace(/\D/g, "")
              const numFinal = telLimpio
                ? telLimpio.startsWith("54")
                  ? telLimpio
                  : `549${telLimpio}`
                : null

              const mensajeWs = encodeURIComponent(
                `Hola ${v.clienteNombre.trim()}, te escribo de Romina Ribot Cortinados para coordinar nuestra visita de hoy a las ${v.horaInicio} hs. Nos vemos ahí!`
              )

              const whatsappUrl = numFinal
                ? `https://wa.me/${numFinal}?text=${mensajeWs}`
                : null

              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                v.localidad ? `${v.direccion}, ${v.localidad}` : v.direccion
              )}`

              return (
                <div
                  key={v.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                        <Clock className="h-3.5 w-3.5 text-indigo-600" />
                        {v.horaInicio} a {v.horaFin} hs
                      </span>
                      <span className="rounded-md bg-indigo-100/70 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                        {v.tipoVisita.replace(/_/g, " ")}
                      </span>
                    </div>

                    <Link
                      href={`/clientes/${v.clienteId}`}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 block"
                    >
                      {v.clienteNombre}
                    </Link>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {v.direccion} {v.localidad ? `(${v.localidad})` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    )}

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-sky-50 border border-sky-200 p-2 text-sky-700 hover:bg-sky-100 transition-colors"
                      title="Abrir en Google Maps"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                    </a>

                    <Link
                      href={`/mediciones/nueva?clienteId=${v.clienteId}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
                    >
                      <Ruler className="h-3.5 w-3.5" />
                      <span>Medir</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
