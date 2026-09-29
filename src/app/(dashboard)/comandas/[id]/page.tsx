import { notFound } from "next/navigation"
import { obtenerComandaPorId } from "@/modules/comandas/queries"
import { tienePermisoModuloComandas } from "@/modules/comandas/lib/auth"
import { ComandaDetalle } from "@/modules/comandas/components/comanda-detalle"
import { AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

interface ComandaDetallePageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    imprimir?: string
  }>
}

export default async function ComandaDetallePage({
  params,
  searchParams,
}: ComandaDetallePageProps) {
  const { id } = await params
  const { imprimir } = await searchParams

  const auth = await tienePermisoModuloComandas(false)

  if (!auth.permitido) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3 border border-rose-200">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Acceso Restringido</h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          {auth.error || "No tenés permisos para ver esta comanda."}
        </p>
      </div>
    )
  }

  const [authEscritura, comanda] = await Promise.all([
    tienePermisoModuloComandas(true),
    obtenerComandaPorId(id),
  ])

  if (!comanda) {
    notFound()
  }

  const iniciarEnImpresion = imprimir === "true"

  return (
    <ComandaDetalle
      comanda={comanda}
      puedeEditar={authEscritura.permitido}
      iniciarEnImpresion={iniciarEnImpresion}
    />
  )
}
