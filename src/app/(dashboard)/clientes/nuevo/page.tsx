import Link from "next/link"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { ClienteForm } from "@/modules/clientes/components/cliente-form"
import { ArrowLeft } from "lucide-react"
import { obtenerArquitectosParaSelector } from "@/modules/arquitectos/queries"

export const dynamic = "force-dynamic"

export default async function NuevoClientePage() {
  const arquitectos = await obtenerArquitectosParaSelector()
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Encabezado */}
      <PageHeader
        titulo="Nuevo Cliente"
        descripcion="Completá la ficha con los datos de contacto y ubicación para coordinar visitas"
      >
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>
      </PageHeader>

      {/* Formulario */}
      <ClienteForm modo="crear" arquitectos={arquitectos} />
    </div>
  )
}
