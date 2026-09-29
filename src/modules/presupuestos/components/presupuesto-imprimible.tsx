"use client"

import { useEffect } from "react"
import { Printer, ArrowLeft, Phone, MapPin, CreditCard } from "lucide-react"
import { formatearPrecio, formatearFecha } from "@/lib/utils"
import {
  formatearNumeroPresupuesto,
  calcularDiasRestantesValidez,
  DATOS_EMPRESA_DEFAULT,
  CONDICIONES_PAGO_DEFAULT,
  PLAZO_ENTREGA_DEFAULT,
} from "../types"
import type { IPresupuestoDetalle, IAmbientePresupuestoGrupo } from "../types"
import { PresupuestoWhatsappButton } from "./presupuesto-whatsapp-button"

interface PresupuestoImprimibleProps {
  presupuesto: IPresupuestoDetalle
  onVolver?: () => void
}

export function PresupuestoImprimible({
  presupuesto,
  onVolver,
}: PresupuestoImprimibleProps) {
  const { cliente, items } = presupuesto
  const numPresupuesto = formatearNumeroPresupuesto(presupuesto.numero)
  const { diasRestantes, vencido } = calcularDiasRestantesValidez(
    presupuesto.creadoEn,
    presupuesto.validezDias
  )

  // Configurar título del documento para que al imprimir/guardar PDF el nombre por defecto sea "Presupuesto - Nombre y Apellido"
  useEffect(() => {
    const tituloAnterior = document.title
    const nombreCliente = cliente.nombre ? cliente.nombre.trim() : "Cliente"
    document.title = `Presupuesto - ${nombreCliente}`

    return () => {
      document.title = tituloAnterior
    }
  }, [cliente.nombre])

  // Agrupar items por ambiente
  const gruposAmbientes = items.reduce<Record<string, IAmbientePresupuestoGrupo>>(
    (acc, it) => {
      const amb = it.ambiente || "General"
      if (!acc[amb]) {
        acc[amb] = {
          ambiente: amb,
          items: [],
          subtotalAmbiente: 0,
        }
      }
      acc[amb].items.push(it)
      acc[amb].subtotalAmbiente += it.subtotal
      return acc
    },
    {}
  )

  const listaAmbientes = Object.values(gruposAmbientes)

  function handleImprimir() {
    const nombreCliente = cliente.nombre ? cliente.nombre.trim() : "Cliente"
    document.title = `Presupuesto - ${nombreCliente}`
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* React 19 native title tag for document head */}
      <title>{`Presupuesto - ${cliente.nombre?.trim() || "Cliente"}`}</title>

      {/* ── ESTILOS ESPECÍFICOS PARA IMPRESIÓN A4 EN 1 HOJA ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              .no-print, [class*="print:hidden"] {
                display: none !important;
                height: 0 !important;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                visibility: hidden !important;
                overflow: hidden !important;
              }
              .print-a4-hoja {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }
              .evitar-quiebre {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `,
        }}
      />

      {/* ── BARRA DE HERRAMIENTAS (No se imprime) ── */}
      <div className="no-print print:hidden flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al detalle
            </button>
          )}
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Vista Previa de Cotización para Cliente
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <PresupuestoWhatsappButton presupuesto={presupuesto} />
          <button
            type="button"
            onClick={handleImprimir}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF (A4)
          </button>
        </div>
      </div>

      {/* ── HOJA DE COTIZACIÓN COMERCIAL (A4) ── */}
      <div className="print-a4-hoja print:m-0 print:p-0 print:shadow-none print:border-none mx-auto max-w-[210mm] rounded-2xl border border-slate-200 bg-white p-7 md:p-9 shadow-sm font-sans text-slate-900">
        {/* Cabecera Membrete */}
        <div
          className="border-b-2 border-slate-900 pb-3"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <div>
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
              {DATOS_EMPRESA_DEFAULT.subtitulo}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {DATOS_EMPRESA_DEFAULT.nombre}
            </h1>
            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {DATOS_EMPRESA_DEFAULT.direccion}, {DATOS_EMPRESA_DEFAULT.localidad}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {DATOS_EMPRESA_DEFAULT.telefono}
              </p>
            </div>
          </div>

          <div
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-right shrink-0"
            style={{ minWidth: "210px" }}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Cotización Formal
            </span>
            <span className="text-xl font-black text-indigo-900 font-mono block mt-0.5">
              {numPresupuesto}
            </span>
            <div className="mt-1 text-xs text-slate-600 space-y-0.5">
              <p>
                <strong>Fecha:</strong> {formatearFecha(presupuesto.creadoEn)}
              </p>
              <p>
                <strong>Validez:</strong> {presupuesto.validezDias} días{" "}
                <span className="text-[11px] text-slate-400">
                  ({vencido ? "Vencido" : `${diasRestantes}d restantes`})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Datos del Cliente (3 columnas horizontales garantizadas) */}
        <div
          className="my-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 evitar-quiebre"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Datos del Cliente
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="text-slate-500 font-medium block text-xs">
                Nombre / Razón Social:
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                {cliente.nombre}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="text-slate-500 font-medium block text-xs">
                Teléfono / WhatsApp:
              </span>
              <p className="font-semibold text-slate-800 text-xs mt-0.5">
                {cliente.telefono || "No especificado"}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="text-slate-500 font-medium block text-xs">
                Ubicación / Domicilio:
              </span>
              <p className="font-semibold text-slate-800 text-xs mt-0.5 truncate">
                {cliente.direccion
                  ? `${cliente.direccion}${cliente.localidad ? `, ${cliente.localidad}` : ""}`
                  : "Santa Fe"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Productos agrupada por Ambiente */}
        <div className="space-y-3">
          {listaAmbientes.map((grupo) => (
            <div
              key={grupo.ambiente}
              className="space-y-1 evitar-quiebre"
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50/50 px-3 py-1 rounded-t-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Ambiente: {grupo.ambiente}
                </span>
                <span className="text-xs font-semibold text-indigo-700">
                  Subtotal: {formatearPrecio(grupo.subtotalAmbiente)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-1 px-3 font-semibold">
                        Descripción del Producto
                      </th>
                      <th className="py-1 px-3 font-semibold text-center w-28">
                        Medidas (m)
                      </th>
                      <th className="py-1 px-3 font-semibold text-center w-16">
                        Cant.
                      </th>
                      <th className="py-1 px-3 font-semibold text-right w-28">
                        P. Unitario
                      </th>
                      <th className="py-1 px-3 font-semibold text-right w-28">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grupo.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-3">
                          <p className="font-bold text-slate-900">{it.descripcion}</p>
                        </td>
                        <td className="py-1.5 px-3 text-center text-slate-600 font-mono">
                          {it.ancho > 0 && it.alto > 0
                            ? `${it.ancho.toFixed(2)} × ${it.alto.toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-1.5 px-3 text-center font-bold text-slate-800">
                          {it.cantidad}
                        </td>
                        <td className="py-1.5 px-3 text-right text-slate-700 font-mono">
                          {formatearPrecio(it.precioUnitario)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900 font-mono">
                          {formatearPrecio(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen Comercial de Totales (Horizontal lado a lado garantizado) */}
        <div
          className="mt-4 border-t-2 border-slate-200 pt-3 evitar-quiebre"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            breakInside: "avoid",
            pageBreakInside: "avoid",
          }}
        >
          {/* Notas y Condiciones (Lado Izquierdo ~58%) */}
          <div
            style={{ flex: "1 1 58%", maxWidth: "58%" }}
            className="space-y-2 text-xs text-slate-600"
          >
            {presupuesto.notas && (
              <div className="rounded-lg bg-slate-50 p-2 border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-0.5">
                  Notas especiales:
                </span>
                <p className="whitespace-pre-line text-slate-700">
                  {presupuesto.notas}
                </p>
              </div>
            )}

            <div className="space-y-0.5 text-[11px] leading-tight">
              <p>
                <strong>Forma de pago:</strong> {CONDICIONES_PAGO_DEFAULT}
              </p>
              <p>
                <strong>Plazo de entrega:</strong> {PLAZO_ENTREGA_DEFAULT}
              </p>
              <p>
                <strong>Garantía:</strong> 1 año de garantía sobre confección y
                mecanismos de fábrica.
              </p>
            </div>

            {/* Datos Bancarios para Seña */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2 text-[11px] text-indigo-950">
              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                Datos para Transferencia / Seña (50%):
              </div>
              <p className="text-[10px]">
                <strong>Banco:</strong> Banco Santander &nbsp;|&nbsp;{" "}
                <strong>Titular:</strong> Romina Ribot
              </p>
              <p className="text-[10px]">
                <strong>Alias:</strong> CORTINADOS.RR &nbsp;|&nbsp;{" "}
                <strong>CBU:</strong> 0720123988000034567891
              </p>
            </div>
          </div>

          {/* Bloque de Números (Lado Derecho ~38%) */}
          <div
            style={{ flex: "0 0 38%", width: "38%" }}
            className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1.5 text-xs"
          >
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatearPrecio(presupuesto.subtotal)}
              </span>
            </div>

            {presupuesto.descuento > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento ({presupuesto.descuento}%):</span>
                <span className="font-mono font-bold">
                  -{" "}
                  {formatearPrecio(
                    presupuesto.subtotal * (presupuesto.descuento / 100)
                  )}
                </span>
              </div>
            )}

            <div className="border-t border-slate-300 pt-1.5 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">
                Total Cotizado:
              </span>
              <span className="text-lg font-black text-indigo-950 font-mono">
                {formatearPrecio(presupuesto.total)}
              </span>
            </div>

            {presupuesto.estado === "ACEPTADO_PARCIAL" && (
              <div className="border-t border-indigo-200 pt-1 text-[11px] text-indigo-900">
                <span className="block font-semibold">Aceptación Parcial:</span>
                <div className="flex justify-between font-bold mt-0.5">
                  <span>Monto Aprobado:</span>
                  <span>
                    {formatearPrecio(
                      items
                        .filter((it) => it.aceptado)
                        .reduce((acc, it) => acc + it.subtotal, 0) *
                        (1 - presupuesto.descuento / 100)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie de Página */}
        <div className="mt-4 border-t border-slate-100 pt-2 text-center text-[10px] text-slate-400 print:text-[9px]">
          Cotización generada a través de ERP RR — ROMINA RIBOT Cortinados a Medida • Santa Fe, Argentina.
        </div>
      </div>
    </div>
  )
}

