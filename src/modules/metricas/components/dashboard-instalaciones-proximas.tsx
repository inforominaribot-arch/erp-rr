// Componente: Próximas instalaciones con estado de materiales de taller

import Link from "next/link"
import { Calendar, Clock, MapPin, Phone, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import type { IInstalacionProximaDashboard } from "../types"

interface DashboardInstalacionesProximasProps {
  instalaciones: IInstalacionProximaDashboard[]
}

export function DashboardInstalacionesProximas({
  instalaciones,
}: DashboardInstalacionesProximasProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Próximas instalaciones</h2>
            <p className="text-xs text-slate-500">Esta semana & materiales de taller</p>
          </div>
        </div>
        <Link
          href="/instalaciones"
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Ver agenda
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {instalaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-10 w-10 text-slate-200" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No hay instalaciones programadas
            </p>
            <p className="text-xs text-slate-400">
              Las nuevas colocaciones aparecerán aquí
            </p>
          </div>
        ) : (
          instalaciones.map((inst) => {
            const fechaObj = new Date(inst.fecha)
            const diaSemana = fechaObj.toLocaleDateString("es-AR", { weekday: "short" })
            const diaNum = fechaObj.toLocaleDateString("es-AR", { day: "numeric", month: "short" })

            return (
              <div
                key={inst.id}
                className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Fecha badge */}
                  <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-center min-w-[56px]">
                    <span className="text-[10px] font-semibold uppercase text-slate-500">
                      {diaSemana}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {diaNum}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/instalaciones/${inst.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {inst.clienteNombre}
                      </Link>
                      <span className="text-xs text-slate-400">
                        Comanda #{inst.comandaNumero}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {inst.horaInicio && (
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {inst.horaInicio} {inst.horaFin ? `a ${inst.horaFin}` : "hs"}
                        </span>
                      )}
                      {(inst.localidad || inst.direccion) && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          {inst.localidad || inst.direccion}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0">
                  {/* Badge de materiales */}
                  {inst.materialesListos ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Listos en taller
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      Materiales pendientes
                    </span>
                  )}

                  {inst.clienteTelefono && (
                    <a
                      href={`https://wa.me/${inst.clienteTelefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hola ${inst.clienteNombre}! Nos comunicamos de ROMINA RIBOT Cortinados para coordinar la instalación de tus cortinas.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Contactar por WhatsApp"
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
