// Componente: Gráfico Recharts de Distribución por Tipo de Confección / Sistema (PieChart / Donut)

"use client"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"
import { PieChart as PieIcon } from "lucide-react"
import type { ISerieDistribucionConfeccion } from "../types"

interface MetricasDistribucionConfeccionChartProps {
  datos: ISerieDistribucionConfeccion[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data: ISerieDistribucionConfeccion = payload[0].payload
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <p className="text-xs font-semibold text-slate-700">{data.nombre}</p>
        </div>
        <p className="text-sm font-bold text-slate-900 mt-1">
          {data.cantidad} {data.cantidad === 1 ? "cortina" : "cortinas"} ({data.porcentaje}%)
        </p>
      </div>
    )
  }
  return null
}

export function MetricasDistribucionConfeccionChart({
  datos,
}: MetricasDistribucionConfeccionChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <PieIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Distribución por Sistema & Confección
            </h3>
            <p className="text-xs text-slate-500">
              Proporción de cortinas cotizadas y producidas
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center gap-4">
        <div className="h-[240px] sm:h-[260px] w-full md:w-3/5 min-w-0 overflow-hidden">
          {datos.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No hay datos disponibles en el período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="cantidad"
                >
                  {datos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leyenda personalizada lateral */}
        <div className="w-full md:w-2/5 space-y-2">
          {datos.map((item) => (
            <div
              key={item.nombre}
              className="flex items-center justify-between rounded-lg p-1.5 text-xs hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-700 truncate max-w-[130px]">
                  {item.nombre}
                </span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <span>{item.cantidad}</span>
                <span className="text-slate-400 font-normal">({item.porcentaje}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
