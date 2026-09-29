// Módulo: Dashboard & Métricas
// Esquemas de validación Zod

import { z } from "zod"

export const periodoMetricasSchema = z.enum([
  "30d",
  "mes",
  "mes_anterior",
  "trimestre",
  "anio",
  "historico",
])

export const filtrosMetricasSchema = z.object({
  periodo: periodoMetricasSchema.default("mes"),
})

export type FiltrosMetricasInput = z.infer<typeof filtrosMetricasSchema>
