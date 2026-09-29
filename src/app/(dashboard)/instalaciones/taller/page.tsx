// Página: /instalaciones/taller
// Tablero de Preparación de Materiales para Taller (Próximos 7 días)

import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Factory } from "lucide-react"
import { obtenerUsuarioActual } from "@/lib/auth"
import {
  obtenerInstalacionesTaller,
  obtenerInstaladoresDisponibles,
  obtenerBloqueosAgenda,
} from "@/modules/instalaciones/queries"
import { InstalacionesTallerTablero } from "@/modules/instalaciones/components/instalaciones-taller-tablero"

export const dynamic = "force-dynamic"

export default async function InstalacionesTallerPage() {
  const usuario = await obtenerUsuarioActual()

  // Control de roles: solo Admin General, Administración y Taller
  if (usuario && usuario.rol === "INSTALACION") {
    redirect("/instalaciones")
  }

  const [instalaciones, instaladores, bloqueos] = await Promise.all([
    obtenerInstalacionesTaller(7),
    obtenerInstaladoresDisponibles(),
    obtenerBloqueosAgenda(),
  ])

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/instalaciones"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-indigo-600" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Taller — Preparación de Salidas
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Control de embalaje y confirmación de cortinas para las instalaciones de los próximos 7 días
            </p>
          </div>
        </div>
      </div>

      <InstalacionesTallerTablero
        instalaciones={instalaciones}
        instaladores={instaladores}
        bloqueos={bloqueos}
      />
    </div>
  )
}
