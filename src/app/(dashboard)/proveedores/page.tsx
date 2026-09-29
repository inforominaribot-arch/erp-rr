// Módulo: Proveedores & Compras
// Página Principal del Dashboard (/proveedores)

import { tienePermisoModuloProveedores } from "@/modules/proveedores/lib/auth"
import {
  obtenerProveedores,
  obtenerOrdenesCompra,
  obtenerMetricasProveedoresYCompras,
  obtenerSugerenciasReposicion,
  obtenerCatalogoProductosParaCompras,
} from "@/modules/proveedores/queries"
import { ProveedoresView } from "@/modules/proveedores/components/proveedores-view"
import { ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Proveedores & Compras — ERP RR",
  description: "Directorio de proveedores, órdenes de compra y reposición de stock",
}

export default async function ProveedoresPage() {
  const auth = await tienePermisoModuloProveedores("lectura")

  if (!auth.permitido) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Acceso Restringido</h2>
        <p className="mt-1 max-w-md text-xs text-slate-500">
          {auth.error ||
            "Tu rol de usuario no tiene permisos para acceder al módulo de Proveedores y Compras."}
        </p>
      </div>
    )
  }

  // Cargar datos en paralelo para máximo rendimiento
  const [
    proveedores,
    ordenesCompra,
    metricas,
    { sugerencias, porProveedor },
    catalogoProductos,
  ] = await Promise.all([
    obtenerProveedores(),
    obtenerOrdenesCompra(undefined, !auth.puedeVerCostos),
    obtenerMetricasProveedoresYCompras(),
    obtenerSugerenciasReposicion(),
    obtenerCatalogoProductosParaCompras(),
  ])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <ProveedoresView
        proveedores={proveedores}
        ordenesCompra={ordenesCompra}
        metricas={metricas}
        sugerencias={sugerencias}
        sugerenciasPorProveedor={porProveedor}
        catalogoProductos={catalogoProductos}
        puedeVerCostos={auth.puedeVerCostos}
        puedeAdministrar={auth.puedeAdministrar}
        puedeEmitirOrden={auth.puedeEmitirOrden}
        puedeRecibir={auth.puedeRecibir}
      />
    </div>
  )
}