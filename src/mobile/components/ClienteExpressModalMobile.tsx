import React, { useState } from "react"
import { agregarClienteExpressLocal } from "../services/storage-service"
import type { IClienteCache } from "@/modules/mediciones/lib/offline-storage"
import { User, Phone, MapPin, Building, FileText, X, Check } from "lucide-react"

interface ClienteExpressModalMobileProps {
  abierto: boolean
  onCerrar: () => void
  onClienteCreado: (cliente: IClienteCache) => void
}

export function ClienteExpressModalMobile({
  abierto,
  onCerrar,
  onClienteCreado,
}: ClienteExpressModalMobileProps) {
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [localidad, setLocalidad] = useState("")
  const [notas, setNotas] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (!abierto) return null

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError("El nombre o apellido del cliente es obligatorio.")
      return
    }

    const nuevoCliente: IClienteCache = {
      id: `cli_offline_${Date.now()}`,
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      direccion: direccion.trim() || null,
      localidad: localidad.trim() || null,
      estado: "MEDICION_TOMADA",
    }

    try {
      await agregarClienteExpressLocal(nuevoCliente)
      onClienteCreado(nuevoCliente)
      onCerrar()
    } catch (err: any) {
      setError("No se pudo guardar el cliente en el almacenamiento local.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Alta Express de Cliente en Obra
              </h3>
              <p className="text-xs text-slate-500">
                Disponible de inmediato sin internet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre y Apellido *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Marcelo Tinelli / María López"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 11 5555 4444"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Localidad / Barrio
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  placeholder="Ej: Nordelta / Palermo"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Dirección de la Obra
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej: Av. del Libertador 4500, Piso 12"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notas u Observaciones
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Arquitecto a cargo, código de acceso al lote..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-colors min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
