// Módulo: Proveedores & Compras
// Tablero de Órdenes de Compra con filtros, progreso y acciones

"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  ShoppingCart,
  Building2,
  Calendar,
  Boxes,
  Printer,
  CheckCircle2,
  Ban,
  Send,
  MoreVertical,
  ExternalLink,
  Plus,
} from "lucide-react"
import type { IOrdenCompra, EstadoOrdenCompra } from "../types"
import { ESTADOS_ORDEN_COMPRA_CONFIG } from "../types"
import { OrdenCompraEstadoBadge } from "./orden-compra-estado-badge"
import { OrdenCompraWhatsAppButton } from "./orden-compra-whatsapp-button"
import { cambiarEstadoOrdenCompra } from "../actions"

interface OrdenesCompraTablaProps {
  ordenes: IOrdenCompra[]
  puedeVerCostos: boolean
  puedeAdministrar: boolean
  onAbrirRecepcion: (orden: IOrdenCompra) => void
  onNuevaOrden?: () => void
}

export function OrdenesCompraTabla({
  ordenes,
  puedeVerCostos,
  puedeAdministrar,
  onAbrirRecepcion,
  onNuevaOrden,
}: OrdenesCompraTablaProps) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<EstadoOrdenCompra | "TODAS">("TODAS")
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<string | null>(null)

  const ordenesFiltradas = ordenes.filter((oc) => {
    if (filtroEstado !== "TODAS" && oc.estado !== filtroEstado) return false
    if (!busqueda.trim()) return true

    const q = busqueda.toLowerCase().trim()
    const nroTerm = q.replace(/\D/g, "")

    return (
      oc.numeroFormateado.toLowerCase().includes(q) ||
      oc.proveedor.nombre.toLowerCase().includes(q) ||
      (nroTerm !== "" && String(oc.numero).includes(nroTerm)) ||
      (oc.notas && oc.notas.toLowerCase().includes(q))
    )
  })

  const handleCambiarEstado = async (
    ordenCompraId: string,
    nuevoEstado: EstadoOrdenCompra
  ) => {
    setCambiandoEstadoId(ordenCompraId)
    try {
      await cambiarEstadoOrdenCompra({ ordenCompraId, nuevoEstado })
    } catch (err) {
      console.error("Error al cambiar estado:", err)
      alert("No se pudo actualizar el estado de la orden.")
    } finally {
      setCambiandoEstadoId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por # de orden, proveedor o notas..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden transition shadow-2xs"
          />
        </div>

        {/* Filtros por estado */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setFiltroEstado("TODAS")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              filtroEstado === "TODAS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Todas ({ordenes.length})
          </button>
          {(
            [
              "PENDIENTE",
              "ENVIADA",
              "RECIBIDA_PARCIAL",
              "RECIBIDA_TOTAL",
              "CANCELADA",
            ] as EstadoOrdenCompra[]
          ).map((est) => {
            const config = ESTADOS_ORDEN_COMPRA_CONFIG[est]
            const cant = ordenes.filter((o) => o.estado === est).length
            return (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filtroEstado === est
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {config.label} ({cant})
              </button>
            )
          })}
        </div>
      </div>

      {/* ── TABLA DE ÓRDENES ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {ordenesFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">
              No se encontraron órdenes de compra
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Probá cambiando los filtros o emití una nueva orden.
            </p>
            {onNuevaOrden && puedeAdministrar && (
              <button
                type="button"
                onClick={onNuevaOrden}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                Nueva Orden de Compra
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Recepción</th>
                  {puedeVerCostos && <th className="px-4 py-3 text-right">Total</th>}
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {ordenesFiltradas.map((oc) => {
                  const fecha = new Date(oc.creadoEn).toLocaleDateString("es-AR")
                  const puedeRecibir =
                    puedeAdministrar &&
                    oc.estado !== "CANCELADA" &&
                    oc.estado !== "RECIBIDA_TOTAL"

                  return (
                    <tr
                      key={oc.id}
                      className="hover:bg-slate-50/70 transition group"
                    >
                      {/* Número de Orden */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <Link
                          href={`/proveedores/ordenes/${oc.id}`}
                          className="hover:text-indigo-600 transition flex items-center gap-1"
                        >
                          <span>{oc.numeroFormateado}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition text-slate-400" />
                        </Link>
                      </td>

                      {/* Proveedor */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/proveedores/${oc.proveedor.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition block truncate max-w-[200px]"
                        >
                          {oc.proveedor.nombre}
                        </Link>
                        {oc.proveedor.contacto && (
                          <span className="text-[11px] text-slate-400 block truncate">
                            {oc.proveedor.contacto}
                          </span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {fecha}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <OrdenCompraEstadoBadge estado={oc.estado} />
                      </td>

                      {/* Progreso de recepción */}
                      <td className="px-4 py-3">
                        <div className="w-32 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-medium">
                              {oc.totalRecibidos} de {oc.totalItems} ítems
                            </span>
                            <span className="font-bold text-slate-700">
                              {oc.progresoRecepcion}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                oc.progresoRecepcion === 100
                                  ? "bg-emerald-500"
                                  : oc.progresoRecepcion > 0
                                  ? "bg-indigo-500"
                                  : "bg-slate-200"
                              }`}
                              style={{ width: `${oc.progresoRecepcion}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Monto Total */}
                      {puedeVerCostos && (
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {oc.total
                            ? `$${oc.total.toLocaleString("es-AR")}`
                            : "—"}
                        </td>
                      )}

                      {/* Acciones */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Botón WhatsApp */}
                          <OrdenCompraWhatsAppButton ordenCompra={oc} />

                          {/* Botón Recibir Mercadería */}
                          {puedeRecibir && (
                            <button
                              type="button"
                              onClick={() => onAbrirRecepcion(oc)}
                              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                              title="Registrar bultos recibidos e ingresar al stock"
                            >
                              <Boxes className="h-3.5 w-3.5" />
                              <span>Recibir</span>
                            </button>
                          )}

                          {/* Botón cambiar a ENVIADA si está en PENDIENTE */}
                          {puedeAdministrar && oc.estado === "PENDIENTE" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCambiarEstado(oc.id, "ENVIADA")
                              }
                              disabled={cambiandoEstadoId === oc.id}
                              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                              title="Marcar como formalmente enviada al proveedor"
                            >
                              <Send className="h-3 w-3" />
                              <span>Enviar</span>
                            </button>
                          )}

                          {/* Ver Ficha Detallada */}
                          <Link
                            href={`/proveedores/ordenes/${oc.id}`}
                            className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="Ver detalle e imprimir ficha A4"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
