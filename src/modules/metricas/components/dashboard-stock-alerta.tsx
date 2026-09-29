// Componente: Mosaico de productos con stock en alerta para reposición inmediata

import Link from "next/link"
import { Package, AlertTriangle, ArrowRight, PlusCircle, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IStockAlertaDashboard } from "../types"

interface DashboardStockAlertaProps {
  productos: IStockAlertaDashboard[]
}

export function DashboardStockAlerta({ productos }: DashboardStockAlertaProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Stock crítico & alertas</h2>
            <p className="text-xs text-slate-500">Insumos bajo mínimo para reposición</p>
          </div>
        </div>
        <Link
          href="/stock"
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Ir a inventario
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-4">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-10 w-10 text-emerald-200" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              Niveles de stock óptimos 🎉
            </p>
            <p className="text-xs text-slate-400">
              No hay insumos por debajo del mínimo en este momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {productos.map((prod) => {
              const esAgotado = prod.estadoCritico === "AGOTADO"
              const esCritico = prod.estadoCritico === "CRITICO"

              return (
                <div
                  key={prod.id}
                  className={cn(
                    "flex flex-col justify-between rounded-lg border p-3 transition-colors",
                    esAgotado
                      ? "border-rose-200 bg-rose-50/40"
                      : esCritico
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-slate-200 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {prod.nombre}
                      </p>
                      {prod.codigo && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          {prod.codigo}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        esAgotado
                          ? "bg-rose-100 text-rose-800"
                          : esCritico
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                      )}
                    >
                      {prod.estadoCritico}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between pt-2 border-t border-slate-100">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-900">
                          {prod.stockActual}
                        </span>
                        <span className="text-xs text-slate-500">
                          {prod.unidadMedida}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Mínimo: {prod.stockMinimo} {prod.unidadMedida}
                      </p>
                    </div>

                    <Link
                      href="/proveedores"
                      title="Crear orden de reposición"
                      className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-white px-2 py-1 text-[11px] font-medium text-indigo-600 shadow-2xs hover:bg-indigo-50 transition-colors"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Reponer
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
