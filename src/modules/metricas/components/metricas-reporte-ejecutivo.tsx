// Componente: Ficha de Resumen Ejecutivo A4 para Gerencia / Dueña
// Membrete Oficial ROMINA RIBOT Cortinados — Optimizado para impresión A4 y guardado PDF

"use client"

import { Printer, Building2, Calendar, CheckCircle2, TrendingUp, Scissors, Truck, Award } from "lucide-react"
import type { IMetricasAvanzadasData } from "../types"
import { OPCIONES_PERIODO } from "../types"

interface MetricasReporteEjecutivoProps {
  data: IMetricasAvanzadasData
  onVolver?: () => void
}

export function MetricasReporteEjecutivo({
  data,
  onVolver,
}: MetricasReporteEjecutivoProps) {
  const nombrePeriodo =
    OPCIONES_PERIODO.find((p) => p.id === data.periodoSeleccionado)?.label ||
    "Período Seleccionado"

  const fechaImpresion = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  function handleImprimir() {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* Barra de acciones (no visible en print) */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Ficha Ejecutiva Gerencial A4
          </h2>
          <p className="text-xs text-slate-500">
            Vista formal para presentación a dueña / socios ({nombrePeriodo})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Volver al tablero
            </button>
          )}

          <button
            type="button"
            onClick={handleImprimir}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Hoja A4 física */}
      <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] rounded-xl border border-slate-300 bg-white p-8 md:p-12 shadow-md print:m-0 print:w-full print:max-w-none print:min-h-0 print:border-none print:p-0 print:shadow-none">
        {/* Membrete Oficial */}
        <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                ROMINA RIBOT
              </h1>
              <p className="text-xs font-medium uppercase tracking-widest text-indigo-700">
                Cortinados & Sistemas de Protección Solar
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <p className="font-bold text-slate-800 text-sm">REPORTE EJECUTIVO</p>
            <p>Emisión: {fechaImpresion}</p>
            <p className="font-semibold text-indigo-600 mt-0.5">
              {nombrePeriodo}
            </p>
          </div>
        </div>

        {/* Resumen de Cifras Clave */}
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Indicadores Clave de Rendimiento (KPIs)
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Ventas Aprobadas
              </p>
              <p className="text-lg font-black text-slate-900 mt-1">
                {data.esRolFinanciero
                  ? `$ ${data.kpis.facturacionTotal.toLocaleString("es-AR")}`
                  : `${data.kpis.presupuestosAceptados} Aprobados`}
              </p>
              <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                {data.kpis.presupuestosAceptados} cotizaciones cerradas
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Eficacia Comercial
              </p>
              <p className="text-lg font-black text-slate-900 mt-1">
                {data.kpis.tasaConversion}%
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                De {data.kpis.presupuestosTotales} presupuestos emitidos
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Confección en Taller
              </p>
              <p className="text-lg font-black text-slate-900 mt-1">
                {data.kpis.cortinasFabricadasTaller} uds
              </p>
              <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                {data.kpis.ratioTallerProveedor}% de la producción total
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Instalaciones Obra
              </p>
              <p className="text-lg font-black text-slate-900 mt-1">
                {data.kpis.instalacionesCompletadas} uds
              </p>
              <p className="text-[10px] text-teal-700 font-medium mt-0.5">
                {data.kpis.tasaCumplimientoInstalaciones}% cumplimiento
              </p>
            </div>
          </div>
        </div>

        {/* Sección: Producción y Sistemas de Cortinas */}
        <div className="mt-7">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Desglose de Producción por Sistema
          </h2>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Sistema / Tipo de Cortina</th>
                  <th className="px-4 py-2.5 text-center">Unidades</th>
                  <th className="px-4 py-2.5 text-right">Participación</th>
                  <th className="px-4 py-2.5 text-right">Modalidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.distribucionConfeccion.map((item) => (
                  <tr key={item.nombre} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.nombre}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-slate-700">
                      {item.cantidad}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900">
                      {item.porcentaje}%
                    </td>
                    <td className="px-4 py-2 text-right text-[11px] text-slate-500">
                      {item.nombre.includes("Roller") || item.nombre.includes("Hunter") || item.nombre.includes("Bandas")
                        ? "Fábrica Externa"
                        : "Taller Propio RR"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección: Insumos Más Consumidos */}
        <div className="mt-7">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Telas e Insumos Más Demandados
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {data.topProductos.slice(0, 6).map((prod, idx) => (
              <div
                key={prod.nombre}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 font-bold text-slate-600 text-[10px]">
                    #{idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {prod.nombre}
                  </span>
                </div>
                <span className="font-bold text-indigo-700">
                  {prod.cantidad} {prod.unidadMedida}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cierre y Firma */}
        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex items-end justify-between text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-800">ROMINA RIBOT Cortinados</p>
              <p>Gestión Operativa & Comercial ERP</p>
            </div>
            <div className="text-center min-w-[180px]">
              <div className="border-b border-slate-400 pb-1 mb-1" />
              <p className="font-semibold text-slate-700">Firma Gerencia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
