// Módulo: Proveedores & Compras
// Vista de Detalle de Orden de Compra con conmutador Digital / Ficha A4

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ShoppingCart,
  Building2,
  Calendar,
  Boxes,
  Printer,
  Eye,
  Send,
  Ban,
  CheckCircle2,
  FileText,
  AlertCircle,
  ExternalLink,
  ImageIcon,
} from "lucide-react"
import type { IOrdenCompra, EstadoOrdenCompra } from "../types"
import { OrdenCompraEstadoBadge } from "./orden-compra-estado-badge"
import { OrdenCompraWhatsAppButton } from "./orden-compra-whatsapp-button"
import { OrdenCompraImprimible } from "./orden-compra-imprimible"
import { OrdenCompraRecepcionModal } from "./orden-compra-recepcion-modal"
import { cambiarEstadoOrdenCompra } from "../actions"

interface OrdenCompraDetalleViewProps {
  ordenCompra: IOrdenCompra
  puedeVerCostos: boolean
  puedeAdministrar: boolean
  puedeRecibir: boolean
  iniciarEnImpresion?: boolean
}

export function OrdenCompraDetalleView({
  ordenCompra,
  puedeVerCostos,
  puedeAdministrar,
  puedeRecibir,
  iniciarEnImpresion = false,
}: OrdenCompraDetalleViewProps) {
  const router = useRouter()
  const [vista, setVista] = useState<"DIGITAL" | "IMPRESION">(
    iniciarEnImpresion ? "IMPRESION" : "DIGITAL"
  )
  const [modalRecepcion, setModalRecepcion] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const fechaEmision = new Date(ordenCompra.creadoEn).toLocaleDateString("es-AR")
  const fechaActualizada = new Date(ordenCompra.actualizadoEn).toLocaleDateString("es-AR")

  const handleCambiarEstado = async (nuevoEstado: EstadoOrdenCompra) => {
    setCambiandoEstado(true)
    try {
      await cambiarEstadoOrdenCompra({
        ordenCompraId: ordenCompra.id,
        nuevoEstado,
      })
      router.refresh()
    } catch (err) {
      console.error("Error al actualizar estado:", err)
      alert("No se pudo actualizar el estado de la orden.")
    } finally {
      setCambiandoEstado(false)
    }
  }

  // Si está en vista de impresión A4
  if (vista === "IMPRESION") {
    return (
      <OrdenCompraImprimible
        ordenCompra={ordenCompra}
        puedeVerCostos={puedeVerCostos}
        onVolver={() => setVista("DIGITAL")}
      />
    )
  }

  const puedeRegistrarRecepcion =
    puedeRecibir &&
    ordenCompra.estado !== "CANCELADA" &&
    ordenCompra.estado !== "RECIBIDA_TOTAL"

  return (
    <div className="space-y-6">
      {/* ── BOTÓN VOLVER ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/proveedores"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Órdenes de Compra</span>
        </Link>

        {/* Conmutador de vista */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setVista("DIGITAL")}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Gestión Digital</span>
          </button>
          <button
            type="button"
            onClick={() => setVista("IMPRESION")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Ficha A4 (PDF)</span>
          </button>
        </div>
      </div>

      {/* ── CABECERA DE LA ORDEN ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Orden de Compra {ordenCompra.numeroFormateado}
                </h1>
                <OrdenCompraEstadoBadge estado={ordenCompra.estado} />
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Destinatario:{" "}
                <Link
                  href={`/proveedores/${ordenCompra.proveedor.id}`}
                  className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  {ordenCompra.proveedor.nombre}
                  <ExternalLink className="h-3 w-3" />
                </Link>
                {ordenCompra.proveedor.contacto && (
                  <span className="text-slate-400">
                    {" "}
                    (Contacto: {ordenCompra.proveedor.contacto})
                  </span>
                )}
              </p>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Emitida el {fechaEmision}
                </span>
                {ordenCompra.proveedor.telefono && (
                  <span>Tel: {ordenCompra.proveedor.telefono}</span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp */}
            <OrdenCompraWhatsAppButton ordenCompra={ordenCompra} />

            {/* Recibir Mercadería */}
            {puedeRegistrarRecepcion && (
              <button
                type="button"
                onClick={() => setModalRecepcion(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <Boxes className="h-4 w-4" />
                <span>Recibir Mercadería</span>
              </button>
            )}

            {/* Imprimir Ficha A4 */}
            <button
              type="button"
              onClick={() => setVista("IMPRESION")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <Printer className="h-4 w-4 text-slate-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* ── BARRA DE PROGRESO DE RECEPCIÓN ── */}
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-700">
              Estado de Recepción e Ingreso a Stock:
            </span>
            <span className="font-extrabold text-indigo-700">
              {ordenCompra.progresoRecepcion}% Completado ({ordenCompra.totalRecibidos}{" "}
              de {ordenCompra.totalItems} ítems recibidos)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                ordenCompra.progresoRecepcion === 100
                  ? "bg-emerald-500"
                  : ordenCompra.progresoRecepcion > 0
                  ? "bg-indigo-500"
                  : "bg-slate-300"
              }`}
              style={{ width: `${ordenCompra.progresoRecepcion}%` }}
            />
          </div>

          {/* Selector de estados para Administrador */}
          {puedeAdministrar && (
            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-500">Transición manual de estado:</span>
              {ordenCompra.estado === "PENDIENTE" && (
                <button
                  type="button"
                  onClick={() => handleCambiarEstado("ENVIADA")}
                  disabled={cambiandoEstado}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                >
                  <Send className="h-3 w-3 inline mr-1" />
                  Marcar como Enviada
                </button>
              )}
              {ordenCompra.estado !== "CANCELADA" &&
                ordenCompra.estado !== "RECIBIDA_TOTAL" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          "¿Estás seguro de cancelar esta orden de compra? No se registrará ingreso de stock."
                        )
                      ) {
                        handleCambiarEstado("CANCELADA")
                      }
                    }}
                    disabled={cambiandoEstado}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Ban className="h-3 w-3 inline mr-1" />
                    Cancelar Orden
                  </button>
                )}
            </div>
          )}
        </div>
      </div>

      {/* ── TABLA DE ARTÍCULOS PEDIDOS ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Artículos Solicitados ({ordenCompra.items.length})
          </h2>
          {puedeVerCostos && ordenCompra.total && (
            <div className="text-right">
              <span className="text-xs text-slate-400">Total de la Orden:</span>{" "}
              <span className="text-lg font-black text-indigo-700">
                ${ordenCompra.total.toLocaleString("es-AR")}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2.5">Insumo</th>
                <th className="px-4 py-2.5 text-center">Unidad</th>
                <th className="px-4 py-2.5 text-right">Cant. Pedida</th>
                <th className="px-4 py-2.5 text-right">Cant. Recibida</th>
                <th className="px-4 py-2.5 text-right">Saldo Pendiente</th>
                {puedeVerCostos && (
                  <>
                    <th className="px-4 py-2.5 text-right">P. Unitario</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {ordenCompra.items.map((it) => {
                const saldo = Math.max(0, it.cantidadPedida - it.cantidadRecibida)
                const estaCompleto = saldo === 0

                return (
                  <tr key={it.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>
                        <span>{it.producto?.nombre || "Insumo"}</span>
                        {it.producto?.codigo && (
                          <span className="block font-mono text-[10px] text-slate-400">
                            {it.producto.codigo}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center text-slate-500">
                      {it.producto?.unidadMedida || "u."}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {it.cantidadPedida}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {it.cantidadRecibida}
                    </td>

                    <td className="px-4 py-3 text-right font-bold">
                      {estaCompleto ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completo
                        </span>
                      ) : (
                        <span className="text-amber-600">{saldo}</span>
                      )}
                    </td>

                    {puedeVerCostos && (
                      <>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {it.precioUnitario
                            ? `$${it.precioUnitario.toLocaleString("es-AR")}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {it.subtotal
                            ? `$${it.subtotal.toLocaleString("es-AR")}`
                            : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── NOTAS Y REMITO ADJUNTO ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Observaciones */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-indigo-600" />
            Observaciones e Historial de la Orden
          </h3>
          {ordenCompra.notas ? (
            <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
              {ordenCompra.notas}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Sin observaciones registradas.
            </p>
          )}
        </div>

        {/* Remito Físico Adjunto */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4 text-indigo-600" />
            Comprobante / Foto de Remito de Recepción
          </h3>
          {ordenCompra.fotoRemito ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center">
              <img
                src={ordenCompra.fotoRemito}
                alt="Foto remito proveedor"
                className="mx-auto max-h-48 rounded-lg object-contain cursor-pointer hover:opacity-95 transition"
                onClick={() => window.open(ordenCompra.fotoRemito!, "_blank")}
                title="Hacé clic para ver en tamaño completo"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Comprobante físico archivado en sistema
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 bg-slate-50/50">
              No se adjuntó foto de remito al momento de la recepción.
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL RECEPCIÓN ── */}
      {modalRecepcion && (
        <OrdenCompraRecepcionModal
          abierto={modalRecepcion}
          ordenCompra={ordenCompra}
          puedeVerCostos={puedeVerCostos}
          onCerrar={() => setModalRecepcion(false)}
        />
      )}
    </div>
  )
}
