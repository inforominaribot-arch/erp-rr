import Link from "next/link"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { ClienteTabla } from "@/modules/clientes/components/cliente-tabla"
import { ClienteImportarCSV } from "@/modules/clientes/components/cliente-importar-csv"
import { obtenerClientes, obtenerConteosPorEstado } from "@/modules/clientes/queries"
import type { IClienteConConteo } from "@/modules/clientes/types"
import {
  Plus,
  Kanban,
  UploadCloud,
  Users,
  Ruler,
  FileCheck,
  Factory,
  CheckCircle2,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ClientesPage({
  searchParams,
}: {
  searchParams?: Promise<{ importar?: string }>
}) {
  const params = await searchParams
  const mostrarImportador = params?.importar === "true"

  const [{ clientes }, conteos] = await Promise.all([
    obtenerClientes({ porPagina: 100 }),
    obtenerConteosPorEstado(),
  ])

  const totalClientes = Object.values(conteos).reduce(
    (acc, curr) => (acc || 0) + (curr || 0),
    0
  ) || clientes.length

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <PageHeader
        titulo="Clientes & CRM"
        descripcion="Gestión integral de clientes, seguimiento de obras e historial comercial"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/clientes/pipeline"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Kanban className="h-4 w-4 text-slate-500" />
            Vista Pipeline
          </Link>

          <Link
            href={mostrarImportador ? "/clientes" : "/clientes?importar=true"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <UploadCloud className="h-4 w-4 text-indigo-600" />
            {mostrarImportador ? "Ocultar importador" : "Importar CSV"}
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

      {/* Módulo desplegable de importación CSV */}
      {mostrarImportador && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-200">
          <ClienteImportarCSV />
        </div>
      )}

      {/* Métricas rápidas de clientes por estado */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Total */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Clientes
            </span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalClientes}
          </p>
        </div>

        {/* Medición Tomada */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Medición Tomada
            </span>
            <Ruler className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">
            {conteos.MEDICION_TOMADA || 0}
          </p>
        </div>

        {/* Presupuesto Enviado / Aceptado */}
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Presupuestos
            </span>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            {(conteos.PRESUPUESTO_ENVIADO || 0) + (conteos.PRESUPUESTO_ACEPTADO || 0)}
          </p>
        </div>

        {/* En Producción */}
        <div className="rounded-xl border border-orange-200/80 bg-orange-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-700">
              En Producción
            </span>
            <Factory className="h-4 w-4 text-orange-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-orange-900">
            {conteos.EN_PRODUCCION || 0}
          </p>
        </div>

        {/* Instalados */}
        <div className="rounded-xl border border-green-200/80 bg-green-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-green-700">
              Instalados
            </span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-green-900">
            {conteos.INSTALADO || 0}
          </p>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <ClienteTabla clientesIniciales={clientes as unknown as IClienteConConteo[]} />
    </div>
  )
}
