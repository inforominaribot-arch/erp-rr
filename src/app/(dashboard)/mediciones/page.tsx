import Link from "next/link"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { MedicionClientesGrid } from "@/modules/mediciones/components/medicion-clientes-grid"
import { MedicionTabla } from "@/modules/mediciones/components/medicion-tabla"
import { NetworkStatusBar } from "@/modules/mediciones/components/network-status-bar"
import {
  obtenerMediciones,
  obtenerClientesConMediciones,
  obtenerMetricasMediciones,
} from "@/modules/mediciones/queries"
import { tienePermisoModuloMediciones } from "@/lib/auth"
import {
  Plus,
  Ruler,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  List,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MedicionesPage({
  searchParams,
}: {
  searchParams?: Promise<{ vista?: string }>
}) {
  const params = await searchParams
  const vistaActual = params?.vista === "tabla" ? "tabla" : "clientes"

  const [auth, metricas, { mediciones }, clientesConMediciones] =
    await Promise.all([
      tienePermisoModuloMediciones(true),
      obtenerMetricasMediciones(),
      obtenerMediciones({ porPagina: 100 }),
      obtenerClientesConMediciones(),
    ])

  const puedeEscribir = auth.permitido

  return (
    <div className="space-y-6">
      {/* ── Encabezado Principal ── */}
      <PageHeader
        titulo="App Medición (PWA)"
        descripcion="Relevamiento de medidas en obra, ambientes, especificaciones técnicas y esquemas conceptuales"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Vistas */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <Link
              href="/mediciones?vista=clientes"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                vistaActual === "clientes"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Por Clientes
            </Link>
            <Link
              href="/mediciones?vista=tabla"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                vistaActual === "tabla"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Listado
            </Link>
          </div>

          {puedeEscribir && (
            <Link
              href="/mediciones/nueva"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              Nueva Medición
            </Link>
          )}
        </div>
      </PageHeader>

      {/* ── Barra de Estado de Red y Sincronización Offline ── */}
      <NetworkStatusBar />

      {/* ── Métricas Rápidas ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Mediciones */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Mediciones
            </span>
            <Ruler className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {metricas.total}
          </p>
        </div>

        {/* Sincronizadas */}
        <div className="rounded-2xl border border-green-200/80 bg-green-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
              Sincronizadas
            </span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-green-950">
            {metricas.sincronizadas}
          </p>
        </div>

        {/* Pendientes de Sync */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Pendientes Sync
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-950">
            {metricas.pendientes}
          </p>
        </div>

        {/* Total Aberturas / Cortinas */}
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Total Cortinas Relevadas
            </span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-950">
            {metricas.totalAberturas}
          </p>
        </div>
      </div>

      {/* ── Contenido Principal según Vista ── */}
      {vistaActual === "clientes" ? (
        <MedicionClientesGrid clientes={clientesConMediciones} />
      ) : (
        <MedicionTabla
          medicionesIniciales={mediciones}
          puedeEditar={puedeEscribir}
        />
      )}
    </div>
  )
}