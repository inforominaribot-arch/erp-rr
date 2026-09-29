"use client"

import { useState } from "react"
import Link from "next/link"
import { CortinaDibujoDidactico } from "./cortina-dibujo-didactico"
import { MedicionSyncBadge } from "./medicion-sync-badge"
import { ClienteExpressModal } from "./cliente-express-modal"
import { formatearFecha } from "@/lib/utils"
import type { IMedicion } from "../types"
import {
  Search,
  User,
  Phone,
  MapPin,
  Building,
  Plus,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  Ruler,
  Calendar,
  Eye,
  Edit2,
  UserPlus,
} from "lucide-react"

interface ClienteConMediciones {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  localidad: string | null
  estado?: string
  creadoEn: Date | string
  mediciones: IMedicion[]
}

interface MedicionClientesGridProps {
  clientes: ClienteConMediciones[]
}

export function MedicionClientesGrid({ clientes }: MedicionClientesGridProps) {
  const [busqueda, setBusqueda] = useState("")
  const [clienteExpandidoId, setClienteExpandidoId] = useState<string | null>(
    clientes.length > 0 ? clientes[0].id : null
  )
  const [modalExpressAbierto, setModalExpressAbierto] = useState(false)

  // Filtrado de clientes
  const clientesFiltrados = clientes.filter((c) => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase().trim()
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono && c.telefono.toLowerCase().includes(q)) ||
      (c.direccion && c.direccion.toLowerCase().includes(q)) ||
      (c.localidad && c.localidad.toLowerCase().includes(q))
    )
  })

  const clienteSeleccionado = clientes.find((c) => c.id === clienteExpandidoId)

  return (
    <div className="space-y-6">
      {/* ── Barra de Búsqueda y Botón de Nuevo Cliente Express ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, teléfono, dirección o localidad..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalExpressAbierto(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
          >
            <UserPlus className="h-4 w-4 text-indigo-600" />
            + Alta Express Cliente
          </button>

          <Link
            href="/mediciones/nueva"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Nueva Medición
          </Link>
        </div>
      </div>

      {/* ── Layout en Dos Columnas: Lista de Clientes (izq) y Detalle de Ambientes / Cortinas (der) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Tarjetas / Mini Resumen de Clientes */}
        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Clientes ({clientesFiltrados.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {clientesFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                No se encontraron clientes.
              </div>
            ) : (
              clientesFiltrados.map((cliente) => {
                const activo = cliente.id === clienteExpandidoId
                const cantMediciones = cliente.mediciones?.length || 0
                const cantAmbientes = (cliente.mediciones || []).reduce(
                  (acc, m) => acc + (m.ambientes?.length || 0),
                  0
                )
                const cantCortinas = (cliente.mediciones || []).reduce(
                  (acc, m) =>
                    acc +
                    (m.ambientes || []).reduce(
                      (subAcc, a) => subAcc + (a.items?.length || 0),
                      0
                    ),
                  0
                )

                return (
                  <div
                    key={cliente.id}
                    onClick={() => setClienteExpandidoId(cliente.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      activo
                        ? "border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">
                          {cliente.nombre}
                        </h4>

                        {/* Mini Resumen: Teléfono y Dirección */}
                        <div className="space-y-0.5 text-xs text-slate-500">
                          {cliente.telefono ? (
                            <a
                              href={`https://wa.me/${cliente.telefono.replace(
                                /[^0-9]/g,
                                ""
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-indigo-600"
                            >
                              <Phone className="h-3 w-3 text-slate-400" />
                              {cliente.telefono}
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Sin teléfono
                            </span>
                          )}

                          {(cliente.direccion || cliente.localidad) && (
                            <p className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate max-w-[200px]">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {[cliente.direccion, cliente.localidad]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition ${
                          activo ? "text-indigo-600 translate-x-0.5" : "text-slate-300"
                        }`}
                      />
                    </div>

                    {/* Resumen de Trabajos / Ambientes */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                        {cantMediciones} med. • {cantAmbientes} amb. • {cantCortinas} cort.
                      </span>

                      <Link
                        href={`/mediciones/nueva?clienteId=${cliente.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        + Relevar
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Ambientes y Cortinas del Cliente con el Dibujo Didáctico */}
        <div className="space-y-4 lg:col-span-8">
          {clienteSeleccionado ? (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              {/* Cabecera del Cliente Seleccionado */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {clienteSeleccionado.nombre}
                    </h3>
                    <Link
                      href={`/clientes/${clienteSeleccionado.id}`}
                      className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      Ficha CRM <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {clienteSeleccionado.telefono && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {clienteSeleccionado.telefono}
                      </span>
                    )}
                    {(clienteSeleccionado.direccion ||
                      clienteSeleccionado.localidad) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {[
                          clienteSeleccionado.direccion,
                          clienteSeleccionado.localidad,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/mediciones/nueva?clienteId=${clienteSeleccionado.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 self-start sm:self-auto transition"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Medición a este Cliente
                </Link>
              </div>

              {/* Listado de Mediciones y sus Ambientes */}
              {clienteSeleccionado.mediciones.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Ruler className="h-6 w-6" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-800">
                    Sin mediciones tomadas aún
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Este cliente aún no tiene aberturas ni cortinas relevadas en el
                    sistema.
                  </p>
                  <Link
                    href={`/mediciones/nueva?clienteId=${clienteSeleccionado.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    Comenzar Relevamiento en Obra
                  </Link>
                </div>
              ) : (
                <div className="space-y-8">
                  {clienteSeleccionado.mediciones.map((medicion, mIdx) => (
                    <div
                      key={medicion.id}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-4 sm:p-5 space-y-5"
                    >
                      {/* Cabecera de la Medición */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                            #{mIdx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              Medición del {formatearFecha(medicion.creadoEn)}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Tomada por {medicion.usuario?.nombre || "Vendedora"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MedicionSyncBadge
                            sincronizado={medicion.sincronizado}
                          />

                          <Link
                            href={`/mediciones/${medicion.id}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                          >
                            Ver detalle / Imprimir
                          </Link>
                        </div>
                      </div>

                      {/* Ambientes de la Medición */}
                      <div className="space-y-6">
                        {medicion.ambientes.map((ambiente) => (
                          <div key={ambiente.id} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-indigo-600" />
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Ambiente: {ambiente.nombre}
                              </h5>
                              <span className="text-xs text-slate-400">
                                ({ambiente.items.length} cortina
                                {ambiente.items.length !== 1 ? "s" : ""})
                              </span>
                            </div>

                            {/* Cortinas relevadas con Dibujo Didáctico */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                              {ambiente.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900">
                                      {item.descripcion}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500">
                                      {item.cantidad} unid. • {item.ancho}m ×{" "}
                                      {item.alto}m
                                    </span>
                                  </div>

                                  {/* Dibujo Didáctico Conceptual */}
                                  <CortinaDibujoDidactico
                                    ancho={item.ancho}
                                    alto={item.alto}
                                    caracteristicas={item.caracteristicas}
                                  />

                                  {item.observaciones && (
                                    <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900 border border-amber-200">
                                      <strong>Obs:</strong> {item.observaciones}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {medicion.observaciones && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                          <span className="font-bold text-slate-900">
                            Observaciones de la visita:
                          </span>{" "}
                          {medicion.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
              Seleccioná un cliente de la columna izquierda para ver sus ambientes y
              cortinas.
            </div>
          )}
        </div>
      </div>

      {/* Modal Express */}
      <ClienteExpressModal
        abierto={modalExpressAbierto}
        onCerrar={() => setModalExpressAbierto(false)}
        onClienteCreado={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}
