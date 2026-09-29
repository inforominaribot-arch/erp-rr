"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ClienteSelector } from "./cliente-selector"
import { AmbienteManager } from "./ambiente-manager"
import { NetworkStatusBar } from "./network-status-bar"
import { crearMedicion, actualizarMedicion } from "../actions"
import { guardarMedicionOffline } from "../lib/offline-storage"
import { useNetworkStatus } from "../hooks/use-network-status"
import type { IMedicion, IMedicionOffline } from "../types"
import type { IClienteCache } from "../lib/offline-storage"
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Building,
} from "lucide-react"

interface MedicionFormProps {
  medicionExistente?: IMedicion | null
  clientesIniciales?: IClienteCache[]
  modo?: "crear" | "editar"
}

export function MedicionForm({
  medicionExistente,
  clientesIniciales = [],
  modo = "crear",
}: MedicionFormProps) {
  const router = useRouter()
  const { isOnline } = useNetworkStatus()

  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<IClienteCache | null>(
      medicionExistente?.cliente
        ? {
            id: medicionExistente.cliente.id,
            nombre: medicionExistente.cliente.nombre,
            telefono: medicionExistente.cliente.telefono,
            email: medicionExistente.cliente.email,
            direccion: medicionExistente.cliente.direccion,
            localidad: medicionExistente.cliente.localidad,
          }
        : null
    )

  // Ambientes de la medición
  const [ambientes, setAmbientes] = useState<any[]>(
    medicionExistente?.ambientes?.length
      ? medicionExistente.ambientes.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          orden: a.orden,
          items: a.items || [],
        }))
      : [
          {
            idLocal: "amb_1",
            nombre: "Living",
            orden: 0,
            items: [],
          },
        ]
  )

  const [observacionesGenerales, setObservacionesGenerales] = useState<string>(
    medicionExistente?.observaciones || ""
  )

  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)

  // Cantidad total de cortinas cargadas
  const totalCortinas = ambientes.reduce(
    (acc, amb) => acc + (amb.items?.length || 0),
    0
  )

  async function handleGuardarMedicion(e: React.FormEvent) {
    e.preventDefault()
    setErrorGlobal(null)
    setMensajeExito(null)

    if (!clienteSeleccionado) {
      setErrorGlobal("Tenés que seleccionar o dar de alta un cliente para guardar la medición.")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (totalCortinas === 0) {
      setErrorGlobal(
        "Tenés que relevar al menos una cortina en algún ambiente antes de guardar."
      )
      return
    }

    setGuardando(true)

    // Formato de payload para Server Action
    const payload = {
      clienteId: clienteSeleccionado.id,
      observaciones: observacionesGenerales.trim() || null,
      ambientes: ambientes
        .filter((a) => a.items && a.items.length > 0)
        .map((a, idx) => ({
          id: a.id,
          nombre: a.nombre,
          orden: a.orden ?? idx,
          items: a.items.map((item: any) => ({
            id: item.id,
            descripcion: item.descripcion,
            ancho: item.ancho,
            alto: item.alto,
            cantidad: item.cantidad || 1,
            caracteristicas: item.caracteristicas,
            observaciones: item.observaciones || null,
          })),
        })),
    }

    try {
      if (isOnline) {
        let res
        if (modo === "editar" && medicionExistente?.id) {
          res = await actualizarMedicion(medicionExistente.id, payload)
        } else {
          res = await crearMedicion(payload)
        }

        if (res.success) {
          setMensajeExito("¡Medición guardada y sincronizada con éxito en el ERP!")
          setTimeout(() => {
            router.push(`/mediciones/${res.data.id}`)
            router.refresh()
          }, 800)
          return
        } else {
          // Si el servidor falla a pesar de estar online, guardamos offline como respaldo
          throw new Error(res.error || "Fallo en el servidor")
        }
      } else {
        // Modo Offline
        throw new Error("Sin conexión")
      }
    } catch {
      // Guardado Local Offline-First (IndexedDB)
      try {
        const medicionOffline: IMedicionOffline = {
          idLocal: medicionExistente?.id || `med_offline_${Date.now()}`,
          clienteId: clienteSeleccionado.id,
          clienteNombre: clienteSeleccionado.nombre,
          clienteTelefono: clienteSeleccionado.telefono,
          clienteDireccion: clienteSeleccionado.direccion,
          clienteLocalidad: clienteSeleccionado.localidad,
          observaciones: observacionesGenerales.trim() || null,
          sincronizado: false,
          guardadoEn: new Date().toISOString(),
          ambientes: payload.ambientes.map((amb, aIdx) => ({
            idLocal: amb.id || `amb_off_${aIdx}`,
            nombre: amb.nombre,
            orden: amb.orden,
            items: amb.items.map((it: any, iIdx: number) => ({
              idLocal: it.id || `item_off_${iIdx}`,
              descripcion: it.descripcion,
              ancho: it.ancho,
              alto: it.alto,
              cantidad: it.cantidad,
              caracteristicas: it.caracteristicas,
              observaciones: it.observaciones,
            })),
          })),
        }

        await guardarMedicionOffline(medicionOffline)

        setMensajeExito(
          "¡Medición guardada en tu dispositivo (Modo Offline)! Se subirá automáticamente al ERP cuando recuperes señal de internet."
        )

        setTimeout(() => {
          router.push("/mediciones")
          router.refresh()
        }, 1500)
      } catch (errOffline) {
        console.error("Error al guardar offline:", errOffline)
        setErrorGlobal(
          "No se pudo guardar la medición ni en el servidor ni localmente."
        )
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Red y Estado */}
      <NetworkStatusBar />

      {errorGlobal && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorGlobal}</span>
        </div>
      )}

      {mensajeExito && (
        <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs font-bold text-green-800 animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ── 1. Selector de Cliente ── */}
      <ClienteSelector
        clienteSeleccionadoId={clienteSeleccionado?.id}
        clienteSeleccionadoData={clienteSeleccionado}
        clientesIniciales={clientesIniciales}
        onSeleccionarCliente={(c) => {
          setClienteSeleccionado(c)
          setErrorGlobal(null)
        }}
      />

      {/* ── 2. Gestor de Ambientes y Cortinas ── */}
      <AmbienteManager
        ambientes={ambientes}
        onAmbientesChange={(nuevos) => {
          setAmbientes(nuevos)
          setErrorGlobal(null)
        }}
      />

      {/* ── 3. Observaciones Generales de la Visita ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Observaciones Generales de la Visita / Obra
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Detalles de acceso, fechas requeridas por el cliente, requerimientos
          especiales de montaje, etc.
        </p>
        <textarea
          rows={3}
          value={observacionesGenerales}
          onChange={(e) => setObservacionesGenerales(e.target.value)}
          placeholder="Escribí aquí cualquier indicación general para presupuesto o taller..."
          className="mt-3 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* ── Barra Flotante / Inferior de Acciones ── */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-lg backdrop-blur-md">
        <Link
          href="/mediciones"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-slate-900">
              {totalCortinas} Cortina{totalCortinas !== 1 ? "s" : ""}
            </span>
            <p className="text-[11px] text-slate-500">
              en {ambientes.length} ambiente{ambientes.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGuardarMedicion}
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {modo === "editar" ? "Guardar Cambios" : "Finalizar y Guardar"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
