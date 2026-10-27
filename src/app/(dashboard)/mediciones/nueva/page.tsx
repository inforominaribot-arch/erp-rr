import { PageHeader } from "@/components/shared/layout/PageHeader"
import { MedicionForm } from "@/modules/mediciones/components/medicion-form"
import {
  obtenerClientesParaMedicion,
  obtenerTelasParaMedicion,
} from "@/modules/mediciones/queries"
import { TelasListaProvider } from "@/modules/mediciones/components/selector-tela-lista"
import { tienePermisoModuloMediciones } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function NuevaMedicionPage({
  searchParams,
}: {
  searchParams?: Promise<{ clienteId?: string }>
}) {
  const auth = await tienePermisoModuloMediciones(true)
  if (!auth.permitido) {
    redirect("/mediciones")
  }

  const params = await searchParams
  const clienteIdParam = params?.clienteId

  const [clientes, telas] = await Promise.all([
    obtenerClientesParaMedicion(),
    obtenerTelasParaMedicion(),
  ])

  // Si vino un clienteId por URL, preparar objeto inicial con ese cliente
  const clienteInicial = clienteIdParam
    ? clientes.find((c) => c.id === clienteIdParam)
    : null

  const medicionInicial = clienteInicial
    ? ({
        cliente: clienteInicial,
        ambientes: [],
      } as any)
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Nueva Medición en Obra"
        descripcion="Relevá aberturas, ambientes, telas y especificaciones técnicas para presupuesto y confección"
      />

      <TelasListaProvider telas={telas}>
      <MedicionForm
        clientesIniciales={clientes}
        medicionExistente={medicionInicial}
        modo="crear"
      />
      </TelasListaProvider>
    </div>
  )
}
