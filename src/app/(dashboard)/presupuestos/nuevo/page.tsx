import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { PresupuestoForm } from "@/modules/presupuestos/components/presupuesto-form"
import {
  obtenerClientesParaPresupuesto,
  obtenerListaCalculoRS,
  obtenerTablaMedidaMG,
  obtenerPreciosInsumosPT,
  obtenerTelasTradicional,
} from "@/modules/presupuestos/queries"

export const dynamic = "force-dynamic"

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams?: Promise<{ clienteId?: string; medicionId?: string }>
}) {
  const params = await searchParams
  const [clientes, listaRS, tablaMG, preciosPT, telasTradicional, medicion] = await Promise.all([
    obtenerClientesParaPresupuesto(),
    obtenerListaCalculoRS(),
    obtenerTablaMedidaMG(),
    obtenerPreciosInsumosPT(),
    obtenerTelasTradicional(),
    // "Presupuestar" desde una medición: el cliente es el de la medición
    params?.medicionId && !params.clienteId
      ? prisma.medicion
          .findUnique({ where: { id: params.medicionId }, select: { clienteId: true } })
          .catch(() => null)
      : Promise.resolve(null),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Nuevo Presupuesto"
        descripcion="Armá una cotización seleccionando un cliente o importando directamente las cortinas de una medición"
      />

      <PresupuestoForm
        clientes={clientes}
        clientePreseleccionadoId={params?.clienteId ?? medicion?.clienteId}
        medicionPreseleccionadaId={params?.medicionId}
        listaRS={listaRS}
        tablaMG={tablaMG}
        preciosPT={preciosPT}
        telasTradicional={telasTradicional}
      />
    </div>
  )
}
