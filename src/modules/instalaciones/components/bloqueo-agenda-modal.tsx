"use client"

// Módulo: Agenda & Instalación
// Modal para Registrar Indisponibilidad / Bloqueos de Horario

import { useState, useTransition } from "react"
import { Lock, X, Trash2, AlertCircle, Plus, Calendar, Clock, User } from "lucide-react"
import type { IInstalador, IBloqueoAgenda } from "../types"
import { crearBloqueoAgenda, eliminarBloqueoAgenda } from "../actions"

interface Props {
  abierto: boolean
  onCerrar: () => void
  instaladores: IInstalador[]
  bloqueosExistentes: IBloqueoAgenda[]
  usuarioActualId?: string
}

export function BloqueoAgendaModal({
  abierto,
  onCerrar,
  instaladores,
  bloqueosExistentes,
  usuarioActualId,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  // Form state
  const hoyStr = new Date().toISOString().split("T")[0]
  const [usuarioId, setUsuarioId] = useState<string>(usuarioActualId || "")
  const [fecha, setFecha] = useState<string>(hoyStr)
  const [horaInicio, setHoraInicio] = useState<string>("10:00")
  const [horaFin, setHoraFin] = useState<string>("12:00")
  const [motivo, setMotivo] = useState<string>("")

  if (!abierto) return null

  const handleCrearBloqueo = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setExito(null)

    if (!motivo.trim()) {
      setError("Por favor indique el motivo de la indisponibilidad.")
      return
    }

    if (horaInicio >= horaFin) {
      setError("La hora de inicio debe ser anterior a la hora de fin.")
      return
    }

    startTransition(async () => {
      const res = await crearBloqueoAgenda({
        usuarioId: usuarioId || null,
        fecha,
        horaInicio,
        horaFin,
        motivo,
      })

      if (res.success) {
        setExito("Indisponibilidad horaria registrada correctamente.")
        setMotivo("")
        setTimeout(() => {
          setExito(null)
        }, 2000)
      } else {
        setError(res.error || "No se pudo registrar el bloqueo.")
      }
    })
  }

  const handleEliminarBloqueo = (id: string) => {
    if (!confirm("¿Desea desbloquear este horario?")) return
    setError(null)

    startTransition(async () => {
      const res = await eliminarBloqueoAgenda(id)
      if (!res.success) {
        setError(res.error || "No se pudo eliminar el bloqueo.")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bloquear Horario / Indisponibilidad
              </h2>
              <p className="text-xs text-slate-500">
                Evita que se programen instalaciones en esta franja horaria
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

        {/* Mensajes de feedback */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {exito && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
            <span>{exito}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleCrearBloqueo} className="mt-5 space-y-4">
          {/* Miembro afectado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Miembro del equipo / Instalador
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Todo el taller / Sin instaladores disponibles</option>
                {instaladores.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre} ({inst.rol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de la indisponibilidad
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
                Desde (Hora inicio)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hasta (Hora fin)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo del bloqueo / Notificación
            </label>
            <input
              type="text"
              placeholder="Ej: Turno médico, Trámite personal, Mantenimiento camioneta"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-hidden disabled:opacity-50 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            {isPending ? "Guardando..." : "Registrar Indisponibilidad"}
          </button>
        </form>

        {/* Lista de bloqueos activos */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Bloqueos registrados activos ({bloqueosExistentes.length})
          </h3>

          {bloqueosExistentes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No hay bloqueos de horario registrados actualmente.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {bloqueosExistentes.map((b) => {
                const f = new Date(b.fecha)
                const fStr = f.toLocaleDateString("es-AR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  timeZone: "America/Argentina/Buenos_Aires",
                })
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-amber-800">
                          {b.usuario?.nombre || "Taller general"}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-medium text-slate-600">{fStr}</span>
                        <span className="text-amber-700 font-mono">
                          {b.horaInicio} a {b.horaFin} hs
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-500">{b.motivo}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEliminarBloqueo(b.id)}
                      disabled={isPending}
                      title="Eliminar bloqueo"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
