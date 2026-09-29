"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User,
  Plus,
  Trash2,
  Calculator,
  Download,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Calendar,
  Layers,
} from "lucide-react"
import {
  crearPresupuesto,
  actualizarPresupuesto,
  obtenerMedicionesClienteAction,
} from "../actions"
import { PresupuestoCalculadoraModal } from "./presupuesto-calculadora-modal"
import { formatearPrecio } from "@/lib/utils"
import type { ItemPresupuestoInput, PresupuestoFormInput } from "../schemas"
import type { IPresupuestoDetalle, MedicionImportable } from "../types"

interface ClienteOpcion {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  localidad: string | null
}

interface PresupuestoFormProps {
  presupuestoInicial?: IPresupuestoDetalle | null
  clientes: ClienteOpcion[]
  clientePreseleccionadoId?: string
  medicionPreseleccionadaId?: string
}

export function PresupuestoForm({
  presupuestoInicial,
  clientes,
  clientePreseleccionadoId,
  medicionPreseleccionadaId,
}: PresupuestoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Cliente
  const [clienteId, setClienteId] = useState<string>(
    presupuestoInicial?.clienteId || clientePreseleccionadoId || ""
  )
  const [busquedaCliente] = useState("")

  // Mediciones del cliente para importar
  const [medicionesDisponibles, setMedicionesDisponibles] = useState<
    MedicionImportable[]
  >([])
  const haImportadoRef = useRef(false)
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false)

  // Configuración general
  const [validezDias, setValidezDias] = useState<number>(
    presupuestoInicial?.validezDias || 14
  )
  const [descuento, setDescuento] = useState<number>(
    presupuestoInicial?.descuento || 0
  )
  const [notas, setNotas] = useState<string>(presupuestoInicial?.notas || "")

  // Ítems de presupuesto
  const [items, setItems] = useState<ItemPresupuestoInput[]>(() => {
    if (presupuestoInicial?.items && presupuestoInicial.items.length > 0) {
      return presupuestoInicial.items.map((it) => ({
        id: it.id,
        itemMedicionId: it.itemMedicionId,
        descripcion: it.descripcion,
        ambiente: it.ambiente || "General",
        ancho: it.ancho,
        alto: it.alto,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        subtotal: it.subtotal,
        aceptado: it.aceptado,
      }))
    }
    return [
      {
        descripcion: "Cortina Tradicional",
        ambiente: "Living",
        ancho: 2.0,
        alto: 2.2,
        cantidad: 1,
        precioUnitario: 0,
        subtotal: 0,
        aceptado: false,
      },
    ]
  })

  // Estado para la calculadora modal
  const [calculadoraIndex, setCalculadoraIndex] = useState<number | null>(null)

  // Importar ambientes e items de una medición
  function aplicarImportacionMedicion(medicion: MedicionImportable) {
    const nuevosItems: ItemPresupuestoInput[] = []

    medicion.ambientes.forEach((amb) => {
      amb.items.forEach((it) => {
        let desc = it.descripcion || "Cortina"
        const carac = it.caracteristicas as { tipo?: string } | null
        if (carac?.tipo) {
          desc = `${carac.tipo} - ${it.descripcion}`
        }

        nuevosItems.push({
          itemMedicionId: it.id,
          descripcion: desc,
          ambiente: amb.nombre || "General",
          ancho: it.ancho,
          alto: it.alto,
          cantidad: it.cantidad || 1,
          precioUnitario: 0,
          subtotal: 0,
          aceptado: false,
        })
      })
    })

    if (nuevosItems.length > 0) {
      setItems(nuevosItems)
    }
    setMostrarModalImportar(false)
  }

  // Cargar mediciones cuando cambia el cliente
  useEffect(() => {
    if (!clienteId) {
      return
    }

    let cancelado = false
    async function cargar() {
      try {
        const meds = await obtenerMedicionesClienteAction(clienteId)
        if (!cancelado) {
          setMedicionesDisponibles(meds)
          // Si vino medicionPreseleccionadaId por URL y no hay items cargados, importar de una vez
          if (
            medicionPreseleccionadaId &&
            !presupuestoInicial &&
            !haImportadoRef.current
          ) {
            const encontrada = meds.find((m) => m.id === medicionPreseleccionadaId)
            if (encontrada) {
              haImportadoRef.current = true
              aplicarImportacionMedicion(encontrada)
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar mediciones del cliente:", err)
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [clienteId, medicionPreseleccionadaId, presupuestoInicial])

  // Manipulación de ítems
  function handleActualizarItem(
    index: number,
    campo: keyof ItemPresupuestoInput,
    valor: string | number | boolean
  ) {
    setItems((prev) => {
      const copia = [...prev]
      const actual = { ...copia[index], [campo]: valor }

      // Recalcular subtotal del ítem si cambió cantidad o precioUnitario
      if (campo === "cantidad" || campo === "precioUnitario") {
        const cant = Math.max(
          1,
          campo === "cantidad" ? Number(valor) : actual.cantidad
        )
        const pUnit = Math.max(
          0,
          campo === "precioUnitario" ? Number(valor) : actual.precioUnitario
        )
        actual.subtotal = Math.round(cant * pUnit * 100) / 100
      }

      copia[index] = actual
      return copia
    })
  }

  function handleAgregarItem() {
    setItems((prev) => [
      ...prev,
      {
        descripcion: "Nueva Cortina",
        ambiente: prev[prev.length - 1]?.ambiente || "Living",
        ancho: 2.0,
        alto: 2.2,
        cantidad: 1,
        precioUnitario: 0,
        subtotal: 0,
        aceptado: false,
      },
    ])
  }

  function handleEliminarItem(index: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Cálculos de Totales
  const subtotalGeneral = items.reduce((acc, it) => acc + (it.subtotal || 0), 0)
  const montoDescuento =
    Math.round(subtotalGeneral * (descuento / 100) * 100) / 100
  const totalGeneral = Math.max(0, subtotalGeneral - montoDescuento)

  // Cliente seleccionado
  const clienteSeleccionado = clientes.find((c) => c.id === clienteId)
  const clientesFiltrados = busquedaCliente.trim()
    ? clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
          c.telefono?.includes(busquedaCliente) ||
          c.localidad?.toLowerCase().includes(busquedaCliente.toLowerCase())
      )
    : clientes

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!clienteId) {
      setError("Debés seleccionar un cliente para el presupuesto.")
      return
    }

    if (items.length === 0) {
      setError("El presupuesto debe contener al menos un ítem o cortina.")
      return
    }

    const payload: PresupuestoFormInput = {
      clienteId,
      validezDias,
      descuento,
      notas,
      items,
    }

    startTransition(async () => {
      let res
      if (presupuestoInicial) {
        res = await actualizarPresupuesto(presupuestoInicial.id, payload)
      } else {
        res = await crearPresupuesto(payload)
      }

      if (!res.success) {
        setError(res.error || "Ocurrió un error al guardar el presupuesto.")
        return
      }

      router.push(`/presupuestos/${res.data?.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── BARRA SUPERIOR DE ACCIONES ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <Link
          href={
            presupuestoInicial
              ? `/presupuestos/${presupuestoInicial.id}`
              : "/presupuestos"
          }
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar y Volver
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">
            Total Estimado:{" "}
            <strong className="text-indigo-900 font-mono text-sm ml-1">
              {formatearPrecio(totalGeneral)}
            </strong>
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {presupuestoInicial
              ? "Actualizar Presupuesto"
              : "Guardar Presupuesto"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── SECCIÓN 1: SELECCIÓN DE CLIENTE & IMPORTACIÓN DESDE MEDICIÓN ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              1. Cliente del Presupuesto
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Seleccioná a quién va dirigida esta cotización
            </p>
          </div>

          {/* Botón Importar Medición */}
          {clienteId && medicionesDisponibles.length > 0 && (
            <button
              type="button"
              onClick={() => setMostrarModalImportar(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              Importar de Medición ({medicionesDisponibles.length})
            </button>
          )}
        </div>

        {/* Selector de Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700">
              Buscar y Elegir Cliente
            </label>
            <div className="relative mt-1">
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="">-- Seleccionar un Cliente --</option>
                {clientesFiltrados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.localidad ? `(${c.localidad})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ficha rápida del cliente */}
          {clienteSeleccionado && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 space-y-1">
              <p>
                <strong>Nombre:</strong> {clienteSeleccionado.nombre}
              </p>
              <p>
                <strong>Teléfono:</strong>{" "}
                {clienteSeleccionado.telefono || "Sin teléfono"}
              </p>
              <p>
                <strong>Dirección:</strong>{" "}
                {clienteSeleccionado.direccion
                  ? `${clienteSeleccionado.direccion}${clienteSeleccionado.localidad ? `, ${clienteSeleccionado.localidad}` : ""}`
                  : "Sin dirección registrada"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── SECCIÓN 2: ÍTEMS Y CORTINAS A PRESUPUESTAR ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              2. Cortinas y Productos Cotizados
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cargá los precios unitarios o utilizá la calculadora con las fórmulas
              de taller
            </p>
          </div>

          <button
            type="button"
            onClick={handleAgregarItem}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            Agregar Otra Cortina / Ítem
          </button>
        </div>

        {/* Tabla de ítems interactiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-2 font-bold w-32">Ambiente</th>
                <th className="py-2.5 px-2 font-bold">Descripción del Producto</th>
                <th className="py-2.5 px-2 font-bold text-center w-24">
                  Ancho (m)
                </th>
                <th className="py-2.5 px-2 font-bold text-center w-24">
                  Alto (m)
                </th>
                <th className="py-2.5 px-2 font-bold text-center w-20">Cant.</th>
                <th className="py-2.5 px-2 font-bold text-right w-44">
                  Precio Unitario ($)
                </th>
                <th className="py-2.5 px-2 font-bold text-right w-36">
                  Subtotal ($)
                </th>
                <th className="py-2.5 px-2 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  {/* Ambiente */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={it.ambiente || ""}
                      onChange={(e) =>
                        handleActualizarItem(idx, "ambiente", e.target.value)
                      }
                      placeholder="Living, Dorm..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </td>

                  {/* Descripción */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={it.descripcion}
                      onChange={(e) =>
                        handleActualizarItem(idx, "descripcion", e.target.value)
                      }
                      placeholder="Ej: Roller Doble Sunscreen + BO..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900"
                      required
                    />
                  </td>

                  {/* Ancho */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.ancho}
                      onChange={(e) =>
                        handleActualizarItem(
                          idx,
                          "ancho",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-center font-mono font-semibold"
                    />
                  </td>

                  {/* Alto */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.alto}
                      onChange={(e) =>
                        handleActualizarItem(
                          idx,
                          "alto",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-center font-mono font-semibold"
                    />
                  </td>

                  {/* Cantidad */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="1"
                      value={it.cantidad}
                      onChange={(e) =>
                        handleActualizarItem(
                          idx,
                          "cantidad",
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-center font-bold"
                    />
                  </td>

                  {/* Precio Unitario + Botón Calculadora */}
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCalculadoraIndex(idx)}
                        title="Calcular precio con fórmulas del Excel"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition shadow-2xs shrink-0"
                      >
                        <Calculator className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={it.precioUnitario}
                        onChange={(e) =>
                          handleActualizarItem(
                            idx,
                            "precioUnitario",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-mono font-bold text-slate-900"
                      />
                    </div>
                  </td>

                  {/* Subtotal */}
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                    {formatearPrecio(it.subtotal)}
                  </td>

                  {/* Eliminar fila */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleEliminarItem(idx)}
                      disabled={items.length <= 1}
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECCIÓN 3: TOTALES, DESCUENTO Y VALIDEZ ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notas y Validez */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            3. Validez y Observaciones Comerciales
          </h2>

          <div>
            <label className="text-xs font-bold text-slate-700">
              Plazo de Validez de la Cotización (en días)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={validezDias}
              onChange={(e) => setValidezDias(parseInt(e.target.value, 10) || 14)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Por defecto 14 días a partir de la emisión.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              Notas adicionales para el cliente
            </label>
            <textarea
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Incluye flete y colocación en obra. No incluye trabajos especiales de albañilería..."
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Resumen Financiero */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Resumen de Liquidación
          </h2>

          <div className="space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal general:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatearPrecio(subtotalGeneral)}
              </span>
            </div>

            {/* Descuento */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Descuento Comercial (%):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={descuento}
                    onChange={(e) =>
                      setDescuento(parseFloat(e.target.value) || 0)
                    }
                    className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-mono font-bold text-xs"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Botones de descuento rápido */}
              <div className="flex items-center gap-1.5 mt-2">
                {[0, 5, 10, 15, 20].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDescuento(d)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border transition ${
                      descuento === d
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {d === 0 ? "Sin desc." : `${d}%`}
                  </button>
                ))}
              </div>

              {descuento > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold mt-2">
                  <span>Monto descontado:</span>
                  <span className="font-mono">
                    - {formatearPrecio(montoDescuento)}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-3 border-t-2 border-slate-300 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900">
                Total Final Cotizado:
              </span>
              <span className="text-2xl font-black text-indigo-950 font-mono">
                {formatearPrecio(totalGeneral)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL CALCULADORA DE PRECIOS CON FÓRMULAS EXCEL ── */}
      {calculadoraIndex !== null && items[calculadoraIndex] && (
        <PresupuestoCalculadoraModal
          abierto={calculadoraIndex !== null}
          onCerrar={() => setCalculadoraIndex(null)}
          onAplicarPrecio={(precioUnitarioCalculado) => {
            handleActualizarItem(
              calculadoraIndex,
              "precioUnitario",
              precioUnitarioCalculado
            )
          }}
          anchoInicial={items[calculadoraIndex].ancho}
          altoInicial={items[calculadoraIndex].alto}
          cantidadInicial={items[calculadoraIndex].cantidad}
          descripcionInicial={items[calculadoraIndex].descripcion}
        />
      )}

      {/* ── MODAL SELECCIÓN DE MEDICIÓN PARA IMPORTAR ── */}
      {mostrarModalImportar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Download className="h-4 w-4 text-indigo-600" />
                Importar Cortinas de Medición Existente
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalImportar(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-500">
                Elegí la medición de la cual querés volcar automáticamente todos
                los ambientes, cortinas y dimensiones:
              </p>

              <div className="space-y-2">
                {medicionesDisponibles.map((m) => {
                  const totalCortinas = m.ambientes.reduce(
                    (acc: number, a) => acc + (a.items?.length || 0),
                    0
                  )
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200 p-3 hover:border-indigo-400 hover:bg-indigo-50/20 transition cursor-pointer flex items-center justify-between"
                      onClick={() => aplicarImportacionMedicion(m)}
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Medición del{" "}
                          {new Date(m.creadoEn).toLocaleDateString("es-AR")}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {m.ambientes.length} ambiente(s) • {totalCortinas}{" "}
                          cortina(s)
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs">
                        Importar
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
