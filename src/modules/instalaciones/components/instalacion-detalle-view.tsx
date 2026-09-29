"use client"

// Módulo: Agenda & Instalación
// Vista de Detalle de Instalación (Digital + Switch A4)

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  PackageCheck,
  AlertCircle,
  Edit,
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import type { IInstalacion, IInstalador, IBloqueoAgenda } from "../types"
import { formatearFechaCompleta, formatearHorario } from "../types"
import { InstalacionEstadoBadge } from "./instalacion-estado-badge"
import { InstalacionImprimible } from "./instalacion-imprimible"
import { InstalacionAgendarModal } from "./instalacion-agendar-modal"
import { toggleMaterialesListos, completarInstalacion, cancelarInstalacion } from "../actions"

interface Props {
  instalacion: IInstalacion
  instaladores: IInstalador[]
  bloqueos: IBloqueoAgenda[]
}

export function InstalacionDetalleView({
  instalacion,
  instaladores,
  bloqueos,
}: Props) {
  const [vista, setVista] = useState<"digital" | "imprimible">("digital")
  const [modalReprogramar, setModalReprogramar] = useState(false)
  const [modalCompletar, setModalCompletar] = useState(false)
  const [observacionesFinales, setObservacionesFinales] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { comanda, instaladores: asignados } = instalacion
  const cliente = comanda.cliente

  const direccionCompleta = [cliente?.direccion, cliente?.localidad]
    .filter(Boolean)
    .join(", ")

  const mapsUrl = direccionCompleta
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`
    : null

  const mensajeWhatsApp = encodeURIComponent(
    `Hola ${cliente?.nombre || ""}, nos comunicamos de ROMINA RIBOT Cortinados respecto a la instalación de su comanda #${comanda.numero}.`
  )
  const waUrl = cliente?.telefono
    ? `https://wa.me/${cliente.telefono.replace(/\D/g, "")}?text=${mensajeWhatsApp}`
    : null

  const handleToggleMateriales = () => {
    setError(null)
    startTransition(async () => {
      const res = await toggleMaterialesListos(instalacion.id, !instalacion.materialesListos)
      if (!res.success) {
        setError(res.error || "Error al modificar materiales.")
      }
    })
  }

  const handleCompletar = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await completarInstalacion({
        id: instalacion.id,
        observacionesFinales,
      })
      if (res.success) {
        setModalCompletar(false)
      } else {
        setError(res.error || "Error al completar la instalación.")
      }
    })
  }

  const handleCancelar = () => {
    const motivo = prompt("Ingrese el motivo de cancelación de la colocación:")
    if (motivo === null) return
    setError(null)
    startTransition(async () => {
      const res = await cancelarInstalacion({
        id: instalacion.id,
        motivo,
      })
      if (!res.success) {
        setError(res.error || "Error al cancelar la instalación.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Barra de Navegación y Conmutador de Vistas */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/instalaciones"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600">
                Comanda #{comanda.numero}
              </span>
              <h1 className="text-xl font-bold text-slate-900">{cliente.nombre}</h1>
              <InstalacionEstadoBadge
                estado={instalacion.estado}
                materialesListos={instalacion.materialesListos}
                tamano="sm"
              />
            </div>
            <p className="text-xs text-slate-500">
              {formatearFechaCompleta(instalacion.fecha)} • {formatearHorario(instalacion.horaInicio, instalacion.horaFin)}
            </p>
          </div>
        </div>

        {/* Conmutador de vista */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setVista("digital")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                vista === "digital"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Ficha Interactiva
            </button>
            <button
              onClick={() => setVista("imprimible")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                vista === "imprimible"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Printer className="h-3.5 w-3.5" />
              Hoja A4
            </button>
          </div>

          {/* Acciones de gestión */}
          {instalacion.estado === "PROGRAMADA" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalReprogramar(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Edit className="h-3.5 w-3.5" />
                Reprogramar
              </button>
              <button
                onClick={handleCancelar}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Renderizado condicional según vista seleccionada */}
      {vista === "imprimible" ? (
        <InstalacionImprimible instalacion={instalacion} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Información de Obra y Acciones */}
          <div className="space-y-6 lg:col-span-1">
            {/* Tarjeta de Obra y Cliente */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Datos de la Obra
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Cliente</span>
                  <span className="font-bold text-slate-900 text-sm">{cliente.nombre}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Dirección</span>
                  <span className="font-medium text-slate-800">{direccionCompleta || "Sin dirección"}</span>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                    >
                      Ver en Google Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block">Contacto</span>
                  <span className="font-mono font-medium text-slate-800">{cliente.telefono || "Sin teléfono"}</span>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-center gap-1 font-semibold text-emerald-600 hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Enviar WhatsApp
                    </a>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block">Equipo de Instaladores</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {asignados.length > 0
                      ? asignados.map((a) => a.usuario.nombre).join(", ")
                      : "Sin instaladores asignados"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta de Taller: Materiales y Despacho */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Estado de Preparación de Taller
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {instalacion.materialesListos ? "Listo para salir a obra" : "Pendiente de embalar"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {instalacion.materialesListos
                      ? "Cortinas y accesorios verificados en taller"
                      : "Aún no se confirmó la salida de materiales"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMateriales}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
                    instalacion.materialesListos
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-white border-2 border-slate-300 text-slate-700 hover:border-emerald-500"
                  }`}
                >
                  <PackageCheck className="h-4 w-4" />
                  {instalacion.materialesListos ? "Listos" : "Marcar Listos"}
                </button>
              </div>
            </div>

            {/* Botón de Cierre de Obra */}
            {instalacion.estado === "PROGRAMADA" && (
              <button
                onClick={() => setModalCompletar(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 p-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5" />
                Marcar Instalación Completada
              </button>
            )}
          </div>

          {/* Columna Derecha: Detalle de Cortinas y Observaciones */}
          <div className="space-y-6 lg:col-span-2">
            {/* Notas de acceso */}
            {instalacion.notas && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs">
                <span className="font-bold block mb-1">Notas y Recomendaciones de Acceso:</span>
                <p className="whitespace-pre-wrap">{instalacion.notas}</p>
              </div>
            )}

            {/* Listado de Cortinas */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Cortinas y Elementos de la Comanda ({comanda.items.length})
              </h2>

              <div className="space-y-3">
                {comanda.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {item.ambiente && (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-[11px] text-indigo-700 border border-indigo-200">
                            {item.ambiente}
                          </span>
                        )}
                        <h3 className="font-bold text-slate-900 text-sm">{item.descripcion}</h3>
                        <span className="text-xs text-slate-400 font-semibold">
                          x{item.cantidad}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">
                        Tipo: {item.tipo}
                      </p>
                      {item.observaciones && (
                        <p className="text-xs text-slate-600 mt-1 italic">
                          &ldquo;{item.observaciones}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Medidas de Confección</span>
                      <span className="font-mono font-bold text-base text-indigo-700">
                        {item.ancho} × {item.alto} m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reprogramar */}
      {modalReprogramar && (
        <InstalacionAgendarModal
          abierto={modalReprogramar}
          onCerrar={() => setModalReprogramar(false)}
          comandasPendientes={[]}
          instaladores={instaladores}
          bloqueos={bloqueos}
          instalacionParaReprogramar={instalacion}
        />
      )}

      {/* Modal Completar */}
      {modalCompletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Completar Instalación
                </h3>
                <p className="text-xs text-slate-500">
                  Cierre de obra de {cliente.nombre}
                </p>
              </div>
            </div>

            <form onSubmit={handleCompletar} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones de Conformidad de Obra
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Colocación terminada con éxito. Cliente muy conforme con la caída y el funcionamiento."
                  value={observacionesFinales}
                  onChange={(e) => setObservacionesFinales(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="rounded-lg bg-emerald-50/60 p-2.5 text-[11px] text-emerald-800 border border-emerald-200">
                Esta acción marcará automáticamente la instalación como{" "}
                <strong>COMPLETADA</strong>, la comanda como <strong>INSTALADO</strong> y el
                cliente como <strong>INSTALADO</strong>, cerrando el ciclo comercial.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCompletar(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isPending ? "Confirmando..." : "Confirmar y Cerrar Obra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
