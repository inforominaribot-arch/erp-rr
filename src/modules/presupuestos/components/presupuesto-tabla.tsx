"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Layers,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react"
import type { IPresupuesto } from "../types"
import {
  formatearNumeroPresupuesto,
  calcularDiasRestantesValidez,
} from "../types"
import { PresupuestoEstadoBadge } from "./presupuesto-estado-badge"
import { eliminarPresupuesto } from "../actions"
import { formatearPrecio, formatearFecha } from "@/lib/utils"

interface PresupuestoTablaProps {
  presupuestosIniciales: IPresupuesto[]
  puedeEditar?: boolean
}

const OPCIONES_ESTADO = [
  { valor: "TODOS", label: "Todos los Estados" },
  { valor: "BORRADOR", label: "Borrador" },
  { valor: "ENVIADO", label: "Enviado" },
  { valor: "ACEPTADO_TOTAL", label: "Aceptado Total" },
  { valor: "ACEPTADO_PARCIAL", label: "Aceptado Parcial" },
  { valor: "RECHAZADO", label: "Rechazado" },
]

export function PresupuestoTabla({
  presupuestosIniciales,
  puedeEditar = true,
}: PresupuestoTablaProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS")

  const [presupuestoAEliminar, setPresupuestoAEliminar] =
    useState<IPresupuesto | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  // Filtrado reactivo en el cliente
  const presupuestosFiltrados = presupuestosIniciales.filter((p) => {
    // Filtro por Estado
    if (filtroEstado !== "TODOS" && p.estado !== filtroEstado) {
      return false
    }

    if (!busqueda.trim()) return true

    const q = busqueda.toLowerCase().trim()
    const numStr = String(p.numero)
    const numFormateado = formatearNumeroPresupuesto(p.numero).toLowerCase()
    const clienteNombre = p.cliente?.nombre?.toLowerCase() || ""
    const clienteTelefono = p.cliente?.telefono || ""
    const clienteLocalidad = p.cliente?.localidad?.toLowerCase() || ""
    const notas = p.notas?.toLowerCase() || ""

    return (
      numStr.includes(q) ||
      numFormateado.includes(q) ||
      clienteNombre.includes(q) ||
      clienteTelefono.includes(q) ||
      clienteLocalidad.includes(q) ||
      notas.includes(q)
    )
  })

  async function handleConfirmarEliminacion() {
    if (!presupuestoAEliminar) return
    setErrorEliminar(null)

    startTransition(async () => {
      const res = await eliminarPresupuesto(presupuestoAEliminar.id)
      if (!res.success) {
        setErrorEliminar(res.error || "No se pudo eliminar el presupuesto.")
        return
      }

      setPresupuestoAEliminar(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, #PRE-0001, localidad o notas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Filtro por Estado */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:inline" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
          >
            {OPCIONES_ESTADO.map((opt) => (
              <option key={opt.valor} value={opt.valor}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── TABLA DE PRESUPUESTOS ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Presupuesto</th>
                <th className="py-3 px-4 font-bold">Cliente</th>
                <th className="py-3 px-4 font-bold text-center">Cortinas</th>
                <th className="py-3 px-4 font-bold">Vigencia</th>
                <th className="py-3 px-4 font-bold text-right">Total ($)</th>
                <th className="py-3 px-4 font-bold text-center">Estado</th>
                <th className="py-3 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {presupuestosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">
                      No se encontraron presupuestos
                    </p>
                    <p className="text-[11px] mt-0.5">
                      {busqueda || filtroEstado !== "TODOS"
                        ? "Probá ajustando los filtros de búsqueda"
                        : "Creá una nueva cotización para comenzar"}
                    </p>
                  </td>
                </tr>
              ) : (
                presupuestosFiltrados.map((p) => {
                  const numFormatted = formatearNumeroPresupuesto(p.numero)
                  const cantItems = p.items?.length || 0
                  const { diasRestantes, vencido } = calcularDiasRestantesValidez(
                    p.creadoEn,
                    p.validezDias
                  )

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      {/* Presupuesto # */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/presupuestos/${p.id}`}
                          className="font-black text-slate-900 font-mono hover:text-indigo-600 transition"
                        >
                          {numFormatted}
                        </Link>
                        <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                          {formatearFecha(p.creadoEn)}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {p.cliente?.nombre || "Sin cliente"}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {p.cliente?.telefono || p.cliente?.localidad || "—"}
                        </span>
                      </td>

                      {/* Cantidad de Cortinas */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          <Layers className="h-3 w-3 text-slate-400" />
                          {cantItems}
                        </span>
                      </td>

                      {/* Vigencia */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            vencido
                              ? "bg-rose-100 text-rose-700"
                              : diasRestantes <= 3
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {vencido
                            ? "Vencido"
                            : `${diasRestantes} días restantes`}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatearPrecio(p.total)}
                        {p.descuento > 0 && (
                          <span className="block text-[10px] text-emerald-600 font-normal">
                            (-{p.descuento}%)
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <PresupuestoEstadoBadge estado={p.estado} />
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/presupuestos/${p.id}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {puedeEditar && (
                            <>
                              <Link
                                href={`/presupuestos/${p.id}/editar`}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                                title="Editar presupuesto"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => setPresupuestoAEliminar(p)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Eliminar presupuesto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ELIMINAR ── */}
      {presupuestoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              ¿Eliminar Presupuesto{" "}
              {formatearNumeroPresupuesto(presupuestoAEliminar.numero)}?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Esta acción eliminará el presupuesto y todas sus cortinas cotizadas.
              No se puede deshacer.
            </p>

            {errorEliminar && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorEliminar}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPresupuestoAEliminar(null)}
                disabled={isPending}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacion}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
