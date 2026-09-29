import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { MedicionForm } from "@/modules/mediciones/components/medicion-form"
import {
  obtenerMedicionPorId,
  obtenerClientesParaMedicion,
} from "@/modules/mediciones/queries"
import { tienePermisoModuloMediciones } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function EditarMedicionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const auth = await tienePermisoModuloMediciones(true)
  if (!auth.permitido) {
    redirect("/mediciones")
  }

  const { id } = await params

  const [medicion, clientes] = await Promise.all([
    obtenerMedicionPorId(id),
    obtenerClientesParaMedicion(),
  ])

  if (!medicion) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Editar Medición — ${medicion.cliente?.nombre || ""}`}
        descripcion="Modificá las aberturas, ambientes o especificaciones técnicas del relevamiento"
      />

      <MedicionForm
        clientesIniciales={clientes}
        medicionExistente={medicion}
        modo="editar"
      />
    </div>
  )
}
