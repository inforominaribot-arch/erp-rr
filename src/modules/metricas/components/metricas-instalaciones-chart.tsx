// Componente: Gráfico Recharts de Rendimiento de Instalaciones (BarChart Agrupado)

"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import { CalendarCheck, Wrench } from "lucide-react"
import type { ISerieInstalacionesRendimiento } from "../types"

interface MetricasInstalacionesChartProps {
  datos: ISerieInstalacionesRendimiento[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-xs py-0.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 font-medium">{entry.name}:</span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function MetricasInstalacionesChart({
  datos,
}: MetricasInstalacionesChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Rendimiento de Instalaciones
            </h3>
            <p className="text-xs text-slate-500">
              Colocaciones programadas vs completadas con éxito
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 h-[260px] w-full">
        {datos.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No hay registros de instalaciones en este período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datos}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="periodo"
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
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
              />
              <Bar
                name="Programadas"
                dataKey="programadas"
                fill="#94a3b8"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                name="Completadas"
                dataKey="completadas"
                fill="#0d9488"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
