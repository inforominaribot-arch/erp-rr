// Componente: Feed cronológico de actividad reciente del sistema

import Link from "next/link"
import {
  Users,
  FileText,
  ClipboardList,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { IActividadRecienteDashboard, TipoActividadReciente } from "../types"

interface DashboardFeedActividadProps {
  actividades: IActividadRecienteDashboard[]
}

function getIconoConfig(tipo: TipoActividadReciente) {
  switch (tipo) {
    case "CLIENTE_NUEVO":
      return { icono: Users, color: "text-indigo-600", fondo: "bg-indigo-50" }
    case "PRESUPUESTO_ACEPTADO":
      return { icono: CheckCircle2, color: "text-emerald-600", fondo: "bg-emerald-50" }
    case "PRESUPUESTO_ENVIADO":
      return { icono: FileText, color: "text-sky-600", fondo: "bg-sky-50" }
    case "COMANDA_CREADA":
    case "COMANDA_COMPLETADA":
      return { icono: ClipboardList, color: "text-amber-600", fondo: "bg-amber-50" }
    case "INSTALACION_AGENDADA":
    case "INSTALACION_COMPLETADA":
      return { icono: Calendar, color: "text-teal-600", fondo: "bg-teal-50" }
    case "STOCK_REMITO":
      return { icono: Package, color: "text-purple-600", fondo: "bg-purple-50" }
    default:
      return { icono: Clock, color: "text-slate-600", fondo: "bg-slate-50" }
  }
}

export function DashboardFeedActividad({ actividades }: DashboardFeedActividadProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Actividad reciente</h2>
            <p className="text-xs text-slate-500">Últimos movimientos del sistema</p>
          </div>
        </div>
        <span className="text-xs text-slate-400">En vivo</span>
      </div>

      <div className="mt-4">
        {actividades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-slate-200" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No hay actividad registrada
            </p>
            <p className="text-xs text-slate-400">
              Las acciones de los módulos aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {actividades.map((act) => {
              const { icono: Icono, color, fondo } = getIconoConfig(act.tipo)

              const ItemContent = (
                <div className="relative flex items-start gap-3 pl-1 group">
                  <div
                    className={cn(
                      "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-2xs",
                      fondo
                    )}
                  >
                    <Icono className={cn("h-3.5 w-3.5", color)} />
                  </div>

                  <div className="flex-1 min-w-0 -mt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {act.titulo}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {act.tiempoRelativo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {act.descripcion}
                    </p>
                  </div>
                </div>
              )

              if (act.href) {
                return (
                  <Link key={act.id} href={act.href} className="block">
                    {ItemContent}
                  </Link>
                )
              }

              return <div key={act.id}>{ItemContent}</div>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
