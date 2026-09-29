// Componente: Vista Principal del Tablero de Métricas (/metricas)

"use client"

import { useState } from "react"
import { BarChart3, FileSpreadsheet, Printer, Sparkles, RefreshCw } from "lucide-react"
import type { IMetricasAvanzadasData } from "../types"
import { MetricasPeriodoSelector } from "./metricas-periodo-selector"
import { MetricasKpisGrid } from "./metricas-kpis-grid"
import { MetricasVentasChart } from "./metricas-ventas-chart"
import { MetricasDistribucionConfeccionChart } from "./metricas-distribucion-confeccion-chart"
import { MetricasTopProductosChart } from "./metricas-top-productos-chart"
import { MetricasClientesChart } from "./metricas-clientes-chart"
import { MetricasInstalacionesChart } from "./metricas-instalaciones-chart"
import { MetricasReporteEjecutivo } from "./metricas-reporte-ejecutivo"

interface MetricasViewProps {
  data: IMetricasAvanzadasData
}

export function MetricasView({ data }: MetricasViewProps) {
  const [modoReporte, setModoReporte] = useState(false)

  if (modoReporte) {
    return (
      <MetricasReporteEjecutivo
        data={data}
        onVolver={() => setModoReporte(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera & Selector de período */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Métricas & Rendimiento
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              Analítica ERP
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Control de facturación, efectividad comercial, confección y colocaciones en obra
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MetricasPeriodoSelector periodoActual={data.periodoSeleccionado} />

          <button
            type="button"
            onClick={() => setModoReporte(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-all"
          >
            <Printer className="h-4 w-4 text-indigo-600" />
            Ficha Ejecutiva A4
          </button>
        </div>
      </div>

      {/* Grilla de KPIs Principales */}
      <MetricasKpisGrid
        kpis={data.kpis}
        esRolFinanciero={data.esRolFinanciero}
      />

      {/* Gráficos Nivel 1: Evolución de Ventas & Distribución por Confección */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MetricasVentasChart
          datos={data.evolucionVentas}
          esRolFinanciero={data.esRolFinanciero}
        />
        <MetricasDistribucionConfeccionChart
          datos={data.distribucionConfeccion}
        />
      </div>

      {/* Gráficos Nivel 2: Insumos Más Demandados & Rendimiento de Instalaciones */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MetricasTopProductosChart datos={data.topProductos} />
        <MetricasInstalacionesChart datos={data.rendimientoInstalaciones} />
      </div>

      {/* Gráficos Nivel 3: Captación de Nuevos Clientes */}
      <div className="grid grid-cols-1 gap-6">
        <MetricasClientesChart datos={data.captacionClientes} />
      </div>
    </div>
  )
}
