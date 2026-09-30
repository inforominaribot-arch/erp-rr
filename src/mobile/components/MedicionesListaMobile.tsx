import React, { useState } from "react"
import type { IMedicionOffline } from "@/modules/mediciones/types"
import {
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Layers,
  Trash2,
  Edit2,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface MedicionesListaMobileProps {
  mediciones: IMedicionOffline[]
  onNuevaMedicion: () => void
  onEditarMedicion: (medicion: IMedicionOffline) => void
  onEliminarMedicion: (idLocal: string) => void
}

export function MedicionesListaMobile({
  mediciones,
  onNuevaMedicion,
  onEditarMedicion,
  onEliminarMedicion,
}: MedicionesListaMobileProps) {
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState<"TODAS" | "PENDIENTES" | "SINCRONIZADAS">("TODAS")
  const [expandidaId, setExpandidaId] = useState<string | null>(null)

  const filtradas = mediciones.filter((m) => {
    // Filtro por estado
    if (filtro === "PENDIENTES" && m.sincronizado) return false
    if (filtro === "SINCRONIZADAS" && !m.sincronizado) return false

    // Filtro por búsqueda
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      m.clienteNombre.toLowerCase().includes(q) ||
      (m.clienteDireccion && m.clienteDireccion.toLowerCase().includes(q)) ||
      (m.clienteLocalidad && m.clienteLocalidad.toLowerCase().includes(q))
    )
  })

  const pendientesCount = mediciones.filter((m) => !m.sincronizado).length

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-5">
      {/* Barra de Búsqueda y Botón Nueva */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, localidad o dirección..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={onNuevaMedicion}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          + Nueva Medición en Obra
        </button>
      </div>

      {/* Pestañas de Filtro */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltro("TODAS")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filtro === "TODAS"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Todas ({mediciones.length})
        </button>
        <button
          type="button"
          onClick={() => setFiltro("PENDIENTES")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filtro === "PENDIENTES"
              ? "bg-amber-500 text-white"
              : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pendientes ({pendientesCount})
        </button>
        <button
          type="button"
          onClick={() => setFiltro("SINCRONIZADAS")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filtro === "SINCRONIZADAS"
              ? "bg-emerald-600 text-white"
              : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sincronizadas ({mediciones.length - pendientesCount})
        </button>
      </div>

      {/* Lista de Tarjetas */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {busqueda ? "No se encontraron mediciones" : "Sin mediciones en este filtro"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {busqueda
              ? "Probá con otro nombre de cliente o limpiá el buscador."
              : "Hacé clic en '+ Nueva Medición en Obra' para relevar la primera casa o departamento."}
          </p>
          {!busqueda && (
            <button
              type="button"
              onClick={onNuevaMedicion}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Relevar Medición Ahora
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((m) => {
            const totalCortinas = m.ambientes.reduce(
              (acc, a) => acc + (a.items?.length || 0),
              0
            )
            const expandida = expandidaId === m.idLocal
            const fechaStr = new Date(m.guardadoEn).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <div
                key={m.idLocal}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900">
                        {m.clienteNombre}
                      </h4>
                      {m.sincronizado ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sincronizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Pendiente de sincronizar
                        </span>
                      )}
                    </div>

                    {(m.clienteDireccion || m.clienteLocalidad) && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {[m.clienteDireccion, m.clienteLocalidad]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {fechaStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {m.ambientes.length} {m.ambientes.length === 1 ? "ambiente" : "ambientes"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {totalCortinas} {totalCortinas === 1 ? "cortina" : "cortinas"}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditarMedicion(m)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Editar en Obra"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Seguro que querés eliminar la medición local de "${m.clienteNombre}"?`
                          )
                        ) {
                          onEliminarMedicion(m.idLocal)
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar de la tablet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandidaId(expandida ? null : m.idLocal)
                      }
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {expandida ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Detalle Desplegable de Ambientes */}
                {expandida && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Detalle de Ambientes y Aberturas:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.ambientes.map((amb, aIdx) => (
                        <div
                          key={amb.idLocal || aIdx}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1"
                        >
                          <div className="font-bold text-slate-800 flex items-center justify-between">
                            <span>{amb.nombre}</span>
                            <span className="text-slate-400 font-normal">
                              {amb.items.length} {amb.items.length === 1 ? "cortina" : "cortinas"}
                            </span>
                          </div>
                          <ul className="space-y-0.5 text-slate-600">
                            {amb.items.map((it, iIdx) => (
                              <li key={it.idLocal || iIdx} className="truncate">
                                • {it.descripcion} ({it.ancho}m × {it.alto}m)
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
