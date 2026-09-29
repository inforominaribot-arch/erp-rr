import {
  Clock,
  Factory,
  Truck,
  PackageCheck,
  CheckCheck,
} from "lucide-react"
import type { EstadoComanda } from "@/types"

interface ComandaEstadoBadgeProps {
  estado: EstadoComanda
  className?: string
  tamano?: "sm" | "md"
}

export function ComandaEstadoBadge({
  estado,
  className = "",
  tamano = "md",
}: ComandaEstadoBadgeProps) {
  const configs: Record<
    EstadoComanda,
    { label: string; icon: typeof Clock; classes: string }
  > = {
    PENDIENTE: {
      label: "Pendiente",
      icon: Clock,
      classes: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
    EN_PRODUCCION: {
      label: "En Producción",
      icon: Factory,
      classes: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    },
    ESPERANDO_PROVEEDOR: {
      label: "Esperando Proveedor",
      icon: Truck,
      classes: "bg-purple-50 text-purple-700 border-purple-200/80",
    },
    LISTO_PARA_INSTALAR: {
      label: "Listo para Instalar",
      icon: PackageCheck,
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
    INSTALADO: {
      label: "Instalado",
      icon: CheckCheck,
      classes: "bg-slate-100 text-slate-700 border-slate-200",
    },
  }

  const config = configs[estado] || configs.PENDIENTE
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
