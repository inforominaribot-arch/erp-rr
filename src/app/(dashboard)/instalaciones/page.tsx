// Página principal: /instalaciones
// Calendario Interactivo, KPIs y Drawer de Comandas Pendientes

import { obtenerUsuarioActual } from "@/lib/auth"
import {
  obtenerInstalaciones,
  obtenerComandasPendientesAgendar,
  obtenerInstaladoresDisponibles,
  obtenerBloqueosAgenda,
  obtenerMetricasAgenda,
} from "@/modules/instalaciones/queries"
import { InstalacionesView } from "@/modules/instalaciones/components/instalaciones-view"

export const dynamic = "force-dynamic"

export default async function InstalacionesPage() {
  const [
    usuario,
    instalaciones,
    comandasPendientes,
    instaladores,
    bloqueos,
    metricas,
  ] = await Promise.all([
    obtenerUsuarioActual(),
    obtenerInstalaciones(),
    obtenerComandasPendientesAgendar(),
    obtenerInstaladoresDisponibles(),
    obtenerBloqueosAgenda(),
    obtenerMetricasAgenda(),
  ])

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <InstalacionesView
        instalaciones={instalaciones}
        comandasPendientes={comandasPendientes}
        instaladores={instaladores}
        bloqueos={bloqueos}
        metricas={metricas}
        usuarioActualId={usuario?.id}
        rolUsuario={usuario?.rol}
      />
    </div>
  )
}