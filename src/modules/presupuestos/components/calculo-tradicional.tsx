"use client"

// Panel de la calculadora para cortinas tradicionales (estándar o paño invertido):
// telas de las listas de las tiendas, riel o barral, confección, instalación y accesorios del barral.
// Todo lo que se carga queda guardado en la fila (calculoPrecio.tradicional): al volver a abrir la
// calculadora aparece lo mismo.

import { AlertTriangle } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import { SelectorTelaTradicional } from "./selector-tela-tradicional"
import {
  accesoriosPorDefecto,
  type ConfigTradicional,
  type IAccesoriosBarral,
  type ITelaTradicional,
  type ResultadoTradicional,
} from "../lib/tradicional"

interface CalculoTradicionalProps {
  cfg: ConfigTradicional
  onCambiar: (cfg: ConfigTradicional) => void
  ancho: number
  telas: ITelaTradicional[]
  accesorios: IAccesoriosBarral
  resultado: ResultadoTradicional
}

const claseNumero = "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold"

function Numero({ label, valor, onCambiar }: { label: string; valor: number; onCambiar: (n: number) => void }) {
  return (
    <div>
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <input type="number" min="0" value={valor} onChange={(e) => onCambiar(parseFloat(e.target.value) || 0)} className={claseNumero} />
    </div>
  )
}

