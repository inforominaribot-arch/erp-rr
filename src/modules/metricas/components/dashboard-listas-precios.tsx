// Aviso del inicio (Administración): desde el día 1 de cada mes, las listas de precios que hay que
// actualizar (Alhambra, Bia Brem, Sirota y los accesorios de Rollershade). Se sube el archivo o se
// confirma que no cambiaron los precios; el aviso desaparece cuando están todas al día.

import Link from "next/link"
import { FileSpreadsheet } from "lucide-react"
import type { IListaPendiente } from "@/modules/proveedores/lib/listas-telas/aplicar-lista"
import { SubirListaPrecios } from "@/modules/proveedores/components/subir-lista-precios"

export function DashboardListasPrecios({ pendientes }: { pendientes: IListaPendiente[] }) {
  if (pendientes.length === 0) return null
  const mes = new Date().toLocaleDateString("es-AR", { month: "long", timeZone: "America/Argentina/Buenos_Aires" })
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xs space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-amber-950">Actualizar listas de precios de {mes}</h2>
          <p className="text-xs text-amber-900">
            Pedí la lista nueva a cada proveedor y subila, o marcá que no cambiaron los precios.
          </p>
        </div>
      </div>
      <div className="divide-y divide-amber-200 rounded-xl border border-amber-200 bg-white">
        {pendientes.map((p) => (
          <div key={p.proveedorId} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href={`/proveedores/${p.proveedorId}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600">
                {p.nombre}
              </Link>
              <p className="text-[11px] text-slate-500">
                {p.lista}
                {p.confirmadaEn ? ` · última vez ${new Date(p.confirmadaEn).toLocaleDateString("es-AR")}` : ""}
              </p>
            </div>
            <SubirListaPrecios proveedorId={p.proveedorId} archivo={p.archivo} compacto />
          </div>
        ))}
      </div>
    </div>
  )
}
