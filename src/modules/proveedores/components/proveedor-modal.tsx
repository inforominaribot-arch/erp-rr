// Módulo: Proveedores & Compras
// Modal de Alta y Edición de Proveedor

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { crearProveedor, actualizarProveedor } from "../actions"
import type { IProveedor } from "../types"

interface ProveedorModalProps {
  abierto: boolean
  proveedorAEditar?: IProveedor | null
  onCerrar: () => void
  onGuardado?: (proveedor: IProveedor) => void
}

export function ProveedorModal({
  abierto,
  proveedorAEditar,
  onCerrar,
  onGuardado,
}: ProveedorModalProps) {
  const router = useRouter()

  const [nombre, setNombre] = useState("")
  const [contacto, setContacto] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [direccion, setDireccion] = useState("")
  const [notas, setNotas] = useState("")
  const [activo, setActivo] = useState(true)

  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  useEffect(() => {
    if (proveedorAEditar) {
      setNombre(proveedorAEditar.nombre)
      setContacto(proveedorAEditar.contacto || "")
      setTelefono(proveedorAEditar.telefono || "")
      setEmail(proveedorAEditar.email || "")
      setDireccion(proveedorAEditar.direccion || "")
      setNotas(proveedorAEditar.notas || "")
      setActivo(proveedorAEditar.activo)
    } else {
      setNombre("")
      setContacto("")
      setTelefono("")
      setEmail("")
      setDireccion("")
      setNotas("")
      setActivo(true)
    }
    setErrorGlobal(null)
  }, [proveedorAEditar, abierto])

  if (!abierto) return null

  const esEdicion = !!proveedorAEditar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorGlobal(null)

    if (!nombre.trim() || nombre.trim().length < 2) {
      setErrorGlobal("El nombre o razón social debe tener al menos 2 caracteres.")
      return
    }

    setGuardando(true)

    try {
      const payload = {
        nombre: nombre.trim(),
        contacto: contacto.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        direccion: direccion.trim() || null,
        notas: notas.trim() || null,
        activo,
      }

      let res
      if (esEdicion && proveedorAEditar) {
        res = await actualizarProveedor(proveedorAEditar.id, payload)
      } else {
        res = await crearProveedor(payload)
      }

      if (!res.success) {
        setErrorGlobal(res.error || "Ocurrió un error al guardar el proveedor.")
        setGuardando(false)
        return
      }

      router.refresh()
      if (onGuardado) onGuardado(res.data)
      onCerrar()
    } catch (err: any) {
      console.error("Error al guardar proveedor:", err)
      setErrorGlobal(err.message || "Error al procesar la solicitud.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {esEdicion ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h2>
              <p className="text-xs text-slate-500">
                {esEdicion
                  ? "Modificá los datos de contacto y facturación"
                  : "Completá los datos para la agenda de compras"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorGlobal && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorGlobal}</span>
            </div>
          )}

          {/* Nombre / Razón Social */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Razón Social / Nombre Comercial *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Telas & Cía S.A., Rollershade, Hunter Douglas"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                required
              />
            </div>
          </div>

          {/* Contacto & Teléfono */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Persona de Contacto
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Ej: Marcelo Gómez (Ventas)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 11 5544-3322"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Email & Dirección */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email de Pedidos
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pedidos@proveedor.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dirección / Depósito
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: Av. Warnes 1234, CABA"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas y Condiciones Comerciales
            </label>
            <div className="relative">
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                placeholder="Plazo de entrega habitual, días de despacho, CBU bancario o requisitos de factura..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Estado Activo */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <input
              type="checkbox"
              id="proveedor-activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="proveedor-activo"
              className="text-xs font-medium text-slate-700 cursor-pointer select-none"
            >
              Proveedor Activo (disponible para emitir órdenes de compra)
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 focus:outline-hidden transition disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {esEdicion ? "Actualizar Proveedor" : "Guardar Proveedor"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
