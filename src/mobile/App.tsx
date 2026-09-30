import React, { useState, useEffect, useCallback } from "react"
import { Network } from "@capacitor/network"
import { MedicionesListaMobile } from "./components/MedicionesListaMobile"
import { MedicionFormMobile } from "./components/MedicionFormMobile"
import { ConfiguracionModalMobile } from "./components/ConfiguracionModalMobile"
import {
  obtenerMedicionesLocales,
  eliminarMedicionLocal,
  obtenerConfiguracion,
} from "./services/storage-service"
import { sincronizarTodo, type ResultadoSync } from "./services/sync-service"
import type { IMedicionOffline } from "@/modules/mediciones/types"
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "lucide-react"

export function App() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState("wifi")
  const [mediciones, setMediciones] = useState<IMedicionOffline[]>([])
  const [vista, setVista] = useState<"lista" | "form">("lista")
  const [medicionEnEdicion, setMedicionEnEdicion] = useState<IMedicionOffline | null>(null)
  const [configAbierta, setConfigAbierta] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [notificacion, setNotificacion] = useState<{
    tipo: "exito" | "error" | "info"
    mensaje: string
  } | null>(null)

  // 1. Cargar mediciones locales
  const refrescarMediciones = useCallback(async () => {
    const items = await obtenerMedicionesLocales()
    setMediciones(items)
  }, [])

  useEffect(() => {
    refrescarMediciones()
  }, [refrescarMediciones])

  // 2. Monitorear estado de red con Capacitor Network
  useEffect(() => {
    Network.getStatus().then((status) => {
      setIsOnline(status.connected)
      setConnectionType(status.connectionType)
    })

    const listener = Network.addListener("networkStatusChange", (status) => {
      setIsOnline(status.connected)
      setConnectionType(status.connectionType)

      // Si recupera conexión y hay pendientes, notificar
      if (status.connected) {
        setNotificacion({
          tipo: "info",
          mensaje: "Conexión recuperada. Podés sincronizar con el ERP.",
        })
      }
    })

    return () => {
      listener.then((h) => h.remove())
    }
  }, [])

  // 3. Sincronización completa con el ERP
  const handleSincronizar = async () => {
    if (sincronizando) return
    setSincronizando(true)
    setNotificacion(null)

    const res: ResultadoSync = await sincronizarTodo()
    await refrescarMediciones()

    if (res.exito) {
      setNotificacion({
        tipo: "exito",
        mensaje: res.mensaje,
      })
    } else {
      setNotificacion({
        tipo: "error",
        mensaje: `${res.mensaje} (${res.error || "Verificá la conexión y la URL del ERP"})`,
      })
    }
    setSincronizando(false)
  }

  // Auto-desvanecer notificaciones a los 5s
  useEffect(() => {
    if (notificacion) {
      const timer = setTimeout(() => setNotificacion(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notificacion])

  const pendientesCount = mediciones.filter((m) => !m.sincronizado).length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* ── BARRA SUPERIOR DE LA TABLET ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Logo y Marca */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-200 text-base">
              RR
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                Romina Ribot Cortinados
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-indigo-600">
                  App Mediciones en Obra
                </span>
                <span className="text-[10px] text-slate-300">•</span>
                {/* Indicador de Red */}
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    En línea ({connectionType})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <WifiOff className="w-3 h-3 text-amber-500" />
                    Sin red • Modo Obra 100% Offline
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSincronizar}
              disabled={sincronizando}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                pendientesCount > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title="Sincronizar mediciones y clientes con el ERP"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${sincronizando ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {sincronizando
                  ? "Sincronizando..."
                  : pendientesCount > 0
                  ? `Sincronizar (${pendientesCount})`
                  : "Sincronizar"}
              </span>
              <span className="sm:hidden">
                {pendientesCount > 0 ? `(${pendientesCount})` : ""}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConfigAbierta(true)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Ajustes de conexión ERP"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── NOTIFICACIONES FLOTANTES ── */}
      {notificacion && (
        <div className="px-4 py-2 bg-transparent sticky top-16 z-30 flex justify-center">
          <div
            className={`max-w-md w-full p-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-medium border ${
              notificacion.tipo === "exito"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : notificacion.tipo === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-indigo-50 border-indigo-200 text-indigo-900"
            }`}
          >
            {notificacion.tipo === "exito" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {notificacion.tipo === "error" && (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            {notificacion.tipo === "info" && (
              <Wifi className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span className="flex-1">{notificacion.mensaje}</span>
          </div>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL SEGÚN VISTA ── */}
      <main className="flex-1 flex flex-col">
        {vista === "lista" ? (
          <MedicionesListaMobile
            mediciones={mediciones}
            onNuevaMedicion={() => {
              setMedicionEnEdicion(null)
              setVista("form")
            }}
            onEditarMedicion={(med) => {
              setMedicionEnEdicion(med)
              setVista("form")
            }}
            onEliminarMedicion={async (idLocal) => {
              await eliminarMedicionLocal(idLocal)
              await refrescarMediciones()
            }}
          />
        ) : (
          <MedicionFormMobile
            medicionExistente={medicionEnEdicion}
            onVolver={() => {
              setMedicionEnEdicion(null)
              setVista("lista")
            }}
            onGuardadoExitoso={async () => {
              await refrescarMediciones()
              setVista("lista")
              setMedicionEnEdicion(null)
              setNotificacion({
                tipo: "exito",
                mensaje: "Medición guardada en la tablet. Inmune a cortes de red.",
              })
            }}
          />
        )}
      </main>

      {/* ── MODAL DE CONFIGURACIÓN ── */}
      <ConfiguracionModalMobile
        abierto={configAbierta}
        onCerrar={() => setConfigAbierta(false)}
        onConfiguracionGuardada={() => {
          setNotificacion({
            tipo: "info",
            mensaje: "Ajustes de conexión guardados.",
          })
        }}
      />
    </div>
  )
}
