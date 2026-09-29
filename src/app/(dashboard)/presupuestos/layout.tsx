import { tienePermisoModuloPresupuestos } from "@/modules/presupuestos/lib/auth"
import Link from "next/link"
import { ShieldAlert, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PresupuestosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await tienePermisoModuloPresupuestos(false)

  if (!auth.permitido) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Acceso Restringido
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Tu rol actual ({auth.rol || "Sin rol"}) no posee permisos para acceder
          al módulo de <strong>Presupuestos y Cotizaciones</strong>.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Inicio
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
