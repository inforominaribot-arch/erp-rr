"use client"

// Ficha del proveedor: lista de precios que se actualiza subiendo el archivo del proveedor
// (telas de Alhambra / Bia Brem / Sirota, o accesorios de Rollershade en PDF).

import { useMemo, useState } from "react"
import { AlertTriangle, CalendarCheck, Search } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import { SubirListaPrecios } from "./subir-lista-precios"
import type { IListaArchivoProveedor } from "../lib/listas-telas/aplicar-lista"

const normal = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function ListaArchivoProveedor({
  proveedorId,
  lista,
  puedeAdministrar,
}: {
  proveedorId: string
  lista: IListaArchivoProveedor
  puedeAdministrar: boolean
}) {
  const [busqueda, setBusqueda] = useState("")
  const filtradas = useMemo(() => {
    const q = normal(busqueda.trim())
    const base = q ? lista.telas.filter((t) => normal(`${t.nombre} ${t.descripcion ?? ""} ${t.rubro ?? ""}`).includes(q)) : lista.telas
    return base.slice(0, 200)
  }, [busqueda, lista.telas])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">{lista.titulo}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {lista.recargo ? `Al presupuestar: precio de lista ${lista.recargo}. ` : ""}
            {lista.confirmadaEn
              ? `Actualizada el ${new Date(lista.confirmadaEn).toLocaleDateString("es-AR")}`
              : "Nunca se actualizó desde archivo"}
            {lista.vigencia ? ` · lista del ${lista.vigencia}` : ""}
          </p>
          {lista.pendiente ? (
            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
              <AlertTriangle className="h-3 w-3" /> Falta actualizarla este mes
            </p>
          ) : (
            lista.confirmadaEn && (
              <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <CalendarCheck className="h-3 w-3" /> Al día este mes
              </p>
            )
          )}
        </div>
        {puedeAdministrar && <SubirListaPrecios proveedorId={proveedorId} archivo={lista.archivo} />}
      </div>

      {lista.telas.length > 0 && (
        <div className="space-y-2">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={`Buscar entre ${lista.telas.length} telas…`}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-2.5 text-xs"
            />
          </div>
          <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Tela</th>
                  <th className="px-3 py-2 text-left hidden sm:table-cell">Rubro / descripción</th>
                  <th className="px-3 py-2 text-right">Ancho</th>
                  <th className="px-3 py-2 text-right">Lista</th>
                  <th className="px-3 py-2 text-right">Presupuesto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-1.5 font-semibold text-slate-900">{t.nombre}</td>
                    <td className="px-3 py-1.5 text-slate-500 hidden sm:table-cell">{[t.rubro, t.descripcion].filter(Boolean).join(" · ")}</td>
                    <td className="px-3 py-1.5 text-right text-slate-600">{t.ancho ? `${t.ancho.toLocaleString("es-AR")} m` : "—"}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                      {formatearPrecio(t.precio)}
                      {t.precioAnterior !== null && t.precioAnterior !== t.precio && (
                        <span className="block text-[10px] text-slate-400 line-through">{formatearPrecio(t.precioAnterior)}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">{formatearPrecio(t.precioConRecargo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtradas.length === 200 && <p className="text-[11px] text-slate-400">Se muestran las primeras 200: buscá para ver otras.</p>}
        </div>
      )}
    </div>
  )
}
