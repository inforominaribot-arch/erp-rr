"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Clock,
  ExternalLink,
  ChevronDown,
  Check,
  Building,
} from "lucide-react"
import { ClienteEstadoBadge } from "./cliente-estado-badge"
import { actualizarEstadoCliente } from "../actions"
import type { ICliente } from "../types"
import type { EstadoCliente } from "@/types"
import { ESTADOS_CLIENTE_ORDEN } from "../types"
import { ESTADO_CLIENTE_LABELS } from "@/types"

interface ClienteDetalleHeaderProps {
  cliente: ICliente
}

export function ClienteDetalleHeader({ cliente }: ClienteDetalleHeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [estadoActual, setEstadoActual] = useState<EstadoCliente>(cliente.estado)
  const [guardandoEstado, setGuardandoEstado] = useState(false)

  async function handleCambiarEstado(nuevoEstado: EstadoCliente) {
    setSelectorAbierto(false)
    if (nuevoEstado === estadoActual) return

    setGuardandoEstado(true)
    try {
      const res = await actualizarEstadoCliente({
        id: cliente.id,
        estado: nuevoEstado,
      })

      if (res.success) {
        setEstadoActual(nuevoEstado)
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err)
    } finally {
      setGuardandoEstado(false)
    }
  }

  function formatearFecha(f: Date | string) {
    return new Date(f).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const iniciales = cliente.nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Barra superior de navegación y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a clientes
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/clientes/${cliente.id}/editar`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Edit className="h-3.5 w-3.5" />
            Editar datos
          </Link>
        </div>
      </div>

      {/* Identidad del cliente y Estado */}
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar con iniciales */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-xs text-lg">
            {iniciales}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {cliente.nombre}
              </h1>

              {/* Selector interactivo de estado */}
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setSelectorAbierto(!selectorAbierto)}
                  disabled={guardandoEstado}
                  className="inline-flex items-center gap-1.5 rounded-full text-left"
                >
                  <ClienteEstadoBadge estado={estadoActual} />
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {selectorAbierto && (
                  <div className="absolute left-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Cambiar Estado
                    </p>
                    {ESTADOS_CLIENTE_ORDEN.map((est) => (
                      <button
                        key={est}
                        type="button"
                        onClick={() => handleCambiarEstado(est)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-2">
                          <ClienteEstadoBadge estado={est} mostrarPunto={false} />
                        </span>
                        {estadoActual === est && (
                          <Check className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Cliente desde el {formatearFecha(cliente.creadoEn)}
              </span>
              {cliente.actualizadoEn && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Última actualización: {formatearFecha(cliente.actualizadoEn)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Contacto y Ubicación */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Teléfono */}
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Phone className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 uppercase">
              Teléfono / WhatsApp
            </p>
            {cliente.telefono ? (
              <a
                href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs font-semibold text-slate-800 hover:text-indigo-600 block"
              >
                {cliente.telefono}
              </a>
            ) : (
              <p className="text-xs text-slate-400">Sin teléfono</p>
            )}
          </div>
        </div>

        {/* Correo Electrónico */}
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 uppercase">
              Correo Electrónico
            </p>
            {cliente.email ? (
              <a
                href={`mailto:${cliente.email}`}
                className="truncate text-xs font-semibold text-slate-800 hover:text-indigo-600 block"
              >
                {cliente.email}
              </a>
            ) : (
              <p className="text-xs text-slate-400">Sin email</p>
            )}
          </div>
        </div>

        {/* Dirección y Localidad */}
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 uppercase">
              Ubicación
            </p>
            <p className="truncate text-xs font-semibold text-slate-800">
              {cliente.direccion
                ? `${cliente.direccion}${cliente.localidad ? `, ${cliente.localidad}` : ""}`
                : cliente.localidad || "Sin dirección"}
            </p>
          </div>
        </div>
      </div>

      {/* Notas del cliente */}
      {cliente.notas && (
        <div className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50/50 p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Notas y especificaciones del cliente:
          </div>
          <p className="text-slate-700 whitespace-pre-wrap">{cliente.notas}</p>
        </div>
      )}
    </div>
  )
}
