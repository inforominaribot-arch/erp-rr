"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  FileText,
  User,
  Clock,
  Printer,
  Sparkles,
  Scissors,
  Truck,
  CheckCircle2,
  Check,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  PackageCheck,
  Building2,
  ExternalLink,
} from "lucide-react"
import type { IComandaDetalle, EstadoComanda, TipoItemComanda } from "../types"
import { ComandaEstadoBadge } from "./comanda-estado-badge"
import { ComandaTipoBadge } from "./comanda-tipo-badge"
import { ComandaImprimible } from "./comanda-imprimible"
import {
  cambiarEstadoComanda,
  toggleCompletadoItemComanda,
  actualizarTipoItemComanda,
  actualizarNotasComanda,
  eliminarComanda,
} from "../actions"
import { formatearPrecio } from "@/lib/utils"
import { ESTADOS_COMANDA } from "../schemas"

interface ComandaDetalleProps {
  comanda: IComandaDetalle
  puedeEditar?: boolean
  iniciarEnImpresion?: boolean
}

export function ComandaDetalle({
  comanda,
  puedeEditar = true,
  iniciarEnImpresion = false,
}: ComandaDetalleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [vistaActiva, setVistaActiva] = useState<"DIGITAL" | "FICHA_A4">(
    iniciarEnImpresion ? "FICHA_A4" : "DIGITAL"
  )

  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  // Edición rápida de notas y fecha de entrega
  const [editandoNotas, setEditandoNotas] = useState(false)
  const [notasTemp, setNotasTemp] = useState(comanda.notas || "")
  const [fechaTemp, setFechaTemp] = useState(
    comanda.fechaEntrega
      ? new Date(comanda.fechaEntrega).toISOString().split("T")[0]
      : ""
  )

  // Estado local para actualización optimista de ítems
  const [items, setItems] = useState(comanda.items)
  const [estadoComanda, setEstadoComanda] = useState<EstadoComanda>(
    comanda.estado
  )

  const numComanda = `#COM-${String(comanda.numero).padStart(4, "0")}`
  const numPresupuesto = `#PRE-${String(comanda.presupuesto.numero).padStart(
    4,
    "0"
  )}`

  const totalItems = items.length
  const itemsCompletados = items.filter((i) => i.completado).length
  const porcentaje =
    totalItems > 0 ? Math.round((itemsCompletados / totalItems) * 100) : 0
  const todosCompletados = totalItems > 0 && itemsCompletados === totalItems

  // Agrupar ítems por ambiente
  const ambientesMap = new Map<string, typeof items>()
  items.forEach((it) => {
    const amb = it.ambiente || "General"
    if (!ambientesMap.has(amb)) {
      ambientesMap.set(amb, [])
    }
    ambientesMap.get(amb)!.push(it)
  })

  // ── Handlers ──

  async function handleCambiarEstado(nuevoEstado: EstadoComanda) {
    setError(null)
    startTransition(async () => {
      const res = await cambiarEstadoComanda({
        id: comanda.id,
        estado: nuevoEstado,
      })

      if (!res.success) {
        setError(res.error || "No se pudo actualizar el estado de la comanda.")
        return
      }

      setEstadoComanda(nuevoEstado)
      setMensajeExito(`Estado actualizado a ${nuevoEstado}`)
      setTimeout(() => setMensajeExito(null), 3000)
      router.refresh()
    })
  }

  async function handleToggleCompletado(itemId: string) {
    setError(null)
    const itemActual = items.find((i) => i.id === itemId)
    if (!itemActual) return

    const nuevoValor = !itemActual.completado

    // Actualización optimista local
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, completado: nuevoValor } : i))
    )

    startTransition(async () => {
      const res = await toggleCompletadoItemComanda(itemId, nuevoValor)
      if (!res.success) {
        // Revertir
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, completado: !nuevoValor } : i
          )
        )
        setError(res.error || "No se pudo actualizar el ítem.")
        return
      }

      if (res.data?.comandaEstado) {
        setEstadoComanda(res.data.comandaEstado)
      }
      router.refresh()
    })
  }

  async function handleCambiarTipo(itemId: string, nuevoTipo: TipoItemComanda) {
    setError(null)
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, tipo: nuevoTipo } : i))
    )

    startTransition(async () => {
      const res = await actualizarTipoItemComanda(itemId, nuevoTipo)
      if (!res.success) {
        setError(res.error || "No se pudo cambiar la clasificación del ítem.")
        router.refresh()
      }
    })
  }

  async function handleGuardarNotas() {
    setError(null)
    startTransition(async () => {
      const res = await actualizarNotasComanda({
        id: comanda.id,
        notas: notasTemp,
        fechaEntrega: fechaTemp ? fechaTemp : null,
      })

      if (!res.success) {
        setError(res.error || "No se pudieron guardar las observaciones.")
        return
      }

      setEditandoNotas(false)
      setMensajeExito("Observaciones de taller guardadas")
      setTimeout(() => setMensajeExito(null), 3000)
      router.refresh()
    })
  }

  async function handleEliminarComanda() {
    if (
      !confirm(
        `¿Estás seguro de eliminar la Comanda ${numComanda}? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }

    startTransition(async () => {
      const res = await eliminarComanda(comanda.id)
      if (!res.success) {
        setError(res.error || "No se pudo eliminar la comanda.")
        return
      }

      router.push("/comandas")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* ── BARRA SUPERIOR DE ACCIONES ── */}
      <div className="no-print print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/comandas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Comandas
          </Link>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 font-mono tracking-tight">
              {numComanda}
            </h1>
            <ComandaEstadoBadge estado={estadoComanda} />
          </div>
        </div>

        {/* Conmutador de Vista y Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Conmutador Digital / A4 */}
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
              Ficha Taller A4
            </button>
          </div>

          {/* Selector de Estado Rápido */}
          <select
            value={estadoComanda}
            onChange={(e) =>
              handleCambiarEstado(e.target.value as EstadoComanda)
            }
            disabled={isPending}
            aria-label="Cambiar estado del ciclo de comanda"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs transition"
          >
            {ESTADOS_COMANDA.map((est) => (
              <option key={est} value={est}>
                {est.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {puedeEditar && (
            <button
              type="button"
              onClick={handleEliminarComanda}
              disabled={isPending}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
              title="Eliminar comanda"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {mensajeExito && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ── CUERPO: FICHA A4 O VISTA DIGITAL ── */}
      {vistaActiva === "FICHA_A4" ? (
        <ComandaImprimible
          comanda={comanda}
          onVolver={() => setVistaActiva("DIGITAL")}
        />
      ) : (
        <>
          {/* ── ALERTA DE 100% COMPLETADO / LISTO PARA INSTALAR ── */}
          {todosCompletados && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    ¡Comanda 100% Lista en Taller!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Todas las cortinas y sistemas fueron completados. Trabajo listo para coordinar instalación.
                  </p>
                </div>
              </div>
              <Link
                href="/instalaciones"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 transition shrink-0"
              >
                Ver Agenda Instalaciones
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* ── TARJETAS DE INFORMACIÓN (CLIENTE, PRESUPUESTO, FECHAS) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarjeta Cliente */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  Cliente
                </span>
                <Link
                  href={`/clientes/${comanda.presupuesto.cliente.id}`}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Ver CRM
                </Link>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  {comanda.presupuesto.cliente.nombre}
                </p>
                {comanda.presupuesto.cliente.telefono && (
                  <p className="text-xs text-slate-500">
                    Tel: {comanda.presupuesto.cliente.telefono}
                  </p>
                )}
                {comanda.presupuesto.cliente.direccion && (
                  <p className="text-xs text-slate-500">
                    {comanda.presupuesto.cliente.direccion}
                    {comanda.presupuesto.cliente.localidad
                      ? `, ${comanda.presupuesto.cliente.localidad}`
                      : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Tarjeta Presupuesto de Origen */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  Presupuesto Aprobado
                </span>
                <Link
                  href={`/presupuestos/${comanda.presupuesto.id}`}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Ver Cotización
                </Link>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-bold font-mono text-slate-900">
                  {numPresupuesto}
                </p>
                <p className="text-xs text-slate-500">
                  Total Cotizado:{" "}
                  <strong className="text-slate-800 font-mono">
                    {formatearPrecio(comanda.presupuesto.total)}
                  </strong>
                </p>
                <p className="text-xs text-slate-500">
                  Emisión:{" "}
                  {new Date(comanda.creadoEn).toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>

            {/* Tarjeta Plazos & Observaciones */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  Entrega & Taller
                </span>
                <button
                  type="button"
                  onClick={() => setEditandoNotas(!editandoNotas)}
                  className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  {editandoNotas ? "Cancelar" : "Editar"}
                </button>
              </div>

              {editandoNotas ? (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">
                      Fecha Entrega
                    </label>
                    <input
                      type="date"
                      value={fechaTemp}
                      onChange={(e) => setFechaTemp(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">
                      Observaciones Taller
                    </label>
                    <input
                      type="text"
                      value={notasTemp}
                      onChange={(e) => setNotasTemp(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-1.5 text-xs"
                      placeholder="Instrucciones para taller..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGuardarNotas}
                    disabled={isPending}
                    className="w-full rounded-lg bg-indigo-600 py-1 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700"
                  >
                    Guardar Cambios
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-slate-700">
                    Fecha de Entrega:{" "}
                    <strong>
                      {comanda.fechaEntrega
                        ? new Date(comanda.fechaEntrega).toLocaleDateString(
                            "es-AR"
                          )
                        : "A coordinar"}
                    </strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    {comanda.notas || "Sin notas adicionales para taller."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── BARRA DE PROGRESO DE PRODUCCIÓN ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Avance General de Confección & Armado
              </span>
              <span className="font-bold font-mono text-indigo-700">
                {itemsCompletados} de {totalItems} ítems completados ({porcentaje}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  todosCompletados ? "bg-emerald-500" : "bg-indigo-600"
                }`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>

          {/* ── DESGLOSE DE CORTINAS POR AMBIENTE ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Cortinas y Sistemas a Realizar ({totalItems})
              </h2>
              <span className="text-xs text-slate-400">
                Tildá cada cortina a medida que se termine en taller
              </span>
            </div>

            {Array.from(ambientesMap.entries()).map(([ambiente, itemsAmb]) => (
              <div
                key={ambiente}
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
              >
                {/* Cabecera del Ambiente */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {ambiente}
                    </span>
                    <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {itemsAmb.length} cortinas
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {itemsAmb.filter((i) => i.completado).length}/
                    {itemsAmb.length} listas
                  </span>
                </div>

                {/* Lista de Ítems del Ambiente */}
                <div className="divide-y divide-slate-100">
                  {itemsAmb.map((it) => {
                    const c = it.caracteristicas

                    return (
                      <div
                        key={it.id}
                        className={`p-4 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                          it.completado ? "bg-emerald-50/20" : "hover:bg-slate-50/50"
                        }`}
                      >
                        {/* Checkbox táctil y datos principales */}
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCompletado(it.id)}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                              it.completado
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "border-slate-300 bg-white hover:border-indigo-400"
                            }`}
                            title={
                              it.completado
                                ? "Marcar como pendiente"
                                : "Marcar como terminado"
                            }
                          >
                            {it.completado && <Check className="h-4 w-4" />}
                          </button>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-sm font-bold ${
                                  it.completado
                                    ? "line-through text-slate-400"
                                    : "text-slate-900"
                                }`}
                              >
                                {it.descripcion}
                              </span>
                              <ComandaTipoBadge tipo={it.tipo} tamano="sm" />
                            </div>

                            {/* Medidas destacadas */}
                            <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-800">
                              <span>
                                {it.ancho}m ancho × {it.alto}m alto
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-indigo-600">
                                Cantidad: {it.cantidad}
                              </span>
                            </div>

                            {/* Especificaciones Técnicas */}
                            {c && (
                              <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 space-y-1">
                                {c.tipo && (
                                  <div>
                                    <span className="text-slate-400 font-semibold">
                                      Sistema:
                                    </span>{" "}
                                    <strong>{c.tipo}</strong>
                                    {c.sistema && ` — ${c.sistema}`}
                                    {c.colorBarral && ` (${c.colorBarral})`}
                                  </div>
                                )}

                                {c.gaza?.activa && (
                                  <div>
                                    <span className="text-slate-400 font-semibold">
                                      Gaza:
                                    </span>{" "}
                                    <strong>
                                      {c.gaza.nombreTela || "Tela"}
                                    </strong>{" "}
                                    ({c.gaza.panos}{" "}
                                    {c.gaza.panos === 1 ? "paño" : "paños"}
                                    {c.gaza.anchosPanos?.length > 0 &&
                                      ` • [${c.gaza.anchosPanos.join("m, ")}m]`}
                                    )
                                  </div>
                                )}

                                {c.bo?.activa && (
                                  <div>
                                    <span className="text-slate-400 font-semibold">
                                      Black Out:
                                    </span>{" "}
                                    <strong>
                                      {c.bo.nombreTela || "B.O."}
                                    </strong>{" "}
                                    ({c.bo.tramos}{" "}
                                    {c.bo.tramos === 1 ? "tramo" : "tramos"}
                                    {c.bo.anchosTramos?.length > 0 &&
                                      ` • [${c.bo.anchosTramos.join("m, ")}m]`}
                                    )
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-500 pt-0.5">
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
                                  {c.perfileria && (
                                    <span>
                                      Perfilería: <strong>{c.perfileria}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {it.observaciones && (
                              <p className="text-xs text-indigo-700 bg-indigo-50/60 rounded-lg p-2 mt-1">
                                <strong>Nota Taller:</strong> {it.observaciones}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción rápida por ítem */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          {/* Conmutador FABRICAR / PEDIR PROVEEDOR */}
                          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleCambiarTipo(it.id, "FABRICAR")
                              }
                              className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                                it.tipo === "FABRICAR"
                                  ? "bg-indigo-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Fabricar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCambiarTipo(it.id, "PEDIR_PROVEEDOR")
                              }
                              className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                                it.tipo === "PEDIR_PROVEEDOR"
                                  ? "bg-amber-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Proveedor
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
