import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { MedicionForm } from "@/modules/mediciones/components/medicion-form"
import {
  obtenerMedicionPorId,
  obtenerClientesParaMedicion,
  obtenerTelasParaMedicion,
} from "@/modules/mediciones/queries"
import { TelasListaProvider } from "@/modules/mediciones/components/selector-tela-lista"
import { tienePermisoModuloMediciones } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { medicionTienePresupuestoAceptado } from "@/modules/mediciones/lib/aplicar-cambios-medicion"

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

  const [medicion, clientes, bloqueada, telas] = await Promise.all([
    obtenerMedicionPorId(id),
    obtenerClientesParaMedicion(),
    medicionTienePresupuestoAceptado(prisma, id),
    obtenerTelasParaMedicion(),
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

      <TelasListaProvider telas={telas}>
      <MedicionForm
        clientesIniciales={clientes}
        medicionExistente={medicion}
        modo="editar"
        bloquearAltasBajas={bloqueada}
      />
      </TelasListaProvider>
    </div>
  )
}
