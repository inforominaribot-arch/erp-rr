import { notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/shared/layout/PageHeader"
import { ClienteForm } from "@/modules/clientes/components/cliente-form"
import { obtenerClientePorId } from "@/modules/clientes/queries"
import type { ICliente } from "@/modules/clientes/types"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cliente = await obtenerClientePorId(id)

  if (!cliente) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Encabezado */}
      <PageHeader
        titulo={`Editar: ${cliente.nombre}`}
        descripcion="Modificá la información de contacto o especificaciones del cliente"
      >
        <Link
          href={`/clientes/${cliente.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la ficha
        </Link>
      </PageHeader>

      {/* Formulario de edición */}
      <ClienteForm
        modo="editar"
        cliente={cliente as unknown as ICliente}
      />
    </div>
  )
}
