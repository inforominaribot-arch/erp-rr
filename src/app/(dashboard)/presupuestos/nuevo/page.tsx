import { PageHeader } from "@/components/shared/layout/PageHeader"
import { PresupuestoForm } from "@/modules/presupuestos/components/presupuesto-form"
import {
  obtenerClientesParaPresupuesto,
  obtenerListaCalculoRS,
} from "@/modules/presupuestos/queries"

export const dynamic = "force-dynamic"

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams?: Promise<{ clienteId?: string; medicionId?: string }>
}) {
  const params = await searchParams
  const [clientes, listaRS] = await Promise.all([
    obtenerClientesParaPresupuesto(),
    obtenerListaCalculoRS(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Nuevo Presupuesto"
        descripcion="Armá una cotización seleccionando un cliente o importando directamente las cortinas de una medición"
      />

      <PresupuestoForm
        clientes={clientes}
        clientePreseleccionadoId={params?.clienteId}
        medicionPreseleccionadaId={params?.medicionId}
        listaRS={listaRS}
      />
    </div>
  )
}
