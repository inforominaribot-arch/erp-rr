// Módulo: Stock & Inventario
// KPIs de cabecera

import { Package, AlertTriangle, ArrowUpDown, DollarSign } from "lucide-react"
import type { IMetricasStock } from "../types"

interface StockKPIsProps {
  metricas: IMetricasStock
  soloCriticosActivo?: boolean
  onToggleCriticos?: () => void
}

export function StockKPIs({
  metricas,
  soloCriticosActivo = false,
  onToggleCriticos,
}: StockKPIsProps) {
  const formatearMoneda = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val)
  }

  const tieneAlerta = metricas.productosCriticos > 0 || metricas.productosAgotados > 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Insumos */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Package className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Catálogo de Insumos</p>
          <p className="text-xl font-bold text-slate-900">
            {metricas.totalProductos}
          </p>
          <p className="text-[11px] text-slate-400">Materiales y repuestos</p>
        </div>
      </div>

      {/* 2. Stock Crítico o Agotado (Interactivo) */}
      <div
        onClick={onToggleCriticos}
        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
          soloCriticosActivo
            ? "border-red-500 bg-red-50/60 ring-2 ring-red-400"
            : tieneAlerta
            ? "border-red-200 bg-red-50/30 hover:border-red-300"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            tieneAlerta
              ? "bg-red-100 text-red-600 animate-pulse"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Stock Crítico / Agotado</p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold ${
                tieneAlerta ? "text-red-700" : "text-emerald-700"
              }`}
            >
              {metricas.productosCriticos + metricas.productosAgotados}
            </span>
            {metricas.productosAgotados > 0 && (
              <span className="text-[11px] font-semibold text-rose-600">
                ({metricas.productosAgotados} agotados)
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium text-indigo-600 hover:underline">
            {soloCriticosActivo ? "Mostrando solo críticos (quitar filtro)" : "Hacé clic para filtrar"}
          </p>
        </div>
      </div>

      {/* 3. Movimientos del Mes */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ArrowUpDown className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Movimientos del Mes</p>
          <p className="text-xl font-bold text-slate-900">
            {metricas.movimientosMes}
          </p>
          <p className="text-[11px] text-slate-400">Ingresos, egresos y ajustes</p>
        </div>
      </div>

      {/* 4. Valuación de Inventario (Solo visible si no es Taller) */}
      {metricas.valorTotalInventario !== null ? (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Valor de Inventario</p>
            <p className="text-xl font-bold text-slate-900">
              {formatearMoneda(metricas.valorTotalInventario)}
            </p>
            <p className="text-[11px] text-slate-400">A precio de costo actual</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Operaciones de Taller</p>
            <p className="text-sm font-semibold text-slate-800">
              Disponibilidad Activa
            </p>
            <p className="text-[11px] text-slate-400">Control físico de insumos</p>
          </div>
        </div>
      )}
    </div>
  )
}
