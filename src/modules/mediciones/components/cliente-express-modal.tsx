"use client"

import { useState } from "react"
import { crearClienteExpress } from "../actions"
import { clienteExpressSchema, type ClienteExpressInput } from "../schemas"
import { guardarClientesCache } from "../lib/offline-storage"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  Loader2,
  X,
  UserPlus,
} from "lucide-react"

interface ClienteExpressModalProps {
  abierto: boolean
  onCerrar: () => void
  onClienteCreado: (cliente: {
    id: string
    nombre: string
    telefono?: string | null
    direccion?: string | null
    localidad?: string | null
  }) => void
}

export function ClienteExpressModal({
  abierto,
  onCerrar,
  onClienteCreado,
}: ClienteExpressModalProps) {
  const [cargando, setCargando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClienteExpressInput>({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    localidad: "",
    notas: "",
  })

  if (!abierto) return null

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorGlobal(null)

    const validacion = clienteExpressSchema.safeParse(formData)
    if (!validacion.success) {
      setErrorGlobal(validacion.error.issues[0]?.message || "Datos inválidos")
      return
    }

    setCargando(true)

    try {
      if (navigator.onLine) {
        const res = await crearClienteExpress(validacion.data)
        if (!res.success) {
          setErrorGlobal(res.error || "No se pudo registrar el cliente")
          return
        }

        // Guardar en caché offline también
        await guardarClientesCache([
          {
            id: res.data.id,
            nombre: res.data.nombre,
            telefono: res.data.telefono,
            direccion: formData.direccion,
            localidad: formData.localidad,
          },
        ])

        onClienteCreado({
          id: res.data.id,
          nombre: res.data.nombre,
          telefono: res.data.telefono,
          direccion: formData.direccion,
          localidad: formData.localidad,
        })
      } else {
        // Modo Offline: generar un ID local temporal y guardar en caché local
        const idLocalTemp = `offline_cli_${Date.now()}`
        const clienteOffline = {
          id: idLocalTemp,
          nombre: formData.nombre,
          telefono: formData.telefono || null,
          direccion: formData.direccion || null,
          localidad: formData.localidad || null,
        }

        await guardarClientesCache([clienteOffline])
        onClienteCreado(clienteOffline)
      }

      onCerrar()
    } catch {
      setErrorGlobal("Ocurrió un error inesperado al crear el cliente.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Alta Express de Cliente
              </h3>
              <p className="text-xs text-slate-500">
                Registrá al cliente en el momento de la visita
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorGlobal && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {errorGlobal}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Nombre Completo / Razón Social <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Marcelo Gómez o Familia Rossi"
                className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Teléfono */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Teléfono / WhatsApp
              </label>
              <div className="relative mt-1">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono || ""}
                  onChange={handleChange}
                  placeholder="Ej: 11 4455-6677"
                  className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="cliente@ejemplo.com"
                  className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Dirección */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Dirección / Barrio
              </label>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion || ""}
                  onChange={handleChange}
                  placeholder="Calle 1234, Barrio Cerrado Lote 5"
                  className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Localidad */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Localidad / Zona
              </label>
              <div className="relative mt-1">
                <Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="localidad"
                  value={formData.localidad || ""}
                  onChange={handleChange}
                  placeholder="Ej: Tigre, Nordelta, Santa Fe"
                  className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {cargando ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Guardar y Seleccionar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
