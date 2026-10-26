import Link from "next/link"
import { ArrowRight, ShoppingCart, Truck, AlertTriangle } from "lucide-react"
import type { IResumenPedidosProveedor } from "../queries"

/** Alerta del dashboard: cortinas por pedir a proveedor y pedidos demorados. */
export function DashboardPedidosProveedor({ resumen }: { resumen: IResumenPedidosProveedor }) {
  if (resumen.porPedir === 0 && resumen.demorados === 0) return null

  return (
    <Link
      href="/produccion"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-4 shadow-2xs hover:border-orange-400 transition"
    >
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {resumen.porPedir > 0 && (
          <span className="inline-flex items-center gap-1.5 font-bold text-orange-900">
            <ShoppingCart className="h-4 w-4 text-orange-600" />
            Cortinas por pedir a proveedor: {resumen.porPedir}
          </span>
        )}
        {resumen.esperando > 0 && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-sky-900">
            <Truck className="h-4 w-4 text-sky-600" />
            Esperando llegada: {resumen.esperando}
          </span>
        )}
        {resumen.demorados > 0 && (
          <span className="inline-flex items-center gap-1.5 font-bold text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Demorados: {resumen.demorados}
          </span>
        )}
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-800">
        Ir a Producción
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}
