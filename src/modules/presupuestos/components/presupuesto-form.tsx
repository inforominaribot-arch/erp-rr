"use client"

import { useState, useTransition, useEffect, useRef, useMemo } from "react"
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
  GitBranch,
  Pencil,
  CornerDownRight,
  X,
  AlertTriangle,
  Hand,
} from "lucide-react"
import {
  crearPresupuesto,
  actualizarPresupuesto,
  obtenerMedicionesClienteAction,
} from "../actions"
import { PresupuestoCalculadoraModal } from "./presupuesto-calculadora-modal"
import { CortinaItemForm } from "@/modules/mediciones/components/cortina-item-form"
import { TelasListaProvider } from "@/modules/mediciones/components/selector-tela-lista"
import type { IItemMedicion, ICaracteristicasItem, ITelaMedicion } from "@/modules/mediciones/types"
import { formatearPrecio } from "@/lib/utils"
import type { ItemPresupuestoInput, PresupuestoFormInput } from "../schemas"
import type { IPresupuestoDetalle, MedicionImportable } from "../types"
import { MAX_OPCIONES_POR_CORTINA } from "../types"
import { calcularTotalesPorOpcion, subtotalPrincipales } from "../lib/alternativas"
import {
  filasDeAbertura,
  filasDesdeMedicion,
  nuevoGrupoId,
  sufijoCortina,
} from "../lib/filas-desde-medicion"
import { coloresDe, recalcularFila, type IItemListaCalculo } from "../lib/lista-precios-rs"

/** Editor de alternativa: nueva (a partir de la cortina principal) o edición de una existente */
type EditorAlternativa =
  | { modo: "nueva"; indexPrincipal: number }
  | { modo: "editar"; index: number }

/** Opción de la fila dentro de su capa: la principal o el nombre de la alternativa */
const claveOpcionFila = (it: ItemPresupuestoInput) =>
  it.esOpcionPrincipal !== false ? "__principal" : (it.nombreOpcion || "").trim().toLowerCase()

/** ¿Las dos filas son cortinas de la misma opción de la misma capa? */
const mismaOpcion = (a: ItemPresupuestoInput, b: ItemPresupuestoInput) =>
  Boolean(a.grupoAlternativa) &&
  a.grupoAlternativa === b.grupoAlternativa &&
  claveOpcionFila(a) === claveOpcionFila(b)

const cantidadOpciones = (lista: ItemPresupuestoInput[], grupo: string | null | undefined) =>
  grupo ? new Set(lista.filter((o) => o.grupoAlternativa === grupo).map(claveOpcionFila)).size : 1

const conSubtotal = (it: ItemPresupuestoInput): ItemPresupuestoInput => ({
  ...it,
  subtotal: Math.round(Math.max(1, it.cantidad) * Math.max(0, it.precioUnitario) * 100) / 100,
})

const NOMBRE_CAPA: Record<string, string> = { GAZA: "Gaza", BO: "B.O." }

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
  /** Lista de precios RS para calcular las cortinas RS */
  listaRS?: IItemListaCalculo[]
}

