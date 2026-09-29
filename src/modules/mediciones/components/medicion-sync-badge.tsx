import { CheckCircle2, Clock } from "lucide-react"

interface MedicionSyncBadgeProps {
  sincronizado: boolean
}

export function MedicionSyncBadge({ sincronizado }: MedicionSyncBadgeProps) {
  if (sincronizado) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3 w-3 text-green-600" />
        Sincronizado
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
      Pendiente
    </span>
  )
}
