"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Clock,
  Ruler,
  User,
  MapPin,
  Phone,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FilePlus,
  AlertCircle,
} from "lucide-react"
import type { IMedicionPendientePresupuesto } from "../types"
import { formatearFecha } from "@/lib/utils"

interface MedicionesPendientesAlertaProps {
  mediciones: IMedicionPendientePresupuesto[]
  puedeEditar?: boolean
}

export function MedicionesPendientesAlerta({
  mediciones,
  puedeEditar = true,
}: MedicionesPendientesAlertaProps) {
  const [expandido, setExpandido] = useState(true)

  if (!mediciones || mediciones.length === 0) {
    return null
  }

  const cantidad = mediciones.length

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-xs transition-all">
      {/* ── Encabezado del Panel de Alerta ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Ruler className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-amber-950">
                Mediciones Pendientes de Presupuestar
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                {cantidad} {cantidad === 1 ? "a presupuestar" : "a presupuestar"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-amber-800/90 leading-relaxed">
              Clientes con medidas tomadas en obra listos para cotizar con la calculadora y enviar presupuesto formal.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-amber-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-white transition cursor-pointer"
        >
          {expandido ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Ocultar lista
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Ver {cantidad} {cantidad === 1 ? "pendiente" : "pendientes"}
            </>
          )}
        </button>
      </div>

      {/* ── Grilla de Clientes con Medición Tomada ── */}
      {expandido && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mediciones.map((item) => {
            const ambientesTexto =
              item.ambientesNombres.length > 0
                ? item.ambientesNombres.slice(0, 3).join(", ") +
                  (item.ambientesNombres.length > 3 ? "..." : "")
                : "General"

            return (
              <div
                key={item.medicionId}
                className="flex flex-col justify-between rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs hover:border-amber-300 hover:shadow-xs transition"
              >
                <div>
                  {/* Cabecera del Ítem */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="min-w-0">
                      <Link
                        href={`/clientes/${item.clienteId}`}
                        className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition truncate block"
                      >
                        {item.clienteNombre}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        {item.clienteTelefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {item.clienteTelefono}
                          </span>
                        )}
                        {item.clienteLocalidad && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {item.clienteLocalidad}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {formatearFecha(item.creadoEn)}
                    </span>
                  </div>

                  {/* Resumen de Medición */}
                  <div className="my-3 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Cortinas relevadas:</span>
                      <span className="font-bold text-slate-900">
                        {item.totalCortinas} {item.totalCortinas === 1 ? "unidad" : "unidades"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Ambientes ({item.totalAmbientes}):</span>
                      <span className="font-semibold text-slate-800 text-right truncate">
                        {ambientesTexto}
                      </span>
                    </div>

                    {item.observaciones && (
                      <p className="mt-1 rounded-md bg-slate-50 p-1.5 text-[11px] text-slate-600 italic line-clamp-2">
                        &ldquo;{item.observaciones}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Botón de Acción Directa */}
                {puedeEditar && (
                  <div className="pt-2 border-t border-slate-100">
                    <Link
                      href={`/presupuestos/nuevo?clienteId=${item.clienteId}&medicionId=${item.medicionId}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 transition"
                    >
                      <FilePlus className="h-4 w-4" />
                      Presupuestar Cortinas
                      <ArrowRight className="h-3.5 w-3.5 opacity-80" />
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
