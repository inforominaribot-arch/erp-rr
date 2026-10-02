// Página: Agenda de Visitas de Medición y Asesoramiento en Obra
// Módulo Comercial para Romina Ribot

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { tienePermisoModuloVisitas } from "@/modules/visitas/lib/auth"
import {
  obtenerVisitas,
  obtenerMetricasVisitas,
  obtenerClientesParaVisita,
} from "@/modules/visitas/queries"
import { VisitasView } from "@/modules/visitas/components/visitas-view"

export const metadata: Metadata = {
  title: "Visitas de Medición | ERP RR — ROMINA RIBOT",
  description: "Agenda comercial de visitas de medición y asesoramiento en obra",
}

export const dynamic = "force-dynamic"

export default async function VisitasPage() {
  const auth = await tienePermisoModuloVisitas()
  if (!auth.permitido) {
    redirect("/")
  }

  const [visitas, metricas, clientesParaModal] = await Promise.all([
    obtenerVisitas(),
    obtenerMetricasVisitas(),
    obtenerClientesParaVisita(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Visitas de Medición y Asesoramiento"
        descripcion="Agenda previa comercial para coordinar visitas a domicilio, sincronizar con Google Calendar y comenzar mediciones en obra"
      />

      <VisitasView
        visitas={visitas}
        metricas={metricas}
        clientesParaModal={clientesParaModal}
      />
    </div>
  )
}
