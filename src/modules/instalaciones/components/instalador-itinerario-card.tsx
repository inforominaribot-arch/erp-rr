"use client"

// Módulo: Agenda & Instalación
// Tarjeta de Itinerario para Instaladores (Mobile / Tablet First)

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  AlertCircle,
  UserCheck,
} from "lucide-react"
import type { IInstalacion } from "../types"
import { formatearHorario } from "../types"
import { InstalacionEstadoBadge } from "./instalacion-estado-badge"
import { completarInstalacion } from "../actions"

interface Props {
  instalacion: IInstalacion
}

export function InstaladorItinerarioCard({ instalacion }: Props) {
  const [modalCompletarAbierto, setModalCompletarAbierto] = useState(false)
  const [observacionesFinales, setObservacionesFinales] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { comanda, instaladores } = instalacion
  const cliente = comanda.cliente

  const direccionCompleta = [cliente?.direccion, cliente?.localidad]
    .filter(Boolean)
    .join(", ")

  const mapsUrl = direccionCompleta
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`
    : null

  // Mensaje prearmado para WhatsApp
  const mensajeWhatsApp = encodeURIComponent(
    `Hola ${cliente?.nombre || ""}, nos estamos comunicando de ROMINA RIBOT Cortinados. Estamos en camino a su domicilio para realizar la colocación de sus cortinas prevista para hoy.`
  )
  const waUrl = cliente?.telefono
    ? `https://wa.me/${cliente.telefono.replace(/\D/g, "")}?text=${mensajeWhatsApp}`
    : null

  const handleCompletar = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await completarInstalacion({
        id: instalacion.id,
        observacionesFinales,
      })

      if (res.success) {
        setModalCompletarAbierto(false)
      } else {
        setError(res.error || "No se pudo marcar la instalación como completada.")
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
      {/* Cabecera de la tarjeta */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs font-mono">
            #{comanda.numero}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{cliente?.nombre}</h3>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {formatearHorario(instalacion.horaInicio, instalacion.horaFin)}
            </p>
          </div>
        </div>

        <InstalacionEstadoBadge
          estado={instalacion.estado}
          materialesListos={instalacion.materialesListos}
        />
      </div>

      {/* Datos de contacto y ubicación rápida con botones táctiles */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dirección */}
        <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <MapPin className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">Dirección</p>
            <p className="text-slate-600 break-words">{direccionCompleta || "Sin dirección cargada"}</p>
          </div>
        </div>

        {/* Teléfono y Contacto */}
        <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <Phone className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">Contacto</p>
            <p className="font-mono text-slate-700 font-semibold">{cliente?.telefono || "Sin teléfono"}</p>
          </div>
        </div>
      </div>

      {/* Botones táctiles directos para la camioneta: Google Maps y WhatsApp */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-xs sm:text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs active:scale-95"
          >
            <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Abrir en Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60 ml-auto sm:ml-0" />
          </a>
        )}

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs active:scale-95"
          >
            <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Enviar aviso por WhatsApp</span>
          </a>
        )}
      </div>

      {/* Instaladores asignados */}
      {instaladores.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <UserCheck className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium">Equipo a cargo:</span>
          <span>{instaladores.map((i) => i.usuario.nombre).join(", ")}</span>
        </div>
      )}

      {/* Notas de acceso */}
      {instalacion.notas && (
        <div className="mt-3 rounded-lg bg-amber-50/60 p-2.5 text-xs text-amber-900 border border-amber-200">
          <span className="font-bold">Recomendaciones de acceso:</span>{" "}
          <span>{instalacion.notas}</span>
        </div>
      )}

      {/* Cortinas a colocar */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          Cortinas a colocar ({comanda.items.length})
        </p>

        <div className="space-y-1.5">
          {comanda.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs border border-slate-200"
            >
              <div>
                <span className="font-semibold text-slate-800">
                  {item.ambiente ? `[${item.ambiente}] ` : ""}
                  {item.descripcion}
                </span>
                <span className="text-slate-400 ml-2">x{item.cantidad}</span>
              </div>
              <span className="font-mono text-slate-600 font-medium">
                {item.ancho} × {item.alto} m
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones principales de la tarjeta */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Link
          href={`/instalaciones/${instalacion.id}`}
          className="min-h-[40px] flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <FileText className="h-4 w-4" />
          Ver Ficha Técnica / Hoja A4
        </Link>

        {instalacion.estado === "PROGRAMADA" && (
          <button
            onClick={() => setModalCompletarAbierto(true)}
            className="min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm active:scale-95 w-full sm:w-auto"
          >
            <CheckCircle2 className="h-5 w-5" />
            Marcar Instalación Completada
          </button>
        )}
      </div>

      {/* Modal de finalización de instalación */}
      {modalCompletarAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Completar Instalación
                </h3>
                <p className="text-xs text-slate-500">
                  Cierre de obra de {cliente?.nombre}
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCompletar} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones finales de obra / Conformidad
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Colocación exitosa sin inconvenientes. Cliente conforme y firmó la hoja de colocación."
                  value={observacionesFinales}
                  onChange={(e) => setObservacionesFinales(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="rounded-lg bg-emerald-50/60 p-2.5 text-[11px] text-emerald-800 border border-emerald-200">
                Esta acción actualizará automáticamente el estado de la colocación a{" "}
                <strong>COMPLETADA</strong>, la comanda a <strong>INSTALADO</strong> y el
                cliente a <strong>INSTALADO</strong>, cerrando el ciclo comercial.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCompletarAbierto(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isPending ? "Confirmando..." : "Confirmar y Cerrar Obra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
