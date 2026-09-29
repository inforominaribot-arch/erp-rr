// Módulo: Proveedores & Compras
// Modal de Emisión de Orden de Compra (Carga Manual)

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  Building2,
  Package,
  FileText,
  BadgeDollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { crearOrdenCompra } from "../actions"
import type { IProveedor } from "../types"

interface FilaItemOC {
  idTemporal: string
  productoId: string
  cantidadPedida: string
  precioUnitario: string
}

interface OrdenCompraFormModalProps {
  abierto: boolean
  proveedores: IProveedor[]
  proveedorPreseleccionadoId?: string
  productosDisponibles: Array<{
    id: string
    codigo: string | null
    nombre: string
    unidadMedida: string
    precio: number | null
  }>
  puedeVerCostos: boolean
  onCerrar: () => void
  onCompletado?: (ordenId: string) => void
}

export function OrdenCompraFormModal({
  abierto,
  proveedores,
  proveedorPreseleccionadoId,
  productosDisponibles,
  puedeVerCostos,
  onCerrar,
  onCompletado,
}: OrdenCompraFormModalProps) {
  const router = useRouter()

  const [proveedorId, setProveedorId] = useState("")
  const [notas, setNotas] = useState("")
  const [items, setItems] = useState<FilaItemOC[]>([])

  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      const pId =
        proveedorPreseleccionadoId ||
        proveedores.find((p) => p.activo)?.id ||
        proveedores[0]?.id ||
        ""
      setProveedorId(pId)
      setNotas("")

      const primerProd = productosDisponibles[0]
      setItems([
        {
          idTemporal: `it-${Date.now()}-1`,
          productoId: primerProd?.id || "",
          cantidadPedida: "1",
          precioUnitario:
            puedeVerCostos && primerProd?.precio ? String(primerProd.precio) : "",
        },
      ])
      setErrorGlobal(null)
    }
  }, [abierto, proveedorPreseleccionadoId, proveedores, productosDisponibles, puedeVerCostos])

  if (!abierto) return null

  const handleAgregarFila = () => {
    const primerProd = productosDisponibles[0]
    setItems((prev) => [
      ...prev,
      {
        idTemporal: `it-${Date.now()}-${prev.length + 1}`,
        productoId: primerProd?.id || "",
        cantidadPedida: "1",
        precioUnitario:
          puedeVerCostos && primerProd?.precio ? String(primerProd.precio) : "",
      },
    ])
  }

  const handleEliminarFila = (idTemporal: string) => {
    if (items.length <= 1) {
      setErrorGlobal("La orden de compra debe contener al menos un artículo.")
      return
    }
    setItems((prev) => prev.filter((i) => i.idTemporal !== idTemporal))
  }

  const handleCambioProducto = (idTemporal: string, prodId: string) => {
    const prod = productosDisponibles.find((p) => p.id === prodId)
    setItems((prev) =>
      prev.map((i) =>
        i.idTemporal === idTemporal
          ? {
              ...i,
              productoId: prodId,
              precioUnitario:
                puedeVerCostos && prod?.precio ? String(prod.precio) : i.precioUnitario,
            }
          : i
      )
    )
  }

  const handleCambioCantidad = (idTemporal: string, val: string) => {
    setItems((prev) =>
      prev.map((i) => (i.idTemporal === idTemporal ? { ...i, cantidadPedida: val } : i))
    )
  }

  const handleCambioPrecio = (idTemporal: string, val: string) => {
    setItems((prev) =>
      prev.map((i) => (i.idTemporal === idTemporal ? { ...i, precioUnitario: val } : i))
    )
  }

  // Calcular total estimado
  let totalEstimado = 0
  for (const it of items) {
    const cant = parseFloat(it.cantidadPedida) || 0
    const prec = parseFloat(it.precioUnitario) || 0
    totalEstimado += cant * prec
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorGlobal(null)

    if (!proveedorId) {
      setErrorGlobal("Por favor seleccione un proveedor.")
      return
    }

    if (items.length === 0) {
      setErrorGlobal("Debe agregar al menos un artículo.")
      return
    }

    for (const it of items) {
      const cant = parseFloat(it.cantidadPedida)
      if (isNaN(cant) || cant <= 0) {
        setErrorGlobal("Todas las cantidades deben ser números mayores a 0.")
        return
      }
    }

    setGuardando(true)

    try {
      const payload = {
        proveedorId,
        notas: notas.trim() || null,
        items: items.map((it) => ({
          productoId: it.productoId,
          cantidadPedida: parseFloat(it.cantidadPedida),
          precioUnitario: it.precioUnitario ? parseFloat(it.precioUnitario) : null,
        })),
      }

      const res = await crearOrdenCompra(payload)

      if (!res.success) {
        setErrorGlobal(res.error || "No se pudo emitir la orden de compra.")
        setGuardando(false)
        return
      }

      router.refresh()
      if (onCompletado) onCompletado(res.data.id)
      onCerrar()
    } catch (err: any) {
      console.error("Error al emitir orden de compra:", err)
      setErrorGlobal(err.message || "Error al procesar la orden.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Emitir Orden de Compra
              </h2>
              <p className="text-xs text-slate-500">
                Generación correlativa de pedido a fábrica o proveedor
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorGlobal && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorGlobal}</span>
            </div>
          )}

          {/* Proveedor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proveedor Destinatario *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                required
              >
                <option value="">-- Seleccionar Proveedor --</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.contacto ? `(${p.contacto})` : ""} {!p.activo ? "[Inactivo]" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla dinámica de artículos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Artículos Solicitados ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAgregarFila}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Artículo
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/30">
              <div className="divide-y divide-slate-200">
                {items.map((it, idx) => {
                  const prod = productosDisponibles.find((p) => p.id === it.productoId)
                  const cant = parseFloat(it.cantidadPedida) || 0
                  const prec = parseFloat(it.precioUnitario) || 0
                  const sub = cant * prec

                  return (
                    <div
                      key={it.idTemporal}
                      className="grid grid-cols-12 gap-2 p-3 items-center bg-white"
                    >
                      {/* Producto */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-[10px] font-semibold text-slate-400 sm:hidden">
                          Insumo
                        </label>
                        <select
                          value={it.productoId}
                          onChange={(e) =>
                            handleCambioProducto(it.idTemporal, e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                          required
                        >
                          {productosDisponibles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codigo ? `[${p.codigo}] ` : ""}
                              {p.nombre} ({p.unidadMedida})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cantidad */}
                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-400 sm:hidden">
                          Cantidad
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={it.cantidadPedida}
                            onChange={(e) =>
                              handleCambioCantidad(it.idTemporal, e.target.value)
                            }
                            placeholder="Cant."
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                            required
                          />
                          <span className="text-[11px] text-slate-400 font-medium shrink-0">
                            {prod?.unidadMedida || "u."}
                          </span>
                        </div>
                      </div>

                      {/* Precio Unitario (si tiene permisos) */}
                      {puedeVerCostos ? (
                        <div className="col-span-5 sm:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-400 sm:hidden">
                            Precio Unit.
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400 font-medium">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={it.precioUnitario}
                              onChange={(e) =>
                                handleCambioPrecio(it.idTemporal, e.target.value)
                              }
                              placeholder="Unitario"
                              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-5 sm:col-span-3 text-[11px] text-slate-400 italic">
                          Costo confidencial
                        </div>
                      )}

                      {/* Botón eliminar */}
                      <div className="col-span-2 sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleEliminarFila(it.idTemporal)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Eliminar artículo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones / Instrucciones de Entrega
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Ej: Entregar por la mañana antes de las 13hs en el taller..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
            />
          </div>

          {/* Resumen Total */}
          {puedeVerCostos && totalEstimado > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Monto Estimado Total:
              </span>
              <span className="text-base font-black text-indigo-700">
                ${totalEstimado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || items.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 focus:outline-hidden transition disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Emitiendo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Emitir Orden de Compra
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
