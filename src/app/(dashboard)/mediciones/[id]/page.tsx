import { notFound } from "next/navigation"
import { obtenerMedicionPorId } from "@/modules/mediciones/queries"
import { MedicionDetalle } from "@/modules/mediciones/components/medicion-detalle"
import { tienePermisoModuloMediciones } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function MedicionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [medicion, auth] = await Promise.all([
    obtenerMedicionPorId(id),
    tienePermisoModuloMediciones(true),
  ])

  if (!medicion) {
    notFound()
  }

  const puedeEditar = auth.permitido
  const rolUsuario = auth.rol || "ADMIN_GENERAL"

  return (
    <div className="space-y-6">
      <MedicionDetalle
        medicion={medicion}
        rolUsuario={rolUsuario}
        puedeEditar={puedeEditar}
      />
    </div>
  )
}
