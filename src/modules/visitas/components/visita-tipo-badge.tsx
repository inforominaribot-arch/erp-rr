import type { TipoVisita } from "@/types"
import { TIPO_VISITA_CONFIG } from "../types"
import { cn } from "@/lib/utils"

interface VisitaTipoBadgeProps {
  tipo: TipoVisita
  className?: string
}

export function VisitaTipoBadge({ tipo, className }: VisitaTipoBadgeProps) {
  const config = TIPO_VISITA_CONFIG[tipo] || {
    label: tipo,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight",
        config.badgeClass,
        className
      )}
    >
      {config.label}
    </span>
  )
}
