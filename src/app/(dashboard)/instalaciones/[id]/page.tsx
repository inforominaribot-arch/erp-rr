// Página: /instalaciones/[id]
// Ficha Técnica de Instalación y Hoja de Colocación A4

import { notFound } from "next/navigation"
import {
  obtenerInstalacionPorId,
  obtenerInstaladoresDisponibles,
  obtenerBloqueosAgenda,
} from "@/modules/instalaciones/queries"
import { InstalacionDetalleView } from "@/modules/instalaciones/components/instalacion-detalle-view"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InstalacionDetallePage({ params }: Props) {
  const { id } = await params

  const [instalacion, instaladores, bloqueos] = await Promise.all([
    obtenerInstalacionPorId(id),
    obtenerInstaladoresDisponibles(),
    obtenerBloqueosAgenda(),
  ])

  if (!instalacion) {
    notFound()
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <InstalacionDetalleView
        instalacion={instalacion}
        instaladores={instaladores}
        bloqueos={bloqueos}
      />
    </div>
  )
}
