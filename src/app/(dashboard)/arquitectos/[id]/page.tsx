import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ArquitectoDetalle } from "@/modules/arquitectos/components/arquitecto-detalle"
import { obtenerArquitectoPorId } from "@/modules/arquitectos/queries"

export const dynamic = "force-dynamic"

export default async function ArquitectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const arquitecto = await obtenerArquitectoPorId(id)
  if (!arquitecto) notFound()

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link href="/arquitectos" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Todos los arquitectos
      </Link>
      <ArquitectoDetalle arquitecto={arquitecto} />
    </div>
  )
}
