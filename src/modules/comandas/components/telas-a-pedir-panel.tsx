// Comanda: telas de las tradicionales para pedir a las tiendas, con la tienda donde está más barata.
// Solo para Administración (muestra costos).

import { Scissors, AlertTriangle } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import type { ITelaAPedir } from "../lib/telas-a-pedir"

const fmtAncho = (n: number | null) => (n ? `${n.toLocaleString("es-AR")} m` : "ancho ?")

export function TelasAPedirPanel({ telas }: { telas: ITelaAPedir[] }) {
  if (telas.length === 0) return null
  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-4 sm:p-5 shadow-xs space-y-3 print:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <Scissors className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Telas para pedir (tradicionales)</h3>
          <p className="text-[11px] text-slate-500">
            Uso interno: al cliente se le presupuestó la tienda más cara; pedila donde está más barata.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Tela</th>
              <th className="px-3 py-2 text-right">Metros</th>
              <th className="px-3 py-2 text-left">Pedir en</th>
              <th className="px-3 py-2 text-left">Presupuestada con</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {telas.map((t) => {
              const pedir = t.masBarata ?? t.presupuestada
              const otroAncho = t.masBarata && t.presupuestada && t.masBarata.ancho !== t.presupuestada.ancho
              return (
                <tr key={`${t.tela}|${t.presupuestada?.proveedor ?? ""}`} className="align-top">
                  <td className="px-3 py-2">
                    <p className="font-bold text-slate-900">{t.tela}</p>
                    <p className="text-[11px] text-slate-500">
                      {t.capas.join(", ")} · {t.cortinas.join(" · ")}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{t.metros.toLocaleString("es-AR")}</td>
                  <td className="px-3 py-2">
                    {pedir ? (
                      <>
                        <p className="font-bold text-sky-800">{pedir.proveedor}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatearPrecio(pedir.precio)}/m (con recargo) · {fmtAncho(pedir.ancho)}
                        </p>
                        {otroAncho && (
                          <p className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <AlertTriangle className="h-3 w-3" /> Otro ancho que la presupuestada
                          </p>
                        )}
                        {t.otras.map((o) => (
                          <p key={o.proveedor} className="text-[11px] text-slate-400">
                            o {o.proveedor} {formatearPrecio(o.precio)}/m · {fmtAncho(o.ancho)}
                          </p>
                        ))}
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-500">Precio a mano (no está en las listas)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-600">
                    {t.presupuestada
                      ? `${t.presupuestada.proveedor} ${formatearPrecio(t.presupuestada.precio)}/m · ${fmtAncho(t.presupuestada.ancho)}`
                      : "—"}
                    {t.precioManual && t.presupuestada && <span className="block text-slate-400">precio corregido a mano</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
