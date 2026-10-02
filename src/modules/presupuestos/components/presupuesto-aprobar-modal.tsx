"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  CheckCircle2,
  CheckCheck,
  Send,
  XCircle,
  FileEdit,
  Loader2,
  Check,
  AlertCircle,
  Package,
  Layers,
  Ruler,
  AlertTriangle,
} from "lucide-react"
import type { EstadoPresupuesto } from "@/types"
import type { IPresupuestoDetalle } from "../types"
import { cambiarEstadoPresupuesto, verificarStockPresupuestoAction } from "../actions"
import type { IReporteDisponibilidadStock } from "../lib/explosion-materiales"
import { formatearPrecio } from "@/lib/utils"

interface PresupuestoAprobarModalProps {
  abierto: boolean
  onCerrar: () => void
  presupuesto: IPresupuestoDetalle
}

export function PresupuestoAprobarModal({
  abierto,
  onCerrar,
  presupuesto,
}: PresupuestoAprobarModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cargandoStock, setCargandoStock] = useState<boolean>(false)
  const [reporteStock, setReporteStock] = useState<IReporteDisponibilidadStock | null>(null)

  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoPresupuesto>(
    presupuesto.estado === "BORRADOR" ? "ENVIADO" : "ACEPTADO_TOTAL"
  )

  // Para aceptación parcial: array de IDs de ítems tildados
  const [itemsAceptados, setItemsAceptados] = useState<string[]>(() => {
    // Si ya tiene ítems aceptados previamente, conservarlos; si no, todos tildados por defecto
    const previamentAceptados = presupuesto.items
      .filter((it) => it.aceptado)
      .map((it) => it.id)
    return previamentAceptados.length > 0
      ? previamentAceptados
      : presupuesto.items.map((it) => it.id)
  })

  // Chequear stock cuando se selecciona ACEPTADO_TOTAL o ACEPTADO_PARCIAL
  useEffect(() => {
    if (
      !abierto ||
      (estadoSeleccionado !== "ACEPTADO_TOTAL" &&
        estadoSeleccionado !== "ACEPTADO_PARCIAL")
    ) {
      setReporteStock(null)
      return
    }

    let activo = true
    setCargandoStock(true)

    const idsAEvaluar =
      estadoSeleccionado === "ACEPTADO_PARCIAL" ? itemsAceptados : undefined

    verificarStockPresupuestoAction(presupuesto.id, idsAEvaluar)
      .then((res) => {
        if (activo && res.success && res.data) {
          setReporteStock(res.data)
        }
      })
      .catch((err) => {
        console.error("Error al consultar stock:", err)
      })
      .finally(() => {
        if (activo) setCargandoStock(false)
      })

    return () => {
      activo = false
    }
  }, [abierto, estadoSeleccionado, itemsAceptados, presupuesto.id])

  function toggleItem(id: string) {
    setItemsAceptados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function seleccionarTodos() {
    setItemsAceptados(presupuesto.items.map((it) => it.id))
  }

  function deseleccionarTodos() {
    setItemsAceptados([])
  }

  // Cálculo en vivo de total parcial
  const itemsAceptadosDetalle = presupuesto.items.filter((it) =>
    itemsAceptados.includes(it.id)
  )
  const subtotalParcial = itemsAceptadosDetalle.reduce(
    (acc, it) => acc + it.subtotal,
    0
  )
  const totalParcial = Math.round(
    subtotalParcial * (1 - presupuesto.descuento / 100)
  )

  async function handleConfirmar() {
    setError(null)

    if (estadoSeleccionado === "ACEPTADO_PARCIAL" && itemsAceptados.length === 0) {
      setError("Debés tildar al menos una cortina para la aceptación parcial.")
      return
    }

    startTransition(async () => {
      const res = await cambiarEstadoPresupuesto({
        id: presupuesto.id,
        estado: estadoSeleccionado,
        itemsAceptadosIds:
          estadoSeleccionado === "ACEPTADO_PARCIAL" ? itemsAceptados : undefined,
      })

      if (!res.success) {
        setError(res.error || "Ocurrió un error al actualizar el estado.")
        return
      }

      router.refresh()
      onCerrar()
    })
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gestionar Ciclo y Aprobación
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                Actualizá el estado comercial del presupuesto #PRE-
                {String(presupuesto.numero).padStart(4, "0")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto touch-scroll flex-1 min-h-0">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Opciones de Estado */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Seleccionar Nuevo Estado
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* ENVIADO */}
              <button
                type="button"
                onClick={() => setEstadoSeleccionado("ENVIADO")}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  estadoSeleccionado === "ENVIADO"
                    ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Send className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Presupuesto Enviado
                  </span>
                  <span className="text-[11px] text-slate-500">
                    En negociación. Actualiza el cliente a PRESUPUESTO_ENVIADO.
                  </span>
                </div>
              </button>

              {/* ACEPTADO TOTAL */}
              <button
                type="button"
                onClick={() => setEstadoSeleccionado("ACEPTADO_TOTAL")}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  estadoSeleccionado === "ACEPTADO_TOTAL"
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CheckCheck className="h-4 w-4 text-emerald-600 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Aceptado Total
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Cliente aprueba el 100% de las cortinas presupuestadas.
                  </span>
                </div>
              </button>

              {/* ACEPTADO PARCIAL */}
              <button
                type="button"
                onClick={() => setEstadoSeleccionado("ACEPTADO_PARCIAL")}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  estadoSeleccionado === "ACEPTADO_PARCIAL"
                    ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Aceptado Parcial
                  </span>
                  <span className="text-[11px] text-slate-500">
                    El cliente aprueba sólo algunas cortinas del presupuesto.
                  </span>
                </div>
              </button>

              {/* RECHAZADO */}
              <button
                type="button"
                onClick={() => setEstadoSeleccionado("RECHAZADO")}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  estadoSeleccionado === "RECHAZADO"
                    ? "border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-600 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Rechazado
                  </span>
                  <span className="text-[11px] text-slate-500">
                    El cliente no aprobó la cotización.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Selector de Cortinas en ACEPTACIÓN PARCIAL */}
          {estadoSeleccionado === "ACEPTADO_PARCIAL" && (
            <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">
                    Cortinas Aprobadas por el Cliente
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Marcá qué ítems se fabricarán para la futura comanda
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={seleccionarTodos}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    Todas
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={deseleccionarTodos}
                    className="font-bold text-slate-500 hover:underline"
                  >
                    Ninguna
                  </button>
                </div>
              </div>

              <div className="divide-y divide-indigo-100/80 rounded-xl border border-indigo-100 bg-white overflow-hidden max-h-56 overflow-y-auto">
                {presupuesto.items.map((it) => {
                  const check = itemsAceptados.includes(it.id)
                  return (
                    <label
                      key={it.id}
                      className={`flex items-center justify-between p-3 cursor-pointer text-xs transition ${
                        check ? "bg-indigo-50/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={check}
                          onChange={() => toggleItem(it.id)}
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {it.ambiente ? `[${it.ambiente}] ` : ""}
                            {it.descripcion}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {it.ancho}m × {it.alto}m • Cant: {it.cantidad}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold font-mono text-slate-800">
                        {formatearPrecio(it.subtotal)}
                      </span>
                    </label>
                  )
                })}
              </div>

              {/* Total Parcial Calculado */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-600 font-medium">
                  {itemsAceptados.length} de {presupuesto.items.length} cortinas aprobadas:
                </span>
                <div className="text-right">
                  <span className="text-sm font-black text-indigo-900 font-mono">
                    {formatearPrecio(totalParcial)}
                  </span>
                  {presupuesto.descuento > 0 && (
                    <span className="text-[10px] text-slate-400 block">
                      (Con {presupuesto.descuento}% desc.)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PANEL DE ANÁLISIS DE STOCK & RIELES ── */}
          {(estadoSeleccionado === "ACEPTADO_TOTAL" ||
            estadoSeleccionado === "ACEPTADO_PARCIAL") && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Disponibilidad de Materiales en Taller
                  </span>
                </div>
                {cargandoStock && (
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verificando stock...
                  </span>
                )}
              </div>

              {reporteStock && (
                <div className="space-y-2.5">
                  {/* Banner de Estado General */}
                  {reporteStock.hayFaltantes ? (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-amber-950">
                          Se detectaron materiales faltantes ({reporteStock.totalFaltantes})
                        </span>
                        <span className="text-[11px] text-amber-700">
                          Podés aprobar el presupuesto para que el taller conozca qué pedir a fábrica o proveedores.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 border border-emerald-200 text-xs text-emerald-800 font-medium">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        ¡Stock suficiente en taller para confeccionar e instalar estas cortinas!
                      </span>
                    </div>
                  )}

                  {/* Lista de Materiales y Rieles Calculados */}
                  {reporteStock.materiales.length > 0 && (
                    <div className="divide-y divide-slate-200/80 rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                      {reporteStock.materiales.map((mat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50/50"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {mat.nombre}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                                  mat.tieneStockSuficiente
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {mat.tieneStockSuficiente
                                  ? "Stock OK"
                                  : `Falta ${mat.faltante} ${mat.unidadMedida === "metro" ? "m" : "u"}`}
                              </span>
                            </div>
                            {mat.detalles && (
                              <p className="text-[11px] text-slate-500">
                                {mat.detalles}
                              </p>
                            )}
                          </div>

                          <div className="text-right text-[11px] font-mono shrink-0 pl-3">
                            <span className="text-slate-500 block">
                              Nec: <strong>{mat.cantidadRequerida}</strong> {mat.unidadMedida === "metro" ? "m" : "u"}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              Stock: {mat.stockActual} {mat.unidadMedida === "metro" ? "m" : "u"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie con Botones */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-4 sm:px-6 py-3.5 shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            disabled={isPending}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-700 hover:bg-slate-100 transition text-center"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            <span>Confirmar Cambio de Estado</span>
          </button>
        </div>
      </div>
    </div>
  )
}
