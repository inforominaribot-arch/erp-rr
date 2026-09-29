import { Scissors, Truck } from "lucide-react"
import type { TipoItemComanda } from "@/types"

interface ComandaTipoBadgeProps {
  tipo: TipoItemComanda
  className?: string
  tamano?: "sm" | "md"
}

export function ComandaTipoBadge({
  tipo,
  className = "",
  tamano = "md",
}: ComandaTipoBadgeProps) {
  const configs: Record<
    TipoItemComanda,
    { label: string; icon: typeof Scissors; classes: string }
  > = {
    FABRICAR: {
      label: "Fabricar en Taller",
      icon: Scissors,
      classes: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    },
    PEDIR_PROVEEDOR: {
      label: "Pedir a Proveedor",
      icon: Truck,
      classes: "bg-amber-50 text-amber-800 border-amber-200/80",
    },
  }

  const config = configs[tipo] || configs.FABRICAR
  const Icono = config.icon

  const paddingClases =
    tamano === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5"

  const iconoTamano = tamano === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg border shadow-2xs ${paddingClases} ${config.classes} ${className}`}
    >
      <Icono className={iconoTamano} />
      {config.label}
    </span>
  )
}
