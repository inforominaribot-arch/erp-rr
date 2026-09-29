"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  UserCheck,
  ExternalLink,
} from "lucide-react"
import { ClienteEstadoBadge } from "./cliente-estado-badge"
import { eliminarCliente } from "../actions"
import type { IClienteConConteo } from "../types"
import type { EstadoCliente } from "@/types"
import { ESTADO_CLIENTE_LABELS } from "@/types"

interface ClienteTablaProps {
  clientesIniciales: IClienteConConteo[]
}

const OPCIONES_FILTRO_ESTADO: Array<{ valor: string; label: string }> = [
  { valor: "TODOS", label: "Todos los estados" },
  { valor: "MEDICION_TOMADA", label: "Medición tomada" },
  { valor: "PRESUPUESTO_ENVIADO", label: "Presupuesto enviado" },
  { valor: "PRESUPUESTO_ACEPTADO", label: "Presupuesto aceptado" },
  { valor: "EN_PRODUCCION", label: "En producción" },
  { valor: "INSTALADO", label: "Instalado" },
]

export function ClienteTabla({ clientesIniciales }: ClienteTablaProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS")

  // Estado para modal de confirmación de eliminación
  const [clienteAEliminar, setClienteAEliminar] = useState<IClienteConConteo | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null)

  // Filtrado local en cliente
  const clientesFiltrados = clientesIniciales.filter((cliente) => {
    const cumpleEstado =
      filtroEstado === "TODOS" || cliente.estado === filtroEstado

    if (!cumpleEstado) return false

    if (!busqueda.trim()) return true

    const q = busqueda.toLowerCase().trim()
    const nombre = cliente.nombre?.toLowerCase() || ""
    const telefono = cliente.telefono?.toLowerCase() || ""
    const direccion = cliente.direccion?.toLowerCase() || ""
    const localidad = cliente.localidad?.toLowerCase() || ""
    const email = cliente.email?.toLowerCase() || ""

    return (
      nombre.includes(q) ||
      telefono.includes(q) ||
      direccion.includes(q) ||
      localidad.includes(q) ||
      email.includes(q)
    )
  })

  async function handleConfirmarEliminacion() {
    if (!clienteAEliminar) return
    setEliminando(true)
    setErrorEliminacion(null)

    try {
      const res = await eliminarCliente(clienteAEliminar.id)
      if (!res.success) {
        setErrorEliminacion(res.error)
        return
      }
      setClienteAEliminar(null)
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setErrorEliminacion("Ocurrió un error inesperado al intentar eliminar.")
    } finally {
      setEliminando(false)
    }
  }

  function formatearFecha(fecha: Date | string) {
    const d = new Date(fecha)
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, teléfono, localidad, dirección..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {OPCIONES_FILTRO_ESTADO.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Contacto
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Ubicación
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Estado Actual
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Trabajos
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Fecha Alta
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-800">
                      No se encontraron clientes
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {busqueda || filtroEstado !== "TODOS"
                        ? "Probá ajustando los términos de búsqueda o el filtro de estado."
                        : "Aún no hay clientes registrados en el sistema."}
                    </p>
                    {!busqueda && filtroEstado === "TODOS" && (
                      <Link
                        href="/clientes/nuevo"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        Crear primer cliente
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="transition hover:bg-slate-50/60"
                  >
                    {/* Cliente */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="group flex flex-col"
                      >
                        <span className="font-medium text-slate-900 group-hover:text-indigo-600">
                          {cliente.nombre}
                        </span>
                        {cliente.email && (
                          <span className="text-xs text-slate-400 truncate max-w-[200px]">
                            {cliente.email}
                          </span>
                        )}
                      </Link>
                    </td>

                    {/* Teléfono */}
                    <td className="px-6 py-4">
                      {cliente.telefono ? (
                        <a
                          href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-indigo-600"
                          title="Contactar por WhatsApp"
                        >
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {cliente.telefono}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    {/* Ubicación */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-slate-800">
                          {cliente.localidad || "Sin localidad"}
                        </span>
                        {cliente.direccion && (
                          <span className="text-slate-400 truncate max-w-[220px]">
                            {cliente.direccion}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <ClienteEstadoBadge estado={cliente.estado} />
                    </td>

                    {/* Conteo de Trabajos */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span
                          className="rounded bg-slate-100 px-2 py-0.5 text-slate-700"
                          title="Mediciones registradas"
                        >
                          {cliente._count?.mediciones || 0} med.
                        </span>
                        <span
                          className="rounded bg-slate-100 px-2 py-0.5 text-slate-700"
                          title="Presupuestos generados"
                        >
                          {cliente._count?.presupuestos || 0} ppto.
                        </span>
                      </div>
                    </td>

                    {/* Fecha de creación */}
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatearFecha(cliente.creadoEn)}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/clientes/${cliente.id}`}
                          title="Ver detalle"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/clientes/${cliente.id}/editar`}
                          title="Editar datos"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setClienteAEliminar(cliente)}
                          title="Eliminar cliente"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con resumen */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
          <span>
            Mostrando <strong>{clientesFiltrados.length}</strong> de{" "}
            <strong>{clientesIniciales.length}</strong> clientes
          </span>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {clienteAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  ¿Eliminar cliente?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              ¿Estás seguro de que querés eliminar a{" "}
              <strong className="text-slate-900">{clienteAEliminar.nombre}</strong>?
            </p>

            {errorEliminacion && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errorEliminacion}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setClienteAEliminar(null)
                  setErrorEliminacion(null)
                }}
                disabled={eliminando}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacion}
                disabled={eliminando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {eliminando ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Confirmar eliminación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
