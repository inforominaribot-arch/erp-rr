"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Factory,
  Scissors,
  Truck,
  CheckCircle2,
  Check,
  Calendar,
  Search,
  Filter,
  PackageCheck,
  Clock,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from "lucide-react"
import type { IItemProduccion, IMetricasProduccion, TipoItemComanda } from "../types"
import { ComandaEstadoBadge } from "./comanda-estado-badge"
import { ComandaTipoBadge } from "./comanda-tipo-badge"
import { toggleCompletadoItemComanda, actualizarTipoItemComanda } from "../actions"

interface ProduccionTableroProps {
  itemsIniciales: IItemProduccion[]
  metricasIniciales: IMetricasProduccion
  puedeGestionar?: boolean
}

export function ProduccionTablero({
  itemsIniciales,
  metricasIniciales,
  puedeGestionar = true,
}: ProduccionTableroProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filtros
  const [tabTipo, setTabTipo] = useState<"TODOS" | "FABRICAR" | "PEDIR_PROVEEDOR">("FABRICAR")
  const [filtroEstado, setFiltroEstado] = useState<"PENDIENTES" | "TODOS">("PENDIENTES")
  const [busqueda, setBusqueda] = useState("")

  // Optimistic updates
  const [items, setItems] = useState<IItemProduccion[]>(itemsIniciales)
  const [avisoListo, setAvisoListo] = useState<string | null>(null)

  // Filtrado reactivo en cliente
  const itemsFiltrados = useMemo(() => {
    return items.filter((it) => {
      // Filtro por tab tipo
      if (tabTipo !== "TODOS" && it.tipo !== tabTipo) {
        return false
      }

      // Filtro completados
      if (filtroEstado === "PENDIENTES" && it.completado) {
        return false
      }

      // Filtro texto
      if (busqueda.trim() !== "") {
        const query = busqueda.toLowerCase().trim()
        const matchCliente = it.clienteNombre.toLowerCase().includes(query)
        const matchAmbiente = it.ambiente.toLowerCase().includes(query)
        const matchDescripcion = it.descripcion.toLowerCase().includes(query)
        const matchNumComanda = String(it.comandaNumero).includes(query)
        const matchTelaGaza =
          it.caracteristicas?.gaza?.nombreTela?.toLowerCase().includes(query) ?? false
        const matchTelaBo =
          it.caracteristicas?.bo?.nombreTela?.toLowerCase().includes(query) ?? false

        return (
          matchCliente ||
          matchAmbiente ||
          matchDescripcion ||
          matchNumComanda ||
          matchTelaGaza ||
          matchTelaBo
        )
      }

      return true
    })
  }, [items, tabTipo, filtroEstado, busqueda])

  // Handlers
  async function handleToggle(itemId: string) {
    const itemActual = items.find((i) => i.id === itemId)
    if (!itemActual) return

    const nuevoValor = !itemActual.completado

    // Actualización optimista
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, completado: nuevoValor } : i))
    )

    startTransition(async () => {
      const res = await toggleCompletadoItemComanda(itemId, nuevoValor)
      if (!res.success) {
        // Revertir si falla
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, completado: !nuevoValor } : i))
        )
        return
      }

      if (res.data?.comandaEstado === "LISTO_PARA_INSTALAR") {
        setAvisoListo(
          `¡Comanda #${itemActual.comandaNumero} completada al 100%! Pasa a Lista para Instalar.`
        )
        setTimeout(() => setAvisoListo(null), 5000)
      }

      router.refresh()
    })
  }

  async function handleCambiarTipo(itemId: string, nuevoTipo: TipoItemComanda) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, tipo: nuevoTipo } : i))
    )

    startTransition(async () => {
      await actualizarTipoItemComanda(itemId, nuevoTipo)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* ── ALERTA DE COMANDA COMPLETADA AUTOMÁTICAMENTE ── */}
      {avisoListo && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">
              ¡Trabajo Terminado en Taller!
            </h4>
            <p className="text-xs text-emerald-800">{avisoListo}</p>
          </div>
        </div>
      )}

      {/* ── KPIs OPERATIVOS DE TALLER ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* A Confeccionar en Taller */}
        <div
          onClick={() => {
            setTabTipo("FABRICAR")
            setFiltroEstado("PENDIENTES")
          }}
          className={`cursor-pointer rounded-2xl border p-4 shadow-xs transition ${
            tabTipo === "FABRICAR"
              ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Corte & Confección
            </span>
            <Scissors className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-950 font-mono">
            {metricasIniciales.itemsFabricarPendientes}
          </p>
          <span className="text-[11px] text-indigo-600/80">
            Pendientes en taller
          </span>
        </div>

        {/* Esperando Proveedor */}
        <div
          onClick={() => {
            setTabTipo("PEDIR_PROVEEDOR")
            setFiltroEstado("PENDIENTES")
          }}
          className={`cursor-pointer rounded-2xl border p-4 shadow-xs transition ${
            tabTipo === "PEDIR_PROVEEDOR"
              ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-200"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pedidos a Proveedor
            </span>
            <Truck className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-950 font-mono">
            {metricasIniciales.itemsProveedorPendientes}
          </p>
          <span className="text-[11px] text-amber-700/80">
            Por encargo / sistemas
          </span>
        </div>

        {/* Total Pendientes */}
        <div
          onClick={() => {
            setTabTipo("TODOS")
            setFiltroEstado("PENDIENTES")
          }}
          className={`cursor-pointer rounded-2xl border p-4 shadow-xs transition ${
            tabTipo === "TODOS" && filtroEstado === "PENDIENTES"
              ? "border-slate-500 bg-slate-100 ring-2 ring-slate-200"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Pendientes
            </span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 font-mono">
            {metricasIniciales.itemsPendientes}
          </p>
          <span className="text-[11px] text-slate-400">
            De {metricasIniciales.totalItems} cortinas activas
          </span>
        </div>

        {/* Completados / Progreso */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Avance General
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-950 font-mono">
            {metricasIniciales.porcentajeCompletado}%
          </p>
          <span className="text-[11px] text-emerald-700/80">
            {metricasIniciales.itemsCompletados} terminados
          </span>
        </div>
      </div>

      {/* ── BARRA DE TABS, BUSCADOR Y TOGGLE DE PENDIENTES ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Tabs de Tipo de Tarea */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setTabTipo("FABRICAR")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              tabTipo === "FABRICAR"
                ? "bg-white text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Confeccionar en Taller ({metricasIniciales.itemsFabricarPendientes})
          </button>
          <button
            type="button"
            onClick={() => setTabTipo("PEDIR_PROVEEDOR")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              tabTipo === "PEDIR_PROVEEDOR"
                ? "bg-white text-amber-800 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            Pedidos a Proveedor ({metricasIniciales.itemsProveedorPendientes})
          </button>
          <button
            type="button"
            onClick={() => setTabTipo("TODOS")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              tabTipo === "TODOS"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todos ({items.length})
          </button>
        </div>

        {/* Buscador reactivo y Filtro completados */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, ambiente, tela, comanda #..."
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs transition"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setFiltroEstado(
                filtroEstado === "PENDIENTES" ? "TODOS" : "PENDIENTES"
              )
            }
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              filtroEstado === "PENDIENTES"
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {filtroEstado === "PENDIENTES" ? "Solo Pendientes" : "Ver Todos"}
          </button>
        </div>
      </div>

      {/* ── GRILLA DE TARJETAS TÁCTILES DE PRODUCCIÓN ── */}
      {itemsFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Factory className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">
            No hay trabajos en este listado
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {busqueda || filtroEstado === "PENDIENTES"
              ? "No hay tareas pendientes que coincidan con la búsqueda o filtro."
              : "No hay órdenes de confección activas en el taller actualmente."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {itemsFiltrados.map((it) => {
            const numComanda = `#COM-${String(it.comandaNumero).padStart(
              4,
              "0"
            )}`
            const c = it.caracteristicas

            return (
              <div
                key={it.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 ${
                  it.completado
                    ? "border-emerald-200 bg-emerald-50/20 opacity-80"
                    : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <div>
                  {/* Fila superior: Comanda, Cliente y Fecha */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/comandas/${it.comandaId}`}
                          className="font-mono text-xs font-black text-indigo-600 hover:underline"
                        >
                          {numComanda}
                        </Link>
                        <ComandaEstadoBadge
                          estado={it.comandaEstado}
                          tamano="sm"
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1">
                        {it.clienteNombre}
                      </div>
                    </div>

                    {it.fechaEntrega ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(it.fechaEntrega).toLocaleDateString("es-AR")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Sin fecha límite
                      </span>
                    )}
                  </div>

                  {/* Cuerpo: Ambiente & Cortina */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                        {it.ambiente}
                      </span>
                      <ComandaTipoBadge tipo={it.tipo} tamano="sm" />
                    </div>

                    <h4
                      className={`mt-1.5 text-sm font-bold ${
                        it.completado
                          ? "line-through text-slate-400"
                          : "text-slate-900"
                      }`}
                    >
                      {it.descripcion}
                    </h4>

                    {/* Medidas destacadas en grande para corte */}
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 px-3.5 py-2 text-white shadow-2xs font-mono">
                      <div className="text-xs">
                        <span className="text-slate-400 text-[10px] uppercase font-sans font-bold block">
                          Medida Exacta
                        </span>
                        <span className="font-bold text-sm tracking-tight">
                          {it.ancho}m × {it.alto}m
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase font-sans font-bold block">
                          Cantidad
                        </span>
                        <span className="font-bold text-sm text-indigo-300">
                          {it.cantidad} {it.cantidad === 1 ? "unidad" : "unidades"}
                        </span>
                      </div>
                    </div>

                    {/* Especificaciones técnicas de taller */}
                    {c && (
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs text-slate-700 space-y-1">
                        {c.tipo && (
                          <div className="font-semibold text-slate-900">
                            {c.tipo} {c.sistema && `(${c.sistema})`}
                            {c.colorBarral && ` • Barral: ${c.colorBarral}`}
                          </div>
                        )}

                        {c.gaza?.activa && (
                          <div className="text-[11px] text-slate-800">
                            • <strong>Gaza:</strong>{" "}
                            {c.gaza.nombreTela || "Gaza"} — {c.gaza.panos}{" "}
                            {c.gaza.panos === 1 ? "paño" : "paños"}
                            {c.gaza.anchosPanos?.length > 0 &&
                              ` [${c.gaza.anchosPanos.join("m, ")}m]`}
                          </div>
                        )}

                        {c.bo?.activa && (
                          <div className="text-[11px] text-slate-800">
                            • <strong>Black Out:</strong>{" "}
                            {c.bo.nombreTela || "B.O."} — {c.bo.tramos}{" "}
                            {c.bo.tramos === 1 ? "tramo" : "tramos"}
                            {c.bo.anchosTramos?.length > 0 &&
                              ` [${c.bo.anchosTramos.join("m, ")}m]`}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-500 pt-0.5">
                          {c.mando && <span>Mando: {c.mando}</span>}
                          {c.caida && <span>Caída: {c.caida}</span>}
                          {c.sujecion && <span>Sujeción: {c.sujecion}</span>}
                          {c.perfileria && (
                            <span>Perfilería: {c.perfileria}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {it.observaciones && (
                      <div className="mt-2 rounded-lg bg-indigo-50/60 p-2 text-[11px] text-indigo-900 font-medium">
                        <strong>Nota:</strong> {it.observaciones}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── BOTÓN TÁCTIL GRANDE DE UN TOQUE ── */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Selector rápido FABRICAR vs PROVEEDOR */}
                  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleCambiarTipo(it.id, "FABRICAR")}
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        it.tipo === "FABRICAR"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      Taller
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCambiarTipo(it.id, "PEDIR_PROVEEDOR")
                      }
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        it.tipo === "PEDIR_PROVEEDOR"
                          ? "bg-amber-600 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      Proveedor
                    </button>
                  </div>

                  {/* Botón Táctil de Completado */}
                  <button
                    type="button"
                    onClick={() => handleToggle(it.id)}
                    disabled={isPending}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition active:scale-95 ${
                      it.completado
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    {it.completado ? "Terminado ✓" : "Marcar Listo"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
