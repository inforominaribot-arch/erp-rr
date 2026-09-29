// Módulo: Proveedores & Compras
// Ficha Formal de Orden de Compra A4 Imprimible

"use client"

import { Printer, ArrowLeft, Building2, Phone, Mail, MapPin, CheckSquare } from "lucide-react"
import type { IOrdenCompra } from "../types"

interface OrdenCompraImprimibleProps {
  ordenCompra: IOrdenCompra
  puedeVerCostos: boolean
  onVolver?: () => void
}

export function OrdenCompraImprimible({
  ordenCompra,
  puedeVerCostos,
  onVolver,
}: OrdenCompraImprimibleProps) {
  const fechaEmision = new Date(ordenCompra.creadoEn).toLocaleDateString("es-AR")
  const totalArticulos = ordenCompra.items.length
  const sumaCantidades = ordenCompra.items.reduce(
    (sum, it) => sum + it.cantidadPedida,
    0
  )

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
              Volver al Detalle Digital
            </button>
          )}
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-medium">
            Vista Previa de Comprobante A4 para Proveedor
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
        >
          <Printer className="h-4 w-4" />
          Imprimir Ficha A4 / Exportar PDF
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
              ORDEN DE COMPRA
            </span>
            <p className="mt-1 text-base font-black text-slate-900">
              {ordenCompra.numeroFormateado}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Fecha: {fechaEmision}
            </p>
          </div>
        </div>

        {/* Datos Empresa y Proveedor */}
        <div className="grid grid-cols-2 gap-6 border-b border-slate-200 py-4">
          {/* Solicitante: ROMINA RIBOT */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              DATOS DEL SOLICITANTE / ENTREGA:
            </p>
            <p className="font-bold text-slate-900 text-sm">ROMINA RIBOT</p>
            <p className="text-slate-600">Recepción de Insumos & Taller Central</p>
            <p className="text-slate-600">Email: administracion@rominaribot.com.ar</p>
          </div>

          {/* Destinatario: Proveedor */}
          <div className="space-y-1 border-l border-slate-200 pl-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              PROVEEDOR / FÁBRICA:
            </p>
            <p className="font-bold text-slate-900 text-sm">
              {ordenCompra.proveedor.nombre}
            </p>
            {ordenCompra.proveedor.contacto && (
              <p className="text-slate-600">
                Atención: <strong>{ordenCompra.proveedor.contacto}</strong>
              </p>
            )}
            {ordenCompra.proveedor.telefono && (
              <p className="text-slate-600">Tel: {ordenCompra.proveedor.telefono}</p>
            )}
            {ordenCompra.proveedor.direccion && (
              <p className="text-slate-600">Dir: {ordenCompra.proveedor.direccion}</p>
            )}
          </div>
        </div>

        {/* Tabla de Artículos Solicitados */}
        <div className="py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-2">
            DETALLE DE ARTÍCULOS SOLICITADOS ({totalArticulos} ÍTEMS):
          </p>

          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <th className="border border-slate-300 px-2 py-1.5 w-10 text-center">#</th>
                <th className="border border-slate-300 px-2 py-1.5 w-24">Código</th>
                <th className="border border-slate-300 px-2 py-1.5">Descripción / Insumo</th>
                <th className="border border-slate-300 px-2 py-1.5 w-20 text-center">Unidad</th>
                <th className="border border-slate-300 px-2 py-1.5 w-24 text-right">Cant. Solicitada</th>
                {puedeVerCostos && (
                  <>
                    <th className="border border-slate-300 px-2 py-1.5 w-24 text-right">P. Unitario</th>
                    <th className="border border-slate-300 px-2 py-1.5 w-24 text-right">Subtotal</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ordenCompra.items.map((it, idx) => (
                <tr key={it.id} className="text-[11px]">
                  <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 font-mono text-[10px] text-slate-600">
                    {it.producto?.codigo || "—"}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 font-semibold text-slate-900">
                    {it.producto?.nombre || "Insumo"}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-600">
                    {it.producto?.unidadMedida || "u."}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-black text-slate-900">
                    {it.cantidadPedida}
                  </td>
                  {puedeVerCostos && (
                    <>
                      <td className="border border-slate-300 px-2 py-1.5 text-right text-slate-600">
                        {it.precioUnitario
                          ? `$${it.precioUnitario.toLocaleString("es-AR")}`
                          : "—"}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-bold text-slate-900">
                        {it.subtotal
                          ? `$${it.subtotal.toLocaleString("es-AR")}`
                          : "—"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold">
                <td
                  colSpan={4}
                  className="border border-slate-300 px-2 py-1.5 text-right text-[10px] uppercase text-slate-600"
                >
                  Total de Unidades / Metros:
                </td>
                <td className="border border-slate-300 px-2 py-1.5 text-right font-black text-slate-900">
                  {sumaCantidades}
                </td>
                {puedeVerCostos && (
                  <>
                    <td className="border border-slate-300 px-2 py-1.5 text-right text-[10px] uppercase text-slate-600">
                      Total Estimado:
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-black text-indigo-700 text-sm">
                      {ordenCompra.total
                        ? `$${ordenCompra.total.toLocaleString("es-AR")}`
                        : "—"}
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Observaciones e Instrucciones */}
        {ordenCompra.notas && (
          <div className="rounded-md border border-slate-300 bg-slate-50/50 p-3 my-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
              OBSERVACIONES / REQUISITOS DE ENTREGA:
            </p>
            <p className="text-slate-700 whitespace-pre-line mt-1 text-[11px]">
              {ordenCompra.notas}
            </p>
          </div>
        )}

        {/* Cuadro de Recepción y Control de Calidad */}
        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-slate-200">
          <div className="border border-dashed border-slate-300 p-3 rounded-sm min-h-[90px] flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              EMITIDO POR ROMINA RIBOT:
            </p>
            <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500">
              Firma y Aclaración
            </div>
          </div>

          <div className="border border-dashed border-slate-300 p-3 rounded-sm min-h-[90px] flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CONTROL DE RECEPCIÓN EN TALLER:
            </p>
            <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-500 flex justify-between">
              <span>Bultos Recibidos: _____</span>
              <span>Remito Nº: _____________</span>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div className="mt-8 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
          ROMINA RIBOT Cortinados — Documento de gestión interna y pedido a proveedores.
        </div>
      </div>
    </div>
  )
}
