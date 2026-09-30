// Componente: Gráfico Recharts de Captación de Nuevos Clientes (BarChart)

"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { Users } from "lucide-react"
import type { ISerieCaptacionClientes } from "../types"

interface MetricasClientesChartProps {
  datos: ISerieCaptacionClientes[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-sm font-bold text-indigo-600 mt-1">
          {val} {val === 1 ? "nuevo cliente" : "nuevos clientes"}
        </p>
      </div>
    )
  }
  return null
}

export function MetricasClientesChart({ datos }: MetricasClientesChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Captación de Nuevos Clientes
            </h3>
            <p className="text-xs text-slate-500">
              Evolución mensual de ingresos al CRM
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 h-[260px] sm:h-[300px] md:h-[340px] w-full min-w-0 overflow-hidden">
        {datos.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No hay registros de nuevos clientes
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datos}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="mes"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="clientes"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
