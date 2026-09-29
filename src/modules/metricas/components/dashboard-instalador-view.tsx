// Componente: Vista Operativa del Dashboard para Rol INSTALACION
// Muestra directamente el itinerario de instalaciones asignadas para hoy y la semana

import Link from "next/link"
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Navigation,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { IDashboardOperativoData } from "../types"

interface DashboardInstaladorViewProps {
  data: IDashboardOperativoData
}

export function DashboardInstaladorView({ data }: DashboardInstaladorViewProps) {
  const itinerarioHoy = data.instalacionData?.itinerarioHoy || []
  const itinerarioSemana = data.instalacionData?.itinerarioSemana || []

  return (
    <div className="space-y-6">
      {/* Resumen Superior */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
              Hoja de Ruta de Colocación
            </span>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Tu Itinerario de Trabajo
            </h2>
            <p className="text-xs text-slate-500">
              Tenés {itinerarioHoy.length} colocación{itinerarioHoy.length === 1 ? "" : "es"} programada{itinerarioHoy.length === 1 ? "" : "s"} para hoy
            </p>
          </div>

          <Link
            href="/instalaciones"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Ver Calendario Completo
          </Link>
        </div>
      </div>

      {/* Instalaciones de Hoy */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600" />
          Colocaciones para Hoy
        </h3>

        {itinerarioHoy.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              ¡No tenés instalaciones asignadas para hoy!
            </p>
            <p className="text-xs text-slate-400">
              Podés revisar las tareas programadas para el resto de la semana.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {itinerarioHoy.map((inst) => {
              const urlMaps = inst.direccion
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    inst.direccion
                  )}`
                : null

              const mensajeWa = `Hola ${inst.cliente}! Nos comunicamos del equipo de instalación de ROMINA RIBOT Cortinados. Estamos en camino para realizar la colocación acordada.`

              return (
                <div
                  key={inst.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-indigo-600">
                        Comanda #{inst.comandaNumero}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">
                        {inst.cliente}
                      </h4>
                    </div>

                    {inst.materialesListos ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Listo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        Falta material
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    {inst.horaInicio && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Horario: {inst.horaInicio} {inst.horaFin ? `a ${inst.horaFin}` : "hs"}
                        </span>
                      </div>
                    )}
                    {inst.direccion && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{inst.direccion}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones directas mobile-first */}
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
                    {urlMaps && (
                      <a
                        href={urlMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Navigation className="h-3.5 w-3.5 text-indigo-600" />
                        Google Maps
                      </a>
                    )}

                    {inst.telefono && (
                      <a
                        href={`https://wa.me/${inst.telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(mensajeWa)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    )}

                    <Link
                      href={`/instalaciones/${inst.id}`}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                      title="Ver Ficha Técnica A4"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Próximas de la semana */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-teal-600" />
          Resto de la Semana
        </h3>

        <div className="divide-y divide-slate-100">
          {itinerarioSemana.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              No hay más colocaciones programadas para esta semana
            </p>
          ) : (
            itinerarioSemana.map((inst) => (
              <div
                key={inst.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {inst.cliente}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(inst.fecha).toLocaleDateString("es-AR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    {inst.horaInicio ? `• ${inst.horaInicio} hs` : ""} • Comanda #{inst.comandaNumero}
                  </p>
                </div>

                <Link
                  href={`/instalaciones/${inst.id}`}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Ver Ficha
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