export function CalculoTradicional({ cfg, onCambiar, ancho, telas, accesorios, resultado }: CalculoTradicionalProps) {
  const set = (cambios: Partial<ConfigTradicional>) => onCambiar({ ...cfg, ...cambios })
  const esBarral = cfg.sistema === "Barral"
  const nombreRiel = esBarral ? "Barral" : "Riel"
  const capas = cfg.modo === "INVERTIDO" ? 1 : (cfg.gasa.lleva ? 1 : 0) + (cfg.bo.lleva ? 1 : 0) || 1
  const acc = cfg.accesorios

  const cambiarSistema = (sistema: "Riel" | "Barral") =>
    set({
      sistema,
      accesorios:
        sistema === "Barral"
          ? cfg.accesorios ?? accesoriosPorDefecto(ancho, capas, accesorios, { cobrar: !cfg.sinSistema })
          : cfg.accesorios,
    })

  // Sin sistema: el riel / barral no se cobra y los accesorios se eligen a mano (arrancan sin cobrar)
  const cambiarSinSistema = (sinSistema: boolean) => {
    const porDefecto = accesoriosPorDefecto(ancho, capas, accesorios, { cobrar: true })
    const actual = cfg.accesorios ?? porDefecto
    set({
      sinSistema,
      accesorios: sinSistema
        ? { ...actual, argollas: 0, terminales: 0, soportes: 0 }
        : { ...actual, argollas: porDefecto.argollas, terminales: porDefecto.terminales, soportes: porDefecto.soportes },
    })
  }
  const accesorioDefecto = accesoriosPorDefecto(ancho, capas, accesorios, { cobrar: true })

  const soporteElegido = acc?.nombreSoporte ?? ""
  const opcionesSoporte = accesorios.soportes.map((s) => ({
    valor: `${s.tipo === "Kent" ? "Kent / York" : "Grampa"} ${s.variante.toLowerCase()}`,
    precio: s.item.precio,
  }))

  return (
    <div className="space-y-4">
      {telas.length === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          No hay listas de telas cargadas (Alhambra, Bia Brem, Sirota): escribí el precio de la tela a mano.
        </div>
      )}

      {/* Riel o barral */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sistema</span>
        {(["Riel", "Barral"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => cambiarSistema(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              cfg.sistema === s ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {[false, true].map((sin) => (
          <button
            key={String(sin)}
            type="button"
            onClick={() => cambiarSinSistema(sin)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              cfg.sinSistema === sin ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {sin ? "Sin sistema" : "Con sistema"}
          </button>
        ))}
      </div>
      {cfg.sinSistema && (
        <p className="text-[11px] font-semibold text-slate-600">
          El cliente ya tiene el {nombreRiel.toLowerCase()}: no se cobra. {esBarral ? "Marcá abajo los accesorios que sí se cobran." : ""}
        </p>
      )}

      {/* Telas */}
      {cfg.modo === "ESTANDAR" ? (
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Capas y telas</label>
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={cfg.gasa.lleva}
                onChange={(e) => set({ gasa: { ...cfg.gasa, lleva: e.target.checked } })}
                className="h-4 w-4 rounded text-indigo-600"
              />
              Gasa (frunce ×2)
            </label>
            {cfg.gasa.lleva && (
              <SelectorTelaTradicional capa={cfg.gasa} telas={telas} onCambiar={(gasa) => set({ gasa })} />
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={cfg.bo.lleva}
                  onChange={(e) => set({ bo: { ...cfg.bo, lleva: e.target.checked } })}
                  className="h-4 w-4 rounded text-indigo-600"
                />
                Blackout
              </label>
              {cfg.bo.lleva && (
                <select
                  value={cfg.bo.frunce}
                  onChange={(e) => set({ bo: { ...cfg.bo, frunce: parseFloat(e.target.value) } })}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold"
                >
                  <option value={1.5}>Frunce ×1,5</option>
                  <option value={2}>Frunce ×2</option>
                </select>
              )}
            </div>
            {cfg.bo.lleva && <SelectorTelaTradicional capa={cfg.bo} telas={telas} onCambiar={(bo) => set({ bo })} />}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tela</label>
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <SelectorTelaTradicional
              capa={cfg.tela}
              telas={telas}
              onCambiar={(tela) => set({ tela, anchoRollo: tela.ancho || cfg.anchoRollo })}
            />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Ancho del rollo (m):</span>
              <input
                type="number"
                step="0.05"
                min="0.5"
                value={cfg.tela.ancho || cfg.anchoRollo}
                onChange={(e) => {
                  const n = parseFloat(e.target.value) || cfg.anchoRollo
                  set({ anchoRollo: n, tela: { ...cfg.tela, ancho: n } })
                }}
                className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Costos fijos */}
      <div className="grid grid-cols-3 gap-2.5">
        <Numero label={`${nombreRiel} ($/m)`} valor={cfg.precioRielMetro} onCambiar={(n) => set({ precioRielMetro: n })} />
        <Numero label="Confección ($/m)" valor={cfg.precioConfeccionMetro} onCambiar={(n) => set({ precioConfeccionMetro: n })} />
        <Numero
          label={cfg.modo === "INVERTIDO" ? "Instalación ($)" : "Instalación ($/capa)"}
          valor={cfg.precioInstalacion}
          onCambiar={(n) => set({ precioInstalacion: n })}
        />
      </div>

      {/* Accesorios del barral */}
      {esBarral && acc && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Accesorios del barral</span>
            <button
              type="button"
              onClick={() =>
                set({
                  accesorios: accesoriosPorDefecto(ancho, capas, accesorios, {
                    tipo: soporteElegido.startsWith("Grampa") ? "Grampa" : "Kent",
                    variante: soporteElegido.endsWith("doble") ? "Doble" : soporteElegido.endsWith("simple") ? "Simple" : null,
                    cantidad: acc.soportes || null,
                    cobrar: acc.soportes > 0,
                  }),
                })
              }
              className="text-[11px] font-bold text-indigo-600 hover:underline"
            >
              Recalcular cantidades y precios
            </button>
          </div>
          <p className="text-[11px] text-slate-500">Lista de accesorios Rollershade, línea Black Point 1&quot;, × 1,5.</p>
          {cfg.sinSistema && (
            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["argollas", "Argollas"],
                  ["terminales", "Terminales"],
                  ["soportes", "Soportes"],
                ] as const
              ).map(([campo, etiqueta]) => (
                <label key={campo} className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acc[campo] > 0}
                    onChange={(e) =>
                      set({ accesorios: { ...acc, [campo]: e.target.checked ? accesorioDefecto[campo] || 1 : 0 } })
                    }
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                  Cobrar {etiqueta.toLowerCase()}
                </label>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
            <Numero label="Argollas (cant.)" valor={acc.argollas} onCambiar={(n) => set({ accesorios: { ...acc, argollas: Math.round(n) } })} />
            <Numero label="$ argolla" valor={acc.precioArgolla} onCambiar={(n) => set({ accesorios: { ...acc, precioArgolla: n } })} />
            <Numero label="Terminales (cant.)" valor={acc.terminales} onCambiar={(n) => set({ accesorios: { ...acc, terminales: Math.round(n) } })} />
            <Numero label="$ terminal" valor={acc.precioTerminal} onCambiar={(n) => set({ accesorios: { ...acc, precioTerminal: n } })} />
            <Numero label="Soportes (cant.)" valor={acc.soportes} onCambiar={(n) => set({ accesorios: { ...acc, soportes: Math.round(n) } })} />
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Soporte</span>
              <select
                value={soporteElegido}
                onChange={(e) => {
                  const op = opcionesSoporte.find((o) => o.valor === e.target.value)
                  set({ accesorios: { ...acc, nombreSoporte: e.target.value, precioSoporte: op?.precio ?? acc.precioSoporte } })
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold"
              >
                {!opcionesSoporte.some((o) => o.valor === soporteElegido) && <option value={soporteElegido}>{soporteElegido || "—"}</option>}
                {opcionesSoporte.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.valor} ({formatearPrecio(o.precio)})
                  </option>
                ))}
              </select>
            </div>
            <Numero label="$ soporte" valor={acc.precioSoporte} onCambiar={(n) => set({ accesorios: { ...acc, precioSoporte: n } })} />
          </div>
          {acc.soportes === 0 && (
            <p className="text-[11px] text-slate-500">Sin soportes en esta fila (los soportes dobles se cobran en la fila de la Gasa).</p>
          )}
        </div>
      )}

      {/* Avisos y desglose */}
      {resultado.avisos.length > 0 && (
        <div className="space-y-1">
          {resultado.avisos.map((a) => (
            <p key={a} className="flex items-start gap-1 text-[11px] font-semibold text-amber-700">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              {a}
            </p>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white">
        {resultado.desglose.map((l) => (
          <div key={l.concepto + l.detalle} className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-1.5 last:border-0">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800">{l.concepto}</p>
              <p className="text-[11px] text-slate-500">{l.detalle}</p>
            </div>
            <span className="shrink-0 text-xs font-bold text-slate-900 font-mono">{formatearPrecio(l.importe)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
