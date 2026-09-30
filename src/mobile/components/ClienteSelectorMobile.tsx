import React, { useState, useEffect } from "react"
import { ClienteExpressModalMobile } from "./ClienteExpressModalMobile"
import { obtenerClientesLocales } from "../services/storage-service"
import type { IClienteCache } from "@/modules/mediciones/lib/offline-storage"
import { Search, User, Phone, MapPin, UserPlus, Check, ChevronDown, X } from "lucide-react"

interface ClienteSelectorMobileProps {
  clienteSeleccionado: IClienteCache | null
  onSeleccionarCliente: (cliente: IClienteCache | null) => void
}

export function ClienteSelectorMobile({
  clienteSeleccionado,
  onSeleccionarCliente,
}: ClienteSelectorMobileProps) {
  const [clientes, setClientes] = useState<IClienteCache[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [desplegado, setDesplegado] = useState(false)
  const [modalExpressAbierto, setModalExpressAbierto] = useState(false)

  const cargarClientes = async () => {
    const lista = await obtenerClientesLocales()
    setClientes(lista)
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const clientesFiltrados = clientes.filter((c) => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono && c.telefono.toLowerCase().includes(q)) ||
      (c.direccion && c.direccion.toLowerCase().includes(q)) ||
      (c.localidad && c.localidad.toLowerCase().includes(q))
    )
  })

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Cliente en Obra *
          </span>
        </div>

        <button
          type="button"
          onClick={() => setModalExpressAbierto(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          + Alta Express en Obra
        </button>
      </div>

      {clienteSeleccionado ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {clienteSeleccionado.nombre}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                Seleccionado
              </span>
            </div>
            {(clienteSeleccionado.direccion || clienteSeleccionado.localidad) && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {[clienteSeleccionado.direccion, clienteSeleccionado.localidad]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {clienteSeleccionado.telefono && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{clienteSeleccionado.telefono}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSeleccionarCliente(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Cambiar cliente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2 relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setDesplegado(true)
              }}
              onFocus={() => setDesplegado(true)}
              placeholder="Buscar cliente precargado por nombre, teléfono o dirección..."
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setDesplegado(!desplegado)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {desplegado && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
              {clientesFiltrados.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    No se encontró ningún cliente con ese término.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDesplegado(false)
                      setModalExpressAbierto(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Crear cliente "{busqueda}" ahora
                  </button>
                </div>
              ) : (
                clientesFiltrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSeleccionarCliente(c)
                      setDesplegado(false)
                      setBusqueda("")
                    }}
                    className="w-full text-left p-3 hover:bg-indigo-50/60 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {c.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[c.localidad, c.direccion, c.telefono]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <Check className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Alta Express */}
      <ClienteExpressModalMobile
        abierto={modalExpressAbierto}
        onCerrar={() => setModalExpressAbierto(false)}
        onClienteCreado={(nuevo) => {
          cargarClientes()
          onSeleccionarCliente(nuevo)
        }}
      />
    </div>
  )
}
