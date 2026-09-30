"use client"

// Módulo: Agenda & Instalación
// Calendario Visual Interactivo (Mes, Semana, Día e Itinerario) con Bloqueos de Horario

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Phone,
  Plus,
  Lock,
  FileText,
  Filter,
  Users,
  Search,
  ListTodo,
} from "lucide-react"
import type {
  IInstalacion,
  IComandaPendienteAgenda,
  IInstalador,
  IBloqueoAgenda,
} from "../types"
import { formatearHorario } from "../types"
import { InstalacionEstadoBadge } from "./instalacion-estado-badge"
import { InstalacionAgendarModal } from "./instalacion-agendar-modal"
import { BloqueoAgendaModal } from "./bloqueo-agenda-modal"
import { InstaladorItinerarioCard } from "./instalador-itinerario-card"

interface Props {
  instalaciones: IInstalacion[]
  comandasPendientes: IComandaPendienteAgenda[]
  instaladores: IInstalador[]
  bloqueos: IBloqueoAgenda[]
  usuarioActualId?: string
  rolUsuario?: string
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

export function CalendarioAgendaView({
  instalaciones,
  comandasPendientes,
  instaladores,
  bloqueos,
  usuarioActualId,
  rolUsuario,
}: Props) {
  // Estado de navegación
  const [fechaActual, setFechaActual] = useState<Date>(new Date())
  const [vista, setVista] = useState<TipoVista>(rolUsuario === "INSTALACION" ? "itinerario" : "mes")

  // Filtros
  const [filtroInstalador, setFiltroInstalador] = useState<string>(
    rolUsuario === "INSTALACION" && usuarioActualId ? usuarioActualId : ""
  )
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS")
  const [busqueda, setBusqueda] = useState<string>("")

  // Modales
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false)
  const [modalBloqueoAbierto, setModalBloqueoAbierto] = useState(false)
  const [comandaPreseleccionada, setComandaPreseleccionada] = useState<string | undefined>()
  const [instalacionSeleccionada, setInstalacionSeleccionada] = useState<IInstalacion | null>(null)

  // Navegación temporal
  const navegar = (direccion: "ant" | "sig" | "hoy") => {
    if (direccion === "hoy") {
      setFechaActual(new Date())
      return
    }

    const delta = direccion === "sig" ? 1 : -1
    const nueva = new Date(fechaActual)

    if (vista === "mes") {
      nueva.setMonth(nueva.getMonth() + delta)
    } else if (vista === "semana") {
      nueva.setDate(nueva.getDate() + delta * 7)
    } else {
      nueva.setDate(nueva.getDate() + delta)
    }
    setFechaActual(nueva)
  }

