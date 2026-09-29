// Módulo: Stock & Inventario
// Tabla Compacta de Productos e Insumos

"use client"

import { useState } from "react"
import {
  Package,
  Edit2,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  Eye,
} from "lucide-react"
import type { IProducto } from "../types"
import { StockEstadoBadge } from "./stock-estado-badge"

interface StockTablaProps {
  productos: IProducto[]
  puedeAdministrar: boolean
  puedeVerCostos: boolean
  onEditarProducto?: (producto: IProducto) => void
  onAjustarStock?: (producto: IProducto) => void
}

export function StockTabla({
  productos,
  puedeAdministrar,
  puedeVerCostos,
  onEditarProducto,
  onAjustarStock,
}: StockTablaProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 25

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

  const totalPaginas = Math.ceil(productos.length / itemsPorPagina)
  const inicio = (paginaActual - 1) * itemsPorPagina
  const productosPaginados = productos.slice(inicio, inicio + itemsPorPagina)

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <Package className="h-12 w-12 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No se encontraron insumos
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Probá modificando los filtros aplicados.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-700">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Insumo / Descripción</th>
              <th className="px-4 py-3 text-center">Unidad</th>
              <th className="px-4 py-3 text-right">Stock Actual</th>
              <th className="px-4 py-3 text-right">Stock Mínimo</th>
              <th className="px-4 py-3 text-center">Estado</th>
              {puedeVerCostos && (
                <th className="px-4 py-3 text-right">Costo Unit.</th>
              )}
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productosPaginados.map((prod) => {
              const sufijo = formatearUnidad(prod.unidadMedida)
              const esCritico =
                prod.estadoStock === "CRITICO" || prod.estadoStock === "AGOTADO"

              return (
                <tr
                  key={prod.id}
                  className={`transition-colors hover:bg-slate-50/80 ${
                    esCritico ? "bg-red-50/20" : ""
                  }`}
                >
                  {/* Código */}
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">
                    {prod.codigo || <span className="text-slate-300">—</span>}
                  </td>

                  {/* Nombre y Foto/Thumbnail */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {prod.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.imagen}
                          alt={prod.nombre}
                          className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-contain bg-white p-0.5"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-slate-400">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {prod.nombre}
                        </p>
                        {prod.descripcion && (
                          <p className="text-[11px] text-slate-500">
                            {prod.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Unidad */}
                  <td className="px-4 py-3 text-center">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                      {prod.unidadMedida}
                    </span>
                  </td>

                  {/* Stock Actual */}
                  <td className="px-4 py-3 text-right font-mono">
                    <span
                      className={`text-sm font-bold ${
                        prod.stockActual <= 0
                          ? "text-rose-600"
                          : esCritico
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {prod.stockActual}
                    </span>{" "}
                    <span className="text-[11px] text-slate-400">{sufijo}</span>
                  </td>

                  {/* Stock Mínimo */}
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {prod.stockMinimo} {sufijo}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3 text-center">
                    <StockEstadoBadge
                      estado={prod.estadoStock}
                      activo={prod.activo}
                    />
                  </td>

                  {/* Costo Unitario (Solo Admin) */}
                  {puedeVerCostos && (
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                      {prod.precio ? (
                        formatearMoneda(prod.precio)
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  )}

                  {/* Acciones */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onAjustarStock && (
                        <button
                          type="button"
                          onClick={() => onAjustarStock(prod)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                          title="Registrar ajuste o movimiento"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                          Ajustar
                        </button>
                      )}

                      {puedeAdministrar && onEditarProducto && (
                        <button
                          type="button"
                          onClick={() => onEditarProducto(prod)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Editar producto"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>
            Mostrando {inicio + 1} a{" "}
            {Math.min(inicio + itemsPorPagina, productos.length)} de{" "}
            {productos.length} insumos
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="font-semibold text-slate-700">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              type="button"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
