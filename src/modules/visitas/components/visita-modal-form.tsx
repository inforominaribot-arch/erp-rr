"use client"

import { useState, useEffect } from "react"
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  FileText,
  UserPlus,
  Loader2,
  Check,
  Search,
} from "lucide-react"
import type { IVisitaConRelaciones, TipoVisita, EstadoVisita } from "../types"
import {
  agendarVisitaAction,
  actualizarVisitaAction,
  crearClienteRapidoVisitaAction,
} from "../actions"
import { generarGoogleCalendarUrl } from "../types"

interface ClienteItem {
  id: string
  nombre: string
  telefono?: string | null
  direccion?: string | null
  localidad?: string | null
  notas?: string | null
  estado?: string
}

interface VisitaModalFormProps {
  abierto: boolean
  onCerrar: () => void
  onExito: () => void
  visitaEditar?: IVisitaConRelaciones | null
  clientesIniciales: ClienteItem[]
  clientePreseleccionadoId?: string
}

const FRANJAS_SUGERIDAS = [
  { inicio: "09:00", fin: "10:30", label: "09:00 a 10:30 hs (Mañana)" },
  { inicio: "11:00", fin: "12:30", label: "11:00 a 12:30 hs (Mediodía)" },
  { inicio: "14:30", fin: "16:00", label: "14:30 a 16:00 hs (Tarde temprano)" },
  { inicio: "16:30", fin: "18:00", label: "16:30 a 18:00 hs (Tarde)" },
  { inicio: "18:00", fin: "19:30", label: "18:00 a 19:30 hs (Último turno)" },
]

