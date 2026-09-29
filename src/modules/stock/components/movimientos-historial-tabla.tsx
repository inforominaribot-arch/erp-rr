// Módulo: Stock & Inventario
// Historial y Trazabilidad de Movimientos de Stock

"use client"

import { useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  FileSpreadsheet,
} from "lucide-react"
import type { IMovimientoStock, TipoMovimientoStock } from "../types"

interface MovimientosHistorialTablaProps {
  movimientos: IMovimientoStock[]
}

export function MovimientosHistorialTabla({
  movimientos,
}: MovimientosHistorialTablaProps) {
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimientoStock | "TODOS">("TODOS")
  const [busqueda, setBusqueda] = useState("")

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  const movimientosFiltrados = movimientos.filter((m) => {
    if (filtroTipo !== "TODOS" && m.tipo !== filtroTipo) {
      return false
    }

    if (busqueda.trim() !== "") {
      const q = busqueda.toLowerCase().trim()
      const enNombre = m.productoNombre?.toLowerCase().includes(q) || false
      const enCodigo = m.productoCodigo?.toLowerCase().includes(q) || false
      const enMotivo = m.motivo?.toLowerCase().includes(q) || false
      const enRef = m.referenciaId?.toLowerCase().includes(q) || false

      return enNombre || enCodigo || enMotivo || enRef
    }

    return true
  })

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por insumo, código, remito o motivo..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["TODOS", "INGRESO", "EGRESO", "AJUSTE"] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setFiltroTipo(tipo)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filtroTipo === tipo
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tipo === "TODOS"
                ? "Todos"
                : tipo === "INGRESO"
                ? "Ingresos (Remitos)"
                : tipo === "EGRESO"
                ? "Egresos (Producción/Mermas)"
                : "Ajustes de Inventario"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3 text-center">Tipo</th>
                <th className="px-4 py-3">Insumo / Pieza</th>
                <th className="px-4 py-3 text-right">Variación</th>
                <th className="px-4 py-3 text-center">Stock Anterior → Nuevo</th>
                <th className="px-4 py-3">Motivo / Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No se encontraron movimientos registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((m) => {
                  const esIngreso = m.tipo === "INGRESO"
                  const esEgreso = m.tipo === "EGRESO"
                  const unidad = m.unidadMedida || "u"

                  return (
                    <tr key={m.id} className="transition-colors hover:bg-slate-50/60">
                      {/* Fecha */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatearFecha(m.creadoEn)}
                      </td>

                      {/* Badge Tipo */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {esIngreso ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <ArrowDownLeft className="h-3 w-3" />
                            Ingreso
                          </span>
                        ) : esEgreso ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                            <ArrowUpRight className="h-3 w-3" />
                            Egreso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                            <RefreshCw className="h-3 w-3" />
                            Ajuste
                          </span>
                        )}
                      </td>

                      {/* Insumo */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {m.productoNombre || "Insumo"}
                        </p>
                        {m.productoCodigo && (
                          <span className="font-mono text-[10px] text-slate-400">
                            [{m.productoCodigo}]
                          </span>
                        )}
                      </td>

                      {/* Variación */}
                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            esIngreso
                              ? "text-emerald-600"
                              : esEgreso
                              ? "text-red-600"
                              : "text-blue-600"
                          }
                        >
                          {esIngreso ? "+" : esEgreso ? "-" : "±"}
                          {m.cantidad} {unidad}
                        </span>
                      </td>

                      {/* Stock Anterior -> Nuevo */}
                      <td className="px-4 py-3 text-center font-mono text-[11px] whitespace-nowrap">
                        <span className="text-slate-400">{m.stockAnterior}</span>
                        <span className="mx-1.5 text-slate-300">→</span>
                        <span className="font-bold text-slate-800">
                          {m.stockNuevo} {unidad}
                        </span>
                      </td>

                      {/* Motivo / Referencia */}
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <p className="font-medium text-slate-800">
                          {m.motivo || "—"}
                        </p>
                        {m.referenciaTipo && (
                          <span className="text-[10px] font-semibold uppercase text-slate-400">
                            {m.referenciaTipo}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
