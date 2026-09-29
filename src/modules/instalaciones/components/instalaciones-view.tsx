"use client"

// Módulo: Agenda & Instalación
// Vista Principal del Módulo (/instalaciones)

import { useState } from "react"
import Link from "next/link"
import { Factory, PanelRightOpen, PanelRightClose } from "lucide-react"
import type {
  IInstalacion,
  IComandaPendienteAgenda,
  IInstalador,
  IBloqueoAgenda,
  MetricasInstalaciones,
} from "../types"
import { InstalacionKPIs } from "./instalacion-kpis"
import { CalendarioAgendaView } from "./calendario-agenda-view"
import { InstalacionesPendientesDrawer } from "./instalaciones-pendientes-drawer"
import { InstalacionAgendarModal } from "./instalacion-agendar-modal"

interface Props {
  instalaciones: IInstalacion[]
  comandasPendientes: IComandaPendienteAgenda[]
  instaladores: IInstalador[]
  bloqueos: IBloqueoAgenda[]
  metricas: MetricasInstalaciones
  usuarioActualId?: string
  rolUsuario?: string
}

export function InstalacionesView({
  instalaciones,
  comandasPendientes,
  instaladores,
  bloqueos,
  metricas,
  usuarioActualId,
  rolUsuario,
}: Props) {
  const [panelPendientesVisible, setPanelPendientesVisible] = useState(true)
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false)
  const [comandaPreseleccionada, setComandaPreseleccionada] = useState<string | undefined>()

  const handleSeleccionarComanda = (comandaId: string) => {
    setComandaPreseleccionada(comandaId)
    setModalAgendarAbierto(true)
  }

  const puedeGestionarTaller = ["ADMIN_GENERAL", "ADMINISTRACION", "TALLER"].includes(
    rolUsuario || ""
  )

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Agenda & Instalaciones
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Planificación de colocaciones en obra, itinerarios y control de salidas de taller
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón a la vista de taller */}
          {puedeGestionarTaller && (
            <Link
              href="/instalaciones/taller"
              className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <Factory className="h-4 w-4" />
              Tablero de Taller (Próximos 7 días)
            </Link>
          )}

          {/* Botón para alternar visibilidad del panel de pendientes */}
          <button
            onClick={() => setPanelPendientesVisible(!panelPendientesVisible)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            {panelPendientesVisible ? (
              <>
                <PanelRightClose className="h-4 w-4 text-slate-400" />
                Ocultar Comandas Listas ({comandasPendientes.length})
              </>
            ) : (
              <>
                <PanelRightOpen className="h-4 w-4 text-slate-400" />
                Ver Comandas Listas ({comandasPendientes.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas / KPIs */}
      <InstalacionKPIs metricas={metricas} />

      {/* Área Principal: Calendario + Drawer lateral de pendientes */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Columna Calendario */}
        <div
          className={`space-y-6 transition-all ${
            panelPendientesVisible ? "xl:col-span-8 2xl:col-span-9" : "xl:col-span-12"
          }`}
        >
          <CalendarioAgendaView
            instalaciones={instalaciones}
            comandasPendientes={comandasPendientes}
            instaladores={instaladores}
            bloqueos={bloqueos}
            usuarioActualId={usuarioActualId}
            rolUsuario={rolUsuario}
          />
        </div>

        {/* Columna Lateral: Comandas Pendientes de Agendar */}
        {panelPendientesVisible && (
          <div className="xl:col-span-4 2xl:col-span-3 sticky top-4 h-[calc(100vh-140px)]">
            <InstalacionesPendientesDrawer
              comandas={comandasPendientes}
              onSeleccionarComanda={handleSeleccionarComanda}
            />
          </div>
        )}
      </div>

      {/* Modal para agendar */}
      <InstalacionAgendarModal
        abierto={modalAgendarAbierto}
        onCerrar={() => setModalAgendarAbierto(false)}
        comandasPendientes={comandasPendientes}
        instaladores={instaladores}
        bloqueos={bloqueos}
        comandaPreseleccionadaId={comandaPreseleccionada}
      />
    </div>
  )
}
