import { PageHeader } from "@/components/shared/layout/PageHeader"
import {
  obtenerItemsProduccion,
  obtenerMetricasProduccion,
} from "@/modules/comandas/queries"
import { tienePermisoModuloProduccion } from "@/modules/comandas/lib/auth"
import { ProduccionTablero } from "@/modules/comandas/components/produccion-tablero"
import { AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProduccionPage() {
  const auth = await tienePermisoModuloProduccion()

  if (!auth.permitido) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3 border border-rose-200">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acceso Restringido</h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          {auth.error || "No tenés permisos para acceder al tablero de producción."}
        </p>
      </div>
    )
  }

  const [metricas, items] = await Promise.all([
    obtenerMetricasProduccion(),
    obtenerItemsProduccion(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Tablero de Producción"
        descripcion="Seguimiento táctil para taller: corte, confección, armado y control de pedidos a proveedores"
      />

      <ProduccionTablero
        itemsIniciales={items}
        metricasIniciales={metricas}
        puedeGestionar={true}
      />
    </div>
  )
}