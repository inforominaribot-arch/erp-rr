"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { ComandaTabla } from "./comanda-tabla"
import { ComandaGenerarModal } from "./comanda-generar-modal"
import type {
  IComandaConRelaciones,
  IMetricasComandas,
  IPresupuestoAceptadoResumen,
} from "../types"
import {
  Plus,
  ClipboardList,
  Clock,
  Factory,
  Truck,
  PackageCheck,
} from "lucide-react"

interface ComandasViewProps {
  comandas: IComandaConRelaciones[]
  metricas: IMetricasComandas
  presupuestosAceptados: IPresupuestoAceptadoResumen[]
  puedeGestionar: boolean
}

export function ComandasView({
  comandas,
  metricas,
  presupuestosAceptados,
  puedeGestionar,
}: ComandasViewProps) {
  const [modalAbierto, setModalAbierto] = useState(false)

  return (
    <div className="space-y-6">
      {/* ── ENCABEZADO PRINCIPAL ── */}
      <PageHeader
        titulo="Comandas de Trabajo"
        descripcion="Gestión de órdenes de confección y pedidos de taller derivados de presupuestos aprobados"
      >
        {puedeGestionar && (
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Nueva Comanda
          </button>
        )}
      </PageHeader>

      {/* ── KPIs DE COMANDAS ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Total Comandas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Comandas
            </span>
            <ClipboardList className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {metricas.totalComandas}
          </p>
          <span className="text-[11px] text-slate-400">Órdenes emitidas</span>
        </div>

        {/* Pendientes */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Pendientes
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-950 font-mono">
            {metricas.pendientes}
          </p>
          <span className="text-[11px] text-amber-700/80">Por iniciar taller</span>
        </div>

        {/* En Producción */}
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              En Producción
            </span>
            <Factory className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-950 font-mono">
            {metricas.enProduccion}
          </p>
          <span className="text-[11px] text-indigo-600/80">
            En corte y confección
          </span>
        </div>

        {/* Esperando Proveedor */}
        <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              En Proveedor
            </span>
            <Truck className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-950 font-mono">
            {metricas.esperandoProveedor}
          </p>
          <span className="text-[11px] text-purple-700/80">
            Sistemas / telas encargadas
          </span>
        </div>

        {/* Listo para Instalar */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Listas para Instalar
            </span>
            <PackageCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-950 font-mono">
            {metricas.listasParaInstalar}
          </p>
          <span className="text-[11px] text-emerald-700/80">
            100% listas en taller
          </span>
        </div>
      </div>

      {/* ── TABLA DE COMANDAS ── */}
      <ComandaTabla
        comandasIniciales={comandas}
        puedeGestionar={puedeGestionar}
        onAbrirModalNueva={() => setModalAbierto(true)}
      />

      {/* ── MODAL DE NUEVA COMANDA ── */}
      {puedeGestionar && (
        <ComandaGenerarModal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          presupuestosAceptados={presupuestosAceptados}
        />
      )}
    </div>
  )
}
