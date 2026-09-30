import React, { useState } from "react"
import { ClienteSelectorMobile } from "./ClienteSelectorMobile"
import { AmbienteManager } from "@/modules/mediciones/components/ambiente-manager"
import { guardarMedicionLocal } from "../services/storage-service"
import type { IMedicionOffline } from "@/modules/mediciones/types"
import type { IClienteCache } from "@/modules/mediciones/lib/offline-storage"
import { ArrowLeft, Save, CheckCircle2, AlertCircle, FileText, Sparkles } from "lucide-react"

interface MedicionFormMobileProps {
  medicionExistente?: IMedicionOffline | null
  onVolver: () => void
  onGuardadoExitoso: () => void
}

export function MedicionFormMobile({
  medicionExistente,
  onVolver,
  onGuardadoExitoso,
}: MedicionFormMobileProps) {
  const [cliente, setCliente] = useState<IClienteCache | null>(
    medicionExistente
      ? {
          id: medicionExistente.clienteId,
          nombre: medicionExistente.clienteNombre,
          telefono: medicionExistente.clienteTelefono,
          direccion: medicionExistente.clienteDireccion,
          localidad: medicionExistente.clienteLocalidad,
        }
      : null
  )

  const [ambientes, setAmbientes] = useState<any[]>(
    medicionExistente?.ambientes?.length
      ? medicionExistente.ambientes.map((a) => ({
          idLocal: a.idLocal,
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

  const [observaciones, setObservaciones] = useState<string>(
    medicionExistente?.observaciones || ""
  )
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  const totalCortinas = ambientes.reduce(
    (acc, amb) => acc + (amb.items?.length || 0),
    0
  )

  const handleGuardar = async () => {
    setError(null)

    if (!cliente) {
      setError("Debes seleccionar o crear un cliente antes de guardar.")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (totalCortinas === 0) {
      setError("Debes relevar al menos una cortina en algún ambiente.")
      return
    }

    const payload: IMedicionOffline = {
      idLocal: medicionExistente?.idLocal || `med_off_${Date.now()}`,
      idServidor: medicionExistente?.idServidor,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      clienteTelefono: cliente.telefono || null,
      clienteDireccion: cliente.direccion || null,
      clienteLocalidad: cliente.localidad || null,
      observaciones: observaciones.trim() || null,
      sincronizado: false,
      guardadoEn: new Date().toISOString(),
      ambientes: ambientes
        .filter((a) => a.items && a.items.length > 0)
        .map((amb, aIdx) => ({
          idLocal: amb.idLocal || amb.id || `amb_off_${aIdx}`,
          nombre: amb.nombre,
          orden: amb.orden ?? aIdx,
          items: amb.items.map((it: any, iIdx: number) => ({
            idLocal: it.idLocal || it.id || `item_off_${iIdx}`,
            descripcion: it.descripcion,
            ancho: Number(it.ancho),
            alto: Number(it.alto),
            cantidad: Number(it.cantidad || 1),
            caracteristicas: it.caracteristicas,
            observaciones: it.observaciones || null,
          })),
        })),
    }

    try {
      await guardarMedicionLocal(payload)
      setGuardado(true)
      setTimeout(() => {
        onGuardadoExitoso()
      }, 600)
    } catch (err: any) {
      setError("Error al guardar en el almacenamiento local de la tablet.")
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Barra de cabecera */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Listado
        </button>

        <div className="text-right">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {medicionExistente ? "Editar Medición" : "Nueva Medición en Obra"}
          </h2>
          <p className="text-xs text-slate-500">
            {totalCortinas} {totalCortinas === 1 ? "cortina relevada" : "cortinas relevadas"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {guardado && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>¡Medición guardada en la tablet con éxito!</span>
        </div>
      )}

      {/* Paso 1: Selección de Cliente */}
      <ClienteSelectorMobile
        clienteSeleccionado={cliente}
        onSeleccionarCliente={setCliente}
      />

      {/* Paso 2: Ambientes y Cortinas */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <AmbienteManager
          ambientes={ambientes}
          onAmbientesChange={setAmbientes}
        />
      </div>

      {/* Paso 3: Observaciones Generales */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-slate-500" />
          Observaciones Generales de la Obra
        </label>
        <textarea
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Detalles de colocación, andamios, accesos, notas para el taller..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
        />
      </div>

      {/* Botón de Guardado Flotante / Inferior */}
      <div className="pt-4 pb-8 flex items-center justify-end gap-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onVolver}
          className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors min-h-[48px]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[48px]"
        >
          <Save className="w-5 h-5" />
          Guardar Medición en Tablet
        </button>
      </div>
    </div>
  )
}
