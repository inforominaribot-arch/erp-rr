"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Clock, Loader2, ShoppingCart, Truck } from "lucide-react"
import type { EstadoPedidoProveedor, IPedidoProveedor, IProveedorPedido } from "../types"
import { actualizarPedidoProveedor } from "../actions"
import { calcularDemora } from "../lib/pedidos-proveedor"

const PASOS: { estado: EstadoPedidoProveedor; label: string; icono: typeof Clock; activo: string }[] = [
  { estado: "PENDIENTE_PEDIDO", label: "Por pedir", icono: ShoppingCart, activo: "bg-orange-500 text-white border-orange-500" },
  { estado: "PEDIDO_REALIZADO", label: "Pedido", icono: Truck, activo: "bg-sky-600 text-white border-sky-600" },
  { estado: "PEDIDO_RECIBIDO", label: "Recibido", icono: CheckCircle2, activo: "bg-emerald-600 text-white border-emerald-600" },
]

const fmtFecha = (iso: string | Date | null) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : ""

interface PedidosProveedorPanelProps {
  pedidos: IPedidoProveedor[]
  proveedores: IProveedorPedido[]
  puedeEditar?: boolean
  compacto?: boolean
}

/** Estados de pedido a proveedor por capa (Por pedir → Pedido → Recibido). */
export function PedidosProveedorPanel({
  pedidos,
  proveedores,
  puedeEditar = true,
  compacto = false,
}: PedidosProveedorPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [locales, setLocales] = useState<IPedidoProveedor[]>(pedidos)
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Si llegan datos nuevos del servidor, reemplazar
  const [firma, setFirma] = useState(JSON.stringify(pedidos))
  if (JSON.stringify(pedidos) !== firma) {
    setFirma(JSON.stringify(pedidos))
    setLocales(pedidos)
  }

  function guardar(p: IPedidoProveedor, cambios: Partial<Pick<IPedidoProveedor, "estado" | "proveedorId" | "nota">>) {
    const ahora = new Date().toISOString()
    const nuevo: IPedidoProveedor = { ...p, ...cambios }
    if (cambios.estado) {
      nuevo.fechaPedido = cambios.estado === "PENDIENTE_PEDIDO" ? null : p.fechaPedido ?? ahora
      nuevo.fechaRecibido = cambios.estado === "PEDIDO_RECIBIDO" ? ahora : null
    }
    if (cambios.proveedorId !== undefined) {
      const prov = proveedores.find((x) => x.id === cambios.proveedorId)
      nuevo.proveedorNombre = prov?.nombre ?? null
      nuevo.diasEntrega = prov?.diasEntrega ?? null
    }
    setLocales((prev) => prev.map((x) => (x.id === p.id ? nuevo : x)))
    setGuardandoId(p.id)
    setError(null)

    startTransition(async () => {
      const res = await actualizarPedidoProveedor({
        pedidoId: p.id,
        estado: nuevo.estado,
        ...(cambios.proveedorId !== undefined ? { proveedorId: cambios.proveedorId } : {}),
        ...(cambios.nota !== undefined ? { nota: cambios.nota } : {}),
      })
      setGuardandoId(null)
      if (!res.success) {
        setLocales((prev) => prev.map((x) => (x.id === p.id ? p : x)))
        setError(res.error || "No se pudo guardar")
        return
      }
      router.refresh()
    })
  }

  if (locales.length === 0) return null

  return (
    <div className="space-y-2">
      {locales.map((p) => {
        const { fechaEsperada, demorado, diasTranscurridos } = calcularDemora(
          p.estado,
          p.fechaPedido,
          p.diasEntrega
        )
        // Si el proveedor sugerido no provee la marca, igual se muestra en la lista
        const opciones = proveedores
        return (
          <div
            key={p.id}
            className={`rounded-xl border p-2.5 text-xs ${
              demorado
                ? "border-red-300 bg-red-50"
                : p.estado === "PEDIDO_RECIBIDO"
                ? "border-emerald-200 bg-emerald-50/50"
                : p.estado === "PEDIDO_REALIZADO"
                ? "border-sky-200 bg-sky-50/50"
                : "border-orange-200 bg-orange-50/50"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900">
                {p.etiqueta.replace("Gaza", "Gasa")}
                {p.marca && (
                  <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {p.marca}
                  </span>
                )}
              </span>
              {guardandoId === p.id && isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              )}
            </div>

            {/* Proveedor */}
            <div className="mt-1.5">
              {puedeEditar ? (
                <select
                  value={p.proveedorId ?? ""}
                  onChange={(e) => guardar(p, { proveedorId: e.target.value || null })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 min-h-[36px]"
                >
                  <option value="">— Elegir proveedor —</option>
                  {opciones.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre}
                      {prov.marcas.length > 0 ? ` (${prov.marcas.join(", ")})` : ""}
                      {prov.diasEntrega ? ` • ${prov.diasEntrega} días` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-slate-700">
                  Proveedor: {p.proveedorNombre || "Sin asignar"}
                </span>
              )}
            </div>

            {/* Estados */}
            <div className="mt-2 grid grid-cols-3 gap-1">
              {PASOS.map((paso) => {
                const activo = p.estado === paso.estado
                const Icono = paso.icono
                return (
                  <button
                    key={paso.estado}
                    type="button"
                    disabled={!puedeEditar || activo}
                    onClick={() => guardar(p, { estado: paso.estado })}
                    className={`inline-flex items-center justify-center gap-1 rounded-lg border px-1.5 ${
                      compacto ? "py-1 min-h-[32px]" : "py-1.5 min-h-[40px]"
                    } text-[11px] font-bold transition ${
                      activo
                        ? paso.activo
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-60"
                    }`}
                  >
                    <Icono className="h-3.5 w-3.5 shrink-0" />
                    {paso.label}
                  </button>
                )
              })}
            </div>

            {/* Fechas y demora */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
              {p.fechaPedido && <span>Pedido: <strong>{fmtFecha(p.fechaPedido)}</strong></span>}
              {fechaEsperada && p.estado === "PEDIDO_REALIZADO" && (
                <span>Esperado: <strong>{fmtFecha(fechaEsperada)}</strong></span>
              )}
              {p.fechaRecibido && <span>Recibido: <strong>{fmtFecha(p.fechaRecibido)}</strong></span>}
              {p.estado === "PEDIDO_REALIZADO" && !p.diasEntrega && p.proveedorId && (
                <span className="text-slate-400">(el proveedor no tiene días de entrega cargados)</span>
              )}
            </div>
            {demorado && (
              <div className="mt-1.5 flex items-center gap-1 font-bold text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Demorado: {diasTranscurridos} días desde el pedido (esperado: {p.diasEntrega})
              </div>
            )}

            {/* Nota (n° de pedido, etc.) */}
            {puedeEditar && p.estado !== "PENDIENTE_PEDIDO" && (
              <input
                type="text"
                defaultValue={p.nota ?? ""}
                placeholder="Nota: n° de pedido, fecha prometida..."
                onBlur={(e) => {
                  if ((e.target.value.trim() || null) !== (p.nota || null)) {
                    guardar(p, { nota: e.target.value })
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400"
              />
            )}
            {!puedeEditar && p.nota && (
              <div className="mt-1 text-[11px] text-slate-600">Nota: {p.nota}</div>
            )}
          </div>
        )
      })}
      {error && <div className="text-[11px] font-semibold text-red-700">{error}</div>}
    </div>
  )
}
