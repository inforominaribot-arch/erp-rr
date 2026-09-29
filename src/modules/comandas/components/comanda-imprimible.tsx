"use client"

import { Printer, ArrowLeft, Scissors, Truck, CheckSquare } from "lucide-react"
import type { IComandaDetalle } from "../types"

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

        {/* ── TABLA DE CORTE Y CONFECCIÓN ── */}
        <div className="mt-4">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-700 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300 w-8 text-center">
                  #
                </th>
                <th className="p-2 border-r border-slate-300 w-36">
                  Ambiente & Cortina
                </th>
                <th className="p-2 border-r border-slate-300 w-24 text-center">
                  Medidas
                </th>
                <th className="p-2 border-r border-slate-300 w-24 text-center">
                  Clasificación
                </th>
                <th className="p-2 border-r border-slate-300">
                  Especificaciones Técnicas Taller
                </th>
                <th className="p-2 w-28 text-center">Control Taller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {comanda.items.map((it, idx) => {
                const c = it.caracteristicas

                return (
                  <tr
                    key={it.id}
                    className="break-inside-avoid hover:bg-slate-50/50"
                  >
                    {/* Índice */}
                    <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Ambiente y Descripción */}
                    <td className="p-2 border-r border-slate-300">
                      <div className="font-bold text-slate-900">
                        {it.ambiente || "General"}
                      </div>
                      <div className="text-slate-600 text-[10px]">
                        {it.descripcion}
                      </div>
                    </td>

                    {/* Medidas */}
                    <td className="p-2 border-r border-slate-300 text-center font-mono">
                      <div className="font-bold text-slate-900">
                        {it.ancho}m × {it.alto}m
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Cant: <strong>{it.cantidad}</strong>
                      </div>
                    </td>

                    {/* Clasificación */}
                    <td className="p-2 border-r border-slate-300 text-center">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          it.tipo === "FABRICAR"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {it.tipo === "FABRICAR" ? "Fabricar" : "Proveedor"}
                      </span>
                    </td>

                    {/* Especificaciones Técnicas */}
                    <td className="p-2 border-r border-slate-300 space-y-1">
                      {c ? (
                        <div className="space-y-0.5 text-[10px] text-slate-700">
                          {c.tipo && (
                            <div>
                              <strong>Tipo:</strong> {c.tipo}
                              {c.sistema ? ` (${c.sistema})` : ""}
                            </div>
                          )}

                          {/* Gaza */}
                          {c.gaza?.activa && (
                            <div className="text-slate-900">
                              • <strong>Gaza:</strong>{" "}
                              {c.gaza.nombreTela || "Tela base"} —{" "}
                              {c.gaza.panos}{" "}
                              {c.gaza.panos === 1 ? "paño" : "paños"}
                              {c.gaza.anchosPanos?.length > 0 &&
                                ` [${c.gaza.anchosPanos.join("m, ")}m]`}
                            </div>
                          )}

                          {/* Black Out */}
                          {c.bo?.activa && (
                            <div className="text-slate-900">
                              • <strong>Black Out:</strong>{" "}
                              {c.bo.nombreTela || "B.O."} — {c.bo.tramos}{" "}
                              {c.bo.tramos === 1 ? "tramo" : "tramos"}
                              {c.bo.anchosTramos?.length > 0 &&
                                ` [${c.bo.anchosTramos.join("m, ")}m]`}
                            </div>
                          )}

                          {/* Mandos / Caídas / Soportes */}
                          <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 pt-0.5">
                            {c.mando && (
                              <span>
                                Mando: <strong>{c.mando}</strong>
                              </span>
                            )}
                            {c.caida && (
                              <span>
                                Caída: <strong>{c.caida}</strong>
                              </span>
                            )}
                            {c.sujecion && (
                              <span>
                                Sujeción: <strong>{c.sujecion}</strong>
                              </span>
                            )}
                            {c.colorBarral && (
                              <span>
                                Barral: <strong>{c.colorBarral}</strong>
                              </span>
                            )}
                            {c.perfileria && (
                              <span>
                                Perfilería: <strong>{c.perfileria}</strong>
                              </span>
                            )}
                            {c.aluminio && (
                              <span>
                                Aluminio: {c.aluminio.tipoLamina} -{" "}
                                {c.aluminio.color}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">
                          Sin especificaciones adicionales
                        </span>
                      )}

                      {it.observaciones && (
                        <div className="text-[10px] font-semibold text-indigo-700 bg-indigo-50/50 rounded p-1 mt-1">
                          Nota: {it.observaciones}
                        </div>
                      )}
                    </td>

                    {/* Casilleros para tildar con lapicera en taller */}
                    <td className="p-2 text-center align-middle">
                      <div className="space-y-1.5 text-[9px] text-slate-500 font-bold text-left pl-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3.5 w-3.5 rounded border border-slate-400" />
                          <span>Corte / Pedido</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3.5 w-3.5 rounded border border-slate-400" />
                          <span>Confección</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3.5 w-3.5 rounded border border-slate-400" />
                          <span>Control OK</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

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
