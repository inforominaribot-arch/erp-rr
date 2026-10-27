// Módulo: Proveedores & Compras
// Lista de precios del proveedor (precios de lista, sin recargos) con edición rápida

"use client"

import { useMemo, useState, useTransition } from "react"
import { Search, Tags, Check, Loader2, AlertCircle, Info, RefreshCw } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import { actualizarItemListaPrecio } from "../actions"
import { recalcularPresupuestosConListaAction } from "@/modules/presupuestos/actions"
import {
  CATEGORIAS_LISTA_PRECIO,
  type CategoriaListaPrecio,
  type IListaPrecioItem,
} from "../types"

interface ListaPreciosProveedorProps {
  items: IListaPrecioItem[]
  puedeAdministrar: boolean
}

const UNIDADES: Record<string, string> = { ml: "ml", m2: "m²", u: "u", par: "par" }

export function ListaPreciosProveedor({ items: itemsIniciales, puedeAdministrar }: ListaPreciosProveedorProps) {
  const [items, setItems] = useState(itemsIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [categoria, setCategoria] = useState<CategoriaListaPrecio | "TODAS">("TODAS")
  const [soloVendemos, setSoloVendemos] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [precioEditado, setPrecioEditado] = useState("")
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [recalculando, setRecalculando] = useState(false)
  const [, startTransition] = useTransition()

  /** Texto del resultado del recálculo de presupuestos */
  function textoRecalculo(filas: number, manuales = 0) {
    const base =
      filas === 0
        ? "Ningún presupuesto abierto cambió de precio."
        : `Se actualizó el precio de ${filas} cortina(s) / ítem(s) en presupuestos abiertos.`
    return manuales > 0 ? `${base} ${manuales} fila(s) con precio corregido a mano no se tocaron.` : base
  }

  function recalcularPresupuestos() {
    setError(null)
    setMensaje(null)
    setRecalculando(true)
    startTransition(async () => {
      const res = await recalcularPresupuestosConListaAction()
      setRecalculando(false)
      if (!res.success) {
        setError(res.error || "No se pudieron recalcular los presupuestos.")
        return
      }
      setMensaje(textoRecalculo(res.data.filasActualizadas, res.data.filasManuales))
    })
  }

  const categoriasPresentes = useMemo(
    () => (Object.keys(CATEGORIAS_LISTA_PRECIO) as CategoriaListaPrecio[]).filter((c) =>
      items.some((it) => it.categoria === c)
    ),
    [items]
  )

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return items.filter(
      (it) =>
        (categoria === "TODAS" || it.categoria === categoria) &&
        (!soloVendemos || it.vendemos) &&
        (!q ||
          it.descripcion.toLowerCase().includes(q) ||
          it.seccion.toLowerCase().includes(q) ||
          (it.colores || "").toLowerCase().includes(q))
    )
  }, [items, busqueda, categoria, soloVendemos])

  // Agrupar por sección respetando el orden de la lista
  const secciones = useMemo(() => {
    const mapa = new Map<string, IListaPrecioItem[]>()
    for (const it of filtrados) {
      const lista = mapa.get(it.seccion) ?? []
      lista.push(it)
      mapa.set(it.seccion, lista)
    }
    return [...mapa.entries()]
  }, [filtrados])

  const vigencia = items.find((it) => it.vigencia)?.vigencia
  const totalVendemos = items.filter((it) => it.vendemos).length

  function guardar(id: string, cambios: { precio?: number; vendemos?: boolean }) {
    setError(null)
    setGuardandoId(id)
    startTransition(async () => {
      const res = await actualizarItemListaPrecio({ id, ...cambios })
      setGuardandoId(null)
      if (!res.success) {
        setError(res.error || "No se pudo guardar el cambio.")
        return
      }
      const { precio, vendemos, filasActualizadas, filasManuales } = res.data
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, precio, vendemos } : it)))
      setEditandoId(null)
      if (cambios.precio !== undefined) setMensaje(textoRecalculo(filasActualizadas, filasManuales))
    })
  }

  function confirmarPrecio(it: IListaPrecioItem) {
    const valor = parseFloat(precioEditado.replace(",", "."))
    if (isNaN(valor) || valor < 0) {
      setError("Ingresá un precio válido.")
      return
    }
    if (valor === it.precio) {
      setEditandoId(null)
      return
    }
    guardar(it.id, { precio: valor })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tags className="h-4 w-4 text-indigo-600" />
            Lista de Precios {vigencia ? `— ${vigencia}` : ""}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {items.length} ítems • {totalVendemos} que vendemos. Precios de lista, sin recargos (los
            coeficientes se aplican al presupuestar).
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={recalcularPresupuestos}
            disabled={recalculando}
            title="Actualiza los presupuestos no aceptados con los precios de esta lista (después de importar una lista nueva)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs disabled:opacity-50 shrink-0"
          >
            {recalculando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Recalcular presupuestos abiertos
          </button>
        )}
      </div>

      {mensaje && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          <Check className="h-4 w-4 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
          <Tags className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-700">Este proveedor no tiene lista de precios cargada</p>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar sistema, tela, color..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={soloVendemos}
                onChange={(e) => setSoloVendemos(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600"
              />
              Solo lo que vendemos
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["TODAS", ...categoriasPresentes] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                  categoria === c
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c === "TODAS" ? "Todas" : CATEGORIAS_LISTA_PRECIO[c]}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {secciones.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">Ningún ítem coincide con el filtro.</p>
          ) : (
            <div className="space-y-4">
              {secciones.map(([seccion, lista]) => (
                <div key={seccion} className="overflow-x-auto rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2">
                    <span className="text-xs font-bold text-slate-900">
                      {seccion}
                      <span className="ml-2 rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {CATEGORIAS_LISTA_PRECIO[lista[0].categoria]}
                      </span>
                    </span>
                    {lista[0].nota && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Info className="h-3 w-3" />
                        {lista[0].nota}
                      </span>
                    )}
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <tbody className="divide-y divide-slate-100">
                      {lista.map((it) => (
                        <tr key={it.id} className={it.vendemos ? "" : "text-slate-400"}>
                          <td className="py-2 px-4 w-28">
                            <label
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                                puedeAdministrar ? "cursor-pointer" : ""
                              }`}
                              title="Se ofrece en los presupuestos"
                            >
                              <input
                                type="checkbox"
                                checked={it.vendemos}
                                disabled={!puedeAdministrar || guardandoId === it.id}
                                onChange={(e) => guardar(it.id, { vendemos: e.target.checked })}
                                className="h-4 w-4 rounded text-emerald-600"
                              />
                              <span className={it.vendemos ? "text-emerald-700" : "text-slate-400"}>
                                {it.vendemos ? "Vendemos" : "No"}
                              </span>
                            </label>
                          </td>
                          <td className="py-2 px-2">
                            <span className={`font-semibold ${it.vendemos ? "text-slate-900" : ""}`}>
                              {it.descripcion}
                            </span>
                            {it.colores && (
                              <span className="block text-[11px] text-slate-500">{it.colores}</span>
                            )}
                          </td>
                          <td className="py-2 px-2 w-16 text-center font-mono">
                            {UNIDADES[it.unidad] || it.unidad}
                          </td>
                          <td className="py-2 px-4 w-44 text-right">
                            {editandoId === it.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  autoFocus
                                  value={precioEditado}
                                  onChange={(e) => setPrecioEditado(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmarPrecio(it)
                                    if (e.key === "Escape") setEditandoId(null)
                                  }}
                                  className="w-28 rounded-lg border border-indigo-300 px-2 py-1 text-right font-mono text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => confirmarPrecio(it)}
                                  disabled={guardandoId === it.id}
                                  className="rounded-lg bg-indigo-600 p-1 text-white"
                                  title="Guardar precio"
                                >
                                  {guardandoId === it.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={!puedeAdministrar}
                                onClick={() => {
                                  setError(null)
                                  setEditandoId(it.id)
                                  setPrecioEditado(String(it.precio))
                                }}
                                title={puedeAdministrar ? "Editar precio" : undefined}
                                className={`font-mono font-bold ${
                                  it.vendemos ? "text-slate-900" : ""
                                } ${puedeAdministrar ? "hover:text-indigo-700 hover:underline" : ""}`}
                              >
                                {formatearPrecio(it.precio)}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
