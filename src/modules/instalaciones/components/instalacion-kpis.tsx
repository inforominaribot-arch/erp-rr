// Módulo: Agenda & Instalación
// KPIs del Módulo

import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MetricasInstalaciones } from "../types"

interface Props {
  metricas: MetricasInstalaciones
  onFiltrarEstado?: (estado: string) => void
}

export function InstalacionKPIs({ metricas, onFiltrarEstado }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Programadas del Mes */}
      <div
        onClick={() => onFiltrarEstado?.("PROGRAMADA")}
        className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-indigo-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Programadas Mes
          </p>
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-slate-900">{metricas.totalMes}</p>
        <p className="mt-1 text-xs text-slate-500">Colocaciones activas</p>
      </div>

      {/* 2. Colocaciones Hoy */}
      <div
        onClick={() => onFiltrarEstado?.("HOY")}
        className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Para Hoy
          </p>
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-slate-900">{metricas.hoy}</p>
        <p className="mt-1 text-xs text-slate-500">En ruta o agendadas</p>
      </div>

      {/* 3. Materiales pendientes mañana */}
      <div
        className={cn(
          "bg-white rounded-xl border p-4 shadow-sm transition-colors",
          metricas.materialesPendientesManana > 0
            ? "border-amber-300 bg-amber-50/30"
            : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Taller: Para Mañana
          </p>
          <div
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              metricas.materialesPendientesManana > 0
                ? "bg-amber-100 text-amber-600"
                : "bg-slate-100 text-slate-500"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p
            className={cn(
              "text-2xl font-bold",
              metricas.materialesPendientesManana > 0 ? "text-amber-700" : "text-slate-900"
            )}
          >
            {metricas.materialesPendientesManana}
          </p>
          <span className="text-xs text-slate-500">sin preparar</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Total mañana: {metricas.manana} colocaciones
        </p>
      </div>

      {/* 4. Completadas del Mes */}
      <div
        onClick={() => onFiltrarEstado?.("COMPLETADA")}
        className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-emerald-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Completadas Mes
          </p>
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-slate-900">{metricas.completadasMes}</p>
        <p className="mt-1 text-xs text-slate-500">Instalaciones concluidas</p>
      </div>
    </div>
  )
}
