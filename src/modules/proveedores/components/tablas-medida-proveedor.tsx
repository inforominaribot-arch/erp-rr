"use client"

// Ficha del proveedor: resumen de sus tablas de precios por medida (ancho × alto, ej: mosquiteros MagicRoll).
// Se cargan con scripts/importar-tablas-medida.mjs; acá se ven y se recalculan los presupuestos abiertos.

import { useState, useTransition } from "react"
import { Grid3x3, Loader2, RefreshCw, Check, AlertCircle } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import { recalcularPresupuestosConListaAction } from "@/modules/presupuestos/actions"
import type { IResumenTablaMedida } from "../types"

export function TablasMedidaProveedor({ tablas }: { tablas: IResumenTablaMedida[] }) {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recalculando, setRecalculando] = useState(false)
  const [, startTransition] = useTransition()

  const vigencia = tablas.find((t) => t.vigencia)?.vigencia

  function recalcular() {
    setError(null)
    setMensaje(null)
    setRecalculando(true)
    startTransition(async () => {
      const res = await recalcularPresupuestosConListaAction()
      setRecalculando(false)
      if (!res.success) {
        setError(res.error || "No se pudieron recalcular los presupuestos.")
        return
      }
      const { filasActualizadas, filasManuales } = res.data
      setMensaje(
        (filasActualizadas === 0
          ? "Ningún presupuesto abierto cambió de precio."
          : `Se actualizó el precio de ${filasActualizadas} ítem(s) en presupuestos abiertos.`) +
          (filasManuales > 0 ? ` ${filasManuales} fila(s) con precio corregido a mano no se tocaron.` : "")
      )
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Grid3x3 className="h-4 w-4 text-indigo-600" />
            Tablas de Precios por Medida {vigencia ? `— ${vigencia}` : ""}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Precio según ancho × alto (IVA incluido). En el presupuesto se le suma el 25%.
          </p>
        </div>
        <button
          type="button"
          onClick={recalcular}
          disabled={recalculando}
          title="Actualiza los presupuestos no aceptados con los precios vigentes (después de importar tablas nuevas)"
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs disabled:opacity-50 shrink-0"
        >
          {recalculando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Recalcular presupuestos abiertos
        </button>
      </div>

      {mensaje && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <Check className="h-4 w-4 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
              <th className="py-2 px-2 font-bold">Modelo</th>
              <th className="py-2 px-2 font-bold">Tabla</th>
              <th className="py-2 px-2 font-bold text-center">Ancho (mm)</th>
              <th className="py-2 px-2 font-bold text-center">Alto (mm)</th>
              <th className="py-2 px-2 font-bold text-center">Cajón</th>
              <th className="py-2 px-2 font-bold text-right">Precios</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tablas.map((t) => (
              <tr key={`${t.modelo}-${t.tabla}`}>
                <td className="py-2 px-2 font-bold text-slate-900">{t.nombreModelo}</td>
                <td className="py-2 px-2 text-slate-600">
                  {t.tabla} · {t.celdas} medidas
                </td>
                <td className="py-2 px-2 text-center font-mono text-slate-700">
                  {t.anchoMin} – {t.anchoMax}
                </td>
                <td className="py-2 px-2 text-center font-mono text-slate-700">
                  {t.altoMin} – {t.altoMax}
                </td>
                <td className="py-2 px-2 text-center text-slate-700">{t.cajones.join(" / ") || "—"}</td>
                <td className="py-2 px-2 text-right font-mono text-slate-900">
                  {t.precioMin === t.precioMax
                    ? formatearPrecio(t.precioMin)
                    : `${formatearPrecio(t.precioMin)} a ${formatearPrecio(t.precioMax)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
