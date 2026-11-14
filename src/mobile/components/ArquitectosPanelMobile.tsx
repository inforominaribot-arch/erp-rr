import React, { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, DraftingCompass, Edit2, Phone, Plus, Ruler, Search, Trash2, Users } from "lucide-react"
import type { IMedicionOffline } from "@/modules/mediciones/types"
import type { IClienteCache } from "@/modules/mediciones/lib/offline-storage"
import {
  borrarArquitectoLocal,
  obtenerArquitectosLocales,
  obtenerClientesLocales,
  type IArquitectoCache,
} from "../services/storage-service"
import { ArquitectoModalMobile } from "./ArquitectoModalMobile"

// Arquitectos en la tablet: buscar, crear, editar y borrar. Al tocar uno se ven sus clientes y sus mediciones.

interface ArquitectosPanelMobileProps {
  mediciones: IMedicionOffline[]
  onAbrirMedicion: (medicion: IMedicionOffline) => void
}

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function ArquitectosPanelMobile({ mediciones, onAbrirMedicion }: ArquitectosPanelMobileProps) {
  const [arquitectos, setArquitectos] = useState<IArquitectoCache[]>([])
  const [clientes, setClientes] = useState<IClienteCache[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [abiertoId, setAbiertoId] = useState<string | null>(null)
  const [editando, setEditando] = useState<IArquitectoCache | null>(null)
  const [creando, setCreando] = useState(false)

  // Se vuelve a leer al cambiar las mediciones (después de sincronizar) o al guardar acá
  const [version, setVersion] = useState(0)
  const cargar = useCallback(async () => setVersion((v) => v + 1), [])

  useEffect(() => {
    let vigente = true
    Promise.all([obtenerArquitectosLocales(), obtenerClientesLocales()]).then(([a, c]) => {
      if (!vigente) return
      setArquitectos(a)
      setClientes(c)
    })
    return () => {
      vigente = false
    }
  }, [version, mediciones])

  const clientesDe = useMemo(() => {
    const mapa = new Map<string, IClienteCache[]>()
    for (const c of clientes) for (const id of c.arquitectoIds ?? []) mapa.set(id, [...(mapa.get(id) ?? []), c])
    return mapa
  }, [clientes])

  const q = norm(busqueda.trim())
  const filtrados = q ? arquitectos.filter((a) => norm(a.nombre).includes(q) || norm(a.telefono).includes(q)) : arquitectos

  const borrar = async (a: IArquitectoCache) => {
    const n = clientesDe.get(a.id)?.length ?? 0
    const aviso =
      n > 0
        ? `¿Borrar a ${a.nombre}? Sus ${n} cliente${n === 1 ? "" : "s"} no se borran: quedan sin este arquitecto.`
        : `¿Borrar a ${a.nombre}?`
    if (!window.confirm(aviso)) return
    await borrarArquitectoLocal(a.id)
    await cargar()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar arquitecto..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Nuevo arquitecto
        </button>
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 space-y-2">
          <DraftingCompass className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {busqueda ? "No hay arquitectos con ese nombre." : "Todavía no hay arquitectos. Sincronizá o creá uno."}
          </p>
        </div>
      ) : (
        filtrados.map((a) => {
          const suyos = clientesDe.get(a.id) ?? []
          const abierto = abiertoId === a.id
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 p-4">
                <button type="button" onClick={() => setAbiertoId(abierto ? null : a.id)} className="flex-1 min-w-0 text-left">
                  <span className="block text-base font-bold text-slate-900">{a.nombre}</span>
                  <span className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    {a.telefono && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {a.telefono}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {suyos.length} cliente{suyos.length === 1 ? "" : "s"}
                    </span>
                    {a.pendiente && <span className="font-semibold text-amber-600">Sin sincronizar</span>}
                  </span>
                </button>
                <button type="button" onClick={() => setEditando(a)} className="p-2 rounded-xl text-slate-500 hover:bg-indigo-50" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => borrar(a)} className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50" title="Borrar">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setAbiertoId(abierto ? null : a.id)} className="p-2 rounded-xl text-slate-400">
                  {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {abierto && (
                <div className="border-t border-slate-100 p-4 space-y-2">
                  {suyos.length === 0 ? (
                    <p className="text-xs text-slate-500">Todavía no tiene clientes. Se asignan al editar los datos de un cliente.</p>
                  ) : (
                    suyos.map((c) => {
                      const meds = mediciones.filter((m) => m.clienteId === c.id)
                      return (
                        <div key={c.id} className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 space-y-1.5">
                          <p className="text-sm font-semibold text-slate-900">{c.nombre}</p>
                          <p className="text-xs text-slate-500">{[c.direccion, c.localidad, c.telefono].filter(Boolean).join(" · ")}</p>
                          {meds.length === 0 ? (
                            <p className="text-xs text-slate-400">Sin mediciones en la tablet</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {meds.map((m) => (
                                <button
                                  key={m.idLocal}
                                  type="button"
                                  onClick={() => onAbrirMedicion(m)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                  <Ruler className="w-3.5 h-3.5" />
                                  Medición {new Date(m.guardadoEn).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })
      )}

      {(creando || editando) && (
        <ArquitectoModalMobile
          arquitecto={editando}
          nombreInicial={creando ? busqueda.trim() : undefined}
          onCerrar={() => {
            setCreando(false)
            setEditando(null)
          }}
          onGuardado={async () => {
            setCreando(false)
            setEditando(null)
            await cargar()
          }}
        />
      )}
    </div>
  )
}
