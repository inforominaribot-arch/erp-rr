"use client"

import { Printer, ArrowLeft, Scissors, Truck, CheckSquare, Layers } from "lucide-react"
import type { IComandaDetalle, IItemComanda } from "../types"
import { CortinaDibujoDidactico } from "@/modules/mediciones/components/cortina-dibujo-didactico"
import {
  calcularAnchoConfeccionGaza,
  calcularArgollasGaza,
  calcularCantidadSoportes,
  determinarVarianteSoporte,
} from "@/modules/mediciones/types"

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
      <div className="mx-auto w-full max-w-[800px] bg-white p-8 border border-slate-200 shadow-sm print:m-0 print:max-w-none print:border-none print:p-0 print:shadow-none font-sans text-slate-900 text-xs">
        {/* Cabecera / Membrete */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              ROMINA RIBOT
            </h1>
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              Cortinados & Decoración
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Taller de Confección & Armado de Sistemas
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-md bg-slate-900 px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
              COMANDA DE TALLER
            </span>
            <div className="text-base font-black font-mono text-slate-900 mt-1">
              {numComanda}
            </div>
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
            <p className="text-sm font-black text-slate-900">
              {comanda.presupuesto.cliente.nombre}
            </p>
            {comanda.presupuesto.cliente.telefono && (
              <p className="text-slate-700">
                Tel: <strong>{comanda.presupuesto.cliente.telefono}</strong>
              </p>
            )}
            {comanda.presupuesto.cliente.direccion && (
              <p className="text-slate-700">
                Dirección: {comanda.presupuesto.cliente.direccion}
                {comanda.presupuesto.cliente.localidad
                  ? `, ${comanda.presupuesto.cliente.localidad}`
                  : ""}
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

        {/* ── SECCIÓN DE CORTINAS A FABRICAR EN TALLER (TARJETAS GRANDES CON DIBUJO) ── */}
        {totalFabricar > 0 && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5" />
                Cortinas para Confección y Corte en Taller ({totalFabricar})
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Dibujo técnico y especificaciones
              </span>
            </div>

            {/* Agrupadas por Ambiente */}
            {(() => {
              const itemsFabricar = comanda.items.filter((i) => i.tipo === "FABRICAR")
              const porAmbiente = itemsFabricar.reduce<Record<string, IItemComanda[]>>((acc, it) => {
                const amb = it.ambiente || "General"
                if (!acc[amb]) acc[amb] = []
                acc[amb].push(it)
                return acc
              }, {})

              return Object.entries(porAmbiente).map(([ambiente, itemsAmb]) => (
                <div key={ambiente} className="space-y-3">
                  {/* Encabezado de Ambiente */}
                  <div className="flex items-center justify-between bg-slate-100 border border-slate-800 px-3 py-1 rounded-md">
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
                      const tieneGaza = Boolean(c?.gaza?.activa)
                      const tieneBO = Boolean(c?.bo?.activa)
                      const anchoGaza = c?.gaza?.ancho || it.ancho
                      const altoGaza = c?.gaza?.alto || it.alto
                      const panosGaza = c?.gaza?.panos || 1
                      const anchosPanos = c?.gaza?.anchosPanos || []
                      const anchoConfeccionGaza = tieneGaza ? calcularAnchoConfeccionGaza(anchoGaza) : 0

                      const anchoBO = c?.bo?.ancho || it.ancho
                      const altoBO = c?.bo?.alto || it.alto
                      const tramosBO = c?.bo?.tramos || 1
                      const anchosTramos = c?.bo?.anchosTramos || []

                      const anchoEfectivo = tieneGaza ? anchoGaza : tieneBO ? anchoBO : it.ancho
                      const argollas = tieneGaza && tipo === "Tradicional" ? calcularArgollasGaza(anchoGaza) : 0
                      const cantidadSoportes = calcularCantidadSoportes(anchoEfectivo)
                      const varianteSoporte = determinarVarianteSoporte(tieneGaza, tieneBO, c?.formatoBO)
                      const caida = c?.caida || "Por delante"

                      return (
                        <div
                          key={it.id}
                          className="break-inside-avoid border-2 border-slate-900 rounded-xl p-3 bg-white shadow-2xs"
                        >
                          <div className="grid grid-cols-12 gap-3 items-center">
                            {/* ── COLUMNA IZQUIERDA: DIBUJO DIDÁCTICO GRANDE (~44%) ── */}
                            <div className="col-span-12 sm:col-span-5 border-b sm:border-b-0 sm:border-r border-slate-300 pb-2 sm:pb-0 sm:pr-3 flex flex-col items-center justify-center min-h-[140px]">
                              <CortinaDibujoDidactico
                                ancho={Number(it.ancho)}
                                alto={Number(it.alto)}
                                caracteristicas={c}
                                modoCompacto={true}
                              />
                            </div>

                            {/* ── COLUMNA DERECHA: ESPECIFICACIONES TÉCNICAS & CASILLEROS (~56%) ── */}
                            <div className="col-span-12 sm:col-span-7 space-y-2 text-xs text-slate-800">
                              {/* Título de la Cortina y Medidas */}
                              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                <div>
                                  <span className="font-extrabold text-slate-950 text-xs block">
                                    {idx + 1}. {it.descripcion}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                                    Medida: {it.ancho}m ancho × {it.alto}m alto • Cant: {it.cantidad}
                                  </span>
                                </div>
                                <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-900 shrink-0">
                                  {tipo}
                                </span>
                              </div>

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

                                {c?.mando && (
                                  <div>
                                    <span className="text-slate-500 font-medium">Mando: </span>
                                    <strong>{c.mando}</strong>
                                  </div>
                                )}

                                {c?.tipoSoporte && (
                                  <div>
                                    <span className="text-slate-500 font-medium">Soportes: </span>
                                    <strong>
                                      {cantidadSoportes} {c.tipoSoporte} ({varianteSoporte})
                                    </strong>
                                  </div>
                                )}
                              </div>

                              {/* Desglose de Confección de Telas */}
                              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-1 text-[11px]">
                                {/* Gaza */}
                                {tieneGaza && (
                                  <div className="border-b border-slate-200/80 pb-1">
                                    <div className="flex items-center justify-between">
                                      <span>
                                        <strong>GAZA:</strong> {anchoGaza.toFixed(2)}m × {altoGaza.toFixed(2)}m
                                        {c?.gaza?.nombreTela ? ` • ${c.gaza.nombreTela}` : ""}
                                      </span>
                                      <span className="rounded bg-amber-100 border border-amber-300 px-1.5 py-0.2 text-[9px] font-black text-amber-950">
                                        Corte (+10cm): {anchoConfeccionGaza.toFixed(2)}m
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-0.5">
                                      Paños ({panosGaza}):{" "}
                                      {anchosPanos.length > 0
                                        ? anchosPanos.map((p, pIdx) => `P${pIdx + 1}: ${p.toFixed(2)}m`).join(" + ")
                                        : `${(anchoGaza / panosGaza).toFixed(2)}m c/u`}
                                      {argollas > 0 && ` • ${argollas} argollas`}
                                    </div>
                                  </div>
                                )}

                                {/* Blackout */}
                                {tieneBO && (
                                  <div className="pt-0.5">
                                    <div className="flex items-center justify-between">
                                      <span>
                                        <strong>BLACK OUT:</strong> {anchoBO.toFixed(2)}m × {altoBO.toFixed(2)}m
                                        {c?.bo?.nombreTela ? ` • ${c.bo.nombreTela}` : ""}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        Caída: {caida}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-0.5">
                                      Tramos ({tramosBO}):{" "}
                                      {anchosTramos.length > 0
                                        ? anchosTramos.map((t, tIdx) => `T${tIdx + 1}: ${t.toFixed(2)}m`).join(" + ")
                                        : `${(anchoBO / tramosBO).toFixed(2)}m c/u`}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Casilleros para tildar con lapicera en taller */}
                              <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Control de Fabricación:
                                </span>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-700">
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-3.5 w-3.5 rounded border-2 border-slate-400 bg-white" />
                                    <span>Corte</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-3.5 w-3.5 rounded border-2 border-slate-400 bg-white" />
                                    <span>Confección</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-3.5 w-3.5 rounded border-2 border-slate-400 bg-white" />
                                    <span>Control OK</span>
                                  </div>
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

        {/* ── SECCIÓN DE PEDIDOS A PROVEEDOR (LISTA COMPACTA SIN DIBUJO) ── */}
        {totalProveedor > 0 && (
          <div className="mt-6 break-inside-avoid space-y-2">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                Artículos para Pedido a Proveedor Externo ({totalProveedor})
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Fábrica / Terminados
              </span>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-700 border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                  <th className="p-2 border-r border-slate-300">Ambiente & Descripción</th>
                  <th className="p-2 border-r border-slate-300 w-28 text-center">Medidas</th>
                  <th className="p-2 border-r border-slate-300 w-24 text-center">Cant.</th>
                  <th className="p-2 border-r border-slate-300">Detalles de Fábrica</th>
                  <th className="p-2 w-24 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {comanda.items
                  .filter((i) => i.tipo === "PEDIR_PROVEEDOR")
                  .map((it, idx) => {
                    const c = it.caracteristicas
                    return (
                      <tr key={it.id} className="hover:bg-slate-50/50">
                        <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-r border-slate-300">
                          <span className="font-bold text-slate-900 block">
                            [{it.ambiente || "General"}] {it.descripcion}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">
                          {it.ancho}m × {it.alto}m
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">
                          {it.cantidad}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-[10px] text-slate-600">
                          {c?.marca && <span>Marca: <strong>{c.marca}</strong> • </span>}
                          {c?.mando && <span>Mando: <strong>{c.mando}</strong> • </span>}
                          {c?.perfileria && <span>Perfil: <strong>{c.perfileria}</strong></span>}
                          {it.observaciones && (
                            <div className="text-indigo-700 font-semibold">{it.observaciones}</div>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-500">
                            <div className="h-3.5 w-3.5 rounded border border-slate-400" />
                            <span>Pedido</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
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
