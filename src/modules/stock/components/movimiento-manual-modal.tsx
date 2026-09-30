// Módulo: Stock & Inventario
// Modal para Ajustes Manuales y Movimientos de Taller (Mermas, Roturas, Conteo Físico)

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  Loader2,
  ArrowUpDown,
  AlertTriangle,
  Package,
  Layers,
  CheckCircle2,
} from "lucide-react"
import type { IProducto, TipoMovimientoStock } from "../types"
import { registrarMovimientoManual } from "../actions"

interface MovimientoManualModalProps {
  productoInicial?: IProducto | null
  productos: IProducto[]
  abierto: boolean
  onCerrar: () => void
  onCompletado?: () => void
}

const MOTIVOS_SUGERIDOS = [
  "Desperdicio en mesa de corte",
  "Merma de rollo de tela",
  "Rotura de pieza en armado de cortina",
  "Ajuste por conteo físico de taller",
  "Muestra o catálogo para cliente",
  "Recupero de material sobrante",
]

export function MovimientoManualModal({
  productoInicial,
  productos,
  abierto,
  onCerrar,
  onCompletado,
}: MovimientoManualModalProps) {
  const router = useRouter()

  const [productoId, setProductoId] = useState(
    productoInicial?.id || productos[0]?.id || ""
  )
  const [tipo, setTipo] = useState<TipoMovimientoStock>("EGRESO")
  const [cantidad, setCantidad] = useState("1")
  const [motivo, setMotivo] = useState("")

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!abierto) return null

  const prodSeleccionado =
    productos.find((p) => p.id === productoId) || productoInicial

  const stockActual = prodSeleccionado ? prodSeleccionado.stockActual : 0
  const cantNum = Number(cantidad) || 0

  let stockResultante = stockActual
  if (tipo === "INGRESO") {
    stockResultante = stockActual + cantNum
  } else if (tipo === "EGRESO") {
    stockResultante = Math.max(0, stockActual - cantNum)
  } else if (tipo === "AJUSTE") {
    stockResultante = cantNum
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!motivo.trim()) {
      setError("Por favor indicá el motivo del ajuste o movimiento.")
      return
    }

    if (cantNum <= 0 && tipo !== "AJUSTE") {
      setError("La cantidad debe ser mayor a 0.")
      return
    }

    if (tipo === "EGRESO" && cantNum > stockActual) {
      setError(
        `Stock insuficiente: intentás egresar ${cantNum} pero solo hay ${stockActual} ${prodSeleccionado?.unidadMedida}.`
      )
      return
    }

    setCargando(true)

    try {
      const res = await registrarMovimientoManual({
        productoId,
        tipo,
        cantidad: cantNum,
        motivo: motivo.trim(),
      })

      if (!res.success) {
        setError(res.error)
        return
      }

      router.refresh()
      if (onCompletado) onCompletado()
      onCerrar()
    } catch (err: any) {
      setError(err.message || "Error al procesar el movimiento.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <ArrowUpDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Ajuste y Movimiento de Taller
              </h2>
              <p className="text-xs text-slate-500 line-clamp-1">
                Registrá mermas de corte, roturas o balance por conteo físico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto touch-scroll px-4 sm:px-6 py-4 space-y-4 min-h-0">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Selector de Producto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Insumo o Pieza
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `[${p.codigo}] ` : ""}
                  {p.nombre} (Stock actual: {p.stockActual} {p.unidadMedida})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipo("EGRESO")}
                className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition ${
                  tipo === "EGRESO"
                    ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Egreso (Merma)
              </button>
              <button
                type="button"
                onClick={() => setTipo("INGRESO")}
                className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition ${
                  tipo === "INGRESO"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Ingreso Manual
              </button>
              <button
                type="button"
                onClick={() => setTipo("AJUSTE")}
                className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition ${
                  tipo === "AJUSTE"
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Conteo Físico
              </button>
            </div>
          </div>

          {/* Cantidad / Conteo Físico */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                {tipo === "AJUSTE"
                  ? "Stock real contado físicamente:"
                  : tipo === "EGRESO"
                  ? "Cantidad a descontar (merma/rotura):"
                  : "Cantidad a sumar:"}
              </label>
              <span className="text-xs font-mono font-bold text-slate-500">
                {prodSeleccionado?.unidadMedida}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                step="any"
                min="0"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-bold font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Simulación del Stock Resultante */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
              <span className="text-slate-500">Stock Actual: {stockActual}</span>
              <span className="font-semibold text-slate-800">
                Resultado:{" "}
                <span
                  className={
                    stockResultante < stockActual
                      ? "text-red-600 font-bold"
                      : "text-emerald-600 font-bold"
                  }
                >
                  {stockResultante} {prodSeleccionado?.unidadMedida}
                </span>
              </span>
            </div>
          </div>

          {/* Motivo del Ajuste */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Motivo o Justificación <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Desperdicio al cortar el rollo de gaza"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />

            {/* Sugerencias en 1 clic */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MOTIVOS_SUGERIDOS.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 min-h-[32px] text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95"
                >
                  + {m}
                </button>
              ))}
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100 pt-4 pb-1 shrink-0">
            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              className="rounded-xl border border-slate-200 px-4 py-2.5 min-h-[44px] text-xs font-medium text-slate-700 hover:bg-slate-50 transition text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 min-h-[44px] text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {cargando && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
              <span>Confirmar Ajuste</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
