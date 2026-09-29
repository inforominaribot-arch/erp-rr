// Página: Métricas & Tablero Analítico
// Ruta: /metricas

import { Metadata } from "next"
import { tienePermisoModuloMetricas } from "@/modules/metricas/lib/auth"
import { obtenerMetricasAvanzadas } from "@/modules/metricas/queries"
import { periodoMetricasSchema } from "@/modules/metricas/schemas"
import { MetricasView } from "@/modules/metricas/components/metricas-view"
import type { PeriodoMetricas } from "@/modules/metricas/types"

export const metadata: Metadata = {
  title: "Métricas & Analítica | ERP RR — ROMINA RIBOT",
  description: "Tablero analítico con gráficos interactivos y KPIs de rendimiento",
}

export const dynamic = "force-dynamic"

interface MetricasPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}

export default async function MetricasPage({ searchParams }: MetricasPageProps) {
  const auth = await tienePermisoModuloMetricas()
  const resolvedSearchParams = await Promise.resolve(searchParams)

  const periodoParam =
    typeof resolvedSearchParams?.periodo === "string"
      ? resolvedSearchParams.periodo
      : "mes"

  const parseResult = periodoMetricasSchema.safeParse(periodoParam)
  const periodo: PeriodoMetricas = parseResult.success ? parseResult.data : "mes"

  const data = await obtenerMetricasAvanzadas(periodo, auth.rol)

  return <MetricasView data={data} />
}