// Módulo: Stock & Inventario
// Modal de Recepción de Mercadería (Ingreso por Remito con Escaneo IA)

"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  UploadCloud,
  Camera,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Package,
} from "lucide-react"
import type { IProducto } from "../types"
import { registrarIngresoRemito, analizarFotoRemitoIA } from "../actions"

interface RemitoIngresoModalProps {
  abierto: boolean
  productos: IProducto[]
  proveedores: Array<{ id: string; nombre: string }>
  puedeVerCostos: boolean
  onCerrar: () => void
  onCompletado?: () => void
}

interface FilaItemRemito {
  idTemporal: string
  productoId: string
  cantidad: string
  costoUnitario: string
}

export function RemitoIngresoModal({
  abierto,
  productos,
  proveedores,
  puedeVerCostos,
  onCerrar,
  onCompletado,
}: RemitoIngresoModalProps) {
  const router = useRouter()
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [numeroRemito, setNumeroRemito] = useState("")
  const [proveedorNombre, setProveedorNombre] = useState("")
  const [proveedorId, setProveedorId] = useState("")
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0])
  const [observaciones, setObservaciones] = useState("")
  const [fotoRemito, setFotoRemito] = useState<string | null>(null)

  const [items, setItems] = useState<FilaItemRemito[]>([
    {
      idTemporal: "item-1",
      productoId: productos[0]?.id || "",
      cantidad: "1",
      costoUnitario: "",
    },
  ])

  const [escaneandoIA, setEscaneandoIA] = useState(false)
  const [cargandoEnvio, setCargandoEnvio] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [avisoIA, setAvisoIA] = useState<string | null>(null)

  if (!abierto) return null

  // Manejar captura o subida de foto
  const handleFotoSeleccionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const b64 = event.target?.result as string
      setFotoRemito(b64)
      setAvisoIA(null)
    }
    reader.readAsDataURL(file)
  }

  // Escaneo del remito con IA (Gemini Vision)
  const handleEscanearConIA = async () => {
    if (!fotoRemito) {
      setErrorGlobal("Primero seleccioná o sacá una foto del remito para escanear.")
      return
    }

    setEscaneandoIA(true)
    setErrorGlobal(null)
    setAvisoIA(null)

    try {
      const res = await analizarFotoRemitoIA(fotoRemito)
      if (!res.success) {
        setErrorGlobal(res.error)
        return
      }

      const datos = res.data
      if (datos.numeroRemito) setNumeroRemito(datos.numeroRemito)
      if (datos.proveedor) setProveedorNombre(datos.proveedor)
      if (datos.fecha) setFecha(datos.fecha)
      if (datos.observaciones) setObservaciones(datos.observaciones)

      // Procesar items extraídos
      if (datos.items && datos.items.length > 0) {
        const nuevasFilas: FilaItemRemito[] = datos.items.map((it, idx) => {
          let matchedProdId = it.productoId || ""

          // Fallback matching por texto si no vino el ID directo
          if (!matchedProdId && it.descripcionRemito) {
            const descLower = it.descripcionRemito.toLowerCase()
            const match = productos.find(
              (p) =>
                descLower.includes(p.nombre.toLowerCase()) ||
                (p.codigo && descLower.includes(p.codigo.toLowerCase()))
            )
            if (match) matchedProdId = match.id
          }

          if (!matchedProdId && productos.length > 0) {
            matchedProdId = productos[0].id
          }

          return {
            idTemporal: `ia-${idx}-${Date.now()}`,
            productoId: matchedProdId,
            cantidad: String(it.cantidad || 1),
            costoUnitario:
              it.costoUnitario !== undefined && it.costoUnitario !== null
                ? String(it.costoUnitario)
                : "",
          }
        })

        setItems(nuevasFilas)
        setAvisoIA(
          `¡Remito analizado con éxito! Se detectaron ${datos.items.length} ítems. Por favor verificá que coincidan con la mercadería física antes de confirmar.`
        )
      } else {
        setAvisoIA(
          "Se leyeron los datos del remito pero no se detectaron filas de productos legibles. Podés agregarlas manualmente abajo."
        )
      }
    } catch (err: any) {
      setErrorGlobal(err.message || "Error al procesar el remito con IA.")
    } finally {
      setEscaneandoIA(false)
    }
  }

  // Agregar fila de ítem manual
  const handleAgregarFila = () => {
    setItems((prev) => [
      ...prev,
      {
        idTemporal: `item-${Date.now()}`,
        productoId: productos[0]?.id || "",
        cantidad: "1",
        costoUnitario: "",
      },
    ])
  }

  // Quitar fila
  const handleQuitarFila = (idTemporal: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((it) => it.idTemporal !== idTemporal))
  }

  // Actualizar campo de fila
  const handleActualizarFila = (
    idTemporal: string,
    campo: keyof FilaItemRemito,
    valor: string
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.idTemporal === idTemporal ? { ...it, [campo]: valor } : it))
    )
  }

  // Guardar ingreso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorGlobal(null)

    if (!numeroRemito.trim()) {
      setErrorGlobal("El número de remito es obligatorio.")
      return
    }

    if (!proveedorNombre.trim()) {
      setErrorGlobal("El nombre del proveedor es obligatorio.")
      return
    }

    if (items.length === 0) {
      setErrorGlobal("Debe ingresar al menos un insumo al remito.")
      return
    }

    for (const it of items) {
      const cant = Number(it.cantidad)
      if (isNaN(cant) || cant <= 0) {
        setErrorGlobal("Todas las cantidades deben ser números positivos mayores a 0.")
        return
      }
    }

    setCargandoEnvio(true)

    try {
      const payload = {
        numeroRemito: numeroRemito.trim(),
        proveedorNombre: proveedorNombre.trim(),
        proveedorId: proveedorId || null,
        fecha,
        fotoRemitoUrl: fotoRemito,
        observaciones: observaciones.trim() || null,
        items: items.map((it) => ({
          productoId: it.productoId,
          cantidad: Number(it.cantidad),
          costoUnitario:
            puedeVerCostos && it.costoUnitario && Number(it.costoUnitario) >= 0
              ? Number(it.costoUnitario)
              : null,
        })),
      }

      const res = await registrarIngresoRemito(payload)
      if (!res.success) {
        setErrorGlobal(res.error)
        return
      }

      router.refresh()
      if (onCompletado) onCompletado()
      onCerrar()
    } catch (err: any) {
      setErrorGlobal(err.message || "Error al procesar el ingreso de mercadería.")
    } finally {
      setCargandoEnvio(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recepción de Mercadería (Ingreso por Remito)
              </h2>
              <p className="text-xs text-slate-500">
                Registrá los materiales recibidos con foto del remito o escaneo con IA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {errorGlobal && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p>{errorGlobal}</p>
            </div>
          )}

          {avisoIA && (
            <div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
              <p>{avisoIA}</p>
            </div>
          )}

          {/* Zona de Foto del Remito y Escaneo Inteligente */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Foto del Remito Comercial
                </p>
                <p className="text-[11px] text-slate-500">
                  Adjuntá la foto del papel para comprobante digital o escaneo automático con IA
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoSeleccionada}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fotoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                >
                  <Camera className="h-3.5 w-3.5 text-indigo-600" />
                  {fotoRemito ? "Cambiar foto" : "Sacar / Subir foto"}
                </button>

                {fotoRemito && (
                  <button
                    type="button"
                    onClick={handleEscanearConIA}
                    disabled={escaneandoIA}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {escaneandoIA ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Leyendo remito...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        Escanear con IA 🪄
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Vista previa de foto si está cargada */}
            {fotoRemito && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoRemito}
                  alt="Remito preview"
                  className="h-16 w-20 rounded object-cover border border-slate-100"
                />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-slate-800">
                    Foto adjuntada correctamente
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Hacé clic en &quot;Escanear con IA 🪄&quot; para rellenar los productos automáticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFotoRemito(null)}
                  className="rounded p-1 text-slate-400 hover:text-rose-600"
                  title="Eliminar foto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Datos Generales del Remito */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Número de Remito <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={numeroRemito}
                onChange={(e) => setNumeroRemito(e.target.value)}
                placeholder="Ej. 0001-00045892"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  list="proveedores-lista"
                  value={proveedorNombre}
                  onChange={(e) => {
                    setProveedorNombre(e.target.value)
                    const pMatch = proveedores.find(
                      (p) => p.nombre.toLowerCase() === e.target.value.toLowerCase()
                    )
                    if (pMatch) setProveedorId(pMatch.id)
                  }}
                  placeholder="Ej. Difutex / Aluminio S.A."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <datalist id="proveedores-lista">
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.nombre} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Fecha de Recepción
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Observaciones del Remito (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Bulto 1 de 2, fletero González, material conforme"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Tabla Dinámica de Ítems Recibidos */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Materiales Recibidos ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAgregarFila}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3" />
                Agregar insumo
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Insumo / Pieza</th>
                    <th className="px-3 py-2.5 text-right w-28">Cantidad</th>
                    <th className="px-3 py-2.5 text-center w-24">Unidad</th>
                    {puedeVerCostos && (
                      <th className="px-3 py-2.5 text-right w-32">
                        Costo Unit. (ARS)
                      </th>
                    )}
                    <th className="px-2 py-2.5 text-center w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it) => {
                    const prodSeleccionado = productos.find(
                      (p) => p.id === it.productoId
                    )

                    return (
                      <tr key={it.idTemporal} className="hover:bg-slate-50/50">
                        {/* Selector de Insumo */}
                        <td className="p-2">
                          <select
                            value={it.productoId}
                            onChange={(e) =>
                              handleActualizarFila(
                                it.idTemporal,
                                "productoId",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          >
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.codigo ? `[${p.codigo}] ` : ""}
                                {p.nombre} (Stock actual: {p.stockActual}{" "}
                                {p.unidadMedida})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Cantidad recibida */}
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            value={it.cantidad}
                            onChange={(e) =>
                              handleActualizarFila(
                                it.idTemporal,
                                "cantidad",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-right font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Unidad de medida etiqueta */}
                        <td className="p-2 text-center text-slate-500 font-mono text-[11px]">
                          {prodSeleccionado?.unidadMedida || "unidad"}
                        </td>

                        {/* Costo Unitario si es Admin */}
                        {puedeVerCostos && (
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={it.costoUnitario}
                              onChange={(e) =>
                                handleActualizarFila(
                                  it.idTemporal,
                                  "costoUnitario",
                                  e.target.value
                                )
                              }
                              placeholder={
                                prodSeleccionado?.precio
                                  ? String(prodSeleccionado.precio)
                                  : "Costo"
                              }
                              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-right font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                        )}

                        {/* Botón quitar */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleQuitarFila(it.idTemporal)}
                            disabled={items.length <= 1}
                            className="rounded p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                            title="Quitar ítem"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-[11px] text-slate-400">
              Al confirmar, el stock se sumará automáticamente y quedará registrado el remito.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCerrar}
                disabled={cargandoEnvio}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargandoEnvio}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {cargandoEnvio && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar Ingreso de Mercadería
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
