"use client"

import { Printer, ArrowLeft, Layers } from "lucide-react"
import type { IComandaDetalle, IItemComanda } from "../types"
import { CortinaDibujoDidactico } from "@/modules/mediciones/components/cortina-dibujo-didactico"
import {
  calcularArgollasGaza,
  calcularCantidadSoportes,
  determinarVarianteSoporte,
} from "@/modules/mediciones/types"
import { calcularCorteRiel } from "@/modules/presupuestos/lib/explosion-materiales"
import { fmtMedida } from "@/lib/utils"
import { detalleCapasComanda, llevaGanchos } from "../lib/detalle-capas"

interface ComandaImprimibleProps {
  comanda: IComandaDetalle
  onVolver?: () => void
}

export function ComandaImprimible({
  comanda,
  onVolver,
}: ComandaImprimibleProps) {
  const numComanda = `#COM-${String(comanda.numero).padStart(4, "0")}`
  const numPresupuesto = `#PRE-${String(comanda.presupuesto.numero).padStart(
    4,
    "0"
  )}`

  const fechaEmision = new Date(comanda.creadoEn).toLocaleDateString("es-AR")
  const fechaEntrega = comanda.fechaEntrega
    ? new Date(comanda.fechaEntrega).toLocaleDateString("es-AR")
    : "A coordinar"

  const totalItems = comanda.items.length
  const totalFabricar = comanda.items.filter((i) => i.tipo === "FABRICAR").length
  const totalProveedor = comanda.items.filter(
    (i) => i.tipo === "PEDIR_PROVEEDOR"
  ).length

  return (
    <div className="w-full space-y-4">
      {/* Impresión A4: solo la hoja; cada cortina entera en una página */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4 portrait; margin: 8mm 10mm; }
              html, body {
                background: #ffffff !important;
                height: auto !important;
                overflow: visible !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              .no-print, [class*="print:hidden"] { display: none !important; }
              .comanda-hoja { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
              .comanda-tarjeta { break-inside: avoid !important; page-break-inside: avoid !important; }
              .comanda-ambiente { break-after: avoid !important; page-break-after: avoid !important; }
              /* En papel todo en negro: los grises claros, naranjas y violetas salen lavados */
              .comanda-hoja, .comanda-hoja * { color: #000 !important; }
              .comanda-hoja [class*="border-"] { border-color: #000 !important; }
              .comanda-hoja .bg-slate-900, .comanda-hoja .bg-amber-600 { background-color: #000 !important; }
              .comanda-hoja .bg-slate-900, .comanda-hoja .bg-slate-900 *,
              .comanda-hoja .bg-amber-600, .comanda-hoja .bg-amber-600 * { color: #fff !important; }
              .comanda-hoja .bg-amber-50, .comanda-hoja .bg-indigo-50 { background-color: #fff !important; }
            }
          `,
        }}
      />

      {/* ── BARRA SUPERIOR DE ACCIONES (OCULTA AL IMPRIMIR) ── */}
      <div className="no-print print:hidden flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Gestión Digital
            </button>
          )}
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-medium">
            Vista Ficha de Comanda A4 para Taller
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
        >
          <Printer className="h-4 w-4" />
          Imprimir Ficha de Taller (A4)
        </button>
      </div>

      {/* ── HOJA A4 IMPRIMIBLE ── */}
      <div className="comanda-hoja mx-auto w-full max-w-[800px] bg-white p-8 border border-slate-200 shadow-sm print:m-0 print:max-w-none print:border-none print:p-0 print:shadow-none font-sans text-slate-900 text-xs">
        {/* Cabecera / Membrete */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              ROMINA RIBOT
            </h1>
          </div>

          <div className="text-right">
            <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
              COMANDA DE TALLER
            </div>
            <span className="inline-block rounded-md bg-slate-900 px-3 py-1 text-base font-black font-mono text-white mt-1">
              {numComanda}
            </span>
            <div className="text-[11px] text-slate-600 font-medium">
              Ref. Presupuesto: <strong>{numPresupuesto}</strong>
            </div>
          </div>
        </div>

        {/* Datos Principales (Cliente, Fechas, Resumen) */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 py-3 text-xs">
          {/* Cliente */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Datos del Cliente
            </p>
            <span className="inline-block rounded-md bg-slate-900 px-3 py-1 text-sm font-black text-white uppercase tracking-wide">
              {comanda.presupuesto.cliente.nombre}
            </span>
            {comanda.presupuesto.cliente.telefono && (
              <p className="text-slate-700">
                Tel: <strong>{comanda.presupuesto.cliente.telefono}</strong>
              </p>
            )}
            {comanda.presupuesto.cliente.direccion && (
              <p className="text-slate-700">
                Dirección:{" "}
                <strong>
                  {comanda.presupuesto.cliente.direccion}
                  {comanda.presupuesto.cliente.localidad
                    ? `, ${comanda.presupuesto.cliente.localidad}`
                    : ""}
                </strong>
              </p>
            )}
          </div>

          {/* Fechas & Resumen Taller */}
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Plazos de Producción
            </p>
            <p className="text-slate-700">
              Emisión Comanda: <strong>{fechaEmision}</strong>
            </p>
            <p className="text-xs font-bold text-slate-900">
              Fecha de Entrega:{" "}
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-900 border border-indigo-200">
                {fechaEntrega}
              </span>
            </p>
            <div className="pt-1 text-[11px] text-slate-600 flex items-center justify-end gap-3">
              <span>
                Total: <strong>{totalItems} cortinas</strong>
              </span>
              <span>
                Fabricar: <strong>{totalFabricar}</strong>
              </span>
              <span>
                Proveedor: <strong>{totalProveedor}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Observaciones generales de comanda si las hay */}
        {comanda.notas && (
          <div className="my-3 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] text-amber-900">
            <strong className="uppercase tracking-wider text-[10px] text-amber-800">
              Instrucciones Especiales de Taller:
            </strong>{" "}
            {comanda.notas}
          </div>
        )}

        {/* ── TODAS LAS CORTINAS (TALLER Y PROVEEDOR) EN TARJETAS GRANDES CON DIBUJO ── */}
        {totalItems > 0 && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Cortinas de la Comanda ({totalItems})
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Dibujo técnico y especificaciones
              </span>
            </div>

            {/* Agrupadas por Ambiente */}
            {(() => {
              const porAmbiente = comanda.items.reduce<Record<string, IItemComanda[]>>((acc, it) => {
                const amb = it.ambiente || "General"
                if (!acc[amb]) acc[amb] = []
                acc[amb].push(it)
                return acc
              }, {})

              return Object.entries(porAmbiente).map(([ambiente, itemsAmb]) => (
                <div key={ambiente} className="space-y-3">
                  {/* Encabezado de Ambiente */}
                  <div className="comanda-ambiente flex items-center justify-between bg-slate-100 border border-slate-800 px-3 py-1 rounded-md">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      📍 AMBIENTE: {ambiente}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {itemsAmb.length} cortina{itemsAmb.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Tarjetas de Cortinas del Ambiente (Layout de tu boceto) */}
                  <div className="space-y-3">
                    {itemsAmb.map((it, idx) => {
                      const c = it.caracteristicas
                      const tipo = c?.tipo || "Tradicional"
                      const esProveedor = it.tipo === "PEDIR_PROVEEDOR"
                      const tieneGaza = Boolean(c?.gaza?.activa)
                      const tieneBO = Boolean(c?.bo?.activa)
                      const anchoGaza = c?.gaza?.ancho || it.ancho
                      const altoGaza = c?.gaza?.alto || it.alto
                      const panosGaza = c?.gaza?.panos || 1
                      const anchosPanos = c?.gaza?.anchosPanos || []

                      const anchoBO = c?.bo?.ancho || it.ancho
                      const altoBO = c?.bo?.alto || it.alto
                      const tramosBO = c?.bo?.tramos || 1
                      const anchosTramos = c?.bo?.anchosTramos || []

                      const anchoEfectivo = tieneGaza ? anchoGaza : tieneBO ? anchoBO : it.ancho
                      const argollas =
                        !esProveedor && tieneGaza && tipo === "Tradicional" ? calcularArgollasGaza(anchoGaza) : 0
                      const cantidadSoportes = calcularCantidadSoportes(anchoEfectivo)
                      const varianteSoporte = determinarVarianteSoporte(tieneGaza, tieneBO, c?.formatoBO)
                      const detallesCapas = detalleCapasComanda(c)
                      // Cálculo de medida de Riel o Barral
                      const esBarral = tipo === "Tradicional" && c?.sistema === "Barral"
                      const calculoRiel = calcularCorteRiel(Number(it.ancho))
                      let textoMedidaSoporte = ""
                      if (esBarral) {
                        textoMedidaSoporte = `Barral: ${fmtMedida(it.ancho)}m (sin corte)`
                      } else if (tipo === "Tradicional" || c?.sistema === "Riel") {
                        if (calculoRiel.cantidadTramos === 1) {
                          textoMedidaSoporte = `Riel: ${fmtMedida(calculoRiel.medidaPorTramo)}m (1 tramo)`
                        } else {
                          textoMedidaSoporte = `Riel: ${fmtMedida(calculoRiel.totalMetros)}m (2 tramos de ${fmtMedida(calculoRiel.medidaPorTramo)}m)`
                        }
                      } else {
                        textoMedidaSoporte = `Sistema: ${fmtMedida(it.ancho)}m`
                      }

                      return (
                        <div
                          key={it.id}
                          className={`comanda-tarjeta break-inside-avoid border-2 rounded-xl p-3.5 bg-white shadow-2xs ${
                            esProveedor ? "border-amber-600" : "border-slate-900"
                          }`}
                        >
                          <div className="grid grid-cols-12 gap-3.5 items-center">
                            {/* ── COLUMNA IZQUIERDA: DIBUJO DIDÁCTICO MUCHO MÁS GRANDE (~48%) ── */}
                            <div className="col-span-12 sm:col-span-6 border-b sm:border-b-0 sm:border-r border-slate-300 pb-2 sm:pb-0 sm:pr-3 flex flex-col items-center justify-center min-h-[175px] bg-slate-50/50 rounded-lg p-1.5">
                              <CortinaDibujoDidactico
                                ancho={Number(it.ancho)}
                                alto={Number(it.alto)}
                                caracteristicas={c}
                                modoCompacto={true}
                                medidasConfeccion={true}
                              />
                            </div>

                            {/* ── COLUMNA DERECHA: ESPECIFICACIONES TÉCNICAS & CASILLEROS (~52%) ── */}
                            <div className="col-span-12 sm:col-span-6 space-y-2 text-xs text-slate-800">
                              {/* Título de la Cortina y Medida de Riel/Barral */}
                              <div className="flex items-start justify-between border-b border-slate-200 pb-1.5">
                                <div>
                                  <span className="font-extrabold text-slate-950 text-sm block">
                                    {idx + 1}. {it.descripcion}
                                  </span>
                                  {/* MEDIDA DE RIEL O BARRAL REMARCADA */}
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="inline-block rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-black text-white font-mono shadow-2xs">
                                      {textoMedidaSoporte}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold">
                                      Cant: {it.cantidad}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span
                                    className={`rounded px-2 py-0.5 text-[10px] font-black uppercase text-white ${
                                      esProveedor ? "bg-amber-600" : "bg-slate-900"
                                    }`}
                                  >
                                    {esProveedor ? "Proveedor" : "Taller"}
                                  </span>
                                  <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-900">
                                    {tipo}
                                  </span>
                                </div>
                              </div>

                              {/* Proveedor por capa (marca y proveedor asignado) */}
                              {esProveedor && it.pedidos.length > 0 && (
                                <div className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] text-amber-950 space-y-0.5">
                                  {it.pedidos.map((p) => (
                                    <div key={p.id}>
                                      <strong>{p.etiqueta.replace("Gaza", "Gasa")}</strong>
                                      {p.marca ? ` (${p.marca})` : ""}: {p.proveedorNombre || "proveedor sin asignar"}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Especificaciones de Sistema, Mandos y Soportes */}
                              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                                <div>
                                  <span className="text-slate-500 font-medium">Sistema: </span>
                                  <strong>
                                    {tipo === "Tradicional"
                                      ? `${c?.sistema || "Riel"}${
                                          c?.sistema === "Barral"
                                            ? ` (${c?.colorBarral || "Negro"})`
                                            : ""
                                        }`
                                      : c?.perfileria || "Blanco"}
                                  </strong>
                                </div>

                                <div>
                                  <span className="text-slate-500 font-medium">Sujeción: </span>
                                  <strong>{c?.sujecion || "Pared"}</strong>
                                </div>

                                {c?.tipoSoporte && (
                                  <div>
                                    <span className="text-slate-500 font-medium">Soportes: </span>
                                    <strong>
                                      {cantidadSoportes} {c.tipoSoporte} ({varianteSoporte})
                                    </strong>
                                  </div>
                                )}
                              </div>

                              {/* Caída, posición y mando de cada capa */}
                              {detallesCapas.length > 0 && (
                                <div className="space-y-0.5 text-[11px]">
                                  {detallesCapas.map((d) => (
                                    <div key={d.capa}>
                                      <strong>{d.capa}</strong>
                                      <span className="text-slate-500"> ({d.tipo}): </span>
                                      {[
                                        d.caida && `Caída ${d.caida.toLowerCase()}`,
                                        d.posicion && `Posición ${d.posicion.toLowerCase()}`,
                                        d.mando && `Mando ${d.mando}`,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Ganchos: los cuenta y anota el taller */}
                              {llevaGanchos(c) && (
                                <div className="flex items-end gap-2 text-[11px] font-black text-slate-900">
                                  <span>GANCHOS:</span>
                                  <span className="flex-1 border-b-2 border-dotted border-slate-500 h-4 max-w-[140px]" />
                                </div>
                              )}

                              {/* Desglose de Confección de Telas */}
                              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-1 text-[11px]">
                                {/* Gaza */}
                                {tieneGaza && (
                                  <div className="border-b border-slate-200/80 pb-1">
                                    <div>
                                      <strong>GASA:</strong> {fmtMedida(anchoGaza)}m × {fmtMedida(altoGaza)}m
                                      {c?.gaza?.nombreTela ? ` • ${c.gaza.nombreTela}` : ""}
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-0.5">
                                      Paños ({panosGaza}):{" "}
                                      {anchosPanos.length > 0
                                        ? anchosPanos.map((p, pIdx) => `P${pIdx + 1}: ${fmtMedida(p)}m`).join(" + ")
                                        : `${fmtMedida(anchoGaza / panosGaza)}m c/u`}
                                      {argollas > 0 && ` • ${argollas} argollas`}
                                    </div>
                                  </div>
                                )}

                                {/* Blackout */}
                                {tieneBO && (
                                  <div className="pt-0.5">
                                    <div>
                                      <strong>BLACK OUT:</strong> {fmtMedida(anchoBO)}m × {fmtMedida(altoBO)}m
                                      {c?.bo?.nombreTela ? ` • ${c.bo.nombreTela}` : ""}
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-0.5">
                                      Tramos ({tramosBO}):{" "}
                                      {anchosTramos.length > 0
                                        ? anchosTramos.map((t, tIdx) => `T${tIdx + 1}: ${fmtMedida(t)}m`).join(" + ")
                                        : `${fmtMedida(anchoBO / tramosBO)}m c/u`}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Casilleros para tildar con lapicera en taller */}
                              <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {esProveedor ? "Control de Recepción:" : "Control de Fabricación:"}
                                </span>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-700">
                                  {(esProveedor
                                    ? ["Recibido", "Controlado", "Embalado"]
                                    : ["Corte", "Confección", "Control OK"]
                                  ).map((casilla) => (
                                    <div key={casilla} className="flex items-center gap-1.5">
                                      <div className="h-3.5 w-3.5 rounded border-2 border-slate-400 bg-white" />
                                      <span>{casilla}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
          </div>
        )}

        {/* Firmas y Recepción de Taller al Pie */}
        <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-500">
          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <p className="font-bold text-slate-700">Jefa de Taller / Corte</p>
            <p>Confección realizada</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <p className="font-bold text-slate-700">Control de Calidad</p>
            <p>Medidas & Terminaciones OK</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-300 mb-1" />
            <p className="font-bold text-slate-700">Recepción para Colocación</p>
            <p>Pase a Instalación</p>
          </div>
        </div>
      </div>
    </div>
  )
}
