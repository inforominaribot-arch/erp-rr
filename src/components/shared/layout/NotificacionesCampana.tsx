"use client"

// Campana de la barra superior: avisa lo que llegó desde la tablet. Consulta cada minuto mientras la pestaña está a la vista.

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Tablet } from "lucide-react"

interface IAviso {
  id: string
  tipo: string
  mensaje: string
  medicionId: string | null
  clienteId: string | null
  leida: boolean
  creadoEn: string
}

const INTERVALO_MS = 60_000

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

export function NotificacionesCampana() {
  const router = useRouter()
  const [abierta, setAbierta] = useState(false)
  const [avisos, setAvisos] = useState<IAviso[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const contenedor = useRef<HTMLDivElement>(null)

  const consultar = useCallback(async () => {
    try {
      const resp = await fetch("/api/notificaciones", { cache: "no-store" })
      if (!resp.ok) return
      const data = await resp.json()
      if (data.success) {
        setAvisos(data.avisos)
        setNoLeidas(data.noLeidas)
      }
    } catch {
      // Sin conexión: se vuelve a intentar en la próxima consulta
    }
  }, [])

  useEffect(() => {
    const consultarSiSeVe = () => {
      if (!document.hidden) consultar()
    }
    consultarSiSeVe()
    const intervalo = setInterval(consultarSiSeVe, INTERVALO_MS)
    document.addEventListener("visibilitychange", consultarSiSeVe)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener("visibilitychange", consultarSiSeVe)
    }
  }, [consultar])

  // Cerrar al tocar afuera
  useEffect(() => {
    if (!abierta) return
    const alTocar = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierta(false)
    }
    document.addEventListener("mousedown", alTocar)
    return () => document.removeEventListener("mousedown", alTocar)
  }, [abierta])

  async function marcar(cuerpo: { id: string } | { todas: true }) {
    await fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    }).catch(() => null)
    await consultar()
  }

  function abrirAviso(aviso: IAviso) {
    setAbierta(false)
    if (!aviso.leida) void marcar({ id: aviso.id })
    if (aviso.medicionId) router.push(`/mediciones/${aviso.medicionId}`)
    else if (aviso.clienteId) router.push(`/clientes/${aviso.clienteId}`)
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-transform"
        aria-label={noLeidas > 0 ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones"}
        title="Cambios desde la tablet"
      >
        <Bell className="h-4 w-4" />
        {noLeidas > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <span className="text-xs font-bold text-slate-900">Cambios desde la tablet</span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={() => marcar({ todas: true })}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Marcar todo como leído
              </button>
            )}
          </div>
          {avisos.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-slate-500">Todavía no hay avisos.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {avisos.map((aviso) => (
                <li key={aviso.id}>
                  <button
                    type="button"
                    onClick={() => abrirAviso(aviso)}
                    className={`flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-slate-50 ${
                      aviso.leida ? "" : "bg-indigo-50/60"
                    }`}
                  >
                    <Tablet className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${aviso.leida ? "text-slate-400" : "text-indigo-600"}`} />
                    <span className="min-w-0">
                      <span className={`block text-xs text-slate-900 ${aviso.leida ? "font-medium" : "font-bold"}`}>
                        {aviso.mensaje}
                      </span>
                      <span className="block text-[10px] text-slate-500">{fechaCorta(aviso.creadoEn)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
