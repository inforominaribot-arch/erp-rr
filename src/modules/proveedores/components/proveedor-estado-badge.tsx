// Módulo: Proveedores & Compras
// Componente Badge para el estado de un Proveedor

import { CheckCircle2, XCircle } from "lucide-react"

interface ProveedorEstadoBadgeProps {
  activo: boolean
  className?: string
}

export function ProveedorEstadoBadge({
  activo,
  className = "",
}: ProveedorEstadoBadgeProps) {
  if (activo) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        Activo
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ${className}`}
    >
      <XCircle className="h-3.5 w-3.5 text-slate-400" />
      Inactivo
    </span>
  )
}
