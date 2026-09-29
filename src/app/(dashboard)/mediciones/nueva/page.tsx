import { PageHeader } from "@/components/shared/layout/PageHeader"
import { MedicionForm } from "@/modules/mediciones/components/medicion-form"
import { obtenerClientesParaMedicion } from "@/modules/mediciones/queries"
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

  const clientes = await obtenerClientesParaMedicion()

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

      <MedicionForm
        clientesIniciales={clientes}
        medicionExistente={medicionInicial}
        modo="crear"
      />
    </div>
  )
}
