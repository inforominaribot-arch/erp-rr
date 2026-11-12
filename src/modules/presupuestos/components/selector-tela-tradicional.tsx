"use client"

// Buscador de tela de las listas de las tiendas (Alhambra, Bia Brem, Sirota) para una capa tradicional.
// Al escribir sugiere las telas; al elegir una toma el precio con recargo de la tienda más cara y avisa
// (solo interno) dónde está más barata. El precio se puede corregir a mano (tela que no está en las listas).

import { useMemo, useState } from "react"
import { AlertTriangle, Search, Store } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import {
  capaConTelaCatalogo,
  sugerirTelas,
  type CapaTela,
  type ITelaTradicional,
} from "../lib/tradicional"

const fmtAncho = (n: number | null | undefined) =>
  n ? `${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m` : "ancho ?"

interface SelectorTelaTradicionalProps {
  capa: CapaTela
  telas: ITelaTradicional[]
  onCambiar: (capa: CapaTela) => void
  placeholder?: string
}

export function SelectorTelaTradicional({ capa, telas, onCambiar, placeholder }: SelectorTelaTradicionalProps) {
  const [texto, setTexto] = useState(capa.nombre ?? "")
  const [abierto, setAbierto] = useState(false)
  const sugerencias = useMemo(() => (abierto ? sugerirTelas(telas, texto) : []), [abierto, telas, texto])

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={texto}
            onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 150)}
            onChange={(e) => {
              setTexto(e.target.value)
              setAbierto(true)
              // Texto libre: la tela deja de estar vinculada a la lista hasta que se elija una sugerencia
              onCambiar({ ...capa, nombre: e.target.value, clave: null, telaId: null, proveedor: null, ancho: null, manual: true, masBaratas: [] })
            }}
            placeholder={placeholder ?? (telas.length > 0 ? "Escribí el nombre de la tela…" : "Nombre de la tela")}
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
          />
          {abierto && sugerencias.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {sugerencias.map((t) => (
                <li key={t.clave}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setTexto(t.opciones[0].nombre)
                      setAbierto(false)
                      onCambiar(capaConTelaCatalogo(capa, t))
                    }}
                    className="block w-full px-3 py-2 text-left hover:bg-indigo-50"
                  >
                    <span className="block text-xs font-bold text-slate-900">{t.nombre}</span>
                    <span className="block text-[11px] text-slate-500">
                      {t.opciones
                        .map((o) => `${o.proveedor} ${formatearPrecio(o.precio)}/m · ${fmtAncho(o.ancho)}`)
                        .join("  |  ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-slate-500">$/m:</span>
          <input
            type="number"
            step="100"
            min="0"
            value={capa.precio}
            onChange={(e) => onCambiar({ ...capa, precio: parseFloat(e.target.value) || 0, manual: true })}
            className="w-28 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-right font-bold"
          />
        </div>
      </div>

      {capa.proveedor && !capa.manual && (
        <p className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
          <Store className="h-3 w-3 shrink-0" />
          {capa.proveedor} · ancho {fmtAncho(capa.ancho)} · precio con recargo {formatearPrecio(capa.precio)}/m
        </p>
      )}
      {capa.manual && capa.clave === null && capa.nombre && telas.length > 0 && (
        <p className="text-[11px] font-semibold text-amber-700">
          &quot;{capa.nombre}&quot; no está elegida de las listas: el precio es el que escribas.
        </p>
      )}
      {capa.manual && capa.clave && (
        <p className="text-[11px] font-semibold text-slate-500">Precio corregido a mano.</p>
      )}
      {capa.masBaratas.length > 0 && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] text-sky-900">
          <span className="mr-1 rounded bg-sky-200 px-1 py-px text-[10px] font-black uppercase">Interno</span>
          Se presupuesta con {capa.proveedor}. Más barata en:{" "}
          {capa.masBaratas
            .map((o) => `${o.proveedor} ${formatearPrecio(o.precio)}/m (ancho ${fmtAncho(o.ancho)})`)
            .join(" · ")}
          {capa.masBaratas.some((o) => o.ancho !== capa.ancho) && (
            <span className="mt-0.5 flex items-center gap-1 font-bold text-amber-800">
              <AlertTriangle className="h-3 w-3" /> Ojo: los anchos no son iguales.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
