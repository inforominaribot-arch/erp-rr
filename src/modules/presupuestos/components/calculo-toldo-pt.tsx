"use client"

// Pestaña "Toldo PT" de la calculadora: Toldo Pérgola Barrio y Toldo Vertical TP1 PRINTEMPS. Insumos de la planilla
// del proveedor, precios propios editables y lo que se carga a mano (madera o motor, domótica y brazo, confección, instalación).

import { AlertTriangle, Ruler } from "lucide-react"
import { formatearPrecio } from "@/lib/utils"
import { descripcionMotorToldo, lineasToldo, normalizarMotorToldo, type IToldoConfig } from "@/modules/mediciones/lib/toldos"
import type { CalculoPrecio, OpcionesCalculo, ResultadoCalculoRS } from "../lib/lista-precios-rs"
import { PRECIO_ALAMBRE_METRO, PRECIO_MENSULA, PRECIO_PUENTE_MEDIA, telasPosibles } from "../lib/toldo-pergola"

interface CalculoToldoPTProps {
  calculo: CalculoPrecio
  ancho: number
  opciones: OpcionesCalculo
  onCambiarOpciones: (opciones: OpcionesCalculo) => void
  resultado: ResultadoCalculoRS | null
}

const claseInput =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-hidden"

function CampoPrecio({
  label,
  valor,
  onCambiar,
  ayuda,
  resaltar = false,
}: {
  label: string
  valor: number | undefined
  onCambiar: (v: number) => void
  ayuda?: string
  resaltar?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700">{label}</label>
      <input
        type="number"
        min="0"
        step="100"
        value={valor ?? 0}
        onChange={(e) => onCambiar(Math.max(0, parseFloat(e.target.value) || 0))}
        className={`${claseInput} ${resaltar ? "border-amber-400 bg-amber-50" : ""}`}
      />
      {ayuda && <p className="mt-0.5 text-[11px] text-slate-500">{ayuda}</p>}
    </div>
  )
}

export function CalculoToldoPT({ calculo, ancho, opciones, onCambiarOpciones, resultado }: CalculoToldoPTProps) {
  const toldo = (calculo.entrada.toldo ?? {}) as Partial<IToldoConfig>
  const efectivas = resultado?.opciones ?? opciones
  const cambiar = (parcial: Partial<OpcionesCalculo>) => onCambiarOpciones({ ...opciones, ...parcial })
  const anchosTela = telasPosibles(toldo)
  const fmtM = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 })
  const esSoloTela = calculo.metodo === "PT_SOLO_TELA"
  // Vertical TP1 y Solo tela no llevan madera ni los precios propios de la pérgola
  const esVertical = calculo.metodo === "PT_VERTICAL_TP1" || esSoloTela
  const motorizado = esVertical && toldo.mecanismo === "Motorizado"
  const motorAMano = motorizado && normalizarMotorToldo(toldo.motor) !== "Oximo"

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-violet-50 p-3 border border-violet-100 text-xs text-violet-900 space-y-0.5">
        <p className="font-bold">
          {esSoloTela
            ? "Toldo Solo tela PRINTEMPS (insumos × 1,5 + confección + instalación)"
            : esVertical
            ? "Toldo Vertical TP1 PRINTEMPS (insumos × 1,5 + domótica × 2 + confección + instalación)"
            : "Toldo Pérgola Barrio PRINTEMPS (insumos × 1,5 + confección + instalación)"}
        </p>
        {lineasToldo(toldo).map((l) => (
          <p key={l} className="text-violet-700">
            {l}
          </p>
        ))}
      </div>

      {anchosTela.length > 1 && (
        <div>
          <label className="text-xs font-bold text-slate-700">Ancho de la tela (microperforado)</label>
          <select
            value={efectivas.anchoTela ?? ""}
            onChange={(e) => cambiar({ anchoTela: parseFloat(e.target.value) || null })}
            className={claseInput}
          >
            {anchosTela.map((t) => (
              <option key={t.ancho} value={t.ancho}>
                x {fmtM(t.ancho)} m
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-3">
        {!esVertical && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Ruler className="h-3.5 w-3.5" />
            Madera listón 3 × 1,5: comprar {fmtM(ancho)} m
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {!esVertical && (
            <CampoPrecio
              label="Madera ($ total)"
              valor={efectivas.precioMadera}
              onCambiar={(precioMadera) => cambiar({ precioMadera })}
              ayuda={`Precio de los ${fmtM(ancho)} m en la maderera`}
              resaltar={!efectivas.precioMadera}
            />
          )}
          {motorAMano && (
            <div className="sm:col-span-3">
              <CampoPrecio
                label="Motor y control ($ total)"
                valor={efectivas.precioMotor}
                onCambiar={(precioMotor) => cambiar({ precioMotor })}
                ayuda={descripcionMotorToldo(toldo)}
                resaltar={!efectivas.precioMotor}
              />
            </div>
          )}
          {motorizado && toldo.domotica && (
            <CampoPrecio
              label="Domótica ($)"
              valor={efectivas.precioDomotica}
              onCambiar={(precioDomotica) => cambiar({ precioDomotica })}
              ayuda="Se cobra × 2"
              resaltar={!efectivas.precioDomotica}
            />
          )}
          {esVertical && toldo.brazoCaputa && (
            <CampoPrecio
              label="Brazo Caduta ($)"
              valor={efectivas.precioBrazoCaduta}
              onCambiar={(precioBrazoCaduta) => cambiar({ precioBrazoCaduta })}
              ayuda="Va con los insumos (× 1,5)"
              resaltar={!efectivas.precioBrazoCaduta}
            />
          )}
          <CampoPrecio
            label="Confección ($)"
            valor={efectivas.confeccion}
            onCambiar={(confeccion) => cambiar({ confeccion })}
            resaltar={!efectivas.confeccion}
          />
          <CampoPrecio
            label="Instalación ($)"
            valor={efectivas.instalacion}
            onCambiar={(instalacion) => cambiar({ instalacion })}
            resaltar={!efectivas.instalacion}
          />
        </div>
      </div>

      {(!esVertical || toldo.cubreToldo) && (
      <details className="rounded-lg border border-slate-200 p-3">
        <summary className="cursor-pointer text-xs font-bold text-slate-700">Precios propios (stock y otros)</summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {!esVertical && (
            <>
              <CampoPrecio
                label="Puente de media ($ c/u)"
                valor={efectivas.precioPuente}
                onCambiar={(precioPuente) => cambiar({ precioPuente })}
                ayuda={`Por defecto ${formatearPrecio(PRECIO_PUENTE_MEDIA)}`}
              />
              <CampoPrecio
                label="Alambre ($ por metro)"
                valor={efectivas.precioAlambre}
                onCambiar={(precioAlambre) => cambiar({ precioAlambre })}
                ayuda={`Por defecto ${formatearPrecio(PRECIO_ALAMBRE_METRO)}`}
              />
            </>
          )}
          {toldo.cubreToldo && (
            <CampoPrecio
              label="Ménsula 20x25 ($ c/u)"
              valor={efectivas.precioMensula}
              onCambiar={(precioMensula) => cambiar({ precioMensula })}
              ayuda={`Por defecto ${formatearPrecio(PRECIO_MENSULA)} ($53.539 / 24)`}
            />
          )}
        </div>
      </details>
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
