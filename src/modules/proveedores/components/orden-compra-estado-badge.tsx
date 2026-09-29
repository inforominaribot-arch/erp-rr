// Módulo: Proveedores & Compras
// Componente Badge para el ciclo de estados de una Orden de Compra

import {
  FileClock,
  Send,
  Boxes,
  CheckCheck,
  Ban,
} from "lucide-react"
import type { EstadoOrdenCompra } from "../types"
import { ESTADOS_ORDEN_COMPRA_CONFIG } from "../types"

interface OrdenCompraEstadoBadgeProps {
  estado: EstadoOrdenCompra
  className?: string
}

export function OrdenCompraEstadoBadge({
  estado,
  className = "",
}: OrdenCompraEstadoBadgeProps) {
  const config = ESTADOS_ORDEN_COMPRA_CONFIG[estado] || {
    label: estado,
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  }

  const renderIcono = () => {
    switch (estado) {
      case "PENDIENTE":
        return <FileClock className="h-3.5 w-3.5 text-amber-600" />
      case "ENVIADA":
        return <Send className="h-3.5 w-3.5 text-blue-600" />
      case "RECIBIDA_PARCIAL":
        return <Boxes className="h-3.5 w-3.5 text-indigo-600" />
      case "RECIBIDA_TOTAL":
        return <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
      case "CANCELADA":
        return <Ban className="h-3.5 w-3.5 text-rose-600" />
      default:
        return null
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass} ${className}`}
      title={config.descripcion}
    >
      {renderIcono()}
      {config.label}
    </span>
  )
}