export function VisitaModalForm({
  abierto,
  onCerrar,
  onExito,
  visitaEditar,
  clientesIniciales,
  clientePreseleccionadoId,
}: VisitaModalFormProps) {
  const [cargando, setCargando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  // Selector y buscador de clientes
  const [clientes, setClientes] = useState<ClienteItem[]>(clientesIniciales)
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteItem | null>(null)
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false)

  // Subformulario para crear cliente express en el mismo modal
  const [modoCrearCliente, setModoCrearCliente] = useState(false)
  const [cargandoClienteExpress, setCargandoClienteExpress] = useState(false)
  const [nuevoClienteData, setNuevoClienteData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    localidad: "",
  })

  // Campos de la visita
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [horaInicio, setHoraInicio] = useState("15:00")
  const [horaFin, setHoraFin] = useState("16:30")
  const [tipoVisita, setTipoVisita] = useState<TipoVisita>("PRIMERA_MEDICION")
  const [estadoVisita, setEstadoVisita] = useState<EstadoVisita>("PROGRAMADA")
  const [direccion, setDireccion] = useState("")
  const [localidad, setLocalidad] = useState("")
  const [notas, setNotas] = useState("")

  // Inicializar si estamos editando
  useEffect(() => {
    if (visitaEditar) {
      const f = new Date(visitaEditar.fecha)
      setFecha(f.toISOString().split("T")[0])
      setHoraInicio(visitaEditar.horaInicio)
      setHoraFin(visitaEditar.horaFin)
      setTipoVisita(visitaEditar.tipoVisita)
      setEstadoVisita(visitaEditar.estado)
      setDireccion(visitaEditar.direccion)
      setLocalidad(visitaEditar.localidad || "")
      setNotas(visitaEditar.notas || "")

      const c = clientes.find((item) => item.id === visitaEditar.cliente.id) || {
        id: visitaEditar.cliente.id,
        nombre: visitaEditar.cliente.nombre,
        telefono: visitaEditar.cliente.telefono,
        direccion: visitaEditar.cliente.direccion,
        localidad: visitaEditar.cliente.localidad,
      }
      setClienteSeleccionado(c)
      setBusquedaCliente(c.nombre)
    } else {
      // Nueva visita
      const hoy = new Date().toISOString().split("T")[0]
      setFecha(hoy)
      setHoraInicio("15:00")
      setHoraFin("16:30")
      setTipoVisita("PRIMERA_MEDICION")
      setEstadoVisita("PROGRAMADA")
      setNotas("")

      if (clientePreseleccionadoId) {
        const c = clientes.find((item) => item.id === clientePreseleccionadoId)
        if (c) {
          seleccionarCliente(c)
        }
      } else {
        setClienteSeleccionado(null)
        setBusquedaCliente("")
        setDireccion("")
        setLocalidad("")
      }
    }
    setErrorGlobal(null)
    setModoCrearCliente(false)
  }, [visitaEditar, abierto, clientePreseleccionadoId])

  if (!abierto) return null

  function seleccionarCliente(c: ClienteItem) {
    setClienteSeleccionado(c)
    setBusquedaCliente(c.nombre)
    setMostrarDropdownClientes(false)
    if (c.direccion) setDireccion(c.direccion)
    if (c.localidad) setLocalidad(c.localidad)
  }

  function aplicarFranja(inicio: string, fin: string) {
    setHoraInicio(inicio)
    setHoraFin(fin)
  }

  async function handleCrearClienteExpress(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoClienteData.nombre.trim()) {
      setErrorGlobal("El nombre del cliente es obligatorio.")
      return
    }
    if (!nuevoClienteData.telefono.trim()) {
      setErrorGlobal("El teléfono es obligatorio para coordinar por WhatsApp.")
      return
    }
    if (!nuevoClienteData.direccion.trim()) {
      setErrorGlobal("La dirección de la obra es obligatoria.")
      return
    }

    setCargandoClienteExpress(true)
    setErrorGlobal(null)

    const res = await crearClienteRapidoVisitaAction({
      nombre: nuevoClienteData.nombre,
      telefono: nuevoClienteData.telefono,
      direccion: nuevoClienteData.direccion,
      localidad: nuevoClienteData.localidad || undefined,
    })

    setCargandoClienteExpress(false)

    if (!res.success) {
      setErrorGlobal(res.error || "No se pudo crear el cliente.")
      return
    }

    const nuevo = res.data
    setClientes((prev) => [nuevo, ...prev])
    seleccionarCliente(nuevo)
    setModoCrearCliente(false)
    setNuevoClienteData({ nombre: "", telefono: "", direccion: "", localidad: "" })
  }

  async function handleSubmit(e: React.FormEvent, abrirGoogleCal: boolean = false) {
    e.preventDefault()
    setErrorGlobal(null)

    if (!clienteSeleccionado) {
      setErrorGlobal("Por favor seleccioná o creá un cliente para la visita.")
      return
    }

    if (!direccion.trim()) {
      setErrorGlobal("La dirección de la obra es obligatoria.")
      return
    }

    setCargando(true)

    try {
      if (visitaEditar) {
        // Actualizar
        const res = await actualizarVisitaAction({
          id: visitaEditar.id,
          clienteId: clienteSeleccionado.id,
          fecha,
          horaInicio,
          horaFin,
          tipoVisita,
          estado: estadoVisita,
          direccion,
          localidad: localidad || undefined,
          notas: notas || undefined,
        })

        if (!res.success) {
          setErrorGlobal(res.error || "Error al actualizar la visita.")
          setCargando(false)
          return
        }
      } else {
        // Crear
        const res = await agendarVisitaAction({
          clienteId: clienteSeleccionado.id,
          fecha,
          horaInicio,
          horaFin,
          tipoVisita,
          direccion,
          localidad: localidad || undefined,
          notas: notas || undefined,
        })

        if (!res.success) {
          setErrorGlobal(res.error || "Error al agendar la visita.")
          setCargando(false)
          return
        }
      }

      if (abrirGoogleCal && clienteSeleccionado) {
        const calUrl = generarGoogleCalendarUrl({
          titulo: `Medición: ${clienteSeleccionado.nombre} (${localidad || "Obra"})`,
          descripcion: `Cliente: ${clienteSeleccionado.nombre}\nTel: ${clienteSeleccionado.telefono || ""}\nTipo: ${tipoVisita}\nNotas: ${notas}`,
          direccion,
          localidad,
          fecha,
          horaInicio,
          horaFin,
        })
        window.open(calUrl, "_blank")
      }

      setCargando(false)
      onExito()
      onCerrar()
    } catch (err: any) {
      setCargando(false)
      setErrorGlobal(err.message || "Ocurrió un error inesperado.")
    }
  }

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    (c.telefono && c.telefono.includes(busquedaCliente)) ||
    (c.direccion && c.direccion.toLowerCase().includes(busquedaCliente.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-slate-50/70">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              {visitaEditar ? "Modificar Visita en Obra" : "Agendar Visita de Medición"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Agenda comercial para Romina Ribot
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 touch-scroll">
          {errorGlobal && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {errorGlobal}
            </div>
          )}

          {/* 1. SECCIÓN CLIENTE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                Cliente
              </label>

              {!visitaEditar && (
                <button
                  type="button"
                  onClick={() => setModoCrearCliente(!modoCrearCliente)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {modoCrearCliente ? "Buscar existente" : "+ Crear cliente nuevo"}
                </button>
              )}
            </div>

            {/* Subformulario rápido para nuevo cliente */}
            {modoCrearCliente ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-3">
                <p className="text-xs font-semibold text-indigo-900">
                  Alta Express de Cliente (se guarda de inmediato en el CRM)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Nombre *</label>
                    <input
                      type="text"
                      placeholder="Ej: Mariana Gómez"
                      value={nuevoClienteData.nombre}
                      onChange={(e) =>
                        setNuevoClienteData({ ...nuevoClienteData, nombre: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">WhatsApp / Tel *</label>
                    <input
                      type="text"
                      placeholder="Ej: 11 4455 6677"
                      value={nuevoClienteData.telefono}
                      onChange={(e) =>
                        setNuevoClienteData({ ...nuevoClienteData, telefono: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Dirección Obra *</label>
                    <input
                      type="text"
                      placeholder="Calle y número / Barrio"
                      value={nuevoClienteData.direccion}
                      onChange={(e) =>
                        setNuevoClienteData({ ...nuevoClienteData, direccion: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Localidad</label>
                    <input
                      type="text"
                      placeholder="Ej: Nordelta, Pilar..."
                      value={nuevoClienteData.localidad}
                      onChange={(e) =>
                        setNuevoClienteData({ ...nuevoClienteData, localidad: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={cargandoClienteExpress}
                    onClick={handleCrearClienteExpress}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {cargandoClienteExpress && <Loader2 className="h-3 w-3 animate-spin" />}
                    Guardar y Seleccionar
                  </button>
                </div>
              </div>
            ) : (
              /* Buscador y selector de cliente existente */
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    disabled={!!visitaEditar}
                    placeholder="Escribí nombre, teléfono o dirección del cliente..."
                    value={busquedaCliente}
                    onChange={(e) => {
                      setBusquedaCliente(e.target.value)
                      setMostrarDropdownClientes(true)
                    }}
                    onFocus={() => setMostrarDropdownClientes(true)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                  />
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                {/* Dropdown de autocompletado */}
                {mostrarDropdownClientes && !visitaEditar && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg touch-scroll">
                    {clientesFiltrados.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        No se encontró ningún cliente. Podés crearlo con el botón "+ Crear cliente nuevo".
                      </div>
                    ) : (
                      clientesFiltrados.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => seleccionarCliente(c)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{c.nombre}</span>
                            {c.telefono && (
                              <span className="text-slate-500 ml-2">📱 {c.telefono}</span>
                            )}
                            {c.direccion && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                📍 {c.direccion} {c.localidad ? `(${c.localidad})` : ""}
                              </p>
                            )}
                          </div>
                          {clienteSeleccionado?.id === c.id && (
                            <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. SECCIÓN FECHA Y HORARIOS */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                  Fecha de Visita *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  Hora Inicio *
                </label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  Hora Fin Estimada *
                </label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Atajos de franjas horarias */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 block mb-1">
                Franjas habituales sugeridas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FRANJAS_SUGERIDAS.map((franja) => (
                  <button
                    key={franja.label}
                    type="button"
                    onClick={() => aplicarFranja(franja.inicio, franja.fin)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    {franja.inicio} - {franja.fin}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. TIPO DE VISITA Y ESTADO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tipo de Visita
              </label>
              <select
                value={tipoVisita}
                onChange={(e) => setTipoVisita(e.target.value as TipoVisita)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="PRIMERA_MEDICION">Primera medición (comercial)</option>
                <option value="REMEDICION">Remedición técnica</option>
                <option value="MUESTRA_TELAS">Muestra de telas y texturas</option>
                <option value="ASESORAMIENTO">Asesoramiento de diseño</option>
              </select>
            </div>

            {visitaEditar && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Estado de la Visita
                </label>
                <select
                  value={estadoVisita}
                  onChange={(e) => setEstadoVisita(e.target.value as EstadoVisita)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="PROGRAMADA">Programada</option>
                  <option value="CONFIRMADA">Confirmada con cliente</option>
                  <option value="REALIZADA">Realizada</option>
                  <option value="REPROGRAMADA">Reprogramada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            )}
          </div>

          {/* 4. DIRECCIÓN DE LA OBRA */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                  Dirección de la Visita / Obra *
                </label>
                <input
                  type="text"
                  placeholder="Calle, número, barrio cerrado o lote"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Localidad / Zona
                </label>
                <input
                  type="text"
                  placeholder="Ej: Nordelta, Tigre"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 5. NOTAS DE OBRA */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              Notas de Obra y Muestras de Tela a Llevar
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Quiere tradicional de lino en living y roller blackout en dormitorios. Llevar catálogo de telas claras. Llamar antes de salir."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Pie del Modal con Botones */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5 bg-slate-50/70 shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            disabled={cargando}
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            Cancelar
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={cargando}
              onClick={(e) => handleSubmit(e, true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors min-h-[44px]"
            >
              📅 Guardar y Enviar a Google Calendar
            </button>

            <button
              type="button"
              disabled={cargando}
              onClick={(e) => handleSubmit(e, false)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors min-h-[44px]"
            >
              {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
              {visitaEditar ? "Guardar Cambios" : "Agendar Visita"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
