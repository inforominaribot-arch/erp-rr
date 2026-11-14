import React, { useState } from "react"
import { Check, DraftingCompass, X } from "lucide-react"
import { guardarArquitectoLocal, type IArquitectoCache } from "../services/storage-service"

// Alta o edición de un arquitecto en la tablet (se guarda sin internet y se sube al sincronizar).

interface ArquitectoModalMobileProps {
  arquitecto?: IArquitectoCache | null
  nombreInicial?: string
  onCerrar: () => void
  onGuardado: (arquitecto: IArquitectoCache) => void
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const claseInput =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"

export function ArquitectoModalMobile({ arquitecto, nombreInicial, onCerrar, onGuardado }: ArquitectoModalMobileProps) {
  const [nombre, setNombre] = useState(arquitecto?.nombre ?? nombreInicial ?? "")
  const [telefono, setTelefono] = useState(arquitecto?.telefono ?? "")
  const [email, setEmail] = useState(arquitecto?.email ?? "")
  const [notas, setNotas] = useState(arquitecto?.notas ?? "")
  const [error, setError] = useState<string | null>(null)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nombre.trim().length < 2) return setError("El nombre del arquitecto es obligatorio (mínimo 2 letras).")
    if (email.trim() && !EMAIL_VALIDO.test(email.trim())) return setError("El email no es válido.")
    try {
      const guardado = await guardarArquitectoLocal({
        id: arquitecto?.id,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        notas: notas.trim() || null,
      })
      onGuardado(guardado)
    } catch {
      setError("No se pudo guardar el arquitecto en la tablet.")
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <form onSubmit={guardar} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DraftingCompass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{arquitecto ? "Editar arquitecto" : "Nuevo arquitecto"}</h3>
          </div>
          <button type="button" onClick={onCerrar} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>}
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Nombre y apellido *
            <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${claseInput} mt-1.5`} />
          </label>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Teléfono
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={`${claseInput} mt-1.5`} />
          </label>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${claseInput} mt-1.5`} />
          </label>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Notas
            <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} className={`${claseInput} mt-1.5`} />
          </label>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2.5">
          <button type="button" onClick={onCerrar} className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 min-h-[44px]">
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}
