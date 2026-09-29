// Módulo: Agenda & Instalación
// Badge de Estado de Instalación

import { cn } from "@/lib/utils"
import type { EstadoInstalacion } from "@/types"
import { CheckCircle2, Clock, XCircle, PackageCheck } from "lucide-react"

interface Props {
  estado: EstadoInstalacion
  materialesListos?: boolean
  className?: string
  tamano?: "sm" | "md"
}

export function InstalacionEstadoBadge({
  estado,
  materialesListos = false,
  className,
  tamano = "md",
}: Props) {
  const esPequeno = tamano === "sm"
  const tamanoIcono = esPequeno ? "h-3 w-3" : "h-3.5 w-3.5"
  const padding = esPequeno ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"

  if (estado === "COMPLETADA") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200",
          padding,
          className
        )}
      >
        <CheckCircle2 className={tamanoIcono} />
        Completada
      </span>
    )
  }

  if (estado === "CANCELADA") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full bg-red-50 text-red-700 border border-red-200",
          padding,
          className
        )}
      >
        <XCircle className={tamanoIcono} />
        Cancelada
      </span>
    )
  }

  // PROGRAMADA
  if (materialesListos) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200",
          padding,
          className
        )}
      >
        <PackageCheck className={tamanoIcono} />
        Materiales listos
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200",
        padding,
        className
      )}
    >
      <Clock className={tamanoIcono} />
      Programada
    </span>
  )
}
