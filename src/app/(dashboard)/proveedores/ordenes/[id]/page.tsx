// Módulo: Proveedores & Compras
// Página de Detalle de Orden de Compra (/proveedores/ordenes/[id])

import { notFound } from "next/navigation"
import { tienePermisoModuloProveedores } from "@/modules/proveedores/lib/auth"
import { obtenerOrdenCompraPorId } from "@/modules/proveedores/queries"
import { OrdenCompraDetalleView } from "@/modules/proveedores/components/orden-compra-detalle-view"
import { ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

interface OrdenCompraDetallePageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    imprimir?: string
  }>
}

export async function generateMetadata({
  params,
}: OrdenCompraDetallePageProps) {
  const { id } = await params
  const oc = await obtenerOrdenCompraPorId(id, true)
  if (!oc) return { title: "Orden de Compra no encontrada — ERP RR" }
  return {
    title: `${oc.numeroFormateado} (${oc.proveedor.nombre}) — ERP RR`,
    description: `Detalle de la orden de compra ${oc.numeroFormateado} para ${oc.proveedor.nombre}`,
  }
}

export default async function OrdenCompraDetallePage({
  params,
  searchParams,
}: OrdenCompraDetallePageProps) {
  const { id } = await params
  const { imprimir } = await searchParams

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
            "Tu rol de usuario no tiene permisos para acceder a esta orden de compra."}
        </p>
      </div>
    )
  }

  const ordenCompra = await obtenerOrdenCompraPorId(id, !auth.puedeVerCostos)

  if (!ordenCompra) {
    notFound()
  }

  const iniciarEnImpresion = imprimir === "true"

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <OrdenCompraDetalleView
        ordenCompra={ordenCompra}
        puedeVerCostos={auth.puedeVerCostos}
        puedeAdministrar={auth.puedeAdministrar}
        puedeRecibir={auth.puedeRecibir}
        iniciarEnImpresion={iniciarEnImpresion}
      />
    </div>
  )
}
