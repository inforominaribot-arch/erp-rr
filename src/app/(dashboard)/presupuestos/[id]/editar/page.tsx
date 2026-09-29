import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { PresupuestoForm } from "@/modules/presupuestos/components/presupuesto-form"
import {
  obtenerPresupuestoPorId,
  obtenerClientesParaPresupuesto,
} from "@/modules/presupuestos/queries"
import { formatearNumeroPresupuesto } from "@/modules/presupuestos/types"

export const dynamic = "force-dynamic"

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [presupuesto, clientes] = await Promise.all([
    obtenerPresupuestoPorId(id),
    obtenerClientesParaPresupuesto(),
  ])

  if (!presupuesto) {
    notFound()
  }

  const numPresupuesto = formatearNumeroPresupuesto(presupuesto.numero)

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Editar Presupuesto ${numPresupuesto}`}
        descripcion={`Modificá los precios, cantidades, descuentos o cortinas del cliente ${presupuesto.cliente.nombre}`}
      />

      <PresupuestoForm
        presupuestoInicial={presupuesto}
        clientes={clientes}
      />
    </div>
  )
}
