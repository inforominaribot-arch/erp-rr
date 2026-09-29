// Módulo: Proveedores & Compras
// Modal para asociar o editar insumos provistos por un proveedor

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  Package,
  Barcode,
  BadgeDollarSign,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react"
import { vincularProductoProveedor } from "../actions"
import type { IProductoProveedor } from "../types"

interface ProveedorCatalogoModalProps {
  abierto: boolean
  proveedorId: string
  proveedorNombre: string
  itemAEditar?: IProductoProveedor | null
  productosDisponibles: Array<{
    id: string
    codigo: string | null
    nombre: string
    unidadMedida: string
    precio: number | null
  }>
  puedeVerCostos: boolean
  onCerrar: () => void
  onGuardado?: () => void
}

export function ProveedorCatalogoModal({
  abierto,
  proveedorId,
  proveedorNombre,
  itemAEditar,
  productosDisponibles,
  puedeVerCostos,
  onCerrar,
  onGuardado,
}: ProveedorCatalogoModalProps) {
  const router = useRouter()

  const [productoId, setProductoId] = useState("")
  const [codigoProveedor, setCodigoProveedor] = useState("")
  const [precioUltimo, setPrecioUltimo] = useState("")
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [filtroProducto, setFiltroProducto] = useState("")

  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  useEffect(() => {
    if (itemAEditar) {
      setProductoId(itemAEditar.productoId)
      setCodigoProveedor(itemAEditar.codigoProveedor || "")
      setPrecioUltimo(
        itemAEditar.precioUltimo !== null && itemAEditar.precioUltimo !== undefined
          ? String(itemAEditar.precioUltimo)
          : ""
      )
      setEsPrincipal(itemAEditar.esPrincipal)
    } else {
      setProductoId(productosDisponibles[0]?.id || "")
      setCodigoProveedor("")
      setPrecioUltimo("")
      setEsPrincipal(false)
    }
    setFiltroProducto("")
    setErrorGlobal(null)
  }, [itemAEditar, abierto, productosDisponibles])

  if (!abierto) return null

  const esEdicion = !!itemAEditar

  const productosFiltrados = productosDisponibles.filter((p) => {
    if (!filtroProducto.trim()) return true
    const term = filtroProducto.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(term) ||
      (p.codigo && p.codigo.toLowerCase().includes(term))
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorGlobal(null)

    if (!productoId) {
      setErrorGlobal("Por favor seleccione un producto del catálogo.")
      return
    }

    setGuardando(true)

    try {
      const res = await vincularProductoProveedor({
        productoId,
        proveedorId,
        codigoProveedor: codigoProveedor.trim() || null,
        precioUltimo: precioUltimo ? parseFloat(precioUltimo) : null,
        esPrincipal,
      })

      if (!res.success) {
        setErrorGlobal(res.error || "No se pudo vincular el producto.")
        setGuardando(false)
        return
      }

      router.refresh()
      if (onGuardado) onGuardado()
      onCerrar()
    } catch (err: any) {
      console.error("Error al vincular producto al proveedor:", err)
      setErrorGlobal(err.message || "Error al procesar el insumo.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {esEdicion ? "Editar Insumo Provisto" : "Vincular Insumo a Catálogo"}
              </h2>
              <p className="text-xs text-slate-500">
                Proveedor: <strong className="text-slate-700">{proveedorNombre}</strong>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorGlobal && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorGlobal}</span>
            </div>
          )}

          {/* Selector de Producto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Producto / Tela del Catálogo de Stock *
            </label>

            {!esEdicion && (
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={filtroProducto}
                  onChange={(e) => setFiltroProducto(e.target.value)}
                  placeholder="Filtrar por nombre o código..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            )}

            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              disabled={esEdicion}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition disabled:opacity-75"
              required
            >
              {productosFiltrados.length === 0 ? (
                <option value="">No se encontraron productos coincidentes</option>
              ) : (
                productosFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo ? `[${p.codigo}] ` : ""}
                    {p.nombre} ({p.unidadMedida})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Código del Proveedor & Precio Pactado */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código de Fábrica / Proveedor
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={codigoProveedor}
                  onChange={(e) => setCodigoProveedor(e.target.value)}
                  placeholder="Ej: TEL-WHITE-300"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 uppercase focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            </div>

            {puedeVerCostos && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Último Precio de Compra Pactado ($)
                </label>
                <div className="relative">
                  <BadgeDollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioUltimo}
                    onChange={(e) => setPrecioUltimo(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Proveedor Principal */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <input
              type="checkbox"
              id="es-principal"
              checked={esPrincipal}
              onChange={(e) => setEsPrincipal(e.target.checked)}
              className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="es-principal"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none"
            >
              <Star className="h-3.5 w-3.5 text-amber-500" />
              Proveedor Principal (Sugerido por defecto en reposición de stock)
            </label>
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
              disabled={guardando || !productoId}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 focus:outline-hidden transition disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {esEdicion ? "Actualizar Insumo" : "Vincular Insumo"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
