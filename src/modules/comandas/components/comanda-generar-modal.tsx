"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  ClipboardList,
  Loader2,
  Calendar,
  AlertCircle,
  Scissors,
  Truck,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import type { IPresupuestoAceptadoResumen, TipoItemComanda } from "../types"
import { generarComandaDesdePresupuesto } from "../actions"
import { formatearPrecio } from "@/lib/utils"

interface ComandaGenerarModalProps {
  abierto: boolean
  onCerrar: () => void
  presupuestosAceptados: IPresupuestoAceptadoResumen[]
  presupuestoPreseleccionadoId?: string
}

export function ComandaGenerarModal({
  abierto,
  onCerrar,
  presupuestosAceptados,
  presupuestoPreseleccionadoId,
}: ComandaGenerarModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [presupuestoId, setPresupuestoId] = useState<string>(
    presupuestoPreseleccionadoId ||
      (presupuestosAceptados.length > 0 ? presupuestosAceptados[0].id : "")
  )

  const [fechaEntrega, setFechaEntrega] = useState<string>("")
  const [notas, setNotas] = useState<string>("")

  // Clasificación por ítem: { [itemId]: { tipo: "FABRICAR" | "PEDIR_PROVEEDOR", observaciones: string } }
  const [clasificaciones, setClasificaciones] = useState<
    Record<string, { tipo: TipoItemComanda; observaciones: string }>
  >({})

  const presupuestoSeleccionado = presupuestosAceptados.find(
    (p) => p.id === presupuestoId
  )

  function handleSetTipo(itemId: string, tipo: TipoItemComanda) {
    setClasificaciones((prev) => ({
      ...prev,
      [itemId]: {
        tipo,
        observaciones: prev[itemId]?.observaciones || "",
      },
    }))
  }

  function handleSetObservacion(itemId: string, observaciones: string) {
    setClasificaciones((prev) => ({
      ...prev,
      [itemId]: {
        tipo: prev[itemId]?.tipo || "FABRICAR",
        observaciones,
      },
    }))
  }

  async function handleConfirmar() {
    if (!presupuestoId) {
      setError("Debés seleccionar un presupuesto aprobado.")
      return
    }

    setError(null)

    startTransition(async () => {
      // Construir array de clasificación
      const itemsClasificacion = (presupuestoSeleccionado?.itemsAceptados || []).map(
        (it) => ({
          itemPresupuestoId: it.id,
          tipo: clasificaciones[it.id]?.tipo || ("FABRICAR" as TipoItemComanda),
          observaciones: clasificaciones[it.id]?.observaciones || null,
        })
      )

      const res = await generarComandaDesdePresupuesto({
        presupuestoId,
        fechaEntrega: fechaEntrega ? fechaEntrega : null,
        notas: notas.trim() ? notas.trim() : null,
        itemsClasificacion,
      })

      if (!res.success) {
        setError(res.error || "Ocurrió un error al generar la comanda.")
        return
      }

      onCerrar()
      router.push(`/comandas/${res.data.id}`)
      router.refresh()
    })
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Generar Comanda de Trabajo
              </h3>
              <p className="text-xs text-slate-500">
                Pase a producción de presupuesto aceptado para confección y armado en taller
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Presupuesto */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Presupuesto Aceptado
            </label>
            {presupuestosAceptados.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="text-xs font-medium text-amber-800">
                  No hay presupuestos aceptados pendientes de generar comanda.
                </p>
                <p className="text-[11px] text-amber-600 mt-1">
                  Aprobá un presupuesto en el módulo de Presupuestos para emitir su comanda.
                </p>
              </div>
            ) : (
              <select
                value={presupuestoId}
                onChange={(e) => setPresupuestoId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {presupuestosAceptados.map((p) => (
                  <option key={p.id} value={p.id}>
                    #PRE-{String(p.numero).padStart(4, "0")} — {p.cliente.nombre}{" "}
                    ({p.itemsAceptados.length} cortinas aceptadas) —{" "}
                    {formatearPrecio(p.total)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {presupuestoSeleccionado && (
            <>
              {/* Resumen del Cliente */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-700">Cliente: </span>
                  <span className="text-slate-900 font-semibold">
                    {presupuestoSeleccionado.cliente.nombre}
                  </span>
                  {presupuestoSeleccionado.cliente.direccion && (
                    <span className="text-slate-500 ml-2">
                      ({presupuestoSeleccionado.cliente.direccion}
                      {presupuestoSeleccionado.cliente.localidad
                        ? `, ${presupuestoSeleccionado.cliente.localidad}`
                        : ""}
                      )
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Total Presupuesto:{" "}
                  <strong className="text-slate-800 font-mono">
                    {formatearPrecio(presupuestoSeleccionado.total)}
                  </strong>
                </div>
              </div>

              {/* Fecha de Entrega y Notas Generales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Fecha de Entrega Estimada
                  </label>
                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instrucciones / Observaciones Generales
                  </label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej. Prioridad alta / Cliente retira por taller..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Lista de Ítems y Clasificación Operativa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Clasificación de Cortinas para Taller (
                    {presupuestoSeleccionado.itemsAceptados.length})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Fabricar en taller vs Pedir a proveedor
                  </span>
                </div>

                <div className="space-y-2">
                  {presupuestoSeleccionado.itemsAceptados.map((it) => {
                    const tipoActual =
                      clasificaciones[it.id]?.tipo || "FABRICAR"
                    const obsActual =
                      clasificaciones[it.id]?.observaciones || ""

                    return (
                      <div
                        key={it.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                                {it.ambiente}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">
                                {it.descripcion}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              {it.ancho}m ancho × {it.alto}m alto • Cant:{" "}
                              {it.cantidad}
                            </div>
                          </div>

                          {/* Selector de Clasificación: FABRICAR vs PEDIR_PROVEEDOR */}
                          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetTipo(it.id, "FABRICAR")}
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                                tipoActual === "FABRICAR"
                                  ? "bg-indigo-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <Scissors className="h-3 w-3" />
                              Fabricar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSetTipo(it.id, "PEDIR_PROVEEDOR")
                              }
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                                tipoActual === "PEDIR_PROVEEDOR"
                                  ? "bg-amber-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <Truck className="h-3 w-3" />
                              Pedir Proveedor
                            </button>
                          </div>
                        </div>

                        {/* Input para notas técnicas adicionales de taller si hace falta */}
                        <input
                          type="text"
                          value={obsActual}
                          onChange={(e) =>
                            handleSetObservacion(it.id, e.target.value)
                          }
                          placeholder="Ajuste o nota para este ítem (opcional)..."
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-[11px] text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onCerrar}
            disabled={isPending}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isPending || !presupuestoSeleccionado}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando Comanda...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Generar Comanda de Trabajo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
