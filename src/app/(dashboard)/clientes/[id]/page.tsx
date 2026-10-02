import { notFound } from "next/navigation"
import { obtenerClientePorId } from "@/modules/clientes/queries"
import { ClienteDetalleHeader } from "@/modules/clientes/components/cliente-detalle-header"
import { ClienteHistorial } from "@/modules/clientes/components/cliente-historial"
import type { ICliente, IMedicionResumen, IPresupuestoResumen } from "@/modules/clientes/types"

export const dynamic = "force-dynamic"

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cliente = await obtenerClientePorId(id)

  if (!cliente) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Cabecera del Cliente con datos de contacto y estado */}
      <ClienteDetalleHeader cliente={cliente as unknown as ICliente} />

      {/* Historial de Trabajos: Visitas, Mediciones, Presupuestos y Comandas */}
      <ClienteHistorial
        clienteId={cliente.id}
        visitas={(cliente as any).visitas || []}
        mediciones={cliente.mediciones as unknown as IMedicionResumen[]}
        presupuestos={cliente.presupuestos as unknown as IPresupuestoResumen[]}
      />
    </div>
  )
}
