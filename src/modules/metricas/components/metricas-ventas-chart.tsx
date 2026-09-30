// Componente: Gráfico Recharts de Evolución Temporal de Ventas (AreaChart)

"use client"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { TrendingUp, DollarSign } from "lucide-react"
import type { ISerieVentaTemporal } from "../types"

interface MetricasVentasChartProps {
  datos: ISerieVentaTemporal[]
  esRolFinanciero: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  esRolFinanciero: boolean
}

function CustomTooltip({ active, payload, label, esRolFinanciero }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data: ISerieVentaTemporal = payload[0].payload
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        {esRolFinanciero ? (
          <p className="text-sm font-bold text-indigo-600 mt-1">
            $ {data.monto.toLocaleString("es-AR")}
          </p>
        ) : (
          <p className="text-sm font-bold text-indigo-600 mt-1">
            {data.cantidadPresupuestos} trabajos aprobados
          </p>
        )}
        <p className="text-[11px] text-slate-400 mt-0.5">
          {data.cantidadPresupuestos} {data.cantidadPresupuestos === 1 ? "presupuesto" : "presupuestos"}
        </p>
      </div>
    )
  }
  return null
}

export function MetricasVentasChart({
  datos,
  esRolFinanciero,
}: MetricasVentasChartProps) {
  const formatearEjeY = (valor: number) => {
    if (!esRolFinanciero) return `${valor}`
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`
    if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}k`
    return `$${valor}`
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {esRolFinanciero ? "Evolución de Ventas" : "Trabajos Aprobados"}
            </h3>
            <p className="text-xs text-slate-500">
              {esRolFinanciero
                ? "Facturación de presupuestos aceptados mes a mes"
                : "Cantidad de presupuestos aceptados por período"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 h-[260px] sm:h-[300px] md:h-[340px] w-full min-w-0 overflow-hidden">
        {datos.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No hay datos de ventas en este período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={datos}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="periodo"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={formatearEjeY}
                width={56}
              />
              <Tooltip
                content={<CustomTooltip esRolFinanciero={esRolFinanciero} />}
              />
              <Area
                type="monotone"
                dataKey={esRolFinanciero ? "monto" : "cantidadPresupuestos"}
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMonto)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
