import { PageHeader } from "@/components/shared/layout/PageHeader"
import { PresupuestoForm } from "@/modules/presupuestos/components/presupuesto-form"
import { obtenerClientesParaPresupuesto } from "@/modules/presupuestos/queries"

export const dynamic = "force-dynamic"

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams?: Promise<{ clienteId?: string; medicionId?: string }>
}) {
  const params = await searchParams
  const clientes = await obtenerClientesParaPresupuesto()

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
      />
    </div>
  )
}
