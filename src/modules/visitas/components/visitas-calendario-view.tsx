"use client"

import { useState, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Filter,
  Search,
  Plus,
  ListTodo,
} from "lucide-react"
import type { IVisitaConRelaciones, EstadoVisita } from "../types"
import { VisitaCard } from "./visita-card"
import { VisitaEstadoBadge } from "./visita-estado-badge"
import { formatearHorarioVisita } from "../types"

interface VisitasCalendarioViewProps {
  visitas: IVisitaConRelaciones[]
  onAgendarNueva?: () => void
  onEditarVisita?: (visita: IVisitaConRelaciones) => void
  onCambiarEstadoVisita?: (visita: IVisitaConRelaciones) => void
}

type TipoVista = "mes" | "semana" | "dia" | "itinerario"

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export function VisitasCalendarioView({
  visitas,
  onAgendarNueva,
  onEditarVisita,
  onCambiarEstadoVisita,
}: VisitasCalendarioViewProps) {
  const [fechaActual, setFechaActual] = useState<Date>(new Date())
  const [vista, setVista] = useState<TipoVista>("mes")
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS")
  const [busqueda, setBusqueda] = useState<string>("")

  // Filtrado reactivo de visitas
  const visitasFiltradas = useMemo(() => {
    return visitas.filter((v) => {
      // Filtro de estado
      if (filtroEstado !== "TODOS" && v.estado !== filtroEstado) {
        return false
      }
      // Búsqueda de texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const coincide =
          v.cliente.nombre.toLowerCase().includes(q) ||
          (v.cliente.telefono && v.cliente.telefono.includes(q)) ||
          v.direccion.toLowerCase().includes(q) ||
          (v.localidad && v.localidad.toLowerCase().includes(q)) ||
          (v.notas && v.notas.toLowerCase().includes(q))
        if (!coincide) return false
      }
      return true
    })
  }, [visitas, filtroEstado, busqueda])

  // Navegación de fechas
  function irAnterior() {
    const f = new Date(fechaActual)
    if (vista === "mes") f.setMonth(f.getMonth() - 1)
    else if (vista === "semana") f.setDate(f.getDate() - 7)
    else if (vista === "dia") f.setDate(f.getDate() - 1)
    setFechaActual(f)
  }

  function irSiguiente() {
    const f = new Date(fechaActual)
    if (vista === "mes") f.setMonth(f.getMonth() + 1)
    else if (vista === "semana") f.setDate(f.getDate() + 7)
    else if (vista === "dia") f.setDate(f.getDate() + 1)
    setFechaActual(f)
  }

  function irHoy() {
    setFechaActual(new Date())
  }

  // Título dinámico según vista
  const tituloPeriodo = useMemo(() => {
    const mes = MESES[fechaActual.getMonth()]
    const anio = fechaActual.getFullYear()

    if (vista === "mes") return `${mes} ${anio}`
    if (vista === "dia") {
      return fechaActual.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }
    if (vista === "semana") {
      const inicio = new Date(fechaActual)
      const diaSemana = inicio.getDay()
      inicio.setDate(inicio.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
      const fin = new Date(inicio)
      fin.setDate(fin.getDate() + 6)
      return `${inicio.getDate()} ${MESES[inicio.getMonth()].slice(0, 3)} - ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)} ${anio}`
    }
    return "Itinerario de Visitas"
  }, [fechaActual, vista])

  // Generar cuadrícula del mes
  const diasMes = useMemo(() => {
    const anio = fechaActual.getFullYear()
    const mes = fechaActual.getMonth()

    const primerDiaMes = new Date(anio, mes, 1)
    const ultimoDiaMes = new Date(anio, mes + 1, 0)

    // Ajustar para que la semana empiece en Lunes (0 = Lun, 6 = Dom)
    let diaInicio = primerDiaMes.getDay() - 1
    if (diaInicio === -1) diaInicio = 6

    const dias = []

    // Días del mes anterior
    const ultimoDiaMesAnt = new Date(anio, mes, 0).getDate()
    for (let i = diaInicio - 1; i >= 0; i--) {
      dias.push({
        fecha: new Date(anio, mes - 1, ultimoDiaMesAnt - i),
        esMesActual: false,
      })
    }

    // Días del mes actual
    for (let i = 1; i <= ultimoDiaMes.getDate(); i++) {
      dias.push({
        fecha: new Date(anio, mes, i),
        esMesActual: true,
      })
    }

    // Días del mes siguiente para completar grilla de 35 o 42
    const restantes = 42 - dias.length
    for (let i = 1; i <= restantes; i++) {
      dias.push({
        fecha: new Date(anio, mes + 1, i),
        esMesActual: false,
      })
    }

    return dias
  }, [fechaActual])

  function esMismoDia(d1: Date, d2: Date) {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    )
  }

  const hoy = new Date()

  return (
    <div className="space-y-4">
      {/* Barra de Controles Superiores: Navegación, Vistas y Filtros */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Navegador de Fecha */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={irHoy}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              Hoy
            </button>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={irAnterior}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:shadow-2xs transition-all"
                title="Período anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={irSiguiente}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:shadow-2xs transition-all"
                title="Período siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 capitalize ml-1">
              {tituloPeriodo}
            </h2>
          </div>

          {/* Selector de Vistas */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 self-start sm:self-auto">
            {(
              [
                { id: "itinerario", label: "Itinerario" },
                { id: "mes", label: "Mes" },
                { id: "semana", label: "Semana" },
                { id: "dia", label: "Día" },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVista(v.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  vista === v.id
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Filtros y Buscador */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, dirección o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PROGRAMADA">Programadas</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="REALIZADA">Realizadas</option>
              <option value="REPROGRAMADA">Reprogramadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>

            {onAgendarNueva && (
              <button
                type="button"
                onClick={onAgendarNueva}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors whitespace-nowrap min-h-[36px]"
              >
                <Plus className="h-4 w-4" />
                <span>Agendar Visita</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RENDERIZADO SEGÚN VISTA */}

      {/* 1. VISTA ITINERARIO (Mobile-First en tarjetas) */}
      {vista === "itinerario" && (
        <div className="space-y-4">
          {visitasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <CalendarIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">
                No hay visitas agendadas con los filtros seleccionados
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Podés agendar una nueva visita comercial de medición con el botón superior.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitasFiltradas.map((visita) => (
                <VisitaCard
                  key={visita.id}
                  visita={visita}
                  onCambiarEstado={onCambiarEstadoVisita}
                  onEditar={onEditarVisita}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. VISTA MES */}
      {vista === "mes" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Cabecera de días de la semana (Lun - Dom) */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="py-2.5">
                {d}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
            {diasMes.map((d, index) => {
              const esDiaDeHoy = esMismoDia(d.fecha, hoy)
              const visitasDelDia = visitasFiltradas.filter((v) =>
                esMismoDia(new Date(v.fecha), d.fecha)
              )

              return (
                <div
                  key={index}
                  onClick={() => {
                    setFechaActual(d.fecha)
                    setVista("dia")
                  }}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 transition-colors cursor-pointer hover:bg-slate-50/80 flex flex-col justify-between ${
                    !d.esMesActual ? "bg-slate-50/40 text-slate-400" : "bg-white text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-bold rounded-full h-6 w-6 ${
                        esDiaDeHoy
                          ? "bg-indigo-600 text-white"
                          : d.esMesActual
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {d.fecha.getDate()}
                    </span>

                    {visitasDelDia.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {visitasDelDia.length}
                      </span>
                    )}
                  </div>

                  {/* Listita compacta de visitas en la casilla del mes */}
                  <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                    {visitasDelDia.slice(0, 2).map((v) => (
                      <div
                        key={v.id}
                        className="rounded-md border border-slate-200 bg-white p-1 text-[10px] leading-tight shadow-2xs truncate hover:border-indigo-400"
                      >
                        <span className="font-semibold text-slate-800">
                          {v.horaInicio}
                        </span>{" "}
                        <span className="text-slate-600">{v.cliente.nombre}</span>
                      </div>
                    ))}
                    {visitasDelDia.length > 2 && (
                      <span className="block text-[10px] font-medium text-slate-400 pl-1">
                        +{visitasDelDia.length - 2} más...
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. VISTA DÍA */}
      {vista === "dia" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {fechaActual.toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {visitasFiltradas.filter((v) => esMismoDia(new Date(v.fecha), fechaActual)).length} visitas coordinadas
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVista("mes")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Volver al mes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitasFiltradas
              .filter((v) => esMismoDia(new Date(v.fecha), fechaActual))
              .map((visita) => (
                <VisitaCard
                  key={visita.id}
                  visita={visita}
                  onCambiarEstado={onCambiarEstadoVisita}
                  onEditar={onEditarVisita}
                />
              ))}
          </div>

          {visitasFiltradas.filter((v) => esMismoDia(new Date(v.fecha), fechaActual)).length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                No hay visitas para este día
              </p>
              {onAgendarNueva && (
                <button
                  type="button"
                  onClick={onAgendarNueva}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
                >
                  + Agendar visita en este día
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. VISTA SEMANA */}
      {vista === "semana" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(fechaActual)
            const diaSemana = d.getDay()
            d.setDate(d.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1) + i)
            const esHoyDia = esMismoDia(d, hoy)
            const visitasEsteDia = visitasFiltradas.filter((v) =>
              esMismoDia(new Date(v.fecha), d)
            )

            return (
              <div
                key={i}
                className={`rounded-2xl border p-3 flex flex-col justify-between min-h-[300px] ${
                  esHoyDia
                    ? "border-indigo-300 bg-indigo-50/30"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      {d.toLocaleDateString("es-AR", { weekday: "short" })}
                    </span>
                    <span
                      className={`text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${
                        esHoyDia ? "bg-indigo-600 text-white" : "text-slate-800"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {visitasEsteDia.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => onEditarVisita && onEditarVisita(v)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-2xs hover:border-indigo-400 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-900">
                          <span>{v.horaInicio} hs</span>
                          <VisitaEstadoBadge estado={v.estado} mostrarPunto={false} />
                        </div>
                        <p className="font-semibold text-slate-800 mt-1 truncate">
                          {v.cliente.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          📍 {v.direccion}
                        </p>
                      </div>
                    ))}

                    {visitasEsteDia.length === 0 && (
                      <span className="block text-[11px] text-slate-400 text-center py-6">
                        Libre
                      </span>
                    )}
                  </div>
                </div>

                {onAgendarNueva && (
                  <button
                    type="button"
                    onClick={onAgendarNueva}
                    className="w-full text-center text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold pt-2 border-t border-slate-100"
                  >
                    + Agendar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
