"use client"

import { useState } from "react"
import {
  AMBIENTES_PREDETERMINADOS,
  type IAmbiente,
  type IItemMedicion,
} from "../types"
import { CortinaItemForm } from "./cortina-item-form"
import { CortinaDibujoDidactico } from "./cortina-dibujo-didactico"
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Building,
} from "lucide-react"

interface AmbienteManagerProps {
  ambientes: Array<{
    id?: string
    idLocal?: string
    nombre: string
    orden: number
    items: Array<Partial<IItemMedicion>>
  }>
  onAmbientesChange: (ambientes: any[]) => void
}

export function AmbienteManager({
  ambientes,
  onAmbientesChange,
}: AmbienteManagerProps) {
  // Ambiente actualmente seleccionado para visualización/edición
  const [ambienteActivoIdx, setAmbienteActivoIdx] = useState<number>(0)
  const [nuevoNombreAmbiente, setNuevoNombreAmbiente] = useState<string>("")

  // Estado para modal / formulario de cortina
  const [editandoCortina, setEditandoCortina] = useState<{
    ambienteIdx: number
    cortinaIdx?: number
    item?: Partial<IItemMedicion> | null
  } | null>(null)

  // Agregar ambiente nuevo
  function agregarAmbiente(nombre: string) {
    if (!nombre.trim()) return
    const nuevo = {
      idLocal: `amb_${Date.now()}`,
      nombre: nombre.trim(),
      orden: ambientes.length,
      items: [],
    }
    const nuevosAmbientes = [...ambientes, nuevo]
    onAmbientesChange(nuevosAmbientes)
    setAmbienteActivoIdx(nuevosAmbientes.length - 1)
    setNuevoNombreAmbiente("")
  }

  // Eliminar ambiente
  function eliminarAmbiente(idx: number) {
    if (ambientes.length <= 1) {
      alert("Debe haber al menos un ambiente en la medición.")
      return
    }
    const nuevos = ambientes.filter((_, i) => i !== idx)
    onAmbientesChange(nuevos)
    setAmbienteActivoIdx(Math.max(0, idx - 1))
  }

  // Guardar cortina (crear o editar)
  function handleGuardarCortina(cortina: Partial<IItemMedicion>) {
    if (!editandoCortina) return
    const { ambienteIdx, cortinaIdx } = editandoCortina

    const copiaAmbientes = [...ambientes]
    const itemsAmbiente = [...(copiaAmbientes[ambienteIdx]?.items || [])]

    if (typeof cortinaIdx === "number" && cortinaIdx >= 0) {
      // Editar
      itemsAmbiente[cortinaIdx] = {
        ...itemsAmbiente[cortinaIdx],
        ...cortina,
      }
    } else {
      // Crear nueva
      itemsAmbiente.push({
        idLocal: `item_${Date.now()}`,
        ...cortina,
      })
    }

    copiaAmbientes[ambienteIdx].items = itemsAmbiente
    onAmbientesChange(copiaAmbientes)
    setEditandoCortina(null)
  }

  // Duplicar cortina
  function duplicarCortina(ambienteIdx: number, cortinaIdx: number) {
    const copiaAmbientes = [...ambientes]
    const itemOriginal = copiaAmbientes[ambienteIdx].items[cortinaIdx]
    if (!itemOriginal) return

    const itemDuplicado = {
      ...itemOriginal,
      id: undefined,
      idLocal: `item_${Date.now()}`,
      descripcion: `${itemOriginal.descripcion || "Cortina"} (Copia)`,
    }

    copiaAmbientes[ambienteIdx].items.push(itemDuplicado)
    onAmbientesChange(copiaAmbientes)
  }

  // Eliminar cortina
  function eliminarCortina(ambienteIdx: number, cortinaIdx: number) {
    const copiaAmbientes = [...ambientes]
    copiaAmbientes[ambienteIdx].items = copiaAmbientes[ambienteIdx].items.filter(
      (_, i) => i !== cortinaIdx
    )
    onAmbientesChange(copiaAmbientes)
  }

  const ambienteActual = ambientes[ambienteActivoIdx] || ambientes[0]

  return (
    <div className="space-y-6">
      {/* ── Selector / Creador de Ambientes ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Ambientes del Domicilio
            </h3>
            <p className="text-xs text-slate-500">
              Seleccioná un ambiente o agregá uno nuevo para cargar sus aberturas
            </p>
          </div>

          {/* Input para agregar ambiente personalizado */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={nuevoNombreAmbiente}
              onChange={(e) => setNuevoNombreAmbiente(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  agregarAmbiente(nuevoNombreAmbiente)
                }
              }}
              placeholder="Otro ambiente..."
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[40px]"
            />
            <button
              type="button"
              onClick={() => agregarAmbiente(nuevoNombreAmbiente)}
              disabled={!nuevoNombreAmbiente.trim()}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 min-h-[40px]"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </button>
          </div>
        </div>

        {/* Botones rápidos de ambientes predeterminados */}
        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 self-center mr-1">
            Sugeridos:
          </span>
          {AMBIENTES_PREDETERMINADOS.slice(0, 8).map((nom) => (
            <button
              key={nom}
              type="button"
              onClick={() => agregarAmbiente(nom)}
              className="min-h-[36px] flex items-center rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition active:scale-95"
            >
              + {nom}
            </button>
          ))}
        </div>

        {/* Pestañas de ambientes existentes */}
        <div className="mt-4 flex flex-wrap gap-2">
          {ambientes.map((amb, idx) => {
            const activo = idx === ambienteActivoIdx
            const cantItems = amb.items?.length || 0
            return (
              <div
                key={amb.id || amb.idLocal || idx}
                className={`flex items-center rounded-xl border text-xs font-bold transition ${
                  activo
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAmbienteActivoIdx(idx)
                    setEditandoCortina(null)
                  }}
                  className="flex items-center gap-2 px-3.5 py-2"
                >
                  <span>{amb.nombre}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      activo
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {cantItems}
                  </span>
                </button>

                {ambientes.length > 1 && (
                  <button
                    type="button"
                    title="Eliminar ambiente"
                    onClick={() => eliminarAmbiente(idx)}
                    className="pr-2.5 text-slate-300 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Formulario de Cortina (si está en modo edición / creación) ── */}
      {editandoCortina && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-150">
          <CortinaItemForm
            itemInicial={editandoCortina.item}
            onGuardar={handleGuardarCortina}
            onCancelar={() => setEditandoCortina(null)}
          />
        </div>
      )}

      {/* ── Lista de Cortinas del Ambiente Actual (si no se está editando una) ── */}
      {!editandoCortina && ambienteActual && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Cortinas en {ambienteActual.nombre}</span>
              <span className="text-xs font-normal text-slate-400">
                ({ambienteActual.items.length} relevada
                {ambienteActual.items.length !== 1 ? "s" : ""})
              </span>
            </h4>

            <button
              type="button"
              onClick={() =>
                setEditandoCortina({
                  ambienteIdx: ambienteActivoIdx,
                  item: null,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              Nueva Cortina
            </button>
          </div>

          {ambienteActual.items.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Layers className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">
                Sin cortinas en {ambienteActual.nombre}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Tocá el botón para relevar la primera cortina de este ambiente con
                sus medidas y especificaciones.
              </p>
              <button
                type="button"
                onClick={() =>
                  setEditandoCortina({
                    ambienteIdx: ambienteActivoIdx,
                    item: null,
                  })
                }
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Cargar Cortina
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {ambienteActual.items.map((item, cIdx) => (
                <div
                  key={item.id || item.idLocal || cIdx}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {item.descripcion || `Abertura ${cIdx + 1}`}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {item.cantidad && item.cantidad > 1 ? `${item.cantidad} unid. • ` : ""}
                        {item.ancho?.toFixed(2)}m (Ancho) × {item.alto?.toFixed(2)}m (Alto)
                      </p>
                    </div>

                    {/* Acciones de cortina */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Duplicar cortina"
                        onClick={() => duplicarCortina(ambienteActivoIdx, cIdx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Editar cortina"
                        onClick={() =>
                          setEditandoCortina({
                            ambienteIdx: ambienteActivoIdx,
                            cortinaIdx: cIdx,
                            item,
                          })
                        }
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar cortina"
                        onClick={() => eliminarCortina(ambienteActivoIdx, cIdx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dibujo Didáctico Preview de la Cortina */}
                  <div className="mt-3">
                    <CortinaDibujoDidactico
                      ancho={item.ancho || 2}
                      alto={item.alto || 2}
                      caracteristicas={item.caracteristicas as any}
                    />
                  </div>

                  {item.observaciones && (
                    <div className="mt-2.5 rounded-lg bg-amber-50/60 p-2 text-[11px] text-amber-900 border border-amber-200/60">
                      <strong>Obs:</strong> {item.observaciones}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
