"use client"

import { useNetworkStatus } from "../hooks/use-network-status"
import { useMedicionesOffline } from "../hooks/use-mediciones-offline"
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
} from "lucide-react"

export function NetworkStatusBar() {
  const { isOnline } = useNetworkStatus()
  const {
    pendientes,
    cantidadPendientes,
    sincronizando,
    errorSync,
    sincronizarPendientes,
  } = useMedicionesOffline()

  // Si está online y no hay pendientes, mostramos un indicador discreto o nada
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border p-3 text-xs transition-all ${
        !isOnline
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : cantidadPendientes > 0
          ? "border-indigo-200 bg-indigo-50/70 text-indigo-950"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-800">
            <WifiOff className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Wifi className="h-3.5 w-3.5" />
          </span>
        )}

        <div>
          <span className="font-bold">
            {!isOnline ? "Modo Offline (Sin Conexión)" : "En Línea (Conectado)"}
          </span>
          <span className="text-slate-500 ml-1.5 hidden md:inline">
            {!isOnline
              ? "Las mediciones que tomes se guardarán en tu dispositivo y se sincronizarán al volver a tener señal."
              : cantidadPendientes > 0
              ? `${cantidadPendientes} medición/es guardada/s localmente pendiente/s de subir al ERP.`
              : "Base de datos sincronizada con el ERP."}
          </span>
        </div>
      </div>

      {/* Botón de Sincronización Manual */}
      {cantidadPendientes > 0 && isOnline && (
        <button
          type="button"
          onClick={sincronizarPendientes}
          disabled={sincronizando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 self-start sm:self-auto transition"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${sincronizando ? "animate-spin" : ""}`}
          />
          {sincronizando ? "Sincronizando..." : `Subir ${cantidadPendientes} Pendiente/s`}
        </button>
      )}

      {errorSync && (
        <span className="text-red-600 font-semibold text-[11px]">
          {errorSync}
        </span>
      )}
    </div>
  )
}
