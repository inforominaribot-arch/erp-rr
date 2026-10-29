"use client"

// Pestaña "Lista RS" de la calculadora: opciones (tela, color, zócalo, caño, motor, control) y desglose
// del precio calculado con la lista de precios de Rollershade.

import { AlertTriangle } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import { modelosDisponibles } from "@/modules/mediciones/lib/mosquiteros"
import {
  buscarPorId,
  canoBateria,
  canosOpciones,
  coloresDe,
  motoresOpciones,
  normalizarTexto,
  telasParaCapa,
  zocalosOpciones,
  type CalculoPrecio,
  type ICeldaPrecioMedida,
  type IItemListaCalculo,
  type OpcionesCalculo,
  type ResultadoCalculoRS,
} from "../lib/lista-precios-rs"

interface CalculoListaRSProps {
  calculo: CalculoPrecio
  lista: IItemListaCalculo[]
  tablaMG?: ICeldaPrecioMedida[]
  ancho?: number
  alto?: number
  opciones: OpcionesCalculo
  onCambiarOpciones: (opciones: OpcionesCalculo) => void
  resultado: ResultadoCalculoRS | null
}

const claseSelect =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-hidden"

export function CalculoListaRS({
  calculo,
  lista,
  tablaMG = [],
  ancho = 0,
  alto = 0,
  opciones,
  onCambiarOpciones,
  resultado,
}: CalculoListaRSProps) {
  const { metodo, entrada } = calculo
  const modo = entrada.modo || "Normal"
  const efectivas = resultado?.opciones ?? opciones
  const cambiar = (parcial: Partial<OpcionesCalculo>) => onCambiarOpciones({ ...opciones, ...parcial })

  const esAccesorio = metodo === "RS_CONTROL" || metodo === "RS_CARGADOR"
  const esMosquitero = metodo === "MG_MOSQUITERO"
  const modelosMG = esMosquitero ? modelosDisponibles(tablaMG, ancho, alto) : []
  const telas = telasParaCapa(lista, entrada.tipoCapa)
  const telaElegida = buscarPorId(lista, efectivas.telaId)
  const colores = coloresDe(telaElegida)
  const esLiIon = normalizarTexto(entrada.motor?.modelo).replace(/[^a-z]/g, "").includes("liion")
  const accesorios = lista.filter((it) => {
    const d = normalizarTexto(it.descripcion)
    return it.categoria === "MOTORIZACION" && (metodo === "RS_CONTROL" ? d.startsWith("control remoto") : d.startsWith("cargador"))
  })

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-violet-50 p-3 border border-violet-100 text-xs text-violet-900 space-y-0.5">
        <p className="font-bold">
          {esMosquitero
            ? "Mosquitero MagicRoll (tabla × 1,25, instalación incluida)"
            : esAccesorio
            ? metodo === "RS_CONTROL"
              ? "Control remoto (lista × 1,5)"
              : "Cargador Li-ion (lista × 1,5)"
            : `${entrada.tipoCapa} RS${modo !== "Normal" ? ` · ${modo}` : ""}`}
        </p>
        {resultado?.formula && <p>{resultado.formula}</p>}
        {!esAccesorio && !esMosquitero && (
          <p className="text-violet-700">Ancho mínimo 1 m y mínimo 1 m² de tela.</p>
        )}
      </div>

      {esMosquitero ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Modelo (los que se fabrican en esta medida)</label>
            <select
              value={efectivas.modelo || ""}
              onChange={(e) => cambiar({ modelo: e.target.value || null })}
              className={claseSelect}
            >
              <option value="">-- Elegir modelo --</option>
              {modelosMG.map((m) => (
                <option key={m.modelo} value={m.modelo}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          {efectivas.modelo === "PLEGABLE_IMPORTADO" && (
            <div>
              <label className="text-xs font-bold text-slate-700">Puerta</label>
              <select
                value={efectivas.puertas || "Simple"}
                onChange={(e) => cambiar({ puertas: e.target.value === "Doble" ? "Doble" : "Simple" })}
                className={claseSelect}
              >
                <option value="Simple">Simple</option>
                <option value="Doble">Doble (× 2)</option>
              </select>
            </div>
          )}
        </div>
      ) : esAccesorio ? (
        <div>
          <label className="text-xs font-bold text-slate-700">Ítem de la lista</label>
          <select
            value={efectivas.itemId || ""}
            onChange={(e) => cambiar({ itemId: e.target.value || null })}
            className={claseSelect}
          >
            <option value="">-- Elegir --</option>
            {accesorios.map((it) => (
              <option key={it.id} value={it.id}>
                {it.descripcion} ({it.seccion}) — {formatearPrecio(it.precio)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modo !== "Solo riel" && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700">Tela</label>
                <select
                  value={efectivas.telaId || ""}
                  onChange={(e) => cambiar({ telaId: e.target.value || null, color: null })}
                  className={claseSelect}
                >
                  <option value="">-- Elegir tela --</option>
                  {telas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.descripcion} — {formatearPrecio(t.precio)}/m²
                    </option>
                  ))}
                </select>
                {entrada.nombreTelaMedicion && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    En la medición: &quot;{entrada.nombreTelaMedicion}&quot;
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Color</label>
                <select
                  value={efectivas.color || ""}
                  onChange={(e) => cambiar({ color: e.target.value || null })}
                  disabled={colores.length === 0}
                  className={claseSelect}
                >
                  <option value="">{colores.length === 0 ? "Sin colores" : "-- Elegir color --"}</option>
                  {colores.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {modo === "Solo tela" && metodo !== "RS_BANDAS" && (
            <div>
              <label className="text-xs font-bold text-slate-700">Zócalo</label>
              <select
                value={efectivas.zocaloId || ""}
                onChange={(e) => cambiar({ zocaloId: e.target.value || null })}
                className={claseSelect}
              >
                {zocalosOpciones(lista).map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.descripcion} — {formatearPrecio(z.precio)}/ml
                  </option>
                ))}
              </select>
            </div>
          )}

          {metodo === "RS_ROLLER_MOT" && modo !== "Solo tela" && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700">Motor</label>
                <select
                  value={efectivas.motorId || ""}
                  onChange={(e) => cambiar({ motorId: e.target.value || null })}
                  className={claseSelect}
                >
                  <option value="">-- Elegir motor --</option>
                  {motoresOpciones(lista).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.descripcion} ({m.seccion}) — {formatearPrecio(m.precio)}
                    </option>
                  ))}
                </select>
                {entrada.motor?.modelo && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    En la medición: {entrada.motor.marca} {entrada.motor.modelo}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Caño</label>
                {esLiIon ? (
                  <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                    Caño de batería Li-ion — {formatearPrecio(canoBateria(lista)?.precio ?? 0)}/ml
                  </p>
                ) : (
                  <select
                    value={efectivas.canoId || ""}
                    onChange={(e) => cambiar({ canoId: e.target.value || null })}
                    className={claseSelect}
                  >
                    {canosOpciones(lista).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.descripcion} — {formatearPrecio(c.precio)}/ml
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Instalación ($)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={efectivas.instalacion ?? 0}
              onChange={(e) => cambiar({ instalacion: Math.max(0, parseFloat(e.target.value) || 0) })}
              className={claseSelect}
            />
          </div>
        </div>
      )}

      {resultado && resultado.avisos.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 space-y-1">
          {resultado.avisos.map((a) => (
            <p key={a} className="flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {a}
            </p>
          ))}
        </div>
      )}

      {resultado && resultado.desglose.length > 0 && (
        <table className="w-full text-xs">
          <tbody className="divide-y divide-slate-100">
            {resultado.desglose.map((l, i) => (
              <tr key={i}>
                <td className="py-1.5 pr-2 font-bold text-slate-700 whitespace-nowrap">{l.concepto}</td>
                <td className="py-1.5 pr-2 text-slate-500">{l.detalle}</td>
                <td className="py-1.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                  {formatearPrecio(l.importe)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
