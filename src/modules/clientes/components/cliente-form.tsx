"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { crearCliente, actualizarCliente } from "../actions"
import { clienteSchema, type ClienteInput } from "../schemas"
import type { ICliente } from "../types"

interface ClienteFormProps {
  cliente?: ICliente | null
  modo?: "crear" | "editar"
  onExito?: (cliente: ICliente) => void
  onCancelar?: () => void
}

export function ClienteForm({
  cliente,
  modo = "crear",
  onExito,
  onCancelar,
}: ClienteFormProps) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ClienteInput>({
    nombre: cliente?.nombre || "",
    telefono: cliente?.telefono || "",
    email: cliente?.email || "",
    direccion: cliente?.direccion || "",
    localidad: cliente?.localidad || "",
    notas: cliente?.notas || "",
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (erroresCampos[name]) {
      setErroresCampos((prev) => {
        const nuevo = { ...prev }
        delete nuevo[name]
        return nuevo
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorGlobal(null)
    setErroresCampos({})

    // Validar en cliente con Zod
    const validacion = clienteSchema.safeParse(formData)
    if (!validacion.success) {
      const errMap: Record<string, string> = {}
      for (const err of validacion.error.issues) {
        const campo = err.path[0] as string
        if (campo && !errMap[campo]) {
          errMap[campo] = err.message
        }
      }
      setErroresCampos(errMap)
      return
    }

    setCargando(true)

    try {
      if (modo === "editar" && cliente?.id) {
        const res = await actualizarCliente(cliente.id, validacion.data)
        if (!res.success) {
          setErrorGlobal(res.error)
          return
        }
        if (onExito) {
          onExito(res.data as unknown as ICliente)
        } else {
          router.push(`/clientes/${cliente.id}`)
          router.refresh()
        }
      } else {
        const res = await crearCliente(validacion.data)
        if (!res.success) {
          setErrorGlobal(res.error)
          return
        }
        if (onExito) {
          onExito(res.data as unknown as ICliente)
        } else {
          router.push(`/clientes/${res.data.id}`)
          router.refresh()
        }
      }
    } catch {
      setErrorGlobal("Ocurrió un error inesperado al procesar la solicitud.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {errorGlobal && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="font-medium">Error al guardar el cliente</p>
            <p className="mt-0.5 text-xs text-red-600">{errorGlobal}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Sección: Datos Principales */}
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Información del Contacto
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Datos identificatorios y canales directos de comunicación.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-slate-700"
              >
                Nombre completo o Razón Social{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Sofía Martínez o Residencial Los Álamos"
                  required
                  className={`block w-full rounded-lg border pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    erroresCampos.nombre
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
              </div>
              {erroresCampos.nombre && (
                <p className="mt-1 text-xs text-red-600">{erroresCampos.nombre}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label
                htmlFor="telefono"
                className="block text-sm font-medium text-slate-700"
              >
                Teléfono / WhatsApp
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono || ""}
                  onChange={handleChange}
                  placeholder="Ej: +54 9 11 4455-6677"
                  className="block w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {erroresCampos.telefono && (
                <p className="mt-1 text-xs text-red-600">
                  {erroresCampos.telefono}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Correo Electrónico
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="cliente@ejemplo.com"
                  className={`block w-full rounded-lg border pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    erroresCampos.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
              </div>
              {erroresCampos.email && (
                <p className="mt-1 text-xs text-red-600">{erroresCampos.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Separador */}
        <hr className="border-slate-200" />

        {/* Sección: Ubicación */}
        <div>
          <h2 className="text-base font-semibold text-slate-900">Ubicación</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dirección para visita de medición e instalación.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Dirección */}
            <div>
              <label
                htmlFor="direccion"
                className="block text-sm font-medium text-slate-700"
              >
                Dirección (Calle y Altura / Piso / Dpto)
              </label>
              <div className="relative mt-1.5">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion || ""}
                  onChange={handleChange}
                  placeholder="Av. del Libertador 4500, 4to B"
                  className="block w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {erroresCampos.direccion && (
                <p className="mt-1 text-xs text-red-600">
                  {erroresCampos.direccion}
                </p>
              )}
            </div>

            {/* Localidad */}
            <div>
              <label
                htmlFor="localidad"
                className="block text-sm font-medium text-slate-700"
              >
                Localidad / Barrio / Zona
              </label>
              <div className="relative mt-1.5">
                <Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="localidad"
                  name="localidad"
                  value={formData.localidad || ""}
                  onChange={handleChange}
                  placeholder="Ej: Tigre, Nordelta, Palermo"
                  className="block w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {erroresCampos.localidad && (
                <p className="mt-1 text-xs text-red-600">
                  {erroresCampos.localidad}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Separador */}
        <hr className="border-slate-200" />

        {/* Sección: Notas y Observaciones */}
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Notas y Observaciones
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Detalles relevantes como preferencias, horarios de visita, etc.
          </p>

          <div className="mt-4">
            <div className="relative">
              <textarea
                id="notas"
                name="notas"
                rows={3}
                value={formData.notas || ""}
                onChange={handleChange}
                placeholder="Observaciones de acceso al domicilio, tipo de cortinas de interés, etc."
                className="block w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            {erroresCampos.notas && (
              <p className="mt-1 text-xs text-red-600">{erroresCampos.notas}</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        {onCancelar ? (
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
        ) : (
          <Link
            href={cliente?.id ? `/clientes/${cliente.id}` : "/clientes"}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {cargando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              {modo === "editar" ? "Guardar Cambios" : "Crear Cliente"}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
