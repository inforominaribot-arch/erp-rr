"use client"

import { useState } from "react"
import { X, CheckCircle2, Clock, Calendar, AlertCircle, Loader2 } from "lucide-react"
import type { IVisitaConRelaciones, EstadoVisita } from "../types"
import { cambiarEstadoVisitaAction, reprogramarVisitaAction } from "../actions"

interface VisitaCambiarEstadoModalProps {
  visita: IVisitaConRelaciones | null
  abierto: boolean
  onCerrar: () => void
  onExito: () => void
}

export function VisitaCambiarEstadoModal({
  visita,
  abierto,
  onCerrar,
  onExito,
}: VisitaCambiarEstadoModalProps) {
  const [cargando, setCargando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  const [estado, setEstado] = useState<EstadoVisita>(visita?.estado || "REALIZADA")
  const [notas, setNotas] = useState("")

  // Campos para reprogramación
  const [nuevaFecha, setNuevaFecha] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [horaInicio, setHoraInicio] = useState(visita?.horaInicio || "15:00")
  const [horaFin, setHoraFin] = useState(visita?.horaFin || "16:30")

  if (!abierto || !visita) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!visita) return

    setCargando(true)
    setErrorGlobal(null)

    try {
      if (estado === "REPROGRAMADA") {
        const res = await reprogramarVisitaAction({
          id: visita.id,
          fecha: nuevaFecha,
          horaInicio,
          horaFin,
          motivo: notas.trim() || undefined,
        })
        if (!res.success) {
          setErrorGlobal(res.error || "Error al reprogramar la visita.")
          setCargando(false)
          return
        }
      } else {
        const res = await cambiarEstadoVisitaAction({
          id: visita.id,
          estado,
          notasAdicionales: notas.trim() || undefined,
        })
        if (!res.success) {
          setErrorGlobal(res.error || "Error al cambiar el estado.")
          setCargando(false)
          return
        }
      }

      setCargando(false)
      onExito()
      onCerrar()
    } catch (err: any) {
      setCargando(false)
      setErrorGlobal(err.message || "Error al procesar el cambio.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              Actualizar Visita de Obra
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cliente: {visita.cliente.nombre}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorGlobal && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {errorGlobal}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nuevo Estado de la Visita
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "CONFIRMADA", label: "Confirmada", desc: "Cita ratificada" },
                { id: "REALIZADA", label: "Realizada", desc: "Medición tomada" },
                { id: "REPROGRAMADA", label: "Reprogramar", desc: "Cambiar día/hora" },
                { id: "CANCELADA", label: "Cancelada", desc: "No se realiza" },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setEstado(op.id as EstadoVisita)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    estado === op.id
                      ? "border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`block text-xs font-bold ${
                      estado === op.id ? "text-indigo-900" : "text-slate-900"
                    }`}
                  >
                    {op.label}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    {op.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Si eligió reprogramar, pedir nueva fecha y hora */}
          {estado === "REPROGRAMADA" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2.5">
              <span className="text-xs font-semibold text-amber-900 block">
                Nueva Coordinación de Fecha y Hora
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Fecha *</label>
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Hora Inicio *</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Hora Fin *</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {estado === "REALIZADA"
                ? "Notas de la visita (telas elegidas, pedidos especiales)"
                : estado === "REPROGRAMADA"
                ? "Motivo de la reprogramación"
                : "Notas adicionales"}
            </label>
            <textarea
              rows={3}
              placeholder={
                estado === "REALIZADA"
                  ? "Ej: Le encantó el lino rústico en crudo para living. En dormitorios quiere motorización."
                  : "Ej: El cliente pidió posponer por viaje o lluvia."
              }
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              {cargando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar Estado
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