  // Filtrado de instalaciones
  const instalacionesFiltradas = useMemo(() => {
    return instalaciones.filter((inst) => {
      // Filtro por instalador
      if (filtroInstalador) {
        const tieneInstalador = inst.instaladores.some(
          (i) => i.usuarioId === filtroInstalador
        )
        if (!tieneInstalador) return false
      }

      // Filtro por estado
      if (filtroEstado !== "TODOS" && inst.estado !== filtroEstado) {
        return false
      }

      // Búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const matchCliente = inst.comanda.cliente.nombre.toLowerCase().includes(q)
        const matchComanda = inst.comanda.numero.toString().includes(q)
        const matchLocalidad =
          inst.comanda.cliente.localidad?.toLowerCase().includes(q) || false
        if (!matchCliente && !matchComanda && !matchLocalidad) return false
      }

      return true
    })
  }, [instalaciones, filtroInstalador, filtroEstado, busqueda])

  // Filtrado de bloqueos por instalador
  const bloqueosFiltrados = useMemo(() => {
    return bloqueos.filter((b) => {
      if (!filtroInstalador) return true
      return !b.usuarioId || b.usuarioId === filtroInstalador
    })
  }, [bloqueos, filtroInstalador])

  // Helpers para generar días del mes
  const diasDelMes = useMemo(() => {
    const year = fechaActual.getFullYear()
    const month = fechaActual.getMonth()

    const primerDia = new Date(year, month, 1)
    const ultimoDia = new Date(year, month + 1, 0)

    const diaSemanaInicio = primerDia.getDay() // 0 = Dom
    const totalDias = ultimoDia.getDate()

    const dias: Array<{ fecha: Date; esMesActual: boolean }> = []

    // Días del mes anterior para rellenar la primera semana
    const mesAnteriorUltimo = new Date(year, month, 0).getDate()
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      dias.push({
        fecha: new Date(year, month - 1, mesAnteriorUltimo - i),
        esMesActual: false,
      })
    }

    // Días del mes actual
    for (let i = 1; i <= totalDias; i++) {
      dias.push({
        fecha: new Date(year, month, i),
        esMesActual: true,
      })
    }

    // Días del mes siguiente para completar hasta múltiplo de 7
    const faltantes = 42 - dias.length // 6 filas de 7
    for (let i = 1; i <= faltantes; i++) {
      dias.push({
        fecha: new Date(year, month + 1, i),
        esMesActual: false,
      })
    }

    return dias
  }, [fechaActual])

  // Helpers para generar días de la semana
  const diasDeLaSemana = useMemo(() => {
    const curr = new Date(fechaActual)
    const primer = curr.getDate() - curr.getDay() // primer día (domingo)
    const dias: Date[] = []

    for (let i = 0; i < 7; i++) {
      dias.push(new Date(curr.setDate(primer + i)))
    }
    return dias
  }, [fechaActual])

  // Función para obtener eventos e indisponibilidades de una fecha
  const getEventosPorFecha = (fecha: Date) => {
    const fechaKey = fecha.toISOString().split("T")[0]

    const insts = instalacionesFiltradas.filter((i) => i.fecha.split("T")[0] === fechaKey)
    const blqs = bloqueosFiltrados.filter((b) => b.fecha.split("T")[0] === fechaKey)

    return { insts, blqs }
  }

  // Título del período según la vista
  const tituloPeriodo = useMemo(() => {
    if (vista === "mes") {
      return `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`
    }
    if (vista === "semana") {
      const inicio = diasDeLaSemana[0]
      const fin = diasDeLaSemana[6]
      return `${inicio.getDate()} ${MESES[inicio.getMonth()].substring(0, 3)} - ${fin.getDate()} ${MESES[fin.getMonth()].substring(0, 3)} ${fin.getFullYear()}`
    }
    return fechaActual.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }, [fechaActual, vista, diasDeLaSemana])

  const hoyStr = new Date().toISOString().split("T")[0]

  return (
    <div className="space-y-4">
      {/* Barra Superior de Control y Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Navegación temporal */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button
              onClick={() => navegar("ant")}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navegar("hoy")}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => navegar("sig")}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 capitalize tracking-tight">
            {tituloPeriodo}
          </h2>
        </div>

        {/* Selectores de vista */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setVista("mes")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                vista === "mes" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setVista("semana")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                vista === "semana" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setVista("dia")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                vista === "dia" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setVista("itinerario")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                vista === "itinerario" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
              }`}
            >
              <ListTodo className="h-3.5 w-3.5" />
              Itinerario
            </button>
          </div>

          {/* Botón Bloquear Horario */}
          <button
            onClick={() => setModalBloqueoAbierto(true)}
            title="Registrar turno médico, trámite o indisponibilidad de horario"
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <Lock className="h-3.5 w-3.5 text-amber-600" />
            Bloquear Horario
          </button>

          {/* Botón Agendar Colocación */}
          {rolUsuario !== "INSTALACION" && (
            <button
              onClick={() => {
                setComandaPreseleccionada(undefined)
                setModalAgendarAbierto(true)
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Agendar Colocación
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros secundarios */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        {/* Filtro por Instalador */}
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Instalador:</span>
          <select
            value={filtroInstalador}
            onChange={(e) => setFiltroInstalador(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="">Todos los instaladores</option>
            {instaladores.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Estado */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 text-slate-800 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="TODOS">Todos</option>
            <option value="PROGRAMADA">Programada</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        {/* Buscador */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, localidad o comanda..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* VISTA 1: CALENDARIO MENSUAL */}
      {vista === "mes" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto touch-scroll">
            <div className="min-w-[680px]">
              {/* Cabecera de días de la semana */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="py-2.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grilla de celdas del mes */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                {diasDelMes.map(({ fecha, esMesActual }, idx) => {
                  const { insts, blqs } = getEventosPorFecha(fecha)
                  const fechaKey = fecha.toISOString().split("T")[0]
                  const esHoy = fechaKey === hoyStr

                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] p-1.5 transition-colors ${
                        !esMesActual ? "bg-slate-50/50 text-slate-300" : "bg-white text-slate-700"
                      } ${esHoy ? "bg-indigo-50/30 ring-1 ring-inset ring-indigo-400" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            esHoy
                              ? "bg-indigo-600 text-white"
                              : esMesActual
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {fecha.getDate()}
                        </span>
                        {(insts.length > 0 || blqs.length > 0) && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {insts.length + blqs.length} ev.
                          </span>
                        )}
                      </div>

                      {/* Lista de eventos del día */}
                      <div className="space-y-1">
                        {/* Bloqueos de agenda (Indisponibilidad) */}
                        {blqs.map((b) => (
                          <div
                            key={b.id}
                            title={`Bloqueo: ${b.usuario?.nombre || "Taller"} - ${b.motivo} (${b.horaInicio} a ${b.horaFin} hs)`}
                            className="truncate rounded-md bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 border border-amber-300 flex items-center gap-1"
                          >
                            <Lock className="h-2.5 w-2.5 text-amber-700 shrink-0" />
                            <span className="truncate font-semibold">{b.horaInicio} {b.motivo}</span>
                          </div>
                        ))}

                        {/* Instalaciones */}
                        {insts.map((inst) => {
                          const colorBg =
                            inst.estado === "COMPLETADA"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : inst.estado === "CANCELADA"
                              ? "bg-red-50 text-red-700 border-red-200 line-through opacity-60"
                              : inst.materialesListos
                              ? "bg-teal-50 text-teal-800 border-teal-300"
                              : "bg-indigo-50 text-indigo-800 border-indigo-200"

                          return (
                            <button
                              key={inst.id}
                              onClick={() => setInstalacionSeleccionada(inst)}
                              className={`w-full text-left truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold border transition-transform hover:scale-[1.02] shadow-2xs ${colorBg}`}
                            >
                              <span className="font-mono">{inst.horaInicio || "S/H"}</span>{" "}
                              <span>{inst.comanda.cliente.nombre}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: CALENDARIO SEMANAL */}
      {vista === "semana" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto touch-scroll">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 divide-x divide-slate-200">
                {diasDeLaSemana.map((dia, idx) => {
                  const diaKey = dia.toISOString().split("T")[0]
                  const esHoy = diaKey === hoyStr
                  return (
                    <div
                      key={idx}
                      className={`py-3 ${esHoy ? "bg-indigo-50 text-indigo-700" : ""}`}
                    >
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">
                        {DIAS_SEMANA[dia.getDay()]}
                      </p>
                      <p className="text-base font-black mt-0.5">{dia.getDate()}</p>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[400px]">
                {diasDeLaSemana.map((dia, idx) => {
                  const { insts, blqs } = getEventosPorFecha(dia)
                  const diaKey = dia.toISOString().split("T")[0]
                  const esHoy = diaKey === hoyStr

                  return (
                    <div
                      key={idx}
                      className={`p-2 space-y-2 ${esHoy ? "bg-indigo-50/20" : "bg-white"}`}
                    >
                      {/* Bloqueos */}
                      {blqs.map((b) => (
                        <div
                          key={b.id}
                          className="rounded-xl border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 shadow-2xs"
                        >
                          <div className="flex items-center gap-1 font-bold text-amber-800">
                            <Lock className="h-3 w-3 shrink-0" />
                            <span>{b.horaInicio} - {b.horaFin} hs</span>
                          </div>
                          <p className="text-[11px] font-semibold mt-0.5">
                            {b.usuario?.nombre || "Taller general"}
                          </p>
                          <p className="text-[10px] text-slate-500">{b.motivo}</p>
                        </div>
                      ))}

                      {/* Instalaciones */}
                      {insts.map((inst) => (
                        <div
                          key={inst.id}
                          onClick={() => setInstalacionSeleccionada(inst)}
                          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 hover:border-indigo-400 hover:shadow-xs transition-all space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-indigo-600">
                              {inst.horaInicio || "S/H"}
                            </span>
                            <InstalacionEstadoBadge
                              estado={inst.estado}
                              materialesListos={inst.materialesListos}
                              tamano="sm"
                            />
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {inst.comanda.cliente.nombre}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {inst.comanda.cliente.localidad || "Sin localidad"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: DÍA / AGENDA DIARIA */}
      {vista === "dia" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 capitalize">
              Agenda del día: {tituloPeriodo}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {getEventosPorFecha(fechaActual).insts.length} instalaciones agendadas
            </span>
          </div>

          <div className="space-y-4">
            {/* Bloqueos del día */}
            {getEventosPorFecha(fechaActual).blqs.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {b.horaInicio} a {b.horaFin} hs
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-amber-800">
                      {b.usuario?.nombre || "Taller general"}
                    </span>
                  </div>
                  <p className="text-slate-600">{b.motivo}</p>
                </div>
              </div>
            ))}

            {/* Instalaciones del día */}
            {getEventosPorFecha(fechaActual).insts.length === 0 &&
            getEventosPorFecha(fechaActual).blqs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No hay actividades programadas para este día.
              </div>
            ) : (
              getEventosPorFecha(fechaActual).insts.map((inst) => (
                <InstaladorItinerarioCard key={inst.id} instalacion={inst} />
              ))
            )}
          </div>
        </div>
      )}

      {/* VISTA 4: ITINERARIO MÓVIL (HOJA DE RUTA) */}
      {vista === "itinerario" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Itinerario & Hoja de Ruta de Colocaciones
              </h3>
              <p className="text-xs text-slate-500">
                Turnos programados ordenados cronológicamente
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              {instalacionesFiltradas.length} total
            </span>
          </div>

          {instalacionesFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              No se encontraron instalaciones con los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-3">
              {instalacionesFiltradas.map((inst) => (
                <InstaladorItinerarioCard key={inst.id} instalacion={inst} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL RÁPIDO DE DETALLE AL HACER CLIC EN UN EVENTO */}
      {instalacionSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg">
                  Comanda #{instalacionSeleccionada.comanda.numero}
                </span>
                <InstalacionEstadoBadge
                  estado={instalacionSeleccionada.estado}
                  materialesListos={instalacionSeleccionada.materialesListos}
                  tamano="sm"
                />
              </div>

              <button
                onClick={() => setInstalacionSeleccionada(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {instalacionSeleccionada.comanda.cliente.nombre}
                </h3>
                <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                  {formatearHorario(
                    instalacionSeleccionada.horaInicio,
                    instalacionSeleccionada.horaFin
                  )}{" "}
                  — {new Date(instalacionSeleccionada.fecha).toLocaleDateString("es-AR")}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-200">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Dirección: </span>
                    <span>
                      {[
                        instalacionSeleccionada.comanda.cliente.direccion,
                        instalacionSeleccionada.comanda.cliente.localidad,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Sin dirección"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Teléfono: </span>
                    <span className="font-mono">
                      {instalacionSeleccionada.comanda.cliente.telefono || "Sin teléfono"}
                    </span>
                  </div>
                </div>
              </div>

              {instalacionSeleccionada.notas && (
                <div className="rounded-lg bg-amber-50 p-2.5 text-amber-900 border border-amber-200">
                  <span className="font-bold">Acceso a obra: </span>
                  {instalacionSeleccionada.notas}
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 block mb-1">
                  Cortinas a colocar ({instalacionSeleccionada.comanda.items.length}):
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {instalacionSeleccionada.comanda.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded-md text-[11px]"
                    >
                      <span className="font-medium text-slate-800">
                        {item.ambiente ? `[${item.ambiente}] ` : ""}
                        {item.descripcion}
                      </span>
                      <span className="font-mono font-semibold text-slate-600">
                        {item.ancho}×{item.alto}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href={`/instalaciones/${instalacionSeleccionada.id}`}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                Ver Ficha Completa / Hoja A4
              </Link>

              <button
                type="button"
                onClick={() => setInstalacionSeleccionada(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agendar nueva instalación */}
      <InstalacionAgendarModal
        abierto={modalAgendarAbierto}
        onCerrar={() => setModalAgendarAbierto(false)}
        comandasPendientes={comandasPendientes}
        instaladores={instaladores}
        bloqueos={bloqueos}
        comandaPreseleccionadaId={comandaPreseleccionada}
      />

      {/* Modal para registrar bloqueos de horario / indisponibilidades */}
      <BloqueoAgendaModal
        abierto={modalBloqueoAbierto}
        onCerrar={() => setModalBloqueoAbierto(false)}
        instaladores={instaladores}
        bloqueosExistentes={bloqueos}
        usuarioActualId={usuarioActualId}
      />
    </div>
  )
}
