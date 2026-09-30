// Componente: Selector de Período para Métricas Avanzadas

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { OPCIONES_PERIODO, type PeriodoMetricas } from "../types"

interface MetricasPeriodoSelectorProps {
  periodoActual: PeriodoMetricas
}

export function MetricasPeriodoSelector({
  periodoActual,
}: MetricasPeriodoSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function cambiarPeriodo(periodo: PeriodoMetricas) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("periodo", periodo)
    router.push(`/metricas?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs overflow-x-auto touch-scroll max-w-full">
      <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        <span>Período:</span>
      </div>

      {OPCIONES_PERIODO.map((opc) => {
        const activo = periodoActual === opc.id

        return (
          <button
            key={opc.id}
            type="button"
            onClick={() => cambiarPeriodo(opc.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px]",
              activo
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {activo && <Check className="h-3 w-3 stroke-[3]" />}
            {opc.label}
          </button>
        )
      })}
    </div>
  )
}
