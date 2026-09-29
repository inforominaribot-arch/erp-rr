// Componente: Vista Operativa del Dashboard para Rol TALLER
// Foco 100% en corte, confección, materiales de mañana y stock crítico sin números financieros

import Link from "next/link"
import {
  Scissors,
  CheckCircle2,
  Clock,
  Package,
  Calendar,
  ArrowRight,
  AlertCircle,
  Factory,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { IDashboardOperativoData } from "../types"

interface DashboardTallerViewProps {
  data: IDashboardOperativoData
}

export function DashboardTallerView({ data }: DashboardTallerViewProps) {
  const tallerData = data.tallerData
  const comandasHoy = tallerData?.comandasHoy || []
  const materialesManana = tallerData?.materialesManana || []

  return (
    <div className="space-y-6">
      {/* KPIs Operativos de Taller */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Factory className="h-5 w-5 text-amber-600" />
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              En mesa
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {data.kpis.comandasActivas.enTaller}
            </p>
            <p className="text-sm font-medium text-slate-700">
              Comandas en producción
            </p>
            <p className="text-xs text-slate-400">Trabajos activos en taller</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50">
              <Clock className="h-5 w-5 text-sky-600" />
            </div>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
              Fábrica
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {data.kpis.comandasActivas.esperandoProveedor}
            </p>
            <p className="text-sm font-medium text-slate-700">
              Esperando fábrica/proveedor
            </p>
            <p className="text-xs text-slate-400">Rollers / Mecanismos pedidos</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Salidas
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {data.kpis.instalacionesSemana.total}
            </p>
            <p className="text-sm font-medium text-slate-700">
              Instalaciones esta semana
            </p>
            <p className="text-xs text-emerald-600 font-medium">
              {data.kpis.instalacionesSemana.listasParaInstalar} paquetes listos
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm ring-1 ring-red-100">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 animate-pulse">
              Alerta
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-slate-900">
              {data.kpis.stockCritico.total}
            </p>
            <p className="text-sm font-medium text-slate-700">
              Insumos bajo mínimo
            </p>
            <p className="text-xs text-red-600">Requiere pedido a compras</p>
          </div>
        </div>
      </div>

      {/* Grid Principal Taller */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Comandas activas en mesa de confección */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Scissors className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Comandas a confeccionar</h2>
                <p className="text-xs text-slate-500">Corte & armado en taller</p>
              </div>
            </div>
            <Link
              href="/produccion"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Ir a Producción
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {comandasHoy.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No hay comandas activas pendientes en taller
              </div>
            ) : (
              comandasHoy.map((c) => (
                <div key={c.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/comandas/${c.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        Comanda #{c.numero} — {c.cliente}
                      </Link>
                      {c.fechaEntrega && (
                        <p className="text-xs text-slate-400">
                          Entrega: {new Date(c.fechaEntrega).toLocaleDateString("es-AR")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-indigo-600">
                      {c.porcentajeAvance}% listo
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${c.porcentajeAvance}%` }}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className={cn(
                          "rounded px-2 py-0.5 text-[11px] font-medium",
                          item.completado
                            ? "bg-emerald-50 text-emerald-700 line-through"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {item.descripcion} ({item.ancho}×{item.alto}m)
                      </span>
                    ))}
                    {c.items.length > 3 && (
                      <span className="text-[11px] text-slate-400 py-0.5">
                        +{c.items.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Materiales a preparar para mañana */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Salidas de mañana</h2>
                <p className="text-xs text-slate-500">
                  Verificar embalaje & accesorios
                </p>
              </div>
            </div>
            <Link
              href="/instalaciones/taller"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Tablero Taller
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {materialesManana.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No hay instalaciones programadas para mañana
              </div>
            ) : (
              materialesManana.map((mat) => (
                <div
                  key={mat.instalacionId}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {mat.cliente}
                    </p>
                    <p className="text-xs text-slate-400">
                      Comanda #{mat.comandaNumero} {mat.horaInicio ? `• ${mat.horaInicio} hs` : ""}
                    </p>
                  </div>

                  {mat.materialesListos ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Embalado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      Falta embalar
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
