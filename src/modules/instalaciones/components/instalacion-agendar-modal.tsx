"use client"

// Módulo: Agenda & Instalación
// Modal para Agendar o Reprogramar una Instalación

import { useState, useTransition, useMemo } from "react"
import { Calendar, Clock, AlertCircle, X, Check, AlertTriangle } from "lucide-react"
import type { IComandaPendienteAgenda, IInstalador, IInstalacion, IBloqueoAgenda } from "../types"
import { agendarInstalacion, reprogramarInstalacion } from "../actions"

interface Props {
  abierto: boolean
  onCerrar: () => void
  comandasPendientes: IComandaPendienteAgenda[]
  instaladores: IInstalador[]
  bloqueos: IBloqueoAgenda[]
  comandaPreseleccionadaId?: string
  instalacionParaReprogramar?: IInstalacion | null
}

export function InstalacionAgendarModal({
  abierto,
  onCerrar,
  comandasPendientes,
  instaladores,
  bloqueos,
  comandaPreseleccionadaId,
  instalacionParaReprogramar,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const esEdicion = !!instalacionParaReprogramar

  // Initial values
  const hoyStr = new Date().toISOString().split("T")[0]
  const [comandaId, setComandaId] = useState<string>(
    instalacionParaReprogramar?.comandaId || comandaPreseleccionadaId || comandasPendientes[0]?.id || ""
  )
  const [fecha, setFecha] = useState<string>(
    instalacionParaReprogramar
      ? instalacionParaReprogramar.fecha.split("T")[0]
      : hoyStr
  )
  const [horaInicio, setHoraInicio] = useState<string>(
    instalacionParaReprogramar?.horaInicio || "09:00"
  )
  const [horaFin, setHoraFin] = useState<string>(
    instalacionParaReprogramar?.horaFin || "12:00"
  )
  const [instaladorIds, setInstaladorIds] = useState<string[]>(
    instalacionParaReprogramar
      ? instalacionParaReprogramar.instaladores.map((i) => i.usuarioId)
      : []
  )
  const [notas, setNotas] = useState<string>(
    instalacionParaReprogramar?.notas || ""
  )

  // Verificación en tiempo real de colisión con bloqueos
  const alertaColision = useMemo(() => {
    if (!fecha || !horaInicio || !horaFin || instaladorIds.length === 0) return null

    const bloqueosEnFecha = bloqueos.filter((b) => b.fecha.split("T")[0] === fecha)

    for (const b of bloqueosEnFecha) {
      const colisionaInstalador = !b.usuarioId || instaladorIds.includes(b.usuarioId)
      const solapamiento = horaInicio < b.horaFin && horaFin > b.horaInicio

      if (colisionaInstalador && solapamiento) {
        const nombreAfectado = b.usuario?.nombre || "El taller completo"
        return `Atención: ${nombreAfectado} tiene bloqueo registrado para ese horario ("${b.motivo}" de ${b.horaInicio} a ${b.horaFin} hs).`
      }
    }

    return null
  }, [fecha, horaInicio, horaFin, instaladorIds, bloqueos])

  if (!abierto) return null

  const handleToggleInstalador = (id: string) => {
    setInstaladorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!comandaId && !esEdicion) {
      setError("Debe seleccionar una comanda para agendar.")
      return
    }

    if (instaladorIds.length === 0) {
      setError("Debe asignar al menos a un instalador.")
      return
    }

    if (horaInicio && horaFin && horaInicio >= horaFin) {
      setError("La hora de inicio debe ser anterior a la hora estimada de fin.")
      return
    }

    startTransition(async () => {
      if (esEdicion && instalacionParaReprogramar) {
        const res = await reprogramarInstalacion({
          id: instalacionParaReprogramar.id,
          fecha,
          horaInicio,
          horaFin,
          instaladorIds,
          notas,
        })
        if (res.success) {
          onCerrar()
        } else {
          setError(res.error || "Error al reprogramar instalación")
        }
      } else {
        const res = await agendarInstalacion({
          comandaId,
          fecha,
          horaInicio,
          horaFin,
          instaladorIds,
          notas,
        })
        if (res.success) {
          onCerrar()
        } else {
          setError(res.error || "Error al agendar instalación")
        }
      }
    })
  }

  const comandaSeleccionada = comandasPendientes.find((c) => c.id === comandaId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {esEdicion ? "Reprogramar Instalación" : "Programar Instalación en Obra"}
              </h2>
              <p className="text-xs text-slate-500">
                Asigna fecha, franja horaria y colocadores del equipo
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Alerta de bloqueo preventivo */}
        {alertaColision && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold">Conflicto de horario detectado:</span>
              <p className="mt-0.5">{alertaColision}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Selector de Comanda (solo al crear) */}
          {!esEdicion && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Comanda a colocar
              </label>
              <select
                value={comandaId}
                onChange={(e) => setComandaId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Seleccione una comanda lista...</option>
                {comandasPendientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Comanda #{c.numero} — {c.cliente.nombre} ({c.cliente.localidad || "Sin localidad"}) [{c.itemsListos}/{c.totalItems} cortinas]
                  </option>
                ))}
              </select>

              {comandaSeleccionada && (
                <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200 flex flex-col gap-1">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>{comandaSeleccionada.cliente.nombre}</span>
                    <span className="text-indigo-600">{comandaSeleccionada.cliente.telefono || "Sin tel."}</span>
                  </div>
                  <div>
                    {comandaSeleccionada.cliente.direccion || "Sin dirección"}
                    {comandaSeleccionada.cliente.localidad && `, ${comandaSeleccionada.cliente.localidad}`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de colocación
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Franja Horaria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora inicio estimada
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora fin estimada
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Asignación de Instaladores (Múltiples) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Instaladores del equipo</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Seleccionados: {instaladorIds.length}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-lg">
              {instaladores.map((inst) => {
                const seleccionado = instaladorIds.includes(inst.id)
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => handleToggleInstalador(inst.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium border text-left transition-colors ${
                      seleccionado
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{inst.nombre}</span>
                    {seleccionado && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notas y recomendaciones de acceso a obra */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas y recomendaciones de acceso
            </label>
            <textarea
              rows={3}
              placeholder="Ej: Techos de 3.50m (llevar escalera de 4 metros), contactar a seguridad en garita o llamar 30 min antes."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-hidden disabled:opacity-50 transition-colors shadow-xs"
            >
              {isPending
                ? "Guardando..."
                : esEdicion
                ? "Guardar Cambios"
                : "Confirmar y Programar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
