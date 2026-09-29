// Módulo: Proveedores & Compras
// Directorio de Proveedores (Listado reactivo con buscador y acciones)

"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  Edit2,
  Trash2,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import type { IProveedor } from "../types"
import { ProveedorEstadoBadge } from "./proveedor-estado-badge"
import { eliminarProveedor } from "../actions"

interface ProveedorTablaProps {
  proveedores: IProveedor[]
  puedeAdministrar: boolean
  onEditarProveedor: (proveedor: IProveedor) => void
  onCrearOrdenProveedor: (proveedorId: string) => void
}

export function ProveedorTabla({
  proveedores,
  puedeAdministrar,
  onEditarProveedor,
  onCrearOrdenProveedor,
}: ProveedorTablaProps) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS")
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const proveedoresFiltrados = proveedores.filter((p) => {
    // Filtro estado
    if (filtroEstado === "ACTIVOS" && !p.activo) return false
    if (filtroEstado === "INACTIVOS" && p.activo) return false

    // Buscador
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase().trim()
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.contacto && p.contacto.toLowerCase().includes(q)) ||
      (p.telefono && p.telefono.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.direccion && p.direccion.toLowerCase().includes(q))
    )
  })

  const handleEliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de dar de baja o eliminar al proveedor "${nombre}"?`)) {
      return
    }

    setEliminandoId(id)
    try {
      await eliminarProveedor(id)
    } catch (err) {
      console.error("Error al eliminar proveedor:", err)
      alert("No se pudo eliminar el proveedor.")
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por razón social, contacto, teléfono o email..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden transition shadow-2xs"
          />
        </div>

        {/* Filtros de estado */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          {(["TODOS", "ACTIVOS", "INACTIVOS"] as const).map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                filtroEstado === est
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {est === "TODOS" ? "Todos" : est === "ACTIVOS" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTADO / TARJETAS DE PROVEEDORES ── */}
      {proveedoresFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">No se encontraron proveedores</p>
          <p className="text-xs text-slate-400 mt-1">
            Probá ajustando el término de búsqueda o agregá un nuevo proveedor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proveedoresFiltrados.map((prov) => {
            const telLimpio = (prov.telefono || "").replace(/\D/g, "")

            return (
              <div
                key={prov.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition group"
              >
                <div>
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <Link
                          href={`/proveedores/${prov.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition text-sm flex items-center gap-1"
                        >
                          <span className="truncate">{prov.nombre}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition text-slate-400" />
                        </Link>
                        {prov.contacto && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 text-slate-400" />
                            <span className="truncate">{prov.contacto}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <ProveedorEstadoBadge activo={prov.activo} />
                  </div>

                  {/* Datos de contacto */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    {prov.telefono && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <a
                            href={`tel:${prov.telefono}`}
                            className="hover:text-indigo-600 transition"
                          >
                            {prov.telefono}
                          </a>
                        </span>
                        {telLimpio && (
                          <a
                            href={`https://wa.me/${telLimpio}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md transition"
                            title="Chat directo por WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    )}

                    {prov.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <a
                          href={`mailto:${prov.email}`}
                          className="hover:text-indigo-600 transition truncate"
                        >
                          {prov.email}
                        </a>
                      </div>
                    )}

                    {prov.direccion && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{prov.direccion}</span>
                      </div>
                    )}
                  </div>

                  {/* Contadores */}
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 text-xs">
                    <div className="flex-1 flex items-center gap-1.5 text-slate-600">
                      <Package className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        <strong className="text-slate-900 font-bold">
                          {prov._count?.productos || 0}
                        </strong>{" "}
                        insumos
                      </span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="flex-1 flex items-center gap-1.5 text-slate-600">
                      <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        <strong className="text-slate-900 font-bold">
                          {prov._count?.ordenesCompra || 0}
                        </strong>{" "}
                        órdenes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1">
                    {puedeAdministrar && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditarProveedor(prov)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          title="Editar datos del proveedor"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(prov.id, prov.nombre)}
                          disabled={eliminandoId === prov.id}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Eliminar o dar de baja"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {puedeAdministrar && prov.activo && (
                      <button
                        type="button"
                        onClick={() => onCrearOrdenProveedor(prov.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        Pedir
                      </button>
                    )}
                    <Link
                      href={`/proveedores/${prov.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                    >
                      <span>Ficha</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
