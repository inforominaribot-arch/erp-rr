"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  MapPin,
  Sparkles,
  FileText,
  AlertCircle,
  PackageCheck,
  Loader2,
  Plus,
} from "lucide-react"
import type { IPresupuestoDetalle, IAmbientePresupuestoGrupo } from "../types"
import {
  formatearNumeroPresupuesto,
  calcularDiasRestantesValidez,
} from "../types"
import { PresupuestoEstadoBadge } from "./presupuesto-estado-badge"
import { PresupuestoWhatsappButton } from "./presupuesto-whatsapp-button"
import { PresupuestoAprobarModal } from "./presupuesto-aprobar-modal"
import { PresupuestoImprimible } from "./presupuesto-imprimible"
import { ComandaGenerarModal } from "@/modules/comandas/components/comanda-generar-modal"
import type { IPresupuestoAceptadoResumen } from "@/modules/comandas/types"
import { eliminarPresupuesto } from "../actions"
import { formatearPrecio, formatearFecha } from "@/lib/utils"

interface PresupuestoDetalleProps {
  presupuesto: IPresupuestoDetalle
  puedeEditar?: boolean
}

export function PresupuestoDetalle({
  presupuesto,
  puedeEditar = true,
}: PresupuestoDetalleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [vistaActiva, setVistaActiva] = useState<"DIGITAL" | "FICHA_A4">("DIGITAL")
  const [mostrarModalAprobar, setMostrarModalAprobar] = useState(false)
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [mostrarModalComanda, setMostrarModalComanda] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const presupuestosParaComanda = useMemo<IPresupuestoAceptadoResumen[]>(() => {
    const itemsFiltrados =
      presupuesto.estado === "ACEPTADO_TOTAL"
        ? presupuesto.items
        : presupuesto.items.filter((it) => it.aceptado)

    return [
      {
        id: presupuesto.id,
        numero: presupuesto.numero,
        estado: presupuesto.estado,
        total: presupuesto.total,
        creadoEn: new Date(presupuesto.creadoEn),
        cliente: {
          id: presupuesto.cliente.id,
          nombre: presupuesto.cliente.nombre,
          telefono: presupuesto.cliente.telefono,
          direccion: presupuesto.cliente.direccion,
          localidad: presupuesto.cliente.localidad,
        },
        itemsAceptados: itemsFiltrados.map((it) => ({
          id: it.id,
          itemMedicionId: it.itemMedicionId,
          descripcion: it.descripcion,
          ambiente: it.ambiente || "General",
          ancho: it.ancho,
          alto: it.alto,
          cantidad: it.cantidad,
          caracteristicas: null,
        })),
      },
    ]
  }, [presupuesto])

  const numPresupuesto = formatearNumeroPresupuesto(presupuesto.numero)
  const { diasRestantes, vencido } = calcularDiasRestantesValidez(
    presupuesto.creadoEn,
    presupuesto.validezDias
  )

  // Agrupar items por ambiente
  const gruposAmbientes = presupuesto.items.reduce<
    Record<string, IAmbientePresupuestoGrupo>
  >((acc, it) => {
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
  }, {})

  const listaAmbientes = Object.values(gruposAmbientes)
  const totalCortinas = presupuesto.items.reduce((acc, it) => acc + it.cantidad, 0)

  async function handleConfirmarEliminar() {
    setErrorEliminar(null)
    startTransition(async () => {
      const res = await eliminarPresupuesto(presupuesto.id)
      if (!res.success) {
        setErrorEliminar(res.error || "No se pudo eliminar el presupuesto.")
        return
      }
      router.push("/presupuestos")
    })
  }

  return (
    <div className="space-y-6">
      {/* ── BARRA SUPERIOR DE ACCIONES (No se imprime) ── */}
      <div className="no-print print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/presupuestos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Listado
          </Link>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 font-mono tracking-tight">
              {numPresupuesto}
            </h1>
            <PresupuestoEstadoBadge estado={presupuesto.estado} />
          </div>
        </div>

        {/* Selector de Vista & Botones de Acción */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Vista */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setVistaActiva("DIGITAL")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                vistaActiva === "DIGITAL"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Gestión Digital
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva("FICHA_A4")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                vistaActiva === "FICHA_A4"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Ficha Cotización A4
            </button>
          </div>

          <PresupuestoWhatsappButton presupuesto={presupuesto} />

          {puedeEditar && (
            <>
              {/* Botón Gestión de Estado y Aprobación */}
              <button
                type="button"
                onClick={() => setMostrarModalAprobar(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                Cambiar Estado / Aprobar
              </button>

              {/* Botón Editar */}
              <Link
                href={`/presupuestos/${presupuesto.id}/editar`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                Editar
              </Link>

              {/* Botón Eliminar */}
              <button
                type="button"
                onClick={() => setMostrarModalEliminar(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
                title="Eliminar presupuesto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── CUERPO: VISTA IMPRIMIBLE A4 O VISTA DIGITAL ── */}
      {vistaActiva === "FICHA_A4" ? (
        <PresupuestoImprimible
          presupuesto={presupuesto}
          onVolver={() => setVistaActiva("DIGITAL")}
        />
      ) : (
        <>
          {/* ── ALERTA DE PASE A COMANDA DE PRODUCCIÓN ── */}
          {(presupuesto.estado === "ACEPTADO_TOTAL" ||
            presupuesto.estado === "ACEPTADO_PARCIAL") && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Presupuesto Aceptado (
                    {presupuesto.estado === "ACEPTADO_TOTAL"
                      ? "Total"
                      : "Parcial"}
                    )
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {presupuesto.comanda
                      ? `Comanda de producción #${presupuesto.comanda.numero} generada con éxito.`
                      : "Listo para el pase automático a Comanda de Producción en taller."}
                  </p>
                </div>
              </div>

              {presupuesto.comanda ? (
                <Link
                  href={`/comandas/${presupuesto.comanda.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 transition"
                >
                  Ver Comanda #{presupuesto.comanda.numero}
                </Link>
              ) : (
                puedeEditar && (
                  <button
                    type="button"
                    onClick={() => setMostrarModalComanda(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Generar Comanda de Trabajo
                  </button>
                )
              )}
            </div>
          )}

          {/* ── TARJETAS DE INFORMACIÓN GENERAL ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cliente */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  Cliente
                </span>
                <Link
                  href={`/clientes/${presupuesto.clienteId}`}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Ver ficha CRM
                </Link>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p className="text-base font-bold text-slate-900">
                  {presupuesto.cliente.nombre}
                </p>
                <p className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {presupuesto.cliente.telefono || "Sin teléfono"}
                </p>
                <p className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {presupuesto.cliente.direccion
                    ? `${presupuesto.cliente.direccion}${presupuesto.cliente.localidad ? `, ${presupuesto.cliente.localidad}` : ""}`
                    : "Santa Fe"}
                </p>
              </div>
            </div>

            {/* Fechas y Validez */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  Vigencia Comercial
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    vencido
                      ? "bg-rose-100 text-rose-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {vencido ? "Vencido" : `${diasRestantes} días restantes`}
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <p>
                  <strong>Emisión:</strong> {formatearFecha(presupuesto.creadoEn)}
                </p>
                <p>
                  <strong>Plazo de validez:</strong> {presupuesto.validezDias} días
                </p>
                <p>
                  <strong>Total cortinas:</strong> {totalCortinas} unidades en{" "}
                  {listaAmbientes.length} ambiente(s)
                </p>
              </div>
            </div>

            {/* Resumen Financiero */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-3">
                Liquidación
              </span>
              <div className="mt-3 space-y-1 text-xs">
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
                <div className="flex justify-between items-baseline border-t border-slate-200 pt-2 mt-2">
                  <span className="font-bold text-slate-900 text-sm">Total:</span>
                  <span className="text-xl font-black text-indigo-950 font-mono">
                    {formatearPrecio(presupuesto.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── DETALLE DE CORTINAS AGRUPADO POR AMBIENTE ── */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              Desglose de Cortinas y Ambientes
            </h2>

            {listaAmbientes.map((grupo) => (
              <div
                key={grupo.ambiente}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Ambiente: {grupo.ambiente}
                  </span>
                  <span className="text-xs font-bold text-indigo-900 font-mono">
                    Subtotal Ambiente: {formatearPrecio(grupo.subtotalAmbiente)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-4 font-bold">
                          Descripción del Producto
                        </th>
                        <th className="py-2.5 px-4 font-bold text-center w-28">
                          Medidas (m)
                        </th>
                        <th className="py-2.5 px-4 font-bold text-center w-20">
                          Cant.
                        </th>
                        <th className="py-2.5 px-4 font-bold text-right w-36">
                          Precio Unitario
                        </th>
                        <th className="py-2.5 px-4 font-bold text-right w-36">
                          Subtotal
                        </th>
                        {presupuesto.estado === "ACEPTADO_PARCIAL" && (
                          <th className="py-2.5 px-4 font-bold text-center w-28">
                            Aprobación
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grupo.items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {it.descripcion}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600 font-mono font-medium">
                            {it.ancho > 0 && it.alto > 0
                              ? `${it.ancho.toFixed(2)} × ${it.alto.toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {it.cantidad}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700 font-mono">
                            {formatearPrecio(it.precioUnitario)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatearPrecio(it.subtotal)}
                          </td>
                          {presupuesto.estado === "ACEPTADO_PARCIAL" && (
                            <td className="py-3 px-4 text-center">
                              {it.aceptado ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" /> Aprobada
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                  No aprobada
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* ── NOTAS Y CONDICIONES ── */}
          {presupuesto.notas && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Notas y Condiciones Registradas
              </span>
              <p className="whitespace-pre-line text-xs text-slate-700">
                {presupuesto.notas}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── MODAL CAMBIO DE ESTADO & APROBACIÓN PARCIAL ── */}
      {mostrarModalAprobar && (
        <PresupuestoAprobarModal
          abierto={mostrarModalAprobar}
          onCerrar={() => setMostrarModalAprobar(false)}
          presupuesto={presupuesto}
        />
      )}

      {/* ── MODAL CONFIRMACIÓN ELIMINAR ── */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              ¿Eliminar Presupuesto {numPresupuesto}?
            </h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Esta acción eliminará el presupuesto y todas sus cortinas cotizadas.
              No se puede deshacer.
            </p>

            {errorEliminar && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorEliminar}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMostrarModalEliminar(false)}
                disabled={isPending}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL GENERAR COMANDA ── */}
      {mostrarModalComanda && (
        <ComandaGenerarModal
          abierto={mostrarModalComanda}
          onCerrar={() => {
            setMostrarModalComanda(false)
            router.refresh()
          }}
          presupuestosAceptados={presupuestosParaComanda}
          presupuestoPreseleccionadoId={presupuesto.id}
        />
      )}
    </div>
  )
}
