import type { EstadoVisita } from "@/types"
import { ESTADO_VISITA_COLORES } from "../types"
import { cn } from "@/lib/utils"

interface VisitaEstadoBadgeProps {
  estado: EstadoVisita
  className?: string
  mostrarPunto?: boolean
}

export function VisitaEstadoBadge({
  estado,
  className,
  mostrarPunto = true,
}: VisitaEstadoBadgeProps) {
  const estilo = ESTADO_VISITA_COLORES[estado] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: estado,
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        estilo.bg,
        estilo.text,
        estilo.border,
        className
      )}
    >
      {mostrarPunto && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", estilo.dot)}
          aria-hidden="true"
        />
      )}
      {estilo.label}
    </span>
  )
}
