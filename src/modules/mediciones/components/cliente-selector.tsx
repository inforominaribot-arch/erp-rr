"use client"

import { useState, useEffect } from "react"
import { ClienteExpressModal } from "./cliente-express-modal"
import {
  obtenerClientesCache,
  guardarClientesCache,
  type IClienteCache,
} from "../lib/offline-storage"
import {
  Search,
  User,
  Phone,
  MapPin,
  UserPlus,
  Check,
  ChevronDown,
  Building,
  ExternalLink,
} from "lucide-react"

interface ClienteSelectorProps {
  clienteSeleccionadoId?: string | null
  clienteSeleccionadoData?: IClienteCache | null
  clientesIniciales?: IClienteCache[]
  onSeleccionarCliente: (cliente: IClienteCache) => void
}

export function ClienteSelector({
  clienteSeleccionadoId,
  clienteSeleccionadoData,
  clientesIniciales = [],
  onSeleccionarCliente,
}: ClienteSelectorProps) {
  const [busqueda, setBusqueda] = useState("")
  const [clientes, setClientes] = useState<IClienteCache[]>(clientesIniciales)
  const [modalExpressAbierto, setModalExpressAbierto] = useState(false)
  const [desplegado, setDesplegado] = useState(false)

  // Cargar clientes desde cache offline si no vinieron por props
  useEffect(() => {
    async function cargarCache() {
      if (clientesIniciales.length > 0) {
        setClientes(clientesIniciales)
        await guardarClientesCache(clientesIniciales)
      } else {
        const cache = await obtenerClientesCache()
        if (cache.length > 0) {
          setClientes(cache)
        }
      }
    }
    cargarCache()
  }, [clientesIniciales])

  const clienteActual =
    clienteSeleccionadoData ||
    clientes.find((c) => c.id === clienteSeleccionadoId)

  // Filtrado reactivo
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

  function handleSeleccionar(c: IClienteCache) {
    onSeleccionarCliente(c)
    setDesplegado(false)
    setBusqueda("")
  }

  function handleClienteCreado(nuevoCliente: IClienteCache) {
    setClientes((prev) => [nuevoCliente, ...prev])
    onSeleccionarCliente(nuevoCliente)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Cliente del Relevamiento
          </h3>
          <p className="text-xs text-slate-500">
            Buscá un cliente existente o registrá uno express en la visita
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalExpressAbierto(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4 text-indigo-600" />
          + Alta Express en Obra
        </button>
      </div>

      {/* Cliente actualmente seleccionado */}
      {clienteActual ? (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {clienteActual.nombre}
                </span>
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Seleccionado
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                {clienteActual.telefono && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {clienteActual.telefono}
                  </span>
                )}
                {(clienteActual.direccion || clienteActual.localidad) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {[clienteActual.direccion, clienteActual.localidad]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDesplegado(!desplegado)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              {desplegado ? "Cerrar buscador" : "Cambiar cliente"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setDesplegado(true)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-4 text-left hover:bg-indigo-50/60 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-indigo-950">
                  Seleccionar un cliente
                </p>
                <p className="text-xs text-indigo-700">
                  Tocá aquí para buscar en la lista o crear un nuevo cliente
                </p>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-indigo-600" />
          </button>
        </div>
      )}

      {/* Buscador Desplegable de Clientes */}
      {desplegado && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-md animate-in fade-in duration-100">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, teléfono, dirección..."
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="mt-2 max-h-56 overflow-y-auto divide-y divide-slate-100">
            {clientesFiltrados.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                No se encontraron clientes con "{busqueda}".
                <button
                  type="button"
                  onClick={() => setModalExpressAbierto(true)}
                  className="mt-2 block mx-auto text-indigo-600 font-bold hover:underline"
                >
                  + Dar de alta ahora
                </button>
              </div>
            ) : (
              clientesFiltrados.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSeleccionar(c)}
                  className="flex w-full items-center justify-between p-2.5 text-left hover:bg-slate-50 rounded-lg transition"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{c.nombre}</p>
                    <p className="text-[11px] text-slate-500">
                      {[c.telefono, c.localidad].filter(Boolean).join(" • ") ||
                        "Sin contacto"}
                    </p>
                  </div>
                  {clienteActual?.id === c.id && (
                    <Check className="h-4 w-4 text-indigo-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Express */}
      <ClienteExpressModal
        abierto={modalExpressAbierto}
        onCerrar={() => setModalExpressAbierto(false)}
        onClienteCreado={handleClienteCreado}
      />
    </div>
  )
}
