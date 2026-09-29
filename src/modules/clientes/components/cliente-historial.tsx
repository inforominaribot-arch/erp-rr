"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Ruler,
  FileText,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  AlertCircle,
  PackageCheck,
} from "lucide-react"
import type { IMedicionResumen, IPresupuestoResumen } from "../types"
import { ESTADO_PRESUPUESTO_LABELS, ESTADO_COMANDA_LABELS } from "@/types"

interface ClienteHistorialProps {
  clienteId: string
  mediciones: IMedicionResumen[]
  presupuestos: IPresupuestoResumen[]
}

export function ClienteHistorial({
  clienteId,
  mediciones,
  presupuestos,
}: ClienteHistorialProps) {
  const [pestanaActiva, setPestanaActiva] = useState<"mediciones" | "presupuestos" | "comandas">("mediciones")

  // Extraer comandas asociadas a los presupuestos
  const comandas = presupuestos
    .filter((p) => p.comanda !== null)
    .map((p) => ({
      ...p.comanda!,
      presupuestoNumero: p.numero,
      presupuestoId: p.id,
    }))

  function formatearMoneda(monto: number | string) {
    const num = Number(monto) || 0
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(num)
  }

  function formatearFecha(f: Date | string) {
    return new Date(f).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Selector de Pestañas */}
      <div className="flex border-b border-slate-200 bg-slate-50/60 px-6">
        <button
          type="button"
          onClick={() => setPestanaActiva("mediciones")}
          className={`flex items-center gap-2 border-b-2 py-4 px-3 text-sm font-semibold transition ${
            pestanaActiva === "mediciones"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Ruler className="h-4 w-4" />
          Mediciones
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-bold text-slate-700">
            {mediciones.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva("presupuestos")}
          className={`flex items-center gap-2 border-b-2 py-4 px-3 text-sm font-semibold transition ${
            pestanaActiva === "presupuestos"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Presupuestos
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-bold text-slate-700">
            {presupuestos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva("comandas")}
          className={`flex items-center gap-2 border-b-2 py-4 px-3 text-sm font-semibold transition ${
            pestanaActiva === "comandas"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Comandas de Fábrica
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-bold text-slate-700">
            {comandas.length}
          </span>
        </button>
      </div>

      {/* Contenido de la pestaña */}
      <div className="p-6">
        {/* Pestaña: Mediciones */}
        {pestanaActiva === "mediciones" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Historial de Mediciones en Domicilio
              </h3>
              <Link
                href={`/mediciones?clienteId=${clienteId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva medición
              </Link>
            </div>

            {mediciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Ruler className="h-5 w-5" />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No hay mediciones registradas
                </p>
                <p className="text-xs text-slate-400">
                  Cuando la vendedora tome medidas, aparecerán listadas aquí.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {mediciones.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-2 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          Medición #{m.id.substring(0, 8)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {m._count.ambientes} ambiente/s
                        </span>
                        {m.sincronizado && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Sincronizada
                          </span>
                        )}
                      </div>
                      {m.observaciones && (
                        <p className="mt-1 text-xs text-slate-500">
                          {m.observaciones}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        Fecha: {formatearFecha(m.creadoEn)}
                      </p>
                    </div>

                    <Link
                      href={`/mediciones/${m.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 self-start sm:self-center"
                    >
                      Ver ambientes y medidas
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Presupuestos */}
        {pestanaActiva === "presupuestos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Presupuestos Confeccionados
              </h3>
              <Link
                href={`/presupuestos?clienteId=${clienteId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo presupuesto
              </Link>
            </div>

            {presupuestos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No hay presupuestos para este cliente
                </p>
                <p className="text-xs text-slate-400">
                  Podés crear un presupuesto directamente o a partir de una medición.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {presupuestos.map((p) => {
                  const estadoLabel =
                    ESTADO_PRESUPUESTO_LABELS[
                      p.estado as keyof typeof ESTADO_PRESUPUESTO_LABELS
                    ] || p.estado

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-3 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            Presupuesto #{p.numero.toString().padStart(4, "0")}
                          </span>
                          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                            {estadoLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Emitido el {formatearFecha(p.creadoEn)}
                        </p>
                        {p.comanda && (
                          <p className="mt-1 text-xs font-medium text-green-700">
                            Generó Comanda #{p.comanda.numero.toString().padStart(4, "0")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 self-start sm:self-center">
                        <span className="text-base font-bold text-slate-900">
                          {formatearMoneda(p.total)}
                        </span>
                        <Link
                          href={`/presupuestos/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Ver detalle
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Comandas */}
        {pestanaActiva === "comandas" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Comandas Enviadas a Taller / Producción
            </h3>

            {comandas.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Sin comandas de producción activas
                </p>
                <p className="text-xs text-slate-400">
                  Las comandas se generan automáticamente cuando un presupuesto es aceptado.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {comandas.map((c) => {
                  const estadoComandaLabel =
                    ESTADO_COMANDA_LABELS[
                      c.estado as keyof typeof ESTADO_COMANDA_LABELS
                    ] || c.estado

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 transition hover:bg-slate-50/70"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            Comanda #{c.numero.toString().padStart(4, "0")}
                          </span>
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            {estadoComandaLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          Vinculada al Presupuesto #{c.presupuestoNumero.toString().padStart(4, "0")}
                        </p>
                      </div>

                      <Link
                        href={`/comandas/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Ver comanda
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
