import { redirect } from "next/navigation"
import {
  obtenerComandas,
  obtenerMetricasComandas,
  obtenerPresupuestosAceptadosSinComanda,
} from "@/modules/comandas/queries"
import { tienePermisoModuloComandas } from "@/modules/comandas/lib/auth"
import { ComandasView } from "@/modules/comandas/components/comandas-view"
import { AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ComandasPage() {
  const auth = await tienePermisoModuloComandas(false)

  if (!auth.permitido) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3 border border-rose-200">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acceso Restringido</h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          {auth.error || "No tenés permisos para acceder al módulo de comandas."}
        </p>
      </div>
    )
  }

  const [authEscritura, metricas, { comandas }, presupuestosAceptados] =
    await Promise.all([
      tienePermisoModuloComandas(true),
      obtenerMetricasComandas(),
      obtenerComandas({ porPagina: 100 }),
      obtenerPresupuestosAceptadosSinComanda(),
    ])

  return (
    <ComandasView
      comandas={comandas}
      metricas={metricas}
      presupuestosAceptados={presupuestosAceptados}
      puedeGestionar={authEscritura.permitido}
    />
  )
}