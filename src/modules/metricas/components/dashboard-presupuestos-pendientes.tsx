// Componente: Presupuestos pendientes de respuesta para seguimiento rápido

import Link from "next/link"
import { FileText, MessageSquare, ArrowRight, Clock } from "lucide-react"
import type { IPresupuestoPendienteDashboard } from "../types"

interface DashboardPresupuestosPendientesProps {
  presupuestos: IPresupuestoPendienteDashboard[]
}

export function DashboardPresupuestosPendientes({
  presupuestos,
}: DashboardPresupuestosPendientesProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Presupuestos enviados</h2>
            <p className="text-xs text-slate-500">Seguimiento comercial & WhatsApp</p>
          </div>
        </div>
        <Link
          href="/presupuestos"
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Ver todos
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {presupuestos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-10 w-10 text-slate-200" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No hay presupuestos pendientes de respuesta
            </p>
            <p className="text-xs text-slate-400">
              Los nuevos presupuestos enviados aparecerán aquí
            </p>
          </div>
        ) : (
          presupuestos.map((p) => {
            const mensajeWa = `Hola ${p.clienteNombre}! Te escribo de ROMINA RIBOT Cortinados para saber si pudiste revisar el presupuesto #${p.numero} que te enviamos. ¿Tenés alguna duda sobre las telas o sistemas? Quedo a tu disposición!`

            return (
              <div
                key={p.id}
                className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/presupuestos/${p.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {p.clienteNombre}
                    </Link>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      #{p.numero}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      $ {p.total.toLocaleString("es-AR")}
                    </span>
                    <span>•</span>
                    <span>{p.cantItems} {p.cantItems === 1 ? "ítem" : "ítems"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3" />
                      {p.diasDesdeEnvio === 0
                        ? "Enviado hoy"
                        : p.diasDesdeEnvio === 1
                        ? "Enviado ayer"
                        : `Hace ${p.diasDesdeEnvio} días`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {p.clienteTelefono ? (
                    <a
                      href={`https://wa.me/${p.clienteTelefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(mensajeWa)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Seguimiento WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sin teléfono</span>
                  )}

                  <Link
                    href={`/presupuestos/${p.id}`}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    title="Ver presupuesto"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
