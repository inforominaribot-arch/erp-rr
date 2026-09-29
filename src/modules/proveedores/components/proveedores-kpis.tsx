// Módulo: Proveedores & Compras
// Componente de KPIs y Métricas del módulo

import {
  Truck,
  FileClock,
  Send,
  Boxes,
  AlertTriangle,
  BadgeDollarSign,
  Sparkles,
} from "lucide-react"
import type { IMetricasProveedoresYCompras } from "../types"

interface ProveedoresKPIsProps {
  metricas: IMetricasProveedoresYCompras
  puedeVerCostos: boolean
  onAbrirReposicionSugerida?: () => void
}

export function ProveedoresKPIs({
  metricas,
  puedeVerCostos,
  onAbrirReposicionSugerida,
}: ProveedoresKPIsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Proveedores Activos */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Truck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Proveedores
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metricas.proveedoresActivos}
            </span>
            <span className="text-xs text-slate-400">
              de {metricas.totalProveedores}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Órdenes Pendientes (Borradores) */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <FileClock className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            OC Pendientes
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metricas.ordenesPendientes}
            </span>
            <span className="text-xs text-amber-600 font-medium">por emitir</span>
          </div>
        </div>
      </div>

      {/* 3. Órdenes Enviadas en Camino */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Send className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            OC Enviadas
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {metricas.ordenesEnviadas}
            </span>
            <span className="text-xs text-blue-600 font-medium">en fábrica</span>
          </div>
        </div>
      </div>

      {/* 4. Insumos Críticos para Reponer */}
      <div className="relative flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Bajo Stock
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-900">
                {metricas.insumosCriticosParaReponer}
              </span>
              <span className="text-xs text-rose-600 font-medium">insumos</span>
            </div>
          </div>
        </div>

        {onAbrirReposicionSugerida && metricas.insumosCriticosParaReponer > 0 && (
          <button
            type="button"
            onClick={onAbrirReposicionSugerida}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-rose-700 transition"
            title="Ver sugerencias de reposición automática"
          >
            <Sparkles className="h-3 w-3" />
            Reponer
          </button>
        )}
      </div>

      {/* 5. Gasto o Entregas del Mes */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {puedeVerCostos ? (
            <BadgeDollarSign className="h-6 w-6" />
          ) : (
            <Boxes className="h-6 w-6" />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {puedeVerCostos ? "Compras del Mes" : "OC Recibidas"}
          </p>
          {puedeVerCostos ? (
            <p className="text-xl font-black text-slate-900 truncate">
              ${metricas.gastoComprasMes.toLocaleString("es-AR")}
            </p>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {metricas.ordenesRecibidasMes}
              </span>
              <span className="text-xs text-slate-500">completadas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
