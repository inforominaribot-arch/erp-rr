"use client"

// Ficha del arquitecto: sus datos (editar / borrar) y sus clientes, con acceso a cada medición.

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Edit2, Mail, Phone, Ruler, Search, Trash2, Users } from "lucide-react"
import { ClienteEstadoBadge } from "@/modules/clientes/components/cliente-estado-badge"
import type { EstadoCliente } from "@/types"
import { eliminarArquitecto } from "../actions"
import type { IArquitectoDetalle } from "../queries"
import { ArquitectoFormModal } from "./arquitecto-form-modal"

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
const fecha = (d: Date | string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })

export function ArquitectoDetalle({ arquitecto }: { arquitecto: IArquitectoDetalle }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editando, setEditando] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [error, setError] = useState<string | null>(null)

  const q = norm(busqueda.trim())
  const clientes = q
    ? arquitecto.clientes.filter((c) => norm(c.nombre).includes(q) || norm(c.localidad).includes(q) || norm(c.direccion).includes(q))
    : arquitecto.clientes

  async function borrar() {
    const n = arquitecto.clientes.length
    const aviso =
      n > 0
        ? `¿Borrar a ${arquitecto.nombre}? Sus ${n} cliente${n === 1 ? "" : "s"} no se borran: quedan sin este arquitecto.`
        : `¿Borrar a ${arquitecto.nombre}?`
    if (!window.confirm(aviso)) return
    const res = await eliminarArquitecto(arquitecto.id)
    if (!res.success) return setError(res.error)
    router.push("/arquitectos")
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{arquitecto.nombre}</h1>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              {arquitecto.telefono && (
                <a
                  href={`https://wa.me/${arquitecto.telefono.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-indigo-600"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {arquitecto.telefono}
                </a>
              )}
              {arquitecto.email && (
                <a href={`mailto:${arquitecto.email}`} className="inline-flex items-center gap-1 hover:text-indigo-600">
                  <Mail className="h-3.5 w-3.5" />
                  {arquitecto.email}
                </a>
              )}
            </div>
            {arquitecto.notas && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{arquitecto.notas}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={borrar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Borrar
            </button>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Users className="h-4 w-4 text-indigo-600" />
            Clientes ({arquitecto.clientes.length})
          </h2>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
        {clientes.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {arquitecto.clientes.length === 0
              ? "Todavía no tiene clientes. Se asignan desde la ficha de cada cliente."
              : "Ningún cliente coincide con la búsqueda."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {clientes.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/clientes/${c.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600">
                    {c.nombre}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {[c.direccion, c.localidad, c.telefono].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ClienteEstadoBadge estado={c.estado as EstadoCliente} />
                  {c.mediciones.length === 0 ? (
                    <span className="text-xs text-slate-400">Sin mediciones</span>
                  ) : (
                    c.mediciones.map((m) => (
                      <Link
                        key={m.id}
                        href={`/mediciones/${m.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        Medición {fecha(m.creadoEn)}
                      </Link>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editando && (
        <ArquitectoFormModal
          arquitecto={arquitecto}
          onCerrar={() => setEditando(false)}
          onGuardado={() => {
            setEditando(false)
            startTransition(() => router.refresh())
          }}
        />
      )}
    </div>
  )
}
