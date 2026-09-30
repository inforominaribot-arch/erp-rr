"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  ClipboardList,
  User,
  Calendar,
  Eye,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import type { IComandaConRelaciones, EstadoComanda } from "../types"
import { ComandaEstadoBadge } from "./comanda-estado-badge"
import { ESTADOS_COMANDA } from "../schemas"

interface ComandaTablaProps {
  comandasIniciales: IComandaConRelaciones[]
  puedeGestionar?: boolean
  onAbrirModalNueva?: () => void
}

export function ComandaTabla({
  comandasIniciales,
  puedeGestionar = true,
  onAbrirModalNueva,
}: ComandaTablaProps) {
  const [busqueda, setBusqueda] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<string>("TODOS")

  const comandasFiltradas = useMemo(() => {
    return comandasIniciales.filter((c) => {
      // Filtro por estado
      if (estadoFiltro !== "TODOS" && c.estado !== estadoFiltro) {
        return false
      }

      // Filtro por texto
      if (busqueda.trim() !== "") {
        const query = busqueda.toLowerCase().trim()
        const matchCliente = c.presupuesto.cliente.nombre
          .toLowerCase()
          .includes(query)
        const matchTelefono =
          c.presupuesto.cliente.telefono?.toLowerCase().includes(query) ?? false
        const matchNumero = String(c.numero).includes(query)
        const matchNumPresupuesto = String(c.presupuesto.numero).includes(query)
        const matchNotas = c.notas?.toLowerCase().includes(query) ?? false

        return (
          matchCliente ||
          matchTelefono ||
          matchNumero ||
          matchNumPresupuesto ||
          matchNotas
        )
      }

      return true
    })
  }, [comandasIniciales, busqueda, estadoFiltro])

  return (
    <div className="space-y-4">
      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Buscador reactivo */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, comanda #, presupuesto..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 shadow-2xs transition"
          />
        </div>

        {/* Filtro por Estado */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            aria-label="Filtrar por estado de comanda"
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 shadow-2xs transition"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="EN_PRODUCCION">En Producción</option>
            <option value="ESPERANDO_PROVEEDOR">Esperando Proveedor</option>
            <option value="LISTO_PARA_INSTALAR">Listos para Instalar</option>
            <option value="INSTALADO">Instalados</option>
          </select>
        </div>
      </div>

      {/* ── LISTADO / TABLA DE COMANDAS ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {comandasFiltradas.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-700">
              No se encontraron comandas
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {busqueda || estadoFiltro !== "TODOS"
                ? "No hay resultados para los filtros seleccionados."
                : "Aún no se han generado comandas de trabajo desde presupuestos aprobados."}
            </p>
            {puedeGestionar && onAbrirModalNueva && (
              <button
                type="button"
                onClick={onAbrirModalNueva}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                Generar Comanda de Trabajo
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 pl-6 pr-3">Comanda #</th>
                  <th className="py-3.5 px-3">Cliente</th>
                  <th className="py-3.5 px-3">Presupuesto</th>
                  <th className="py-3.5 px-3">Entrega Estimada</th>
                  <th className="py-3.5 px-3">Progreso Taller</th>
                  <th className="py-3.5 px-3">Estado</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {comandasFiltradas.map((c) => {
                  const numComanda = `#COM-${String(c.numero).padStart(4, "0")}`
                  const numPresupuesto = `#PRE-${String(
                    c.presupuesto.numero
                  ).padStart(4, "0")}`

                  const porcentaje =
                    c.itemsTotalCount > 0
                      ? Math.round(
                          (c.itemsCompletadosCount / c.itemsTotalCount) * 100
                        )
                      : 0

                  const estaLista =
                    c.itemsTotalCount > 0 &&
                    c.itemsCompletadosCount === c.itemsTotalCount

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Número de comanda */}
                      <td className="py-4 pl-6 pr-3 font-semibold">
                        <Link
                          href={`/comandas/${c.id}`}
                          className="font-mono font-bold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          {numComanda}
                        </Link>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(c.creadoEn).toLocaleDateString("es-AR")}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-900">
                          {c.presupuesto.cliente.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.presupuesto.cliente.localidad ||
                            c.presupuesto.cliente.telefono ||
                            "—"}
                        </div>
                      </td>

                      {/* Presupuesto Origen */}
                      <td className="py-4 px-3">
                        <Link
                          href={`/presupuestos/${c.presupuesto.id}`}
                          className="font-mono text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
                        >
                          {numPresupuesto}
                        </Link>
                      </td>

                      {/* Fecha de Entrega */}
                      <td className="py-4 px-3">
                        {c.fechaEntrega ? (
                          <div className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(c.fechaEntrega).toLocaleDateString("es-AR")}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            A coordinar
                          </span>
                        )}
                      </td>

                      {/* Progreso Taller */}
                      <td className="py-4 px-3">
                        <div className="w-36 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`font-bold ${
                                estaLista ? "text-emerald-700" : "text-slate-600"
                              }`}
                            >
                              {c.itemsCompletadosCount}/{c.itemsTotalCount} listos
                            </span>
                            <span className="font-mono text-slate-400">
                              {porcentaje}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                estaLista ? "bg-emerald-500" : "bg-indigo-600"
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-3">
                        <ComandaEstadoBadge estado={c.estado} tamano="sm" />
                      </td>

                      {/* Acciones */}
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/comandas/${c.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                            title="Ver Comanda"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span className="hidden md:inline">Detalle</span>
                          </Link>
                          <Link
                            href={`/comandas/${c.id}?imprimir=true`}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition shadow-2xs"
                            title="Imprimir Ficha de Taller A4"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
