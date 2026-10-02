"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  Table as TableIcon,
  Plus,
  Share2,
  CalendarCheck2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import type { IVisitaConRelaciones, IVisitasMetricas } from "../types"
import { VisitaKPIs } from "./visita-kpis"
import { VisitasCalendarioView } from "./visitas-calendario-view"
import { VisitasTabla } from "./visitas-tabla"
import { VisitaModalForm } from "./visita-modal-form"
import { VisitaCambiarEstadoModal } from "./visita-cambiar-estado-modal"

interface VisitasViewProps {
  visitas: IVisitaConRelaciones[]
  metricas: IVisitasMetricas
  clientesParaModal: Array<{
    id: string
    nombre: string
    telefono?: string | null
    direccion?: string | null
    localidad?: string | null
    notas?: string | null
  }>
}

export function VisitasView({
  visitas,
  metricas,
  clientesParaModal,
}: VisitasViewProps) {
  const router = useRouter()

  const [vistaModo, setVistaModo] = useState<"calendario" | "tabla">("calendario")

  // Estado del modal de formulario
  const [modalFormAbierto, setModalFormAbierto] = useState(false)
  const [visitaParaEditar, setVisitaParaEditar] = useState<IVisitaConRelaciones | null>(null)

  // Estado del modal de cambio de estado
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false)
  const [visitaParaEstado, setVisitaParaEstado] = useState<IVisitaConRelaciones | null>(null)

  // Estado del popup de sincronización iCal
  const [mostrarModalSync, setMostrarModalSync] = useState(false)
  const [copiado, setCopiado] = useState(false)

  function abrirAgendar() {
    setVisitaParaEditar(null)
    setModalFormAbierto(true)
  }

  function abrirEditar(v: IVisitaConRelaciones) {
    setVisitaParaEditar(v)
    setModalFormAbierto(true)
  }

  function abrirCambiarEstado(v: IVisitaConRelaciones) {
    setVisitaParaEstado(v)
    setModalEstadoAbierto(true)
  }

  function handleExito() {
    router.refresh()
  }

  const urlIcal = typeof window !== "undefined"
    ? `${window.location.origin}/api/visitas/calendario.ics`
    : "/api/visitas/calendario.ics"

  function copiarIcal() {
    navigator.clipboard.writeText(urlIcal)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* 1. KPIs de la Agenda Comercial */}
      <VisitaKPIs metricas={metricas} />

      {/* 2. Barra de Herramientas Principal: Conmutador de vista + Sincronización + Agendar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Switch Calendario / Tabla */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setVistaModo("calendario")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              vistaModo === "calendario"
                ? "bg-white text-indigo-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Calendario e Itinerario</span>
          </button>

          <button
            type="button"
            onClick={() => setVistaModo("tabla")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              vistaModo === "tabla"
                ? "bg-white text-indigo-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TableIcon className="h-4 w-4" />
            <span>Listado y Tabla</span>
          </button>
        </div>

        {/* Botones de acción: Sincronizar Google Calendar + Agendar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarModalSync(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-colors min-h-[40px]"
            title="Sincronizar visitas con Google Calendar del teléfono"
          >
            <CalendarCheck2 className="h-4 w-4 text-indigo-600" />
            <span>Sincronizar Google Calendar</span>
          </button>

          <button
            type="button"
            onClick={abrirAgendar}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>Agendar Visita</span>
          </button>
        </div>
      </div>

      {/* 3. Contenido Principal */}
      {vistaModo === "calendario" ? (
        <VisitasCalendarioView
          visitas={visitas}
          onAgendarNueva={abrirAgendar}
          onEditarVisita={abrirEditar}
          onCambiarEstadoVisita={abrirCambiarEstado}
        />
      ) : (
        <VisitasTabla
          visitas={visitas}
          onEditarVisita={abrirEditar}
          onCambiarEstadoVisita={abrirCambiarEstado}
        />
      )}

      {/* 4. Modal para Agendar / Editar Visita */}
      <VisitaModalForm
        abierto={modalFormAbierto}
        onCerrar={() => setModalFormAbierto(false)}
        onExito={handleExito}
        visitaEditar={visitaParaEditar}
        clientesIniciales={clientesParaModal}
      />

      {/* 5. Modal para Cambiar Estado y Registrar Notas */}
      <VisitaCambiarEstadoModal
        visita={visitaParaEstado}
        abierto={modalEstadoAbierto}
        onCerrar={() => setModalEstadoAbierto(false)}
        onExito={handleExito}
      />

      {/* 6. Modal de Información y Suscripción a Google Calendar */}
      {mostrarModalSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck2 className="h-5 w-5 text-indigo-600" />
                Vincular con Google Calendar
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalSync(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Podés tener todas las visitas agendadas en tu teléfono (Android / iPhone) suscriptas automáticamente en tu Google Calendar sin tocar nada:
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 block">
                Tu enlace de suscripción iCal privado:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={urlIcal}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono select-all focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={copiarIcal}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 flex items-center gap-1 shrink-0"
                >
                  {copiado ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-white" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-500 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
              <p className="font-semibold text-indigo-900">¿Cómo agregarlo en tu Google Calendar?</p>
              <p>1. Entrá a Google Calendar en la PC o navegador de tu celular.</p>
              <p>2. Al costado de <em>"Otros calendarios"</em>, tocá <strong>"+"</strong> y elegí <strong>"Desde URL"</strong>.</p>
              <p>3. Pegá este enlace y tocá "Agregar calendario". ¡Listo! Todas las visitas que agendes en el ERP se verán en tu app móvil de calendario.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalSync(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
