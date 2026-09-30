// Componente: Gráfico Recharts de Top Insumos y Telas Más Solicitadas (BarChart Horizontal)

"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts"
import { Package, Layers } from "lucide-react"
import type { ISerieTopProducto } from "../types"

interface MetricasTopProductosChartProps {
  datos: ISerieTopProducto[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data: ISerieTopProducto = payload[0].payload
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-700">{data.nombre}</p>
        <p className="text-sm font-bold text-indigo-600 mt-1">
          {data.cantidad} {data.unidadMedida}
        </p>
        <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
          {data.tipo}
        </span>
      </div>
    )
  }
  return null
}

export function MetricasTopProductosChart({
  datos,
}: MetricasTopProductosChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Insumos & Telas Más Demandados
            </h3>
            <p className="text-xs text-slate-500">
              Ranking de metros y unidades utilizadas en el período
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 h-[260px] sm:h-[300px] md:h-[340px] w-full min-w-0 overflow-hidden">
        {datos.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No hay registros de consumo en este período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datos}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                axisLine={false}
                tickLine={false}
                width={100}
                tick={{ fontSize: 10, fill: "#475569" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                {datos.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.tipo === "TELA"
                        ? "#6366f1"
                        : entry.tipo === "MECANISMO"
                        ? "#0ea5e9"
                        : "#8b5cf6"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
