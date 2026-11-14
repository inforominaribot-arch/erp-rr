import React, { useEffect, useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { obtenerArquitectosLocales, type IArquitectoCache } from "../services/storage-service"
import { ArquitectoModalMobile } from "./ArquitectoModalMobile"

// Arquitectos de un cliente en la tablet (puede tener varios). Si no está en la lista se crea acá mismo.

interface SelectorArquitectosMobileProps {
  seleccionados: string[]
  onCambiar: (ids: string[]) => void
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function SelectorArquitectosMobile({ seleccionados, onCambiar }: SelectorArquitectosMobileProps) {
  const [lista, setLista] = useState<IArquitectoCache[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [abierto, setAbierto] = useState(false)
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    obtenerArquitectosLocales().then(setLista)
  }, [])

  const elegidos = seleccionados.map((id) => lista.find((a) => a.id === id)).filter((a): a is IArquitectoCache => Boolean(a))
  const q = norm(busqueda.trim())
  const opciones = lista.filter((a) => !seleccionados.includes(a.id) && (!q || norm(a.nombre).includes(q))).slice(0, 30)

  return (
    <div className="space-y-2">
      {elegidos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {elegidos.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-indigo-800">
              {a.nombre}
              <button
                type="button"
                onClick={() => onCambiar(seleccionados.filter((id) => id !== a.id))}
                className="rounded-full p-1 hover:bg-indigo-100"
                aria-label={`Quitar a ${a.nombre}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setAbierto(true)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          placeholder="Buscar arquitecto para agregar..."
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
        />
        {abierto && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
            {opciones.map((a) => (
              <button
                key={a.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onCambiar([...seleccionados, a.id])
                  setBusqueda("")
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-800 hover:bg-indigo-50"
              >
                {a.nombre}
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setAbierto(false)
                setCreando(true)
              }}
              className="w-full flex items-center gap-1.5 px-4 py-3 text-left text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4" />
              {busqueda.trim() ? `Crear arquitecto "${busqueda.trim()}"` : "Nuevo arquitecto"}
            </button>
          </div>
        )}
      </div>
      {creando && (
        <ArquitectoModalMobile
          nombreInicial={busqueda.trim()}
          onCerrar={() => setCreando(false)}
          onGuardado={(nuevo) => {
            setLista((l) => [...l, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")))
            onCambiar([...seleccionados, nuevo.id])
            setBusqueda("")
            setCreando(false)
          }}
        />
      )}
    </div>
  )
}
