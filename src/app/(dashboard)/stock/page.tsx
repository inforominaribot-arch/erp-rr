// Página: /stock
// Módulo de Stock & Inventario

import { tienePermisoModuloStock } from "@/modules/stock/lib/auth"
import {
  obtenerProductos,
  obtenerMovimientosStock,
  obtenerMetricasStock,
  obtenerProveedoresActivos,
} from "@/modules/stock/queries"
import { StockView } from "@/modules/stock/components/stock-view"
import { ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StockPage() {
  const auth = await tienePermisoModuloStock("lectura")

  if (!auth.permitido) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Acceso Restringido al Módulo de Stock
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          {auth.error ||
            "El rol Instalación no tiene permisos para acceder al inventario y materiales del taller."}
        </p>
      </div>
    )
  }

  const [productos, movimientos, metricas, proveedores] = await Promise.all([
    obtenerProductos(undefined, !auth.puedeVerCostos),
    obtenerMovimientosStock(),
    obtenerMetricasStock(!auth.puedeVerCostos),
    obtenerProveedoresActivos(),
  ])

  return (
    <div className="p-6">
      <StockView
        productosIniciales={productos}
        movimientosIniciales={movimientos}
        metricas={metricas}
        proveedores={proveedores}
        puedeAdministrar={auth.puedeAdministrar}
        puedeVerCostos={auth.puedeVerCostos}
        puedeRegistrarRemito={auth.puedeRegistrarRemito}
      />
    </div>
  )
}