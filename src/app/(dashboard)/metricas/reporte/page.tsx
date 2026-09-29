// Página: Reporte Ejecutivo Gerencial para Imprimir / PDF
// Ruta: /metricas/reporte

import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { tienePermisoModuloMetricas } from "@/modules/metricas/lib/auth"
import { obtenerMetricasAvanzadas } from "@/modules/metricas/queries"
import { periodoMetricasSchema } from "@/modules/metricas/schemas"
import { MetricasReporteEjecutivo } from "@/modules/metricas/components/metricas-reporte-ejecutivo"
import type { PeriodoMetricas } from "@/modules/metricas/types"

export const metadata: Metadata = {
  title: "Reporte Ejecutivo Gerencial A4 | ERP RR — ROMINA RIBOT",
  description: "Ficha formal para imprimir o exportar a PDF con membrete oficial",
}

export const dynamic = "force-dynamic"

interface ReportePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}

export default async function ReportePage({ searchParams }: ReportePageProps) {
  const auth = await tienePermisoModuloMetricas()
  const resolvedSearchParams = await Promise.resolve(searchParams)

  const periodoParam =
    typeof resolvedSearchParams?.periodo === "string"
      ? resolvedSearchParams.periodo
      : "mes"

  const parseResult = periodoMetricasSchema.safeParse(periodoParam)
  const periodo: PeriodoMetricas = parseResult.success ? parseResult.data : "mes"

  const data = await obtenerMetricasAvanzadas(periodo, auth.rol)

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <Link
          href={`/metricas?periodo=${periodo}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al tablero de métricas
        </Link>
      </div>

      <MetricasReporteEjecutivo data={data} />
    </div>
  )
}
