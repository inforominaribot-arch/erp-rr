// Módulo: Proveedores & Compras
// Asistente Inteligente de Reposición Sugerida por Stock Crítico & Comandas

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  Sparkles,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Building2,
  Package,
  ShoppingCart,
  Loader2,
  ArrowRight,
} from "lucide-react"
import type { ISugerenciaReposicionItem, IReposicionPorProveedor, IProveedor } from "../types"
import { crearOrdenCompra } from "../actions"

interface OrdenCompraReposicionModalProps {
  abierto: boolean
  sugerencias: ISugerenciaReposicionItem[]
  porProveedor: IReposicionPorProveedor[]
  proveedores: IProveedor[]
  puedeVerCostos: boolean
  onCerrar: () => void
  onOrdenCreada?: (ordenId: string) => void
}

export function OrdenCompraReposicionModal({
  abierto,
  sugerencias,
  porProveedor,
  proveedores,
  puedeVerCostos,
  onCerrar,
  onOrdenCreada,
}: OrdenCompraReposicionModalProps) {
  const router = useRouter()

  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState<string>(() => {
    return porProveedor[0]?.proveedorId || ""
  })
  const [itemsSeleccionados, setItemsSeleccionados] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    sugerencias.forEach((s) => {
      map[s.productoId] = true
    })
    return map
  })
  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  if (!abierto) return null

  // Grupo activo
  const grupoActivo = porProveedor.find(
    (g) => g.proveedorId === proveedorSeleccionadoId
  ) || porProveedor[0]

  const itemsDelGrupo = grupoActivo ? grupoActivo.items : []

  const toggleItem = (prodId: string) => {
    setItemsSeleccionados((prev) => ({
      ...prev,
      [prodId]: !prev[prodId],
    }))
  }

  const handleEmitirOrdenGrupo = async () => {
    if (!grupoActivo) return
    setErrorGlobal(null)

    // Si no tiene proveedor asignado en el sistema
    let provId = grupoActivo.proveedorId
    if (provId === "SIN_PROVEEDOR") {
      setErrorGlobal(
        "Por favor asigne primero este insumo a un proveedor desde el catálogo de stock o asócielo manualmente."
      )
      return
    }

    const itemsParaPedir = itemsDelGrupo.filter(
      (it) => itemsSeleccionados[it.productoId]
    )

    if (itemsParaPedir.length === 0) {
      setErrorGlobal("Debe seleccionar al menos un artículo para generar la orden.")
      return
    }

    setGuardando(true)

    try {
      const payload = {
        proveedorId: provId,
        notas: "Orden de compra generada automáticamente por reposición sugerida (Stock Crítico / Comandas pendientes).",
        items: itemsParaPedir.map((it) => ({
          productoId: it.productoId,
          cantidadPedida: it.cantidadSugerida,
          precioUnitario: it.ultimoPrecio,
        })),
      }

      const res = await crearOrdenCompra(payload)

      if (!res.success) {
        setErrorGlobal(res.error || "No se pudo generar la orden de compra.")
        setGuardando(false)
        return
      }

      router.refresh()
      if (onOrdenCreada) onOrdenCreada(res.data.id)
      onCerrar()
    } catch (err: any) {
      console.error("Error al generar orden desde sugerencia:", err)
      setErrorGlobal(err.message || "Error al procesar la reposición.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-indigo-50/50 via-white to-purple-50/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Reposición Sugerida Inteligente
              </h2>
              <p className="text-xs text-slate-500">
                Detecta faltantes de stock mínimo y pedidos de comandas de clientes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sugerencias.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              ¡Inventario y Comandas al Día!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No se detectaron insumos por debajo del stock mínimo ni comandas
              pendientes que requieran compra inmediata a proveedores.
            </p>
            <button
              type="button"
              onClick={onCerrar}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              Cerrar Asistente
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorGlobal && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorGlobal}</span>
              </div>
            )}

            {/* Pestañas de Proveedores Sugeridos */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Agrupado por Proveedor Habitual:
              </p>
              <div className="flex flex-wrap gap-2">
                {porProveedor.map((g) => {
                  const esActivo = g.proveedorId === grupoActivo?.proveedorId
                  return (
                    <button
                      key={g.proveedorId}
                      type="button"
                      onClick={() => setProveedorSeleccionadoId(g.proveedorId)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        esActivo
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{g.proveedorNombre}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          esActivo
                            ? "bg-indigo-700 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {g.totalItems}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Lista de artículos a reponer del proveedor activo */}
            {grupoActivo && (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <div className="border-b border-slate-100 bg-slate-50/70 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Insumos solicitados a {grupoActivo.proveedorNombre}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({itemsDelGrupo.length} artículos)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Marcá los insumos a incluir en la orden
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {itemsDelGrupo.map((it) => {
                    const seleccionado = !!itemsSeleccionados[it.productoId]

                    return (
                      <div
                        key={it.productoId}
                        className={`p-3.5 transition flex items-center justify-between gap-4 ${
                          seleccionado ? "bg-white" : "bg-slate-50/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => toggleItem(it.productoId)}
                            className="mt-1 h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">
                                {it.productoNombre}
                              </span>
                              {it.productoCodigo && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                                  {it.productoCodigo}
                                </span>
                              )}
                              {/* Badge de Origen */}
                              {it.origen === "STOCK_CRITICO" && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  Stock Crítico
                                </span>
                              )}
                              {it.origen === "COMANDA_PEDIR_PROVEEDOR" && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  <ClipboardList className="h-3 w-3" />
                                  Pedido de Comanda
                                </span>
                              )}
                              {it.origen === "AMBOS" && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                                  <Sparkles className="h-3 w-3" />
                                  Crítico + Comanda
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mt-0.5">
                              Stock actual:{" "}
                              <strong className="text-slate-700">
                                {it.stockActual} {it.unidadMedida}
                              </strong>{" "}
                              / Mínimo recomendado:{" "}
                              <strong className="text-slate-700">
                                {it.stockMinimo} {it.unidadMedida}
                              </strong>
                            </p>

                            {/* Detalle si proviene de comanda */}
                            {it.detallesComandas && it.detallesComandas.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {it.detallesComandas.map((det) => (
                                  <span
                                    key={det.comandaId}
                                    className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600"
                                  >
                                    Comanda #{det.comandaNumero} ({det.clienteNombre}):{" "}
                                    {det.cantidad} {it.unidadMedida}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cantidad Sugerida */}
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Cantidad a pedir:
                          </p>
                          <p className="text-base font-black text-indigo-700">
                            {it.cantidadSugerida}{" "}
                            <span className="text-xs font-medium text-slate-500">
                              {it.unidadMedida}
                            </span>
                          </p>
                          {puedeVerCostos && it.ultimoPrecio && (
                            <p className="text-[11px] text-slate-500">
                              ~${(it.cantidadSugerida * it.ultimoPrecio).toLocaleString(
                                "es-AR"
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onCerrar}
                disabled={guardando}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleEmitirOrdenGrupo}
                disabled={
                  guardando ||
                  !grupoActivo ||
                  grupoActivo.proveedorId === "SIN_PROVEEDOR"
                }
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando Orden...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span>
                      Emitir Orden para {grupoActivo?.proveedorNombre || "Proveedor"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
