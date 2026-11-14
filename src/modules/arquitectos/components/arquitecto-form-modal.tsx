"use client"

// Alta o edición de un arquitecto (nombre, teléfono, email y notas).

import { useState } from "react"
import { Loader2, X } from "lucide-react"
import { actualizarArquitecto, crearArquitecto } from "../actions"
import { arquitectoSchema } from "../schemas"

export interface IArquitectoEditable {
  id?: string
  nombre: string
  telefono?: string | null
  email?: string | null
  notas?: string | null
}

interface ArquitectoFormModalProps {
  arquitecto?: IArquitectoEditable | null
  /** Nombre sugerido al dar de alta (ej: lo que se escribió en el buscador) */
  nombreInicial?: string
  onCerrar: () => void
  onGuardado: (arquitecto: { id: string; nombre: string }) => void
}

const claseInput =
  "mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"

export function ArquitectoFormModal({ arquitecto, nombreInicial, onCerrar, onGuardado }: ArquitectoFormModalProps) {
  const editando = Boolean(arquitecto?.id)
  const [datos, setDatos] = useState({
    nombre: arquitecto?.nombre ?? nombreInicial ?? "",
    telefono: arquitecto?.telefono ?? "",
    email: arquitecto?.email ?? "",
    notas: arquitecto?.notas ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const v = arquitectoSchema.safeParse(datos)
    if (!v.success) {
      setError(v.error.issues.map((i) => i.message).join(", "))
      return
    }
    setGuardando(true)
    try {
      if (editando && arquitecto?.id) {
        const res = await actualizarArquitecto(arquitecto.id, v.data)
        if (!res.success) return setError(res.error)
        onGuardado({ id: arquitecto.id, nombre: v.data.nombre })
      } else {
        const res = await crearArquitecto(v.data)
        if (!res.success) return setError(res.error)
        onGuardado(res.data)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <form onSubmit={guardar} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{editando ? "Editar arquitecto" : "Nuevo arquitecto"}</h3>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
        <label className="block text-xs font-medium text-slate-700">
          Nombre y apellido *
          <input autoFocus value={datos.nombre} onChange={cambiar("nombre")} required className={claseInput} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-700">
            Teléfono
            <input type="tel" value={datos.telefono} onChange={cambiar("telefono")} className={claseInput} />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Email
            <input type="email" value={datos.email} onChange={cambiar("email")} className={claseInput} />
          </label>
        </div>
        <label className="block text-xs font-medium text-slate-700">
          Notas
          <textarea rows={2} value={datos.notas} onChange={cambiar("notas")} className={claseInput} />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCerrar} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {editando ? "Guardar cambios" : "Crear arquitecto"}
          </button>
        </div>
      </form>
    </div>
  )
}
