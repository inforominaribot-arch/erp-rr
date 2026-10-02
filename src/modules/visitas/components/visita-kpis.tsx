import { CalendarCheck, CalendarDays, CheckCircle2, Clock } from "lucide-react"
import type { IVisitasMetricas } from "../types"

interface VisitaKPIsProps {
  metricas: IVisitasMetricas
}

export function VisitaKPIs({ metricas }: VisitaKPIsProps) {
  const cards = [
    {
      titulo: "Visitas para Hoy",
      valor: metricas.totalHoy,
      subtexto: metricas.totalHoy === 1 ? "1 cita agendada hoy" : `${metricas.totalHoy} citas agendadas hoy`,
      icono: Clock,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      titulo: "Esta Semana",
      valor: metricas.totalSemana,
      subtexto: "Próximos 7 días",
      icono: CalendarDays,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      titulo: "Confirmadas",
      valor: metricas.confirmadas,
      subtexto: "Horario ratificado",
      icono: CalendarCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      titulo: "Realizadas este Mes",
      valor: metricas.realizadasMes,
      subtexto: "Listas para presupuestar",
      icono: CheckCircle2,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c) => {
        const Icono = c.icono
        return (
          <div
            key={c.titulo}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{c.titulo}</span>
              <div className={`rounded-lg p-2 ${c.bg} ${c.color}`}>
                <Icono className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {c.valor}
              </span>
              <p className="mt-0.5 text-xs text-slate-500 truncate">{c.subtexto}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
