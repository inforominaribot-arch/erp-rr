import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { obtenerPresupuestoPorId } from "@/modules/presupuestos/queries"
import { tienePermisoModuloPresupuestos } from "@/modules/presupuestos/lib/auth"
import { PresupuestoDetalle } from "@/modules/presupuestos/components/presupuesto-detalle"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const presupuesto = await obtenerPresupuestoPorId(id)
  if (!presupuesto) {
    return { title: "Presupuesto" }
  }
  const clienteNombre = presupuesto.cliente?.nombre
    ? presupuesto.cliente.nombre.trim()
    : "Cliente"
  return {
    title: `Presupuesto - ${clienteNombre}`,
  }
}

export default async function PresupuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [presupuesto, auth] = await Promise.all([
    obtenerPresupuestoPorId(id),
    tienePermisoModuloPresupuestos(true),
  ])

  if (!presupuesto) {
    notFound()
  }

  return (
    <PresupuestoDetalle
      presupuesto={presupuesto}
      puedeEditar={auth.permitido}
    />
  )
}
