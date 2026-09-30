import React, { useState, useEffect } from "react"
import {
  obtenerConfiguracion,
  guardarConfiguracion,
  type MobileConfig,
} from "../services/storage-service"
import { probarConexionERP } from "../services/sync-service"
import { Settings, Globe, Key, Wifi, Check, X, Loader2, AlertCircle } from "lucide-react"

interface ConfiguracionModalMobileProps {
  abierto: boolean
  onCerrar: () => void
  onConfiguracionGuardada: () => void
}

export function ConfiguracionModalMobile({
  abierto,
  onCerrar,
  onConfiguracionGuardada,
}: ConfiguracionModalMobileProps) {
  const [erpUrl, setErpUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [probando, setProbando] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<{
    ok: boolean
    mensaje: string
  } | null>(null)

  useEffect(() => {
    if (abierto) {
      obtenerConfiguracion().then((cfg) => {
        setErpUrl(cfg.erpUrl)
        setApiKey(cfg.apiKey)
        setResultadoPrueba(null)
      })
    }
  }, [abierto])

  if (!abierto) return null

  const handleProbar = async () => {
    setProbando(true)
    setResultadoPrueba(null)
    const res = await probarConexionERP(erpUrl, apiKey)
    setResultadoPrueba(res)
    setProbando(false)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    await guardarConfiguracion({
      erpUrl: erpUrl.trim(),
      apiKey: apiKey.trim(),
    })
    onConfiguracionGuardada()
    onCerrar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-200 text-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ajustes de Sincronización
              </h3>
              <p className="text-xs text-slate-500">
                Configurá el servidor ERP central
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              URL del Servidor ERP *
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                required
                value={erpUrl}
                onChange={(e) => setErpUrl(e.target.value)}
                placeholder="https://erp-rr.vercel.app"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dirección web donde está desplegado el ERP RR en producción.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Clave de Sincronización (Opcional)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Token x-sync-api-key"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {resultadoPrueba && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                resultadoPrueba.ok
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {resultadoPrueba.ok ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              )}
              <span>{resultadoPrueba.mensaje}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleProbar}
              disabled={probando || !erpUrl.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {probando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-indigo-600" />
              )}
              Probar Conexión
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-colors min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              Guardar Ajustes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
