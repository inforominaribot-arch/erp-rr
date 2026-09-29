"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MedicionSyncBadge } from "./medicion-sync-badge"
import { eliminarMedicion } from "../actions"
import { formatearFecha } from "@/lib/utils"
import type { IMedicion } from "../types"
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  Ruler,
  CheckCircle2,
} from "lucide-react"

interface MedicionTablaProps {
  medicionesIniciales: IMedicion[]
  puedeEditar?: boolean
}

export function MedicionTabla({
  medicionesIniciales,
  puedeEditar = true,
}: MedicionTablaProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busqueda, setBusqueda] = useState("")
  const [filtroSync, setFiltroSync] = useState<string>("TODOS")

  // Estado para eliminación
  const [medicionAEliminar, setMedicionAEliminar] = useState<IMedicion | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null)

  const medicionesFiltradas = medicionesIniciales.filter((med) => {
    // Filtro sync
    if (filtroSync === "SINCRONIZADO" && !med.sincronizado) return false
    if (filtroSync === "PENDIENTE" && med.sincronizado) return false

    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase().trim()
    const clienteNombre = med.cliente?.nombre?.toLowerCase() || ""
    const clienteTel = med.cliente?.telefono?.toLowerCase() || ""
    const clienteLoc = med.cliente?.localidad?.toLowerCase() || ""
    const clienteDir = med.cliente?.direccion?.toLowerCase() || ""
    const obs = med.observaciones?.toLowerCase() || ""

    return (
      clienteNombre.includes(q) ||
      clienteTel.includes(q) ||
      clienteLoc.includes(q) ||
      clienteDir.includes(q) ||
      obs.includes(q)
    )
  })

  async function handleConfirmarEliminacion() {
    if (!medicionAEliminar) return
    setEliminando(true)
    setErrorEliminacion(null)

    try {
      const res = await eliminarMedicion(medicionAEliminar.id)
      if (!res.success) {
        setErrorEliminacion(res.error || "No se pudo eliminar la medición")
        return
      }

      setMedicionAEliminar(null)
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setErrorEliminacion("Ocurrió un error inesperado al intentar eliminar.")
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Filtros y Búsqueda ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, teléfono, dirección o notas..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filtroSync}
            onChange={(e) => setFiltroSync(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="SINCRONIZADO">Sincronizadas</option>
            <option value="PENDIENTE">Pendientes (Locales)</option>
          </select>
        </div>
      </div>

      {/* ── Tabla de Mediciones ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Ubicación / Contacto
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Ambientes & Aberturas
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Sincronización
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Fecha de Toma
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Ruler className="h-6 w-6" />
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-slate-900">
                      No se encontraron mediciones
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Probá ajustando la búsqueda o iniciá un nuevo relevamiento en
                      obra.
                    </p>
                  </td>
                </tr>
              ) : (
                medicionesFiltradas.map((medicion) => {
                  const cantCortinas = medicion.ambientes.reduce(
                    (acc, a) => acc + (a.items?.length || 0),
                    0
                  )

                  return (
                    <tr
                      key={medicion.id}
                      className="transition hover:bg-slate-50/60"
                    >
                      {/* Cliente */}
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <Link
                          href={`/mediciones/${medicion.id}`}
                          className="hover:text-indigo-600"
                        >
                          {medicion.cliente?.nombre || "Cliente sin nombre"}
                        </Link>
                        {medicion.usuario && (
                          <span className="block text-[11px] font-normal text-slate-400">
                            Relevó: {medicion.usuario.nombre}
                          </span>
                        )}
                      </td>

                      {/* Contacto / Ubicación */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-xs">
                          {medicion.cliente?.telefono && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {medicion.cliente.telefono}
                            </span>
                          )}
                          {(medicion.cliente?.direccion ||
                            medicion.cliente?.localidad) && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[200px]">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {[
                                medicion.cliente.direccion,
                                medicion.cliente.localidad,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ambientes & Cortinas */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                            {cantCortinas} cortina{cantCortinas !== 1 ? "s" : ""}
                          </span>
                          <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                            {medicion.ambientes.map((a) => a.nombre).join(" • ")}
                          </p>
                        </div>
                      </td>

                      {/* Sincronización */}
                      <td className="px-6 py-4">
                        <MedicionSyncBadge sincronizado={medicion.sincronizado} />
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 text-slate-500">
                        {formatearFecha(medicion.creadoEn)}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/mediciones/${medicion.id}`}
                            title="Ver detalle de ambientes y cortinas"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {puedeEditar && (
                            <>
                              <Link
                                href={`/mediciones/${medicion.id}/editar`}
                                title="Editar medición"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                title="Eliminar medición"
                                onClick={() => setMedicionAEliminar(medicion)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {medicionAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Eliminar medición?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción eliminará todos los ambientes y cortinas relevadas.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600">
              ¿Estás seguro de que querés eliminar la medición de{" "}
              <strong className="text-slate-900">
                {medicionAEliminar.cliente?.nombre}
              </strong>
              ?
            </p>

            {errorEliminacion && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {errorEliminacion}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMedicionAEliminar(null)
                  setErrorEliminacion(null)
                }}
                disabled={eliminando}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacion}
                disabled={eliminando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {eliminando ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Confirmar eliminación"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
