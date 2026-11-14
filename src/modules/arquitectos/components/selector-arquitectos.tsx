"use client"

// Elegir los arquitectos de un cliente (puede tener varios). Si no está en la lista se crea ahí mismo.

import { useState } from "react"
import { Plus, Search, X } from "lucide-react"
import type { IArquitectoOpcion } from "../queries"
import { ArquitectoFormModal } from "./arquitecto-form-modal"

interface SelectorArquitectosProps {
  arquitectos: IArquitectoOpcion[]
  seleccionados: string[]
  onCambiar: (ids: string[]) => void
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function SelectorArquitectos({ arquitectos, seleccionados, onCambiar }: SelectorArquitectosProps) {
  const [lista, setLista] = useState(arquitectos)
  const [busqueda, setBusqueda] = useState("")
  const [abierto, setAbierto] = useState(false)
  const [creando, setCreando] = useState(false)

  const elegidos = seleccionados
    .map((id) => lista.find((a) => a.id === id))
    .filter((a): a is IArquitectoOpcion => Boolean(a))
  const q = norm(busqueda.trim())
  const opciones = lista.filter((a) => !seleccionados.includes(a.id) && (!q || norm(a.nombre).includes(q))).slice(0, 30)

  return (
    <div className="space-y-2">
      {elegidos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {elegidos.map((a) => (
            <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pl-2.5 pr-1 text-xs font-semibold text-indigo-800">
              {a.nombre}
              <button
                type="button"
                onClick={() => onCambiar(seleccionados.filter((id) => id !== a.id))}
                className="rounded-full p-0.5 hover:bg-indigo-100"
                aria-label={`Quitar a ${a.nombre}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setAbierto(true)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          placeholder="Buscar arquitecto para agregar..."
          className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {abierto && (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {opciones.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onCambiar([...seleccionados, a.id])
                    setBusqueda("")
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-indigo-50"
                >
                  {a.nombre}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setAbierto(false)
                  setCreando(true)
                }}
                className="flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" />
                {busqueda.trim() ? `Crear arquitecto "${busqueda.trim()}"` : "Nuevo arquitecto"}
              </button>
            </li>
          </ul>
        )}
      </div>
      {creando && (
        <ArquitectoFormModal
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
