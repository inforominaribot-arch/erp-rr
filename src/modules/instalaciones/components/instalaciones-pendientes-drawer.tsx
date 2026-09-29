"use client"

// Módulo: Agenda & Instalación
// Panel lateral / Cajón de Comandas Pendientes de Agendar

import { useState } from "react"
import { ClipboardList, CalendarPlus, Search, MapPin, CheckCircle, Package } from "lucide-react"
import type { IComandaPendienteAgenda } from "../types"

interface Props {
  comandas: IComandaPendienteAgenda[]
  onSeleccionarComanda: (comandaId: string) => void
}

export function InstalacionesPendientesDrawer({
  comandas,
  onSeleccionarComanda,
}: Props) {
  const [busqueda, setBusqueda] = useState("")

  const comandasFiltradas = comandas.filter((c) => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return true
    return (
      c.numero.toString().includes(q) ||
      c.cliente.nombre.toLowerCase().includes(q) ||
      (c.cliente.localidad && c.cliente.localidad.toLowerCase().includes(q))
    )
  })

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Cabecera del panel */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Comandas por Agendar
            </h3>
          </div>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
            {comandas.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Listas en taller o en producción avanzada
        </p>

        {/* Buscador */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o comanda..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Lista de comandas */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {comandasFiltradas.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            No hay comandas pendientes de programar
          </div>
        ) : (
          comandasFiltradas.map((comanda) => {
            const porcentajeListo =
              comanda.totalItems > 0
                ? Math.round((comanda.itemsListos / comanda.totalItems) * 100)
                : 0

            return (
              <div
                key={comanda.id}
                className="group relative rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      #{comanda.numero}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {comanda.cliente.nombre}
                    </h4>
                  </div>
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      comanda.estado === "LISTO_PARA_INSTALAR"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {comanda.estado === "LISTO_PARA_INSTALAR" ? "Listo en taller" : "En confección"}
                  </span>
                </div>

                {/* Ubicación */}
                {(comanda.cliente.localidad || comanda.cliente.direccion) && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {comanda.cliente.localidad || comanda.cliente.direccion}
                    </span>
                  </div>
                )}

                {/* Progreso de cortinas */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-slate-400" />
                    {comanda.totalItems} cortinas ({comanda.itemsListos} listas)
                  </span>
                  <span className="font-semibold text-slate-700">{porcentajeListo}%</span>
                </div>

                {/* Barra de progreso */}
                <div className="mt-1 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      porcentajeListo === 100 ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${porcentajeListo}%` }}
                  />
                </div>

                {/* Botón Agendar */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onSeleccionarComanda(comanda.id)}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Agendar Colocación
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
