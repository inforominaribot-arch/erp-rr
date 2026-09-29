// Componente: Tarjeta de KPI para el Dashboard Principal

import Link from "next/link"
import { LucideIcon, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardKpiCardProps {
  titulo: string
  valor: string | number
  descripcion: string
  icono: LucideIcon
  color: string
  fondo: string
  comparativa?: {
    porcentaje: number
    esPositivo: boolean
    texto: string
  }
  montoSecundario?: string
  alerta?: boolean
  href?: string
}

export function DashboardKpiCard({
  titulo,
  valor,
  descripcion,
  icono: Icono,
  color,
  fondo,
  comparativa,
  montoSecundario,
  alerta,
  href,
}: DashboardKpiCardProps) {
  const CardContent = (
    <div
      className={cn(
        "relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
        alerta ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            fondo
          )}
        >
          <Icono className={cn("h-5 w-5", color)} />
        </div>

        {comparativa && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              comparativa.esPositivo
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            )}
          >
            {comparativa.esPositivo ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            <span>
              {comparativa.porcentaje > 0 ? `+${comparativa.porcentaje}%` : `${comparativa.porcentaje}%`}
            </span>
          </div>
        )}

        {alerta && !comparativa && (
          <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span>Atención</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {valor}
          </p>
          {montoSecundario && (
            <span className="text-xs font-semibold text-indigo-600">
              ({montoSecundario})
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-medium text-slate-700">{titulo}</p>
        <p className="text-xs text-slate-400 mt-0.5">{descripcion}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-transform active:scale-[0.99]">
        {CardContent}
      </Link>
    )
  }

  return CardContent
}
