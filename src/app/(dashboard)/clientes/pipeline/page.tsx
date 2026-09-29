import Link from "next/link"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { ClientePipeline } from "@/modules/clientes/components/cliente-pipeline"
import { obtenerClientesParaPipeline } from "@/modules/clientes/queries"
import type { IColumnaKanban } from "@/modules/clientes/types"
import { Table, Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PipelineClientesPage() {
  const columnas = await obtenerClientesParaPipeline()

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <PageHeader
        titulo="Pipeline de Clientes"
        descripcion="Seguimiento visual del flujo comercial y estado de obras en tiempo real"
      >
        <div className="flex items-center gap-2.5">
          <Link
            href="/clientes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Table className="h-4 w-4 text-slate-500" />
            Vista Tabla
          </Link>

          <Link
            href="/clientes/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Link>
        </div>
      </PageHeader>

      {/* Tablero Kanban */}
      <ClientePipeline
        columnasIniciales={columnas as unknown as IColumnaKanban[]}
      />
    </div>
  )
}
