// Módulo: Proveedores & Compras
// Modal de Recepción de Mercadería contra Orden de Compra (Conexión directa con Stock)

"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  Boxes,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  BadgeDollarSign,
  Package,
} from "lucide-react"
import type { IOrdenCompra } from "../types"
import { registrarRecepcionMercaderia } from "../actions"

interface FilaRecepcionState {
  itemId: string
  productoId: string
  productoNombre: string
  unidadMedida: string
  cantidadPedida: number
  cantidadRecibidaAnterior: number
  saldoPendiente: number
  cantidadRecibidaAhora: string
  costoUnitarioActualizado: string
}

interface OrdenCompraRecepcionModalProps {
  abierto: boolean
  ordenCompra: IOrdenCompra
  puedeVerCostos: boolean
  onCerrar: () => void
  onCompletado?: () => void
}

export function OrdenCompraRecepcionModal({
  abierto,
  ordenCompra,
  puedeVerCostos,
  onCerrar,
  onCompletado,
}: OrdenCompraRecepcionModalProps) {
  const router = useRouter()
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [numeroRemito, setNumeroRemito] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [fotoRemito, setFotoRemito] = useState<string | null>(
    ordenCompra.fotoRemito || null
  )

  const [filas, setFilas] = useState<FilaRecepcionState[]>(() => {
    return ordenCompra.items.map((it) => {
      const saldo = Math.max(0, it.cantidadPedida - it.cantidadRecibida)
      return {
        itemId: it.id,
        productoId: it.productoId,
        productoNombre: it.producto?.nombre || "Insumo",
        unidadMedida: it.producto?.unidadMedida || "u.",
        cantidadPedida: it.cantidadPedida,
        cantidadRecibidaAnterior: it.cantidadRecibida,
        saldoPendiente: saldo,
        // Por defecto precargar el saldo pendiente para agilizar
        cantidadRecibidaAhora: String(saldo),
        costoUnitarioActualizado:
          puedeVerCostos && it.precioUnitario ? String(it.precioUnitario) : "",
      }
    })
  })

  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  if (!abierto) return null

  const handleFotoSeleccionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setFotoRemito(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCambioCantidad = (itemId: string, val: string) => {
    setFilas((prev) =>
      prev.map((f) => (f.itemId === itemId ? { ...f, cantidadRecibidaAhora: val } : f))
    )
  }

  const handleCambioCosto = (itemId: string, val: string) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.itemId === itemId ? { ...f, costoUnitarioActualizado: val } : f
      )
    )
  }

  const handleRecibirTodoElSaldo = (itemId: string) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.itemId === itemId
          ? { ...f, cantidadRecibidaAhora: String(f.saldoPendiente) }
          : f
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorGlobal(null)

    // Validar que al menos un ítem tenga cantidad > 0
    let hayCantidad = false
    for (const f of filas) {
      const cant = parseFloat(f.cantidadRecibidaAhora)
      if (!isNaN(cant) && cant > 0) {
        hayCantidad = true
        break
      }
    }

    if (!hayCantidad) {
      setErrorGlobal(
        "Debe indicar la cantidad recibida de al menos un artículo (mayor a 0)."
      )
      return
    }

    setGuardando(true)

    try {
      const payload = {
        ordenCompraId: ordenCompra.id,
        fotoRemito,
        numeroRemito: numeroRemito.trim() || null,
        observaciones: observaciones.trim() || null,
        items: filas
          .filter((f) => parseFloat(f.cantidadRecibidaAhora) > 0)
          .map((f) => ({
            itemId: f.itemId,
            productoId: f.productoId,
            cantidadRecibidaAhora: parseFloat(f.cantidadRecibidaAhora),
            costoUnitarioActualizado: f.costoUnitarioActualizado
              ? parseFloat(f.costoUnitarioActualizado)
              : null,
          })),
      }

      const res = await registrarRecepcionMercaderia(payload)

      if (!res.success) {
        setErrorGlobal(res.error || "No se pudo registrar la recepción.")
        setGuardando(false)
        return
      }

      router.refresh()
      if (onCompletado) onCompletado()
      onCerrar()
    } catch (err: any) {
      console.error("Error al registrar recepción:", err)
      setErrorGlobal(err.message || "Error al procesar el ingreso de mercadería.")
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
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recepción de Mercadería — {ordenCompra.numeroFormateado}
              </h2>
              <p className="text-xs text-slate-500">
                Proveedor:{" "}
                <strong className="text-slate-700">
                  {ordenCompra.proveedor.nombre}
                </strong>
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

          {/* Datos del Remito */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Remito / Factura del Proveedor
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={numeroRemito}
                  onChange={(e) => setNumeroRemito(e.target.value)}
                  placeholder="Ej: R-0001-00084321"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Foto del Remito Físico (Opcional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fotoInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoSeleccionada}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fotoInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Camera className="h-4 w-4 text-indigo-600" />
                  {fotoRemito ? "Cambiar foto de remito" : "Adjuntar / Sacar foto"}
                </button>
                {fotoRemito && (
                  <button
                    type="button"
                    onClick={() => setFotoRemito(null)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Quitar foto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview de Foto */}
          {fotoRemito && (
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-center">
              <img
                src={fotoRemito}
                alt="Remito físico"
                className="mx-auto max-h-36 rounded-lg object-contain"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Comprobante adjunto listo para registrar
              </span>
            </div>
          )}

          {/* Tabla de Artículos a Recibir */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Cantidades Recibidas por Artículo
              </label>
              <span className="text-[11px] text-slate-500">
                Se sumará automáticamente al stock disponible
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
              {filas.map((f) => {
                const completado = f.saldoPendiente <= 0
                return (
                  <div
                    key={f.itemId}
                    className={`p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      completado ? "bg-slate-50/50 opacity-60" : "bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {f.productoNombre}
                        </span>
                        {completado && (
                          <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700">
                            100% Recibido
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pedido: <strong>{f.cantidadPedida} {f.unidadMedida}</strong> | Ya
                        recibido:{" "}
                        <strong className="text-slate-700">
                          {f.cantidadRecibidaAnterior} {f.unidadMedida}
                        </strong>{" "}
                        | Pendiente:{" "}
                        <strong className="text-amber-600">
                          {f.saldoPendiente} {f.unidadMedida}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Cantidad recibida ahora */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400">
                          Recibido ahora:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={f.cantidadRecibidaAhora}
                            onChange={(e) =>
                              handleCambioCantidad(f.itemId, e.target.value)
                            }
                            className="w-24 rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                          />
                          <span className="text-[11px] text-slate-400 font-medium">
                            {f.unidadMedida}
                          </span>
                        </div>
                      </div>

                      {/* Costo final si aplica */}
                      {puedeVerCostos && (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400">
                            Costo Unit. ($):
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={f.costoUnitarioActualizado}
                            onChange={(e) =>
                              handleCambioCosto(f.itemId, e.target.value)
                            }
                            placeholder="Unitario"
                            className="w-24 rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                          />
                        </div>
                      )}

                      {/* Botón rápido saldo */}
                      {!completado && (
                        <button
                          type="button"
                          onClick={() => handleRecibirTodoElSaldo(f.itemId)}
                          className="mt-3.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition shrink-0"
                          title="Recibir todo el saldo pendiente"
                        >
                          Saldo
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones de Recepción / Bultos
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Ej: Llegó todo en perfectas condiciones en 3 rollos rotulados..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
            />
          </div>

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
              disabled={guardando}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden transition disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Impactando en Stock...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar e Ingresar al Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
