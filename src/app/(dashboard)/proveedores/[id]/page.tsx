// Módulo: Proveedores & Compras
// Página de Ficha Completa del Proveedor (/proveedores/[id])

import { notFound } from "next/navigation"
import { tienePermisoModuloProveedores } from "@/modules/proveedores/lib/auth"
import {
  obtenerProveedorPorId,
  obtenerCatalogoProductosParaCompras,
} from "@/modules/proveedores/queries"
import { ProveedorDetalleView } from "@/modules/proveedores/components/proveedor-detalle-view"
import { ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

interface ProveedorDetallePageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ProveedorDetallePageProps) {
  const { id } = await params
  const res = await obtenerProveedorPorId(id, true)
  if (!res) return { title: "Proveedor no encontrado — ERP RR" }
  return {
    title: `${res.proveedor.nombre} — Proveedores ERP RR`,
    description: `Ficha de proveedor, catálogo provisto e historial de compras de ${res.proveedor.nombre}`,
  }
}

export default async function ProveedorDetallePage({
  params,
}: ProveedorDetallePageProps) {
  const { id } = await params

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

  const [detalle, catalogoProductos] = await Promise.all([
    obtenerProveedorPorId(id, !auth.puedeVerCostos),
    obtenerCatalogoProductosParaCompras(),
  ])

  if (!detalle) {
    notFound()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <ProveedorDetalleView
        proveedor={detalle.proveedor}
        productosProvistos={detalle.productosProvistos}
        ordenesCompra={detalle.ordenesCompra}
        catalogoProductos={catalogoProductos}
        puedeVerCostos={auth.puedeVerCostos}
        puedeAdministrar={auth.puedeAdministrar}
        puedeEmitirOrden={auth.puedeEmitirOrden}
        puedeRecibir={auth.puedeRecibir}
      />
    </div>
  )
}
