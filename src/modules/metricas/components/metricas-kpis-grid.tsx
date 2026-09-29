// Componente: Grilla de KPIs Comerciales y Operativos para /metricas

import {
  DollarSign,
  TrendingUp,
  Scissors,
  CheckCircle2,
  Users,
  Target,
  Factory,
  Truck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { IMetricasKpis } from "../types"

interface MetricasKpisGridProps {
  kpis: IMetricasKpis
  esRolFinanciero: boolean
}

export function MetricasKpisGrid({ kpis, esRolFinanciero }: MetricasKpisGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Facturación / Trabajos Aprobados */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {esRolFinanciero ? (
              <DollarSign className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {kpis.presupuestosAceptados} aprobados
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {esRolFinanciero
              ? `$ ${kpis.facturacionTotal.toLocaleString("es-AR")}`
              : `${kpis.presupuestosAceptados} Trabajos`}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {esRolFinanciero ? "Ventas Aprobadas" : "Presupuestos Ganados"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {esRolFinanciero && kpis.presupuestosAceptados > 0
              ? `Ticket promedio: $ ${kpis.ticketPromedio.toLocaleString("es-AR")}`
              : `De ${kpis.presupuestosTotales} presupuestos cotizados`}
          </p>
        </div>
      </div>

      {/* 2. Tasa de Conversión */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Target className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              kpis.tasaConversion >= 50
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {kpis.tasaConversion >= 50 ? "Alta eficacia" : "En seguimiento"}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {kpis.tasaConversion}%
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Tasa de Conversión
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {kpis.presupuestosAceptados} de {kpis.presupuestosTotales} presupuestos
          </p>
        </div>
      </div>

      {/* 3. Confección Taller vs Proveedor */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Scissors className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {kpis.ratioTallerProveedor}% Taller
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {kpis.cortinasFabricadasTaller + kpis.cortinasPedidasProveedor} cortinas
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Confección & Fábrica
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-amber-700">
              <Factory className="h-3 w-3" />
              {kpis.cortinasFabricadasTaller} Taller
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-sky-700">
              <Truck className="h-3 w-3" />
              {kpis.cortinasPedidasProveedor} Fábrica
            </span>
          </div>
        </div>
      </div>

      {/* 4. Instalaciones Realizadas */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
            {kpis.tasaCumplimientoInstalaciones}% Cumplimiento
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {kpis.instalacionesCompletadas} completadas
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Colocaciones en Obra
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            De {kpis.instalacionesTotales} programadas en el período
          </p>
        </div>
      </div>
    </div>
  )
}
