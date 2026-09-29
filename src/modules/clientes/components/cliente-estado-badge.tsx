import type { EstadoCliente } from "@/types"
import { ESTADO_CLIENTE_LABELS } from "@/types"
import { ESTADO_CLIENTE_COLORES } from "../types"
import { cn } from "@/lib/utils"

interface ClienteEstadoBadgeProps {
  estado: EstadoCliente
  className?: string
  mostrarPunto?: boolean
}

export function ClienteEstadoBadge({
  estado,
  className,
  mostrarPunto = true,
}: ClienteEstadoBadgeProps) {
  const estilo = ESTADO_CLIENTE_COLORES[estado] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  }

  const label = ESTADO_CLIENTE_LABELS[estado] || estado

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
      {label}
    </span>
  )
}
