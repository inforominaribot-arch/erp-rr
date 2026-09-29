// Módulo: Stock & Inventario
// Modal para Crear o Editar Producto / Insumo

"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  Loader2,
  Package,
  Upload,
  AlertCircle,
  Trash2,
  Image as ImageIcon,
} from "lucide-react"
import type { IProducto, UnidadMedida } from "../types"
import { UNIDADES_MEDIDA } from "../types"
import { crearProducto, actualizarProducto, eliminarProducto } from "../actions"

interface ProductoModalProps {
  producto?: IProducto | null // Si viene, es modo edición
  abierto: boolean
  puedeVerCostos: boolean
  onCerrar: () => void
  onGuardado?: () => void
}

export function ProductoModal({
  producto,
  abierto,
  puedeVerCostos,
  onCerrar,
  onGuardado,
}: ProductoModalProps) {
  const router = useRouter()
  const archivoInputRef = useRef<HTMLInputElement>(null)

  const esEdicion = Boolean(producto)

  const [codigo, setCodigo] = useState(producto?.codigo || "")
  const [nombre, setNombre] = useState(producto?.nombre || "")
  const [descripcion, setDescripcion] = useState(producto?.descripcion || "")
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>(
    (producto?.unidadMedida as UnidadMedida) || "unidad"
  )
  const [stockActual, setStockActual] = useState(
    producto ? String(producto.stockActual) : "0"
  )
  const [stockMinimo, setStockMinimo] = useState(
    producto ? String(producto.stockMinimo) : "5"
  )
  const [precio, setPrecio] = useState(
    producto?.precio !== null && producto?.precio !== undefined
      ? String(producto.precio)
      : ""
  )
  const [imagen, setImagen] = useState(producto?.imagen || "")
  const [activo, setActivo] = useState(producto ? producto.activo : true)

  const [cargando, setCargando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!abierto) return null

  // Manejar selección de foto del producto desde disco
  const handleFotoSeleccionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Por favor seleccioná un archivo de imagen válido (JPG, PNG, WebP).")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const b64 = event.target?.result as string
      setImagen(b64)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError("El nombre del producto es obligatorio.")
      return
    }

    setCargando(true)

    try {
      const payload = {
        codigo: codigo.trim() || null,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        unidadMedida,
        stockActual: Number(stockActual) || 0,
        stockMinimo: Number(stockMinimo) || 0,
        precio: precio && Number(precio) >= 0 ? Number(precio) : null,
        imagen: imagen || null,
        activo,
      }

      let res
      if (esEdicion && producto) {
        res = await actualizarProducto(producto.id, payload)
      } else {
        res = await crearProducto(payload)
      }

      if (!res.success) {
        setError(res.error)
        return
      }

      router.refresh()
      if (onGuardado) onGuardado()
      onCerrar()
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar el producto.")
    } finally {
      setCargando(false)
    }
  }

  const handleEliminar = async () => {
    if (!producto) return
    const confirmar = window.confirm(
      `¿Estás seguro de que deseás eliminar el producto "${producto.nombre}"? Si tiene movimientos históricos quedará marcado como inactivo.`
    )
    if (!confirmar) return

    setEliminando(true)
    setError(null)

    try {
      const res = await eliminarProducto(producto.id)
      if (!res.success) {
        setError(res.error)
        return
      }

      router.refresh()
      if (onGuardado) onGuardado()
      onCerrar()
    } catch (err: any) {
      setError(err.message || "Error al eliminar producto.")
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {esEdicion ? "Editar Insumo o Pieza" : "Nuevo Insumo de Taller"}
              </h2>
              <p className="text-xs text-slate-500">
                {esEdicion
                  ? "Modificá la ficha técnica, fotos o parámetros de stock"
                  : "Registrá una tela, riel, caño, motor o accesorio"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Foto del Insumo / Pieza */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Foto de la Pieza o Insumo
            </label>
            <div className="mt-2 flex items-center gap-4">
              <div
                onClick={() => archivoInputRef.current?.click()}
                className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-indigo-400 hover:bg-indigo-50/30"
              >
                {imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagen}
                    alt="Preview"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-600">
                    <ImageIcon className="h-6 w-6" />
                    <span className="mt-1 text-[10px] font-medium">Subir foto</span>
                  </div>
                )}
                <input
                  ref={archivoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoSeleccionada}
                  className="hidden"
                />
              </div>

              <div className="flex-1 space-y-1.5 text-xs">
                <p className="font-medium text-slate-700">
                  Subí una foto nítida de la pieza o del corte
                </p>
                <p className="text-[11px] text-slate-400">
                  Permite identificar visualmente caños, rieles y telas en el catálogo tipo manual técnico.
                </p>
                {imagen && (
                  <button
                    type="button"
                    onClick={() => setImagen("")}
                    className="text-[11px] font-semibold text-rose-600 hover:underline"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nombre y Código */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Nombre del Insumo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Caño Galvanizado 0.80m / Gaza Rústica"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Código interno
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej. CA-080 / TEL-01"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono uppercase focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Descripción o Especificación técnica
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Sol de verano 10 / Diámetro 38mm / Blanco óptico"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Unidad de Medida y Stocks */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Unidad de Medida
              </label>
              <select
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value as UnidadMedida)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {UNIDADES_MEDIDA.map((u) => (
                  <option key={u.valor} value={u.valor}>
                    {u.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                {esEdicion ? "Stock Actual" : "Stock Inicial"}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                disabled={esEdicion}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {esEdicion && (
                <span className="text-[10px] text-slate-400">
                  (Para cambiar stock usá el botón Ajustar)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Precio de Costo (solo si puede ver costos) y Estado Activo */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {puedeVerCostos ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Precio de Costo (ARS)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ej. 12500"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="activo" className="text-xs font-medium text-slate-700">
                Insumo activo para producción
              </label>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {esEdicion ? (
              <button
                type="button"
                onClick={handleEliminar}
                disabled={eliminando || cargando}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {eliminando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Eliminar
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCerrar}
                disabled={cargando}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {cargando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {esEdicion ? "Guardar Cambios" : "Crear Insumo"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
