// Módulo: Proveedores & Compras
// Precios copiados de la planilla de Google Sheets del proveedor: buscador, fecha de la última copia,
// precios que cambiaron y botón "Actualizar precios ahora".

"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowDownRight, ArrowUpRight, ExternalLink, Loader2, RefreshCw, Search, FileSpreadsheet } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import { sincronizarPlanillaPreciosAction } from "../actions"
import type { IPrecioPlanilla } from "../types"

interface PlanillaPreciosProveedorProps {
  proveedorId: string
  url: string
  sincronizadaEn: string | null
  errorSync: string | null
  precios: IPrecioPlanilla[]
}

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  })

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Cambios de los últimos 30 días */
const DIAS_CAMBIO_RECIENTE = 30

export function PlanillaPreciosProveedor({ proveedorId, url, sincronizadaEn, errorSync, precios }: PlanillaPreciosProveedorProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [soloCambios, setSoloCambios] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Precios que cambiaron en el último mes (ids)
  const [ahora] = useState(() => Date.now())
  const cambiosRecientes = useMemo(
    () =>
      new Set(
        precios
          .filter(
            (p) =>
              p.precioAnterior !== null &&
              p.cambiadoEn !== null &&
              ahora - new Date(p.cambiadoEn).getTime() < DIAS_CAMBIO_RECIENTE * 86_400_000
          )
          .map((p) => p.id)
      ),
    [precios, ahora]
  )
  const esCambioReciente = (p: IPrecioPlanilla) => cambiosRecientes.has(p.id)
  const cantCambios = cambiosRecientes.size

  const porSeccion = useMemo(() => {
    const palabras = sinTildes(busqueda).split(/\s+/).filter(Boolean)
    const filtrados = precios.filter((p) => {
      if (soloCambios && !cambiosRecientes.has(p.id)) return false
      const texto = sinTildes(`${p.descripcion} ${p.seccion}`)
      return palabras.every((w) => texto.includes(w))
    })
    const mapa = new Map<string, IPrecioPlanilla[]>()
    for (const p of filtrados) {
      if (!mapa.has(p.seccion)) mapa.set(p.seccion, [])
      mapa.get(p.seccion)!.push(p)
    }
    return mapa
  }, [precios, busqueda, soloCambios, cambiosRecientes])

  function actualizar() {
    setError(null)
    setMensaje(null)
    setActualizando(true)
    startTransition(async () => {
      const res = await sincronizarPlanillaPreciosAction(proveedorId)
      setActualizando(false)
      if (!res.success) {
        setError(res.error || "No se pudo leer la planilla.")
        router.refresh()
        return
      }
      const r = res.data
      setMensaje(
        `${r.total} precios leídos · ${r.cambiados} cambiaron · ${r.nuevos} nuevos${r.quitados ? ` · ${r.quitados} ya no están en la planilla` : ""}.`
      )
      router.refresh()
    })
  }

  const totalVisibles = [...porSeccion.values()].reduce((a, l) => a + l.length, 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Planilla de precios (Google Sheets)</h3>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-indigo-600 hover:underline"
            >
              Abrir <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-slate-500">
            {sincronizadaEn ? (
              <>
                Precios actualizados el <strong className="text-slate-700">{fmtFecha(sincronizadaEn)}</strong> ·{" "}
                {precios.length} insumos
              </>
            ) : (
              "Todavía no se copiaron los precios de la planilla."
            )}
            {" · "}Se actualiza sola una vez por día.
          </p>
        </div>
        <button
          type="button"
          onClick={actualizar}
          disabled={actualizando}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {actualizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualizar precios ahora
        </button>
      </div>

      {(error || errorSync) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {error || errorSync}
            {precios.length > 0 && " Se siguen usando los últimos precios copiados."}
          </span>
        </div>
      )}
      {mensaje && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{mensaje}</p>
      )}

      {precios.length > 0 && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar insumo (ej: máquina súper, manija 1,50, sembra 7000)…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none min-h-[40px]"
              />
            </div>
            <button
              type="button"
              onClick={() => setSoloCambios(!soloCambios)}
              className={`min-h-[40px] rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                soloCambios
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Cambios del último mes ({cantCambios})
            </button>
          </div>

          <div className="max-h-[560px] overflow-y-auto rounded-xl border border-slate-200">
            {totalVisibles === 0 ? (
              <p className="p-4 text-center text-xs text-slate-500">No hay insumos que coincidan.</p>
            ) : (
              [...porSeccion.entries()].map(([seccion, lista]) => (
                <div key={seccion}>
                  <div className="sticky top-0 z-10 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    {seccion}
                  </div>
                  {lista.map((p) => {
                    const cambio = esCambioReciente(p)
                    const subio = cambio && p.precio > (p.precioAnterior ?? 0)
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-xs last:border-b-0"
                      >
                        <span className="text-slate-800">{p.descripcion}</span>
                        <span className="flex shrink-0 items-center gap-2 text-right">
                          {cambio && (
                            <span
                              title={`Cambió el ${fmtFecha(p.cambiadoEn!)}`}
                              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                subio ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {subio ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              antes {formatearPrecio(p.precioAnterior ?? 0)}
                            </span>
                          )}
                          <span className={`font-bold ${p.precio === 0 ? "text-slate-400" : "text-slate-900"}`}>
                            {formatearPrecio(p.precio)}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