export function PresupuestoForm({
  presupuestoInicial,
  clientes,
  clientePreseleccionadoId,
  medicionPreseleccionadaId,
  listaRS = [],
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
        caracteristicas: (it.caracteristicas as Record<string, unknown> | null) ?? null,
        grupoAlternativa: it.grupoAlternativa,
        nombreOpcion: it.nombreOpcion,
        esOpcionPrincipal: it.esOpcionPrincipal,
        capa: it.capa === "GAZA" || it.capa === "BO" ? it.capa : null,
        indiceCortina: it.indiceCortina,
        tipoFila:
          it.tipoFila === "CORTINA" || it.tipoFila === "CONTROL" || it.tipoFila === "CARGADOR"
            ? it.tipoFila
            : null,
        calculoPrecio: it.calculoPrecio,
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
        esOpcionPrincipal: true,
      },
    ]
  })

  // Telas tildadas de la lista para el selector de tela de las alternativas
  const telasMedicion = useMemo<ITelaMedicion[]>(
    () =>
      listaRS
        .filter(
          (it) =>
            it.vendemos &&
            it.unidad.toLowerCase() === "m2" &&
            (it.categoria === "TELA" || it.categoria === "BANDAS_VERTICALES")
        )
        .map((it) => ({
          id: it.id,
          descripcion: it.descripcion,
          colores: coloresDe(it),
          categoria: it.categoria === "BANDAS_VERTICALES" ? "BANDAS_VERTICALES" : "TELA",
        })),
    [listaRS]
  )

  // Estado para la calculadora modal
  const [calculadoraIndex, setCalculadoraIndex] = useState<number | null>(null)

  // Editor de alternativas (formulario de cortina de la medición)
  const [editorAlternativa, setEditorAlternativa] = useState<EditorAlternativa | null>(null)
  const [nombreOpcionNueva, setNombreOpcionNueva] = useState("")
  const [nombreOpcionPrincipal, setNombreOpcionPrincipal] = useState("")
  const [errorAlternativa, setErrorAlternativa] = useState<string | null>(null)

  // Importar la medición: una fila por cortina física (paño / tramo de cada capa) con su precio de lista,
  // más los cargadores Li-ion por abertura y los controles remotos del cliente
  function aplicarImportacionMedicion(medicion: MedicionImportable) {
    const nuevosItems = filasDesdeMedicion(medicion, listaRS)
    if (nuevosItems.length > 0) {
      setItems(nuevosItems)
    }
    setMostrarModalImportar(false)
  }

  /** Recalcula con la lista una fila calculada con ella (salvo que tenga el precio corregido a mano). */
  function conPrecioDeLista(it: ItemPresupuestoInput): ItemPresupuestoInput {
    const calc = it.calculoPrecio
    if (!calc || calc.precioManual || listaRS.length === 0) return it
    const r = recalcularFila({ ancho: it.ancho, alto: it.alto, calculoPrecio: calc }, listaRS)
    if (!r) return it
    return conSubtotal({
      ...it,
      precioUnitario: r.precio ?? 0,
      calculoPrecio: {
        ...calc,
        opciones: r.opciones,
        desglose: r.desglose,
        formula: r.formula,
        precioCalculado: r.precio,
        avisos: r.avisos,
        avisoActualizacion: null,
      },
    })
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
      const original = copia[index]
      let actual: ItemPresupuestoInput = { ...original, [campo]: valor }

      // Precio tocado a mano en una fila calculada con la lista: queda "corregido a mano"
      if (campo === "precioUnitario" && actual.calculoPrecio) {
        actual.calculoPrecio = {
          ...actual.calculoPrecio,
          precioManual: Number(valor) !== actual.calculoPrecio.precioCalculado,
          avisoActualizacion: null,
        }
      }
      // Recalcular subtotal del ítem si cambió cantidad o precioUnitario
      if (campo === "cantidad" || campo === "precioUnitario") {
        actual = conSubtotal(actual)
      }
      if (campo === "ancho" || campo === "alto") actual = conPrecioDeLista(actual)
      copia[index] = actual

      // El nombre de la opción lo comparten todas las cortinas de esa opción en la capa
      if (campo === "nombreOpcion" && original.capa && original.grupoAlternativa) {
        copia.forEach((o, i) => {
          if (i !== index && mismaOpcion(o, original)) copia[i] = { ...o, nombreOpcion: String(valor) }
        })
      }

      // Las alternativas comparten ambiente y medidas con la principal
      const camposCompartidos: (keyof ItemPresupuestoInput)[] = [
        "ambiente",
        "descripcion",
        "ancho",
        "alto",
        "cantidad",
      ]
      if (
        actual.grupoAlternativa &&
        actual.esOpcionPrincipal !== false &&
        camposCompartidos.includes(campo)
      ) {
        copia.forEach((otro, i) => {
          if (i === index || otro.grupoAlternativa !== actual.grupoAlternativa) return
          if (original.capa) {
            // Capa: el ambiente es de toda la capa; las medidas, de la misma cortina en cada alternativa
            if (campo === "descripcion") return
            if (
              campo !== "ambiente" &&
              (otro.esOpcionPrincipal !== false || otro.indiceCortina !== original.indiceCortina)
            ) {
              return
            }
          }
          let alt: ItemPresupuestoInput = { ...otro, [campo]: valor }
          if (campo === "ancho" || campo === "alto") alt = conPrecioDeLista(alt)
          copia[i] = conSubtotal(alt)
        })
      }
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
        esOpcionPrincipal: true,
      },
    ])
  }

  function handleEliminarItem(index: number) {
    if (items.length <= 1) return
    const eliminado = items[index]
    if (!eliminado) return

    setItems((prev) => {
      // Una alternativa de una capa se quita entera (todas sus cortinas)
      const seQuita = (o: ItemPresupuestoInput, i: number) =>
        i === index ||
        (Boolean(eliminado.capa) && eliminado.esOpcionPrincipal === false && mismaOpcion(o, eliminado))
      let resto = prev.filter((o, i) => !seQuita(o, i))
      const grupo = eliminado.grupoAlternativa
      if (!grupo) return resto

      const delGrupo = resto.filter((it) => it.grupoAlternativa === grupo)
      if (delGrupo.length === 0) return resto
      // Si no quedó opción principal, la siguiente opción pasa a ser principal
      if (!delGrupo.some((o) => o.esOpcionPrincipal !== false)) {
        const nueva = claveOpcionFila(delGrupo[0])
        resto = resto.map((it) =>
          it.grupoAlternativa === grupo && claveOpcionFila(it) === nueva
            ? { ...it, esOpcionPrincipal: true }
            : it
        )
      }
      // Si queda una sola opción, deja de tener alternativas (las filas de capa siguen agrupadas)
      if (cantidadOpciones(resto, grupo) === 1) {
        resto = resto.map((it) =>
          it.grupoAlternativa === grupo
            ? {
                ...it,
                grupoAlternativa: it.capa ? grupo : null,
                nombreOpcion: null,
                esOpcionPrincipal: true,
              }
            : it
        )
      }
      return resto
    })
  }

  // ── Alternativas ──

  /** Cortina de la medición vinculada a un ítem del presupuesto */
  function buscarItemMedicion(itemMedicionId?: string | null) {
    if (!itemMedicionId) return null
    for (const m of medicionesDisponibles) {
      for (const amb of m.ambientes) {
        const encontrado = amb.items.find((it) => it.id === itemMedicionId)
        if (encontrado) return encontrado
      }
    }
    return null
  }

  function abrirNuevaAlternativa(indexPrincipal: number) {
    setNombreOpcionNueva("")
    setNombreOpcionPrincipal(items[indexPrincipal]?.nombreOpcion || "")
    setErrorAlternativa(null)
    setEditorAlternativa({ modo: "nueva", indexPrincipal })
  }

  function abrirEditarAlternativa(index: number) {
    setNombreOpcionNueva(items[index]?.nombreOpcion || "")
    setErrorAlternativa(null)
    setEditorAlternativa({ modo: "editar", index })
  }

  /** Datos con los que se precarga el formulario de cortina */
  function itemInicialEditor(): Partial<IItemMedicion> | null {
    if (!editorAlternativa) return null
    const idx =
      editorAlternativa.modo === "nueva" ? editorAlternativa.indexPrincipal : editorAlternativa.index
    const it = items[idx]
    if (!it) return null
    const medido = buscarItemMedicion(it.itemMedicionId)
    const carac = (it.caracteristicas ?? medido?.caracteristicas ?? null) as ICaracteristicasItem | null
    return {
      descripcion: medido?.descripcion || it.descripcion,
      ancho: medido?.ancho ?? it.ancho,
      alto: medido?.alto ?? it.alto,
      cantidad: medido?.cantidad ?? it.cantidad,
      caracteristicas: carac,
      observaciones: medido?.observaciones ?? null,
    }
  }

  /** Filas de una alternativa de capa: las cortinas de esa capa según la especificación nueva */
  function filasAlternativaCapa(
    principal: ItemPresupuestoInput,
    carac: Record<string, unknown> | null,
    nombre: string,
    grupo: string
  ): ItemPresupuestoInput[] {
    const medido = buscarItemMedicion(principal.itemMedicionId)
    const abertura = {
      id: principal.itemMedicionId || "",
      descripcion: medido?.descripcion || principal.descripcion,
      ancho: medido?.ancho ?? principal.ancho,
      alto: medido?.alto ?? principal.alto,
      cantidad: 1,
      caracteristicas: medido?.caracteristicas ?? carac,
    }
    return filasDeAbertura(
      abertura,
      principal.ambiente || "General",
      listaRS,
      { caracteristicas: carac, nombreOpcion: nombre, esOpcionPrincipal: false },
      principal.capa
    ).map((f) => ({ ...f, itemMedicionId: principal.itemMedicionId ?? null, grupoAlternativa: grupo }))
  }

  function guardarAlternativa(cortina: Partial<IItemMedicion>) {
    if (!editorAlternativa) return
    const nombre = nombreOpcionNueva.trim()
    if (!nombre) {
      setErrorAlternativa("Poné un nombre a esta opción (ej: Barral, Blackout).")
      return
    }
    const carac = (cortina.caracteristicas ?? null) as Record<string, unknown> | null

    if (editorAlternativa.modo === "editar") {
      const idx = editorAlternativa.index
      const actual = items[idx]
      const repetido = items.some(
        (o, i) =>
          i !== idx &&
          o.grupoAlternativa === actual?.grupoAlternativa &&
          !(actual && mismaOpcion(o, actual)) &&
          (o.nombreOpcion || "").trim().toLowerCase() === nombre.toLowerCase()
      )
      if (repetido) {
        setErrorAlternativa("Ya hay otra opción con ese nombre en esta cortina.")
        return
      }
      if (actual?.capa && actual.grupoAlternativa) {
        // Alternativa de capa: se regeneran sus cortinas con la especificación nueva
        const nuevas = filasAlternativaCapa(actual, carac, nombre, actual.grupoAlternativa)
        if (nuevas.length === 0) {
          setErrorAlternativa(`La especificación no tiene ${NOMBRE_CAPA[actual.capa] || "esta capa"}.`)
          return
        }
        setItems((prev) => {
          const posicion = prev.findIndex((o) => mismaOpcion(o, actual))
          const resto = prev.filter((o) => !mismaOpcion(o, actual))
          resto.splice(Math.max(0, posicion), 0, ...nuevas)
          return resto
        })
        setEditorAlternativa(null)
        return
      }
      setItems((prev) =>
        prev.map((it, i) =>
          i === idx ? { ...it, nombreOpcion: nombre, caracteristicas: carac } : it
        )
      )
      setEditorAlternativa(null)
      return
    }

    const idxPrincipal = editorAlternativa.indexPrincipal
    const principal = items[idxPrincipal]
    if (!principal) return
    const nombrePrincipal = (principal.nombreOpcion || nombreOpcionPrincipal).trim()
    if (!nombrePrincipal) {
      setErrorAlternativa("Poné también un nombre a la opción principal (ej: Riel).")
      return
    }
    const grupo = principal.grupoAlternativa || nuevoGrupoId()
    const opcionesGrupo = principal.grupoAlternativa
      ? items.filter((o) => o.grupoAlternativa === grupo)
      : [principal]
    if (cantidadOpciones(opcionesGrupo, grupo) >= MAX_OPCIONES_POR_CORTINA) {
      setErrorAlternativa(`Máximo ${MAX_OPCIONES_POR_CORTINA} opciones por cortina.`)
      return
    }
    const nombresUsados = [
      nombrePrincipal,
      ...opcionesGrupo.filter((o) => o.esOpcionPrincipal === false).map((o) => o.nombreOpcion || ""),
    ]
    if (nombresUsados.some((n) => n.trim().toLowerCase() === nombre.toLowerCase())) {
      setErrorAlternativa("Ya hay otra opción con ese nombre en esta cortina.")
      return
    }

    if (principal.capa) {
      // Alternativa de capa: todas las cortinas de la capa con la especificación nueva
      const nuevas = filasAlternativaCapa(principal, carac, nombre, grupo)
      if (nuevas.length === 0) {
        setErrorAlternativa(`La especificación no tiene ${NOMBRE_CAPA[principal.capa] || "esta capa"}.`)
        return
      }
      setItems((prev) => {
        const copia = prev.map((it) =>
          it.grupoAlternativa === grupo && it.esOpcionPrincipal !== false
            ? { ...it, nombreOpcion: nombrePrincipal }
            : it
        )
        let posicion = idxPrincipal
        copia.forEach((it, i) => {
          if (it.grupoAlternativa === grupo) posicion = Math.max(posicion, i)
        })
        copia.splice(posicion + 1, 0, ...nuevas)
        return copia
      })
      setEditorAlternativa(null)
      return
    }

    const nuevaOpcion: ItemPresupuestoInput = {
      itemMedicionId: principal.itemMedicionId ?? null,
      descripcion: principal.descripcion,
      ambiente: principal.ambiente,
      ancho: principal.ancho,
      alto: principal.alto,
      cantidad: principal.cantidad,
      precioUnitario: 0,
      subtotal: 0,
      aceptado: false,
      caracteristicas: carac,
      grupoAlternativa: grupo,
      nombreOpcion: nombre,
      esOpcionPrincipal: false,
    }

    setItems((prev) => {
      const copia = prev.map((it, i) =>
        i === idxPrincipal ? { ...it, grupoAlternativa: grupo, nombreOpcion: nombrePrincipal } : it
      )
      // Insertar después de la última opción de esta cortina
      let posicion = idxPrincipal
      copia.forEach((it, i) => {
        if (it.grupoAlternativa === grupo) posicion = Math.max(posicion, i)
      })
      copia.splice(posicion + 1, 0, nuevaOpcion)
      return copia
    })
    setEditorAlternativa(null)
  }

  const totalesPorOpcion = calcularTotalesPorOpcion(items, descuento)

  // Cálculos de Totales (solo suman las opciones principales)
  const subtotalGeneral = subtotalPrincipales(items)
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

  /** ¿Es la primera fila de su opción? (las demás cortinas de la opción no repiten los controles) */
  function esPrimeraDeOpcion(it: ItemPresupuestoInput, idx: number) {
    if (!it.grupoAlternativa) return true
    return items.findIndex((o) => mismaOpcion(o, it)) === idx
  }

  /** Cantidad de cortinas de la opción (para mostrar el paño / tramo solo si hay más de una) */
  function cortinasDeOpcion(it: ItemPresupuestoInput) {
    return it.grupoAlternativa ? items.filter((o) => mismaOpcion(o, it)).length : 1
  }

  /** Avisos del cálculo con la lista: qué falta elegir, precio corregido a mano, no actualizado */
  function renderAvisosCalculo(it: ItemPresupuestoInput) {
    const calc = it.calculoPrecio
    if (!calc) return null
    return (
      <div className="mt-1 space-y-0.5">
        {calc.avisos.map((a) => (
          <p key={a} className="flex items-start gap-1 text-[11px] font-semibold text-amber-700">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            {a}
          </p>
        ))}
        {calc.precioManual && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Hand className="h-3 w-3 shrink-0" />
            Precio corregido a mano
            {calc.precioCalculado !== null && ` (lista: ${formatearPrecio(calc.precioCalculado)})`}
          </p>
        )}
        {calc.avisoActualizacion && (
          <p className="flex items-start gap-1 text-[11px] font-semibold text-amber-700">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            {calc.avisoActualizacion}
          </p>
        )}
      </div>
    )
  }

  /** Fila compacta de una alternativa (comparte ambiente, cortina y medidas con la principal) */
  function renderFilaAlternativa(it: ItemPresupuestoInput, idx: number) {
    const primera = esPrimeraDeOpcion(it, idx)
    const sufijo = cortinasDeOpcion(it) > 1 ? sufijoCortina(it.capa, it.indiceCortina) : ""
    return (
      <tr key={idx} className="bg-indigo-50/40">
        <td className="py-2 px-2 text-right">
          <CornerDownRight className="ml-auto h-4 w-4 text-indigo-300" />
        </td>
        <td className="py-2 px-2" colSpan={4}>
          <div className="flex flex-wrap items-center gap-2">
            {primera ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                  <GitBranch className="h-3 w-3" />
                  Alternativa
                </span>
                <input
                  type="text"
                  value={it.nombreOpcion || ""}
                  onChange={(e) => handleActualizarItem(idx, "nombreOpcion", e.target.value)}
                  placeholder="Nombre (ej: Barral)"
                  maxLength={40}
                  className="w-40 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-xs font-bold text-indigo-900"
                />
              </>
            ) : (
              <span className="text-[11px] font-bold text-indigo-700">{it.nombreOpcion}</span>
            )}
            <span className="text-[11px] text-slate-500 truncate">
              {it.descripcion}
              {sufijo && ` ${sufijo}`} · {it.ancho} × {it.alto} m
            </span>
            {primera && (
              <button
                type="button"
                onClick={() => abrirEditarAlternativa(idx)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="h-3 w-3" />
                Editar especificación
              </button>
            )}
          </div>
          {renderAvisosCalculo(it)}
        </td>
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
              step="any"
              min="0"
              value={it.precioUnitario}
              onChange={(e) =>
                handleActualizarItem(idx, "precioUnitario", parseFloat(e.target.value) || 0)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-right font-mono font-bold text-slate-900"
            />
          </div>
        </td>
        <td className="py-2 px-2 text-right font-mono font-bold text-slate-500">
          {formatearPrecio(it.subtotal)}
        </td>
        <td className="py-2 px-2 text-center">
          {primera && (
            <button
              type="button"
              onClick={() => handleEliminarItem(idx)}
              title="Quitar alternativa"
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </td>
      </tr>
    )
  }

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
              {items.map((it, idx) =>
                it.esOpcionPrincipal === false ? renderFilaAlternativa(it, idx) : (
                <tr
                  key={idx}
                  className={it.grupoAlternativa ? "bg-indigo-50/20" : "hover:bg-slate-50/50"}
                >
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
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {it.capa && cortinasDeOpcion(it) > 1 && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {sufijoCortina(it.capa, it.indiceCortina)}
                        </span>
                      )}
                      {it.grupoAlternativa && cantidadOpciones(items, it.grupoAlternativa) > 1 && esPrimeraDeOpcion(it, idx) && (
                        <input
                          type="text"
                          value={it.nombreOpcion || ""}
                          onChange={(e) =>
                            handleActualizarItem(idx, "nombreOpcion", e.target.value)
                          }
                          placeholder="Nombre opción (ej: Riel)"
                          maxLength={40}
                          title="Nombre de la opción principal"
                          className="w-40 rounded-lg border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-bold text-indigo-900"
                        />
                      )}
                      {it.tipoFila !== "CONTROL" && it.tipoFila !== "CARGADOR" && esPrimeraDeOpcion(it, idx) && (() => {
                        const cantOpciones = cantidadOpciones(items, it.grupoAlternativa)
                        const lleno = cantOpciones >= MAX_OPCIONES_POR_CORTINA
                        return (
                          <button
                            type="button"
                            onClick={() => abrirNuevaAlternativa(idx)}
                            disabled={lleno}
                            title={
                              lleno
                                ? `Máximo ${MAX_OPCIONES_POR_CORTINA} opciones por cortina`
                                : "Presupuestar esta cortina de otra forma (ej: barral en vez de riel)"
                            }
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <Plus className="h-3 w-3" />
                            {it.capa ? `Agregar alternativa (${NOMBRE_CAPA[it.capa]})` : "Agregar alternativa"}
                          </button>
                        )
                      })()}
                    </div>
                    {renderAvisosCalculo(it)}
                  </td>

                  {it.tipoFila === "CONTROL" || it.tipoFila === "CARGADOR" ? (
                    <td colSpan={2} className="py-2 px-2 text-center text-[11px] text-slate-400">
                      —
                    </td>
                  ) : (<>
                  {/* Ancho */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.001"
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
                      step="0.001"
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
                  </>)}

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
                        step="any"
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
                )
              )}
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

            {items.some((it) => it.esOpcionPrincipal === false) && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <p className="text-[11px] text-slate-500">
                  El total guardado suma las opciones principales. Las alternativas se muestran al
                  cliente para que elija.
                </p>
                {totalesPorOpcion?.map((t) => (
                  <div key={t.nombre} className="flex justify-between font-semibold text-indigo-900">
                    <span>Total con {t.nombre}:</span>
                    <span className="font-mono">{formatearPrecio(t.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL CALCULADORA DE PRECIOS CON FÓRMULAS EXCEL ── */}
      {calculadoraIndex !== null && items[calculadoraIndex] && (
        <PresupuestoCalculadoraModal
          abierto={calculadoraIndex !== null}
          onCerrar={() => setCalculadoraIndex(null)}
          onAplicarPrecio={(precioUnitarioCalculado, calculo) => {
            const indice = calculadoraIndex
            setItems((prev) =>
              prev.map((it, i) => {
                if (i !== indice) return it
                const calculoPrecio =
                  calculo ??
                  (it.calculoPrecio
                    ? {
                        ...it.calculoPrecio,
                        precioManual: precioUnitarioCalculado !== it.calculoPrecio.precioCalculado,
                        avisoActualizacion: null,
                      }
                    : null)
                return conSubtotal({ ...it, precioUnitario: precioUnitarioCalculado, calculoPrecio })
              })
            )
          }}
          calculoInicial={items[calculadoraIndex].calculoPrecio ?? null}
          listaRS={listaRS}
          anchoInicial={items[calculadoraIndex].ancho}
          altoInicial={items[calculadoraIndex].alto}
          cantidadInicial={items[calculadoraIndex].cantidad}
          descripcionInicial={
            items[calculadoraIndex].grupoAlternativa && items[calculadoraIndex].nombreOpcion
              ? `${items[calculadoraIndex].descripcion} (${items[calculadoraIndex].nombreOpcion})`
              : items[calculadoraIndex].descripcion
          }
        />
      )}

      {/* ── MODAL ALTERNATIVA: formulario de cortina precargado con la medición ── */}
      {editorAlternativa && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="my-6 w-full max-w-4xl space-y-3">
            <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-indigo-600" />
                    {editorAlternativa.modo === "nueva" ? "Nueva alternativa" : "Editar alternativa"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cambiá solo lo que difiere de la medición (ej: barral en vez de riel). Las
                    medidas se toman siempre de la medición; la medición no se modifica.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditorAlternativa(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {editorAlternativa.modo === "nueva" &&
                  !items[editorAlternativa.indexPrincipal]?.nombreOpcion && (
                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Nombre de la opción actual (principal)
                      </label>
                      <input
                        type="text"
                        value={nombreOpcionPrincipal}
                        onChange={(e) => setNombreOpcionPrincipal(e.target.value)}
                        placeholder="Ej: Riel, Lino"
                        maxLength={40}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                      />
                    </div>
                  )}
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Nombre de esta alternativa
                  </label>
                  <input
                    type="text"
                    value={nombreOpcionNueva}
                    onChange={(e) => setNombreOpcionNueva(e.target.value)}
                    placeholder="Ej: Barral, Blackout"
                    maxLength={40}
                    className="mt-1 w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-900"
                  />
                </div>
              </div>
              {errorAlternativa && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorAlternativa}</span>
                </div>
              )}
            </div>
            <TelasListaProvider telas={telasMedicion}>
            <CortinaItemForm
              key={
                editorAlternativa.modo === "nueva"
                  ? `nueva-${editorAlternativa.indexPrincipal}`
                  : `editar-${editorAlternativa.index}`
              }
              itemInicial={itemInicialEditor()}
              onGuardar={guardarAlternativa}
              onCancelar={() => setEditorAlternativa(null)}
              textoGuardar={
                editorAlternativa.modo === "nueva" ? "Agregar alternativa" : "Guardar alternativa"
              }
            />
            </TelasListaProvider>
          </div>
        </div>
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
