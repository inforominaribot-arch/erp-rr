"use client"

// Botones para actualizar la lista de precios de un proveedor desde su archivo (Excel o PDF),
// o confirmar que este mes "no cambiaron los precios" (queda la lista que está).
// Se usa en el aviso del día 1 (inicio) y en la ficha del proveedor.

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileUp, Loader2 } from "lucide-react"
import { confirmarListaSinCambiosAction, subirListaPreciosAction } from "../actions"
import type { IResultadoListaSubida } from "../lib/listas-telas/aplicar-lista"

interface SubirListaPreciosProps {
  proveedorId: string
  /** "Excel o PDF" / "PDF" */
  archivo: string
  compacto?: boolean
}

export function SubirListaPrecios({ proveedorId, archivo, compacto = false }: SubirListaPreciosProps) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<IResultadoListaSubida | null>(null)
  const [confirmada, setConfirmada] = useState(false)

  const acepta = archivo === "PDF" ? ".pdf,application/pdf" : ".xlsx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

  function subir(file: File) {
    setError(null)
    setResultado(null)
    const datos = new FormData()
    datos.set("proveedorId", proveedorId)
    datos.set("archivo", file)
    startTransition(async () => {
      const r = await subirListaPreciosAction(datos)
      if (r.success) {
        setResultado(r.data)
        router.refresh()
      } else setError(r.error)
      if (input.current) input.current.value = ""
    })
  }

  function sinCambios() {
    setError(null)
    startTransition(async () => {
      const r = await confirmarListaSinCambiosAction(proveedorId)
      if (r.success) {
        setConfirmada(true)
        router.refresh()
      } else setError(r.error)
    })
  }

  const boton = compacto ? "px-2.5 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs"

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept={acepta}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) subir(f)
          }}
        />
        <button
          type="button"
          disabled={pendiente}
          onClick={() => input.current?.click()}
          className={`inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-700 disabled:opacity-50 ${boton}`}
        >
          {pendiente ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
          Subir lista ({archivo})
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={sinCambios}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${boton}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          No cambiaron los precios
        </button>
      </div>
      {error && <p className="text-[11px] font-semibold text-rose-700">{error}</p>}
      {confirmada && <p className="text-[11px] font-semibold text-emerald-700">Listo: queda la lista que estaba.</p>}
      {resultado && (
        <div className="text-[11px] text-slate-700">
          <p className="font-semibold text-emerald-700">
            Lista actualizada: {resultado.leidos} renglones leídos · {resultado.cambiaronPrecio} cambiaron de precio
            {resultado.tipo === "TELAS" ? ` · ${resultado.nuevos} nuevos` : ""} · {resultado.sinCambios} sin cambios
            {resultado.dadosDeBaja > 0 ? ` · ${resultado.dadosDeBaja} ya no están` : ""}
          </p>
          {resultado.avisos.map((a) => (
            <p key={a} className="text-amber-700">
              {a}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
