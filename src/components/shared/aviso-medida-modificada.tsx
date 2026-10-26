"use client"

import { useState } from "react"
import { AlertTriangle, Check, Loader2 } from "lucide-react"
import type { IAvisoMedidaModificada } from "@/modules/mediciones/types"
import { marcarAvisoMedidaRevisado } from "@/modules/mediciones/actions"
import { fmtMedida } from "@/lib/utils"

interface AvisoMedidaModificadaProps {
  aviso: IAvisoMedidaModificada
  anchoActual: number
  altoActual: number
  origen: "presupuesto" | "comanda"
  itemId: string
}

/**
 * Aviso para Administración: la medición de la cortina cambió después de presupuestar
 * o de generar la comanda. No se imprime (clase print:hidden).
 */
export function AvisoMedidaModificada({
  aviso,
  anchoActual,
  altoActual,
  origen,
  itemId,
}: AvisoMedidaModificadaProps) {
  const [guardando, setGuardando] = useState(false)
  const [revisado, setRevisado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (revisado) return null

  const fecha = new Date(aviso.modificadaEn).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  const fmt = (n: number) => fmtMedida(n)

  async function handleRevisado() {
    setGuardando(true)
    setError(null)
    const res = await marcarAvisoMedidaRevisado(origen, itemId)
    setGuardando(false)
    if (res.success) setRevisado(true)
    else setError(res.error || "Error")
  }

  return (
    <div className="print:hidden mt-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
      <span>
        <strong>Medida modificada</strong> el {fecha}: antes{" "}
        <strong>
          {fmt(aviso.anterior.ancho)} × {fmt(aviso.anterior.alto)}
        </strong>{" "}
        → ahora{" "}
        <strong>
          {fmt(anchoActual)} × {fmt(altoActual)}
        </strong>
      </span>
      <button
        type="button"
        onClick={handleRevisado}
        disabled={guardando}
        className="ml-auto inline-flex items-center gap-1 rounded-md border border-amber-400 bg-white px-2 py-0.5 font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        {guardando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        Revisado
      </button>
      {error && <span className="w-full text-red-700">{error}</span>}
    </div>
  )
}
