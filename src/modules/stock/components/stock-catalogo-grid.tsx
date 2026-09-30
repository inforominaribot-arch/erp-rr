// Módulo: Stock & Inventario
// Vista Catálogo Visual en Cuadrícula (Mosaico de Piezas con Foto, Descripción y Stock)

"use client"

import { useState } from "react"
import {
  Package,
  Layers,
  Wrench,
  AlertCircle,
  Edit2,
  ArrowUpDown,
  Image as ImageIcon,
  Check,
} from "lucide-react"
import type { IProducto } from "../types"
import { StockEstadoBadge } from "./stock-estado-badge"

interface StockCatalogoGridProps {
  productos: IProducto[]
  puedeAdministrar: boolean
  puedeVerCostos: boolean
  onEditarProducto?: (producto: IProducto) => void
  onAjustarStock?: (producto: IProducto) => void
}

export function StockCatalogoGrid({
  productos,
  puedeAdministrar,
  puedeVerCostos,
  onEditarProducto,
  onAjustarStock,
}: StockCatalogoGridProps) {
  const [zoomImagen, setZoomImagen] = useState<{ url: string; titulo: string } | null>(null)

  const formatearUnidad = (unidad: string) => {
    switch (unidad) {
      case "metro":
        return "m"
      case "metro2":
        return "m²"
      case "kg":
        return "kg"
      default:
        return "u"
    }
  }

  const formatearMoneda = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Generador de ilustración técnica según la unidad o nombre si no tiene foto cargada
  const renderIconoTecnico = (p: IProducto) => {
    const nombre = p.nombre.toLowerCase()
    if (nombre.includes("caño") || nombre.includes("tubo") || nombre.includes("perfil")) {
      return (
        <div className="flex flex-col items-center justify-center text-slate-400">
          <div className="relative flex h-16 w-24 items-center justify-center">
            {/* Cilindro técnico estilizado */}
            <div className="h-9 w-20 rounded-r-md border-2 border-slate-300 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 shadow-inner flex items-center justify-end pr-1">
              <div className="h-6 w-3 rounded-full border border-slate-400 bg-slate-300" />
            </div>
            <div className="absolute left-1 h-9 w-3 rounded-full border-2 border-slate-400 bg-slate-200" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1">PERFIL / CAÑO</span>
        </div>
      )
    }

    if (nombre.includes("tela") || nombre.includes("gaza") || nombre.includes("blackout") || p.unidadMedida === "metro") {
      return (
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Layers className="h-12 w-12 text-indigo-300" />
          <span className="text-[10px] font-mono text-slate-400 mt-1">ROLLO DE TELA</span>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center text-slate-400">
        <Package className="h-12 w-12 text-slate-300" />
        <span className="text-[10px] font-mono text-slate-400 mt-1">ACCESORIO / PIEZA</span>
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <Package className="h-12 w-12 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No se encontraron insumos con los filtros seleccionados
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Probá modificando el término de búsqueda o quitando el filtro de stock crítico.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Grilla visual idéntica al manual técnico de repuestos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {productos.map((prod) => {
          const esCritico = prod.estadoStock === "CRITICO" || prod.estadoStock === "AGOTADO"
          const sufijo = formatearUnidad(prod.unidadMedida)

          return (
            <div
              key={prod.id}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white shadow-xs transition-all duration-150 hover:shadow-md ${
                esCritico
                  ? "border-red-300 ring-1 ring-red-300 hover:border-red-400"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              {/* Contenedor de la Foto */}
              <div
                onClick={() => {
                  if (prod.imagen) {
                    setZoomImagen({ url: prod.imagen, titulo: prod.nombre })
                  }
                }}
                className={`relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden border-b p-2 transition-colors ${
                  prod.imagen ? "bg-slate-50/80 hover:bg-slate-100" : "bg-slate-50/50"
                } ${esCritico ? "border-red-100" : "border-slate-100"}`}
              >
                {prod.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={prod.imagen}
                    alt={prod.nombre}
                    className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  renderIconoTecnico(prod)
                )}

                {/* Badge de Código Flotante */}
                {prod.codigo && (
                  <span className="absolute top-2 left-2 rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-xs">
                    {prod.codigo}
                  </span>
                )}

                {/* Badge de Alerta Crítica en esquina si aplica */}
                {esCritico && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow-sm animate-pulse" title="Stock Crítico">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              {/* Cuerpo de la Tarjeta: "Lo que es" */}
              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <h3
                    className="line-clamp-2 text-xs font-bold leading-snug text-slate-900 group-hover:text-indigo-600"
                    title={prod.nombre}
                  >
                    {prod.nombre}
                  </h3>

                  {prod.descripcion && (
                    <p
                      className="mt-1 line-clamp-1 text-[11px] text-slate-500"
                      title={prod.descripcion}
                    >
                      {prod.descripcion}
                    </p>
                  )}
                </div>

                {/* Bloque inferior: "Unidades en Stock" */}
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      En Stock:
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className={`text-lg font-black tracking-tight ${
                          prod.stockActual <= 0
                            ? "text-rose-600"
                            : esCritico
                            ? "text-red-600"
                            : "text-slate-900"
                        }`}
                      >
                        {prod.stockActual}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {sufijo}
                      </span>
                    </div>
                  </div>

                  {/* Barra visual de stock vs mínimo */}
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        prod.stockActual <= 0
                          ? "bg-rose-500 w-0"
                          : esCritico
                          ? "bg-red-500"
                          : prod.estadoStock === "BAJO"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            8,
                            prod.stockMinimo > 0
                              ? (prod.stockActual / (prod.stockMinimo * 2)) * 100
                              : 100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Mín: {prod.stockMinimo} {sufijo}</span>
                    {puedeVerCostos && prod.precio ? (
                      <span className="font-semibold text-slate-700">
                        {formatearMoneda(prod.precio)}
                      </span>
                    ) : null}
                  </div>

                  {/* Botones de acción rápida en la tarjeta */}
                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2">
                    {onAjustarStock && (
                      <button
                        type="button"
                        onClick={() => onAjustarStock(prod)}
                        className="flex-1 min-h-[38px] flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-center text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95"
                        title="Ajustar o mover stock"
                      >
                        Ajustar
                      </button>
                    )}

                    {puedeAdministrar && onEditarProducto && (
                      <button
                        type="button"
                        onClick={() => onEditarProducto(prod)}
                        className="min-h-[38px] w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                        title="Editar ficha"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Lightbox para ampliar imagen del producto */}
      {zoomImagen && (
        <div
          onClick={() => setZoomImagen(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] max-w-xl overflow-hidden rounded-2xl bg-white p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                {zoomImagen.titulo}
              </h4>
              <button
                type="button"
                onClick={() => setZoomImagen(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomImagen.url}
                alt={zoomImagen.titulo}
                className="max-h-[65vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
