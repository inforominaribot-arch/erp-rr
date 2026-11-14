import { PageHeader } from "@/components/shared/layout/PageHeader"
import { ArquitectosLista } from "@/modules/arquitectos/components/arquitectos-lista"
import { obtenerArquitectos } from "@/modules/arquitectos/queries"

export const dynamic = "force-dynamic"

export default async function ArquitectosPage() {
  const arquitectos = await obtenerArquitectos()
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader titulo="Arquitectos" descripcion="Arquitectos que traen clientes. Tocá uno para ver sus clientes y mediciones." />
      <ArquitectosLista arquitectos={arquitectos} />
    </div>
  )
}
