"use client"

// Lista de arquitectos: buscar, crear, editar y borrar. Tocar uno abre su ficha con sus clientes.

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DraftingCompass, Edit2, Phone, Plus, Search, Trash2, Users } from "lucide-react"
import { eliminarArquitecto } from "../actions"
import type { IArquitectoResumen } from "../queries"
import { ArquitectoFormModal, type IArquitectoEditable } from "./arquitecto-form-modal"

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function ArquitectosLista({ arquitectos }: { arquitectos: IArquitectoResumen[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [busqueda, setBusqueda] = useState("")
  const [editando, setEditando] = useState<IArquitectoEditable | null>(null)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const q = norm(busqueda.trim())
  const filtrados = q
    ? arquitectos.filter((a) => norm(a.nombre).includes(q) || norm(a.telefono).includes(q) || norm(a.email).includes(q))
    : arquitectos

  const refrescar = () => startTransition(() => router.refresh())

  async function borrar(a: IArquitectoResumen) {
    const aviso =
      a.clientes > 0
        ? `¿Borrar a ${a.nombre}? Sus ${a.clientes} cliente${a.clientes === 1 ? "" : "s"} no se borran: quedan sin este arquitecto.`
        : `¿Borrar a ${a.nombre}?`
    if (!window.confirm(aviso)) return
    setError(null)
    const res = await eliminarArquitecto(a.id)
    if (!res.success) setError(res.error)
    refrescar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar arquitecto por nombre, teléfono o email..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo arquitecto
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtrados.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <DraftingCompass className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {busqueda ? "No hay arquitectos con ese nombre." : "Todavía no hay arquitectos cargados."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtrados.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60">
                <Link href={`/arquitectos/${a.id}`} className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 hover:text-indigo-600">{a.nombre}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    {a.telefono && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {a.telefono}
                      </span>
                    )}
                    {a.email && <span>{a.email}</span>}
                  </span>
                </Link>
                <Link
                  href={`/arquitectos/${a.id}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Users className="h-3.5 w-3.5" />
                  {a.clientes} cliente{a.clientes === 1 ? "" : "s"}
                </Link>
                <button
                  type="button"
                  onClick={() => setEditando(a)}
                  title="Editar"
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => borrar(a)}
                  title="Borrar"
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
          Mostrando <strong>{filtrados.length}</strong> de <strong>{arquitectos.length}</strong> arquitectos
        </div>
      </div>

      {(creando || editando) && (
        <ArquitectoFormModal
          arquitecto={editando}
          nombreInicial={creando ? busqueda.trim() : undefined}
          onCerrar={() => {
            setCreando(false)
            setEditando(null)
          }}
          onGuardado={() => {
            setCreando(false)
            setEditando(null)
            refrescar()
          }}
        />
      )}
    </div>
  )
}
