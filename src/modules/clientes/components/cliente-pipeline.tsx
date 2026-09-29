"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  ChevronLeft,
  Phone,
  MapPin,
  FileText,
  Ruler,
  Clock,
  Loader2,
  ExternalLink,
  MoreVertical,
} from "lucide-react"
import { actualizarEstadoCliente } from "../actions"
import type { IColumnaKanban, IClienteConConteo } from "../types"
import type { EstadoCliente } from "@/types"
import { ESTADOS_CLIENTE_ORDEN, ESTADO_CLIENTE_COLORES } from "../types"
import { ESTADO_CLIENTE_LABELS } from "@/types"

interface ClientePipelineProps {
  columnasIniciales: IColumnaKanban[]
}

export function ClientePipeline({ columnasIniciales }: ClientePipelineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actualizandoId, setActualizandoId] = useState<string | null>(null)
  const [columnas, setColumnas] = useState<IColumnaKanban[]>(columnasIniciales)

  async function handleCambiarEstado(
    clienteId: string,
    nuevoEstado: EstadoCliente
  ) {
    setActualizandoId(clienteId)

    try {
      const res = await actualizarEstadoCliente({
        id: clienteId,
        estado: nuevoEstado,
      })

      if (res.success) {
        // Actualizar estado localmente para feedback inmediato
        setColumnas((prevColumnas) => {
          let clienteMovido: IClienteConConteo | null = null

          // Remover de la columna actual
          const sinCliente = prevColumnas.map((col) => {
            const index = col.clientes.findIndex((c) => c.id === clienteId)
            if (index !== -1) {
              clienteMovido = {
                ...col.clientes[index],
                estado: nuevoEstado,
              }
              return {
                ...col,
                clientes: col.clientes.filter((c) => c.id !== clienteId),
              }
            }
            return col
          })

          if (!clienteMovido) return prevColumnas

          // Añadir a la nueva columna
          return sinCliente.map((col) => {
            if (col.estado === nuevoEstado) {
              return {
                ...col,
                clientes: [clienteMovido!, ...col.clientes],
              }
            }
            return col
          })
        })

        startTransition(() => {
          router.refresh()
        })
      }
    } catch (err) {
      console.error("Error al mover cliente en pipeline:", err)
    } finally {
      setActualizandoId(null)
    }
  }

  function getSiguienteEstado(actual: EstadoCliente): EstadoCliente | null {
    const idx = ESTADOS_CLIENTE_ORDEN.indexOf(actual)
    if (idx !== -1 && idx < ESTADOS_CLIENTE_ORDEN.length - 1) {
      return ESTADOS_CLIENTE_ORDEN[idx + 1]
    }
    return null
  }

  function getAnteriorEstado(actual: EstadoCliente): EstadoCliente | null {
    const idx = ESTADOS_CLIENTE_ORDEN.indexOf(actual)
    if (idx > 0) {
      return ESTADOS_CLIENTE_ORDEN[idx - 1]
    }
    return null
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
      {columnas.map((columna) => {
        const colores = ESTADO_CLIENTE_COLORES[columna.estado]
        const label = ESTADO_CLIENTE_LABELS[columna.estado]

        return (
          <div
            key={columna.estado}
            className="flex w-80 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-100/70 p-3 shadow-xs"
          >
            {/* Cabecera de Columna */}
            <div className="mb-3 flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${colores.dot}`}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-slate-800">
                  {label}
                </h3>
              </div>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-600">
                {columna.clientes.length}
              </span>
            </div>

            {/* Lista de Tarjetas */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
              {columna.clientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center">
                  <p className="text-xs text-slate-400">
                    No hay clientes en esta etapa
                  </p>
                </div>
              ) : (
                columna.clientes.map((cliente) => {
                  const siguiente = getSiguienteEstado(cliente.estado)
                  const anterior = getAnteriorEstado(cliente.estado)
                  const estaActualizando = actualizandoId === cliente.id

                  return (
                    <div
                      key={cliente.id}
                      className="group relative rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-slate-300 hover:shadow-sm"
                    >
                      {/* Estado de carga */}
                      {estaActualizando && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-xs">
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        </div>
                      )}

                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/clientes/${cliente.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600"
                        >
                          {cliente.nombre}
                        </Link>
                        <Link
                          href={`/clientes/${cliente.id}`}
                          title="Abrir ficha"
                          className="text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-indigo-600"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {/* Info de contacto y localidad */}
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        {cliente.telefono && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <a
                              href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-600 hover:text-indigo-600"
                            >
                              {cliente.telefono}
                            </a>
                          </div>
                        )}
                        {cliente.localidad && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="truncate">{cliente.localidad}</span>
                          </div>
                        )}
                      </div>

                      {/* Conteo de trabajos */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5"
                            title="Mediciones"
                          >
                            <Ruler className="h-3 w-3 text-slate-400" />
                            {cliente._count?.mediciones || 0}
                          </span>
                          <span
                            className="flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5"
                            title="Presupuestos"
                          >
                            <FileText className="h-3 w-3 text-slate-400" />
                            {cliente._count?.presupuestos || 0}
                          </span>
                        </div>

                        {/* Botones de navegación de estado */}
                        <div className="flex items-center gap-1">
                          {anterior && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCambiarEstado(cliente.id, anterior)
                              }
                              title={`Mover a ${ESTADO_CLIENTE_LABELS[anterior]}`}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {siguiente && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCambiarEstado(cliente.id, siguiente)
                              }
                              title={`Mover a ${ESTADO_CLIENTE_LABELS[siguiente]}`}
                              className="rounded p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
