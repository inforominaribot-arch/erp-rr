// Módulo: Stock & Inventario
// Badge de estado de stock con código de colores

import { AlertCircle, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import type { EstadoStockNivel } from "../types"

interface StockEstadoBadgeProps {
  estado: EstadoStockNivel
  activo?: boolean
  className?: string
  mostrarIcono?: boolean
}

export function StockEstadoBadge({
  estado,
  activo = true,
  className = "",
  mostrarIcono = true,
}: StockEstadoBadgeProps) {
  if (!activo) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 ${className}`}
      >
        {mostrarIcono && <XCircle className="h-3 w-3" />}
        Inactivo
      </span>
    )
  }

  switch (estado) {
    case "AGOTADO":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ${className}`}
        >
          {mostrarIcono && <XCircle className="h-3 w-3 text-rose-600" />}
          Agotado (0)
        </span>
      )

    case "CRITICO":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 shadow-sm ${className}`}
        >
          {mostrarIcono && <AlertCircle className="h-3 w-3 text-red-600 animate-pulse" />}
          Stock Crítico
        </span>
      )

    case "BAJO":
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ${className}`}
        >
          {mostrarIcono && <AlertTriangle className="h-3 w-3 text-amber-600" />}
          Stock Bajo
        </span>
      )

    case "NORMAL":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ${className}`}
        >
          {mostrarIcono && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
          Normal
        </span>
      )
  }
}
