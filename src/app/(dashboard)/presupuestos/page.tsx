import Link from "next/link"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { PresupuestoTabla } from "@/modules/presupuestos/components/presupuesto-tabla"
import {
  obtenerPresupuestos,
  obtenerMetricasPresupuestos,
} from "@/modules/presupuestos/queries"
import { tienePermisoModuloPresupuestos } from "@/modules/presupuestos/lib/auth"
import {
  Plus,
  FileText,
  Send,
  CheckCheck,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { formatearPrecio } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function PresupuestosPage() {
  const [auth, metricas, { presupuestos }] = await Promise.all([
    tienePermisoModuloPresupuestos(true),
    obtenerMetricasPresupuestos(),
    obtenerPresupuestos({ porPagina: 100 }),
  ])

  const puedeEscribir = auth.permitido

  return (
    <div className="space-y-6">
      {/* ── Encabezado Principal ── */}
      <PageHeader
        titulo="Presupuestos & Cotizaciones"
        descripcion="Cotización ágil de cortinas a medida, integración de fórmulas de taller y gestión de ciclo comercial"
      >
        {puedeEscribir && (
          <Link
            href="/presupuestos/nuevo"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo Presupuesto
          </Link>
        )}
      </PageHeader>

      {/* ── Métricas Superiores ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Cotizaciones */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Presupuestos
            </span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {metricas.totalPresupuestos}
          </p>
          <span className="text-[11px] text-slate-400">
            {metricas.borradores} en borrador
          </span>
        </div>

        {/* Enviados */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Enviados / Negociación
            </span>
            <Send className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-950">
            {metricas.enviados}
          </p>
          <span className="text-[11px] text-blue-600/80">
            Esperando respuesta
          </span>
        </div>

        {/* Aceptados */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Aceptados ({metricas.tasaConversion}%)
            </span>
            <CheckCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-950">
            {metricas.aceptados}
          </p>
          <span className="text-[11px] text-emerald-700/80">
            Total y Parcial aprobados
          </span>
        </div>

        {/* Monto Aceptado / En Producción */}
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Monto Aprobado
            </span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-indigo-950 font-mono">
            {formatearPrecio(metricas.montoTotalAceptado)}
          </p>
          <span className="text-[11px] text-indigo-600/80">
            De {formatearPrecio(metricas.montoTotalPresupuestado)} cotizados
          </span>
        </div>
      </div>

      {/* ── Tabla de Presupuestos ── */}
      <PresupuestoTabla
        presupuestosIniciales={presupuestos}
        puedeEditar={puedeEscribir}
      />
    </div>
  )
}