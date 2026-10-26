import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"
import type { IAvisoMedidaDashboard } from "../queries"

/** Alerta del dashboard: presupuestos con cortinas cuya medida cambió y falta revisar. */
export function DashboardAvisosMedida({ avisos }: { avisos: IAvisoMedidaDashboard[] }) {
  if (avisos.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-2xs">
      <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Medidas modificadas después de presupuestar ({avisos.length})
      </div>
      <p className="mt-0.5 text-xs text-amber-800">
        Revisá precio y comanda. El aviso desaparece al marcarlo como revisado en el presupuesto.
      </p>
      <ul className="mt-3 divide-y divide-amber-200">
        {avisos.map((a) => (
          <li key={a.presupuestoId}>
            <Link
              href={`/presupuestos/${a.presupuestoId}`}
              className="flex items-center justify-between gap-3 py-2 text-xs hover:text-indigo-700"
            >
              <span>
                <strong>#{a.presupuestoNumero}</strong> — {a.clienteNombre} •{" "}
                {a.cortinas} cortina{a.cortinas !== 1 ? "s" : ""} •{" "}
                {new Date(a.ultimaModificacion).toLocaleDateString("es-AR")}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
