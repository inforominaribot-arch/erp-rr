"use client"

// Módulo: Agenda & Instalación
// Vista de Taller: Preparación de Materiales para el Día Siguiente (Próximos 7 días)

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  PackageCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Lock,
  CheckCircle,
  FileText,
} from "lucide-react"
import type { IInstalacion, IInstalador, IBloqueoAgenda } from "../types"
import { formatearHorario } from "../types"
import { toggleMaterialesListos } from "../actions"
import { BloqueoAgendaModal } from "./bloqueo-agenda-modal"

interface Props {
  instalaciones: IInstalacion[]
  instaladores: IInstalador[]
  bloqueos: IBloqueoAgenda[]
}

export function InstalacionesTallerTablero({
  instalaciones,
  instaladores,
  bloqueos,
}: Props) {
  const [modalBloqueoAbierto, setModalBloqueoAbierto] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const hoyStr = hoy.toISOString().split("T")[0]

  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)
  const mananaStr = manana.toISOString().split("T")[0]

  // Detectar instalaciones críticas de mañana sin materiales listos
  const instalacionesMananaSinMateriales = instalaciones.filter((inst) => {
    const instFechaStr = inst.fecha.split("T")[0]
    return instFechaStr === mananaStr && !inst.materialesListos
  })

  const instalacionesHoySinMateriales = instalaciones.filter((inst) => {
    const instFechaStr = inst.fecha.split("T")[0]
    return instFechaStr === hoyStr && !inst.materialesListos
  })

  const handleToggleMateriales = (id: string, nuevoEstado: boolean) => {
    setError(null)
    startTransition(async () => {
      const res = await toggleMaterialesListos(id, nuevoEstado)
      if (!res.success) {
        setError(res.error || "No se pudo actualizar el estado de materiales.")
      }
    })
  }

  // Agrupar instalaciones por fecha
  const instalacionesPorFecha: Record<string, IInstalacion[]> = {}
  for (const inst of instalaciones) {
    const fechaKey = inst.fecha.split("T")[0]
    if (!instalacionesPorFecha[fechaKey]) {
      instalacionesPorFecha[fechaKey] = []
    }
    instalacionesPorFecha[fechaKey].push(inst)
  }

  const fechasOrdenadas = Object.keys(instalacionesPorFecha).sort()

  return (
    <div className="space-y-6">
      {/* Botón superior de bloqueo de horario */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Tablero de Salida y Embalaje de Taller
          </h2>
          <p className="text-xs text-slate-500">
            Control de paquetes y preparación para colocaciones de los próximos 7 días
          </p>
        </div>

        <button
          onClick={() => setModalBloqueoAbierto(true)}
          className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-xs"
        >
          <Lock className="h-4 w-4 text-amber-600" />
          Registrar Indisponibilidad / Bloqueo de Horario
        </button>
      </div>

      {/* ALERTA CRÍTICA DESTACADA si hay colocaciones para MAÑANA sin materiales */}
      {instalacionesMananaSinMateriales.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500 bg-red-50/90 p-5 shadow-sm animate-pulse-subtle">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white shadow-md">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                  ¡Atención Taller!
                </span>
                <span className="text-xs font-bold text-red-900">
                  Instalaciones programadas para MAÑANA sin materiales listos
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-red-800">
                Hay {instalacionesMananaSinMateriales.length}{" "}
                {instalacionesMananaSinMateriales.length === 1
                  ? "colocación fijada para mañana que todavía no tiene"
                  : "colocaciones fijadas para mañana que todavía no tienen"}{" "}
                sus cortinas y accesorios marcados como listos para salir a obra.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {instalacionesMananaSinMateriales.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-800 border border-red-300 shadow-2xs"
                  >
                    <span>Comanda #{inst.comanda.numero}</span>
                    <span className="text-slate-400">•</span>
                    <span>{inst.comanda.cliente.nombre}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-indigo-600">
                      {formatearHorario(inst.horaInicio, inst.horaFin)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta hoy sin materiales */}
      {instalacionesHoySinMateriales.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-center gap-3 text-xs text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Colocaciones de HOY sin tildar:</span> Hay{" "}
            {instalacionesHoySinMateriales.length} instalación(es) programada(s) para hoy sin
            marcar como lista. Por favor verifique el despacho con el equipo de instalación.
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Grid de fechas */}
      {fechasOrdenadas.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
          <h3 className="text-base font-bold text-slate-700">Taller al día</h3>
          <p className="text-xs text-slate-400 mt-1">
            No hay instalaciones programadas para los próximos 7 días.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {fechasOrdenadas.map((fechaKey) => {
            const items = instalacionesPorFecha[fechaKey]
            const esHoy = fechaKey === hoyStr
            const esManana = fechaKey === mananaStr

            const fechaObj = new Date(fechaKey + "T12:00:00")
            const fechaTitulo = fechaObj.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })

            return (
              <div
                key={fechaKey}
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
              >
                {/* Cabecera del día */}
                <div
                  className={`flex items-center justify-between px-5 py-3 border-b ${
                    esHoy
                      ? "bg-blue-50/70 border-blue-200 text-blue-900"
                      : esManana
                      ? "bg-amber-50/70 border-amber-200 text-amber-900"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-bold text-sm capitalize">{fechaTitulo}</span>
                    {esHoy && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        Hoy
                      </span>
                    )}
                    {esManana && (
                      <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        Mañana
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-semibold">
                    {items.length} {items.length === 1 ? "instalación" : "instalaciones"}
                  </span>
                </div>

                {/* Lista de colocaciones del día */}
                <div className="divide-y divide-slate-100 p-2">
                  {items.map((inst) => {
                    const { comanda, instaladores } = inst
                    const cliente = comanda.cliente

                    return (
                      <div
                        key={inst.id}
                        className={`p-4 rounded-xl transition-all ${
                          !inst.materialesListos && (esManana || esHoy)
                            ? "bg-red-50/40 border border-red-200 my-1"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700">
                                Comanda #{comanda.numero}
                              </span>
                              <h3 className="text-base font-bold text-slate-900">
                                {cliente.nombre}
                              </h3>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {formatearHorario(inst.horaInicio, inst.horaFin)}
                              </span>
                              {cliente.localidad && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                  {cliente.localidad}
                                </span>
                              )}
                              {instaladores.length > 0 && (
                                <span className="text-indigo-600">
                                  Colocador(es): {instaladores.map((i) => i.usuario.nombre).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Switch de Materiales Listos */}
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/instalaciones/${inst.id}`}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Ficha A4
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleToggleMateriales(inst.id, !inst.materialesListos)}
                              disabled={isPending}
                              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                                inst.materialesListos
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-white border-2 border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                              }`}
                            >
                              <PackageCheck className="h-4 w-4" />
                              {inst.materialesListos
                                ? "✓ Materiales Listos"
                                : "Marcar Materiales Listos"}
                            </button>
                          </div>
                        </div>

                        {/* Checklist de cortinas y paños */}
                        <div className="mt-3 rounded-xl bg-slate-50/80 p-3 border border-slate-200">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Checklist de Cortinas a Embalar ({comanda.items.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {comanda.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs border border-slate-200 shadow-2xs"
                              >
                                <span className="truncate font-medium text-slate-800">
                                  {item.ambiente ? `[${item.ambiente}] ` : ""}
                                  {item.descripcion}
                                </span>
                                <span className="font-mono text-slate-500 text-[11px] shrink-0 ml-2">
                                  {item.ancho}×{item.alto}m
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notas de acceso */}
                        {inst.notas && (
                          <div className="mt-2 text-xs text-amber-800 bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-200">
                            <span className="font-bold">Observación de obra:</span> {inst.notas}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Bloqueo de Horario */}
      <BloqueoAgendaModal
        abierto={modalBloqueoAbierto}
        onCerrar={() => setModalBloqueoAbierto(false)}
        instaladores={instaladores}
        bloqueosExistentes={bloqueos}
      />
    </div>
  )
}
