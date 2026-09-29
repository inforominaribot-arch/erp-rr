"use client"

import type { EstadoPresupuesto } from "@/types"
import { ESTADO_PRESUPUESTO_LABELS } from "@/types"
import { ESTADO_PRESUPUESTO_COLORES } from "../types"
import {
  FileEdit,
  Send,
  CheckCircle2,
  CheckCheck,
  XCircle,
} from "lucide-react"

interface PresupuestoEstadoBadgeProps {
  estado: EstadoPresupuesto
  className?: string
}

export function PresupuestoEstadoBadge({
  estado,
  className = "",
}: PresupuestoEstadoBadgeProps) {
  const config = ESTADO_PRESUPUESTO_COLORES[estado] || ESTADO_PRESUPUESTO_COLORES.BORRADOR
  const label = ESTADO_PRESUPUESTO_LABELS[estado] || estado

  const renderIcon = () => {
    switch (estado) {
      case "BORRADOR":
        return <FileEdit className="h-3 w-3" />
      case "ENVIADO":
        return <Send className="h-3 w-3" />
      case "ACEPTADO_TOTAL":
        return <CheckCheck className="h-3 w-3" />
      case "ACEPTADO_PARCIAL":
        return <CheckCircle2 className="h-3 w-3" />
      case "RECHAZADO":
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {renderIcon()}
      {label}
    </span>
  )
}
