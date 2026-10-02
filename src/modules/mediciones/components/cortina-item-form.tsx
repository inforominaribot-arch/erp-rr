"use client"

import { useState } from "react"
import {
  TIPOS_CORTINA,
  SISTEMAS_TRADICIONAL,
  COLORES_BARRAL,
  PERFILERIA_NOCHE_TOTAL,
  PERFILERIA_ROLLER,
  PERFILERIA_BANDAS,
  TIPOS_LAMINA_ALUMINIO,
  COLORES_ALUMINIO,
  TIPOS_SUJECION,
  LADOS_MANDO,
  TIPOS_CAIDA,
  MARCAS_CORTINA,
  calcularArgollasGaza,
  calcularCantidadSoportes,
  determinarVarianteSoporte,
  calcularAnchoConfeccionGaza,
  type TipoCortina,
  type IItemMedicion,
  type ICaracteristicasItem,
  type TipoLaminaAluminio,
  type ColorAluminio,
  type LadoMando,
  type SistemaTradicional,
  type ColorBarral,
  type TipoSujecion,
  type TipoCaida,
  type MarcaCortina,
} from "../types"
import { CortinaDibujoDidactico } from "./cortina-dibujo-didactico"
import {
  Check,
  Sparkles,
  Layers,
  Ruler,
  Info,
  AlertCircle,
} from "lucide-react"

interface CortinaItemFormProps {
  itemInicial?: Partial<IItemMedicion> | null
  onGuardar: (item: Partial<IItemMedicion>) => void
  onCancelar: () => void
}

export function CortinaItemForm({
  itemInicial,
  onGuardar,
  onCancelar,
}: CortinaItemFormProps) {
  const caracInicial = itemInicial?.caracteristicas

  // Identificación y Cantidad
  const [descripcion, setDescripcion] = useState(
    itemInicial?.descripcion || ""
  )
  const [cantidad, setCantidad] = useState<number>(itemInicial?.cantidad || 1)
  const [observaciones, setObservaciones] = useState<string>(
    itemInicial?.observaciones || ""
  )

  // 1 • Tipo de Cortina (sin preselección por defecto)
  const [tipo, setTipo] = useState<TipoCortina | null>(
    caracInicial?.tipo || null
  )

  // ─── Aluminio (sin preselección) ───
  const [tipoLaminaAluminio, setTipoLaminaAluminio] =
    useState<TipoLaminaAluminio | null>(
      caracInicial?.aluminio?.tipoLamina || null
    )
  const [colorAluminio, setColorAluminio] = useState<ColorAluminio | null>(
    caracInicial?.aluminio?.color || null
  )
  const [mandoAluminio, setMandoAluminio] = useState<LadoMando | null>(
    caracInicial?.aluminio?.mando || null
  )
  const [tensorAluminio, setTensorAluminio] = useState<boolean>(
    caracInicial?.aluminio?.tensor !== undefined ? caracInicial.aluminio.tensor : false
  )
  const [anchoAluminio, setAnchoAluminio] = useState<number | "">(
    itemInicial?.ancho || ""
  )
  const [altoAluminio, setAltoAluminio] = useState<number | "">(
    itemInicial?.alto || ""
  )

  // ─── Tradicional (sin preselección) ───
  const [sistemaTradicional, setSistemaTradicional] =
    useState<SistemaTradicional | null>(caracInicial?.sistema || null)
  const [colorBarral, setColorBarral] = useState<ColorBarral | null>(
    caracInicial?.colorBarral || null
  )

  // ─── Perfilería (Roller, Bandas, Noche total, Mosquera, y Tradicional con Roller BO) ───
  const [perfileria, setPerfileria] = useState<string | null>(
    caracInicial?.perfileria || null
  )

  // ─── Campos Comunes (sin preselección) ───
  const [sujecion, setSujecion] = useState<TipoSujecion | null>(
    caracInicial?.sujecion || null
  )
  const [mando, setMando] = useState<LadoMando | null>(
    caracInicial?.mando || null
  )
  const [caida, setCaida] = useState<TipoCaida | null>(
    caracInicial?.caida || null
  )
  const [marca, setMarca] = useState<MarcaCortina | null>(
    caracInicial?.marca || null
  )
  const [tipoSoporte, setTipoSoporte] = useState<"Grampa" | "Kent" | null>(
    caracInicial?.tipoSoporte || null
  )
  const [tipoSoporteRoller, setTipoSoporteRoller] = useState<"Común" | "Extendido">(
    caracInicial?.tipoSoporteRoller || "Común"
  )

  // ─── Límite visible para opciones de botones de paños/cortinas (por default 3, expandible a 4 y 5) ───
  const [maxPanosGazaVisibles, setMaxPanosGazaVisibles] = useState<number>(() => {
    const p = caracInicial?.gaza?.panos || 1
    return p > 3 ? p : 3
  })
  const [maxTramosBOVisibles, setMaxTramosBOVisibles] = useState<number>(() => {
    const t = caracInicial?.bo?.tramos || 1
    return t > 3 ? t : 3
  })

  // ─── Telas: GAZA y B.O. (sin preselección) ───
  const [gazaActiva, setGazaActiva] = useState(
    Boolean(caracInicial?.gaza?.activa)
  )
  const [anchoGaza, setAnchoGaza] = useState<number | "">(
    caracInicial?.gaza?.ancho || itemInicial?.ancho || ""
  )
  const [altoGaza, setAltoGaza] = useState<number | "">(
    caracInicial?.gaza?.alto || itemInicial?.alto || ""
  )
  const [panosGaza, setPanosGaza] = useState<1 | 2 | 3 | 4 | 5>(
    (caracInicial?.gaza?.panos as 1 | 2 | 3 | 4 | 5) || 1
  )
  const [anchosPanos, setAnchosPanos] = useState<(number | "")[]>(
    caracInicial?.gaza?.anchosPanos || []
  )
  const [nombreTelaGaza, setNombreTelaGaza] = useState(
    caracInicial?.gaza?.nombreTela || ""
  )

  const [boActiva, setBoActiva] = useState(
    Boolean(caracInicial?.bo?.activa)
  )
  const [anchoBO, setAnchoBO] = useState<number | "">(
    caracInicial?.bo?.ancho || itemInicial?.ancho || ""
  )
  const [altoBO, setAltoBO] = useState<number | "">(
    caracInicial?.bo?.alto || itemInicial?.alto || ""
  )
  const [tramosBO, setTramosBO] = useState<1 | 2 | 3 | 4 | 5>(
    (caracInicial?.bo?.tramos as 1 | 2 | 3 | 4 | 5) || 1
  )
  const [anchosTramos, setAnchosTramos] = useState<(number | "")[]>(
    caracInicial?.bo?.anchosTramos || []
  )
  const [nombreTelaBO, setNombreTelaBO] = useState(
    caracInicial?.bo?.nombreTela || ""
  )

  // Formato B.O. (Tradicional vs Roller) para cuando la cortina es Tradicional
  const [formatoBO, setFormatoBO] = useState<"Tradicional" | "Roller">(
    caracInicial?.formatoBO || "Tradicional"
  )
  const [marcaBO, setMarcaBO] = useState<MarcaCortina>(
    caracInicial?.marcaBO || "HD"
  )
  const [mandosRollerBO, setMandosRollerBO] = useState<(LadoMando | null)[]>(() => {
    if (caracInicial?.mandosRollerBO && caracInicial.mandosRollerBO.length > 0) {
      return caracInicial.mandosRollerBO
    }
    const t = caracInicial?.bo?.tramos || 1
    if (t === 1) return ["Derecha"]
    if (t === 2) return ["Izquierda", "Derecha"]
    return [null, null, null, null, null]
  })

  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)

  // Recalcular paños de gaza equitativos
  function handleCambioPanosGaza(cant: 1 | 2 | 3 | 4 | 5, anc: number | "" = anchoGaza) {
    setPanosGaza(cant)
    const numAnc = typeof anc === "number" ? anc : parseFloat(String(anc)) || 0
    if (numAnc > 0) {
      if (cant === 1) {
        setAnchosPanos([numAnc])
      } else {
        const parte = Number((numAnc / cant).toFixed(2))
        const arr = Array(cant).fill(parte)
        const sumaParcial = Number((parte * (cant - 1)).toFixed(2))
        arr[cant - 1] = Number((numAnc - sumaParcial).toFixed(2))
        setAnchosPanos(arr)
      }
    }
  }

  // Actualizar ancho de paño de Gaza individual (sin auto-balance forzado ni alteración de otros paños)
  function handleActualizarAnchoPanoGaza(pIdx: number, val: number | "") {
    const arr = [...anchosPanos]
    arr[pIdx] = val
    setAnchosPanos(arr)
  }

  // Recalcular tramos de BO equitativos
  function handleCambioTramosBO(cant: 1 | 2 | 3 | 4 | 5, anc: number | "" = anchoBO) {
    setTramosBO(cant)
    const numAnc = typeof anc === "number" ? anc : parseFloat(String(anc)) || 0
    if (numAnc > 0) {
      if (cant === 1) {
        setAnchosTramos([numAnc])
      } else {
        const parte = Number((numAnc / cant).toFixed(2))
        const arr = Array(cant).fill(parte)
        const sumaParcial = Number((parte * (cant - 1)).toFixed(2))
        arr[cant - 1] = Number((numAnc - sumaParcial).toFixed(2))
        setAnchosTramos(arr)
      }
    }

    // Regla de Mandos para B.O. Roller:
    // Si son 2 cortinas: por defecto Izquierda y Derecha.
    // Si son más: por defecto null para obligar a seleccionar.
    // Si es 1 cortina: por defecto Derecha.
    if (cant === 1) {
      setMandosRollerBO(["Derecha"])
    } else if (cant === 2) {
      setMandosRollerBO(["Izquierda", "Derecha"])
    } else {
      setMandosRollerBO(Array(cant).fill(null))
    }
  }

  function handleActualizarMandoRollerBO(cIdx: number, val: LadoMando) {
    const arr = [...mandosRollerBO]
    arr[cIdx] = val
    setMandosRollerBO(arr)
  }

  // Actualizar ancho de tramo/cortina de BO individual (sin auto-balance forzado ni alteración de otros tramos)
  function handleActualizarAnchoTramoBO(tIdx: number, val: number | "") {
    const arr = [...anchosTramos]
    arr[tIdx] = val
    setAnchosTramos(arr)
  }

  // Ancho y alto efectivos calculados para la abertura
  const esTipoDirecto = tipo === "Mosquera" || tipo === "Roller Noche total" || tipo === "Noche total"

  const anchoEfectivo =
    tipo === "Aluminio"
      ? (typeof anchoAluminio === "number" ? anchoAluminio : 0)
      : esTipoDirecto
      ? anchosTramos.length > 0
        ? Number(anchosTramos.slice(0, tramosBO).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2))
        : 0
      : tipo === "Tradicional"
      ? (gazaActiva
          ? (typeof anchoGaza === "number" ? anchoGaza : 0)
          : formatoBO === "Roller"
          ? Number(anchosTramos.slice(0, tramosBO).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2))
          : (typeof anchoBO === "number" ? anchoBO : 0))
      : (gazaActiva && anchosPanos.length > 0
          ? Number(anchosPanos.slice(0, panosGaza).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2))
          : boActiva && anchosTramos.length > 0
          ? Number(anchosTramos.slice(0, tramosBO).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2))
          : 0)

  const altoEfectivo =
    tipo === "Aluminio"
      ? (typeof altoAluminio === "number" ? altoAluminio : 0)
      : esTipoDirecto
      ? (typeof altoBO === "number" ? altoBO : 0)
      : gazaActiva
      ? (typeof altoGaza === "number" ? altoGaza : 0)
      : boActiva
      ? (typeof altoBO === "number" ? altoBO : 0)
      : 0

  // Cálculo automático de la cantidad de cortinas para el presupuesto
  const cantidadCortinasCalculada = (() => {
    if (tipo === "Aluminio") return 1
    if (esTipoDirecto) return Number(tramosBO) || 1
    if (tipo === "Tradicional") {
      if (gazaActiva && boActiva) {
        if (formatoBO === "Roller") {
          return 1 + (Number(tramosBO) || 1)
        }
        return 2
      }
      if (gazaActiva) return 1
      if (boActiva) {
        if (formatoBO === "Roller") return Number(tramosBO) || 1
        return 1
      }
      return 1
    }
    // Para Roller, Bandas: suma de cortinas Gaza + cortinas BO
    let cant = 0
    if (gazaActiva) cant += Number(panosGaza) || 1
    if (boActiva) cant += Number(tramosBO) || 1
    return cant > 0 ? cant : 1
  })()

  // Objeto de características en tiempo real
  const caracteristicasActuales: ICaracteristicasItem | null = tipo
    ? {
        tipo,
        aluminio:
          tipo === "Aluminio" && tipoLaminaAluminio && colorAluminio && mandoAluminio
            ? {
                tipoLamina: tipoLaminaAluminio,
                color: colorAluminio,
                mando: mandoAluminio,
                tensor: tensorAluminio !== null ? tensorAluminio : undefined,
              }
            : undefined,
        sistema: tipo === "Tradicional" ? sistemaTradicional || undefined : undefined,
        colorBarral:
          tipo === "Tradicional" && sistemaTradicional === "Barral"
            ? colorBarral || undefined
            : undefined,
        perfileria:
          (tipo !== "Tradicional" && tipo !== "Aluminio") ||
          (tipo === "Tradicional" && boActiva && formatoBO === "Roller")
            ? perfileria || undefined
            : undefined,
        sujecion: tipo !== "Aluminio" ? sujecion || undefined : undefined,
        // Tradicional: si el B.O. es Roller, lleva mando y marca para ese B.O.
        formatoBO: tipo === "Tradicional" && boActiva ? formatoBO : undefined,
        marcaBO: tipo === "Tradicional" && boActiva && formatoBO === "Roller" ? (marcaBO || undefined) : undefined,
        mandoBO: tipo === "Tradicional" && boActiva && formatoBO === "Roller" ? (mandosRollerBO[0] || undefined) : undefined,
        mandosRollerBO:
          tipo === "Tradicional" && boActiva && formatoBO === "Roller"
            ? (mandosRollerBO.slice(0, tramosBO).filter(Boolean) as LadoMando[])
            : undefined,
        mando:
          tipo === "Tradicional"
            ? (boActiva && formatoBO === "Roller" ? (mandosRollerBO[0] || undefined) : undefined)
            : tipo === "Aluminio"
            ? mandoAluminio || undefined
            : mando || undefined,
        caida: tipo !== "Aluminio" && tipo !== "Mosquera" && (boActiva || esTipoDirecto) ? caida || undefined : undefined,
        marca:
          tipo === "Tradicional"
            ? (boActiva && formatoBO === "Roller" ? (marcaBO || undefined) : undefined)
            : tipo === "Mosquera"
            ? "MG"
            : tipo !== "Aluminio"
            ? marca || undefined
            : undefined,
        // Soportes Kent / Grampa: SOLO EN TRADICIONAL
        tipoSoporte: tipo === "Tradicional" ? tipoSoporte || undefined : undefined,
        varianteSoporte: tipo === "Tradicional" ? determinarVarianteSoporte(gazaActiva, boActiva, formatoBO) : undefined,
        cantidadSoportes: tipo === "Tradicional" ? calcularCantidadSoportes(anchoEfectivo) : undefined,
        // Soporte Roller: Común / Extendido
        tipoSoporteRoller:
          tipo === "Roller" || (tipo === "Tradicional" && boActiva && formatoBO === "Roller")
            ? tipoSoporteRoller || undefined
            : undefined,
        gaza:
          tipo !== "Aluminio" && !esTipoDirecto && gazaActiva
            ? {
                activa: true,
                ancho: tipo === "Tradicional"
                  ? (typeof anchoGaza === "number" ? anchoGaza : 0)
                  : Number(anchosPanos.slice(0, panosGaza).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2)),
                alto: typeof altoGaza === "number" ? altoGaza : 0,
                panos: panosGaza,
                anchosPanos: anchosPanos.slice(0, panosGaza).map((v) => (typeof v === "number" ? v : 0)),
                nombreTela: nombreTelaGaza,
              }
            : undefined,
        bo:
          tipo !== "Aluminio" && (boActiva || esTipoDirecto)
            ? {
                activa: true,
                ancho: esTipoDirecto || (tipo === "Tradicional" && formatoBO === "Roller")
                  ? Number(anchosTramos.slice(0, tramosBO).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2))
                  : tipo === "Tradicional"
                  ? (typeof anchoBO === "number" ? anchoBO : 0)
                  : Number(anchosTramos.slice(0, tramosBO).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2)),
                alto: typeof altoBO === "number" ? altoBO : 0,
                tramos: tramosBO,
                anchosTramos: anchosTramos.slice(0, tramosBO).map((v) => (typeof v === "number" ? v : 0)),
                nombreTela: tipo === "Mosquera" ? "Tela Mosquera" : nombreTelaBO,
                mandosRoller:
                  tipo === "Tradicional" && formatoBO === "Roller"
                    ? (mandosRollerBO.slice(0, tramosBO).filter(Boolean) as LadoMando[])
                    : undefined,
              }
            : undefined,
        cantidadArgollas:
          gazaActiva && tipo === "Tradicional"
            ? calcularArgollasGaza(typeof anchoGaza === "number" ? anchoGaza : 0)
            : undefined,
        anchoConfeccionGaza: gazaActiva && tipo === "Tradicional"
          ? calcularAnchoConfeccionGaza(typeof anchoGaza === "number" ? anchoGaza : 0)
          : undefined,
      }
    : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorValidacion(null)

    if (!descripcion.trim()) {
      setErrorValidacion("Ingresá un nombre o identificación para la cortina.")
      return
    }

    if (!tipo) {
      setErrorValidacion("Tenés que seleccionar el Tipo de Cortina.")
      return
    }

    if (tipo === "Aluminio") {
      if (!anchoAluminio || anchoAluminio <= 0 || !altoAluminio || altoAluminio <= 0) {
        setErrorValidacion("Ingresá el Ancho y Alto de la cortina de aluminio.")
        return
      }
    } else if (esTipoDirecto) {
      // Validaciones para Mosquera y Roller Noche Total
      if (!altoBO || altoBO <= 0) {
        setErrorValidacion(`Ingresá el Alto de la cortina (${tipo}).`)
        return
      }
      for (let i = 0; i < tramosBO; i++) {
        if (!anchosTramos[i] || (anchosTramos[i] as number) <= 0) {
          setErrorValidacion(
            tramosBO === 1
              ? `Ingresá el Ancho de la cortina (${tipo}).`
              : `Ingresá el Ancho de la Cortina ${i + 1} (${tipo}).`
          )
          return
        }
      }
    } else {
      if (!gazaActiva && !boActiva) {
        setErrorValidacion("Tenés que activar al menos una tela (GAZA o B.O.).")
        return
      }

      // Validaciones para Gaza
      if (gazaActiva) {
        if (!altoGaza || altoGaza <= 0) {
          setErrorValidacion("Ingresá el Alto para la GAZA.")
          return
        }
        if (tipo === "Tradicional") {
          if (!anchoGaza || anchoGaza <= 0) {
            setErrorValidacion("Ingresá el Ancho Total para la GAZA.")
            return
          }
          if (panosGaza > 1) {
            const suma = Number(
              anchosPanos
                .slice(0, panosGaza)
                .reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0)
                .toFixed(2)
            )
            const numAnchoGaza = typeof anchoGaza === "number" ? anchoGaza : parseFloat(String(anchoGaza)) || 0
            if (Math.abs(suma - numAnchoGaza) > 0.02) {
              setErrorValidacion(
                `La suma de los paños de Gaza (${suma.toFixed(2)} m) debe ser exactamente igual al Ancho Total (${numAnchoGaza.toFixed(2)} m). Podés tocar "Centrar" para ajustarlos.`
              )
              return
            }
          }
        } else {
          // En Roller / Bandas: cada cortina tiene su ancho individual
          for (let i = 0; i < panosGaza; i++) {
            if (!anchosPanos[i] || (anchosPanos[i] as number) <= 0) {
              setErrorValidacion(`Ingresá el Ancho de la Cortina ${i + 1} de Gaza.`)
              return
            }
          }
        }
      }

      // Validaciones para B.O.
      if (boActiva) {
        if (!altoBO || altoBO <= 0) {
          setErrorValidacion("Ingresá el Alto para el B.O.")
          return
        }
        if (tipo === "Tradicional") {
          if (formatoBO === "Roller") {
            // Cada cortina Roller de BO tiene su ancho individual (sin ancho total)
            for (let i = 0; i < tramosBO; i++) {
              if (!anchosTramos[i] || (anchosTramos[i] as number) <= 0) {
                setErrorValidacion(`Ingresá el Ancho de la Cortina ${i + 1} de B.O. Roller.`)
                return
              }
              if (!mandosRollerBO[i]) {
                setErrorValidacion(
                  `Tenés que seleccionar el lado del mando (Izquierda o Derecha) para la Cortina ${i + 1} de B.O. Roller.`
                )
                return
              }
            }
          } else {
            // Tradicional Taller: Ancho Total + tramos
            if (!anchoBO || anchoBO <= 0) {
              setErrorValidacion("Ingresá el Ancho Total para el B.O.")
              return
            }
            if (tramosBO > 1) {
              const suma = Number(
                anchosTramos
                  .slice(0, tramosBO)
                  .reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0)
                  .toFixed(2)
              )
              const numAnchoBO = typeof anchoBO === "number" ? anchoBO : parseFloat(String(anchoBO)) || 0
              if (Math.abs(suma - numAnchoBO) > 0.02) {
                setErrorValidacion(
                  `La suma de los tramos de B.O. (${suma.toFixed(2)} m) debe ser exactamente igual al Ancho Total (${numAnchoBO.toFixed(2)} m). Podés tocar "Centrar" para ajustarlos.`
                )
                return
              }
            }
          }
        } else {
          // En Roller / Bandas: cada cortina tiene su ancho individual
          for (let i = 0; i < tramosBO; i++) {
            if (!anchosTramos[i] || (anchosTramos[i] as number) <= 0) {
              setErrorValidacion(`Ingresá el Ancho de la Cortina ${i + 1} de B.O.`)
              return
            }
          }
        }
      }
    }

    onGuardar({
      id: itemInicial?.id,
      descripcion: descripcion.trim(),
      ancho: anchoEfectivo,
      alto: altoEfectivo,
      cantidad: cantidadCortinasCalculada,
      caracteristicas: caracteristicasActuales,
      observaciones: observaciones.trim() || null,
    })
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* ── PARTE SUPERIOR: Identificación de la Cortina ── */}
      <div className="border-b border-slate-100 pb-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Identificación de la Cortina o Abertura
          </label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Ventanal Frente, Ventana Izquierda, Dormitorio 1"
            required
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {errorValidacion && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorValidacion}</span>
        </div>
      )}

      {/* ── PASO 1: Tipo de Cortina (Primer paso obligatorio) ── */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          1 • Tipo de Cortina
        </label>
        <p className="mt-0.5 text-xs text-slate-400">
          Seleccioná un tipo para desplegar sus opciones correspondientes
        </p>

        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TIPOS_CORTINA.map((t) => {
            const activo =
              tipo === t ||
              (t === "Roller Noche total" && tipo === "Noche total")
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipo(t)
                  setErrorValidacion(null)
                }}
                className={`min-h-[48px] flex items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold transition text-center ${
                  activo
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                    : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {t === "Roller Noche total" ? "Roller Noche Total" : t}
              </button>
            )
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* FLUJO PROGRESIVO: SI SELECCIONÓ ALUMINIO                                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tipo === "Aluminio" && (
        <div className="space-y-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 animate-in fade-in duration-150">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
            Especificaciones de Aluminio (Persiana Veneciana)
          </h4>

          {/* Tipo de lámina */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Tipo de Lámina:
            </label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {TIPOS_LAMINA_ALUMINIO.map((lam) => (
                <button
                  key={lam}
                  type="button"
                  onClick={() => setTipoLaminaAluminio(lam)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold border transition ${
                    tipoLaminaAluminio === lam
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {lam}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          {tipoLaminaAluminio && (
            <div className="animate-in fade-in duration-100">
              <label className="block text-xs font-bold text-slate-700">
                Color de Aluminio:
              </label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {COLORES_ALUMINIO.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColorAluminio(col)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                      colorAluminio === col
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mando */}
          {colorAluminio && (
            <div className="animate-in fade-in duration-100">
              <label className="block text-xs font-bold text-slate-700">
                Lado de Mando:
              </label>
              <div className="mt-1.5 flex gap-2 max-w-xs">
                {(["Izquierdo", "Derecho"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMandoAluminio(m)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold border transition ${
                      mandoAluminio === m
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opción de Tensor (Informativo para administración) */}
          {colorAluminio && (
            <div className="animate-in fade-in duration-100 pt-2 border-t border-indigo-100">
              <label className="block text-xs font-bold text-slate-700">
                Tensor:
              </label>
              <p className="text-[11px] text-slate-400">
                Informativo para encargar la cortina
              </p>
              <div className="mt-1.5 flex gap-2 max-w-xs">
                {[
                  { label: "SÍ", valor: true },
                  { label: "NO", valor: false },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setTensorAluminio(opt.valor)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold border transition ${
                      tensorAluminio === opt.valor
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medidas de la persiana de aluminio */}
          {mandoAluminio && (
            <div className="grid grid-cols-2 gap-3 max-w-sm pt-2 border-t border-indigo-100 animate-in fade-in duration-100">
              <div>
                <label className="block text-xs font-bold text-sky-900">
                  Ancho (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={anchoAluminio}
                  onChange={(e) =>
                    setAnchoAluminio(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                  }
                  placeholder="0.00"
                  required
                  className="mt-1 block w-full rounded-lg border border-sky-300 bg-sky-50/70 p-2.5 text-sm font-bold text-sky-950 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900">
                  Alto (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={altoAluminio}
                  onChange={(e) =>
                    setAltoAluminio(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                  }
                  placeholder="0.00"
                  required
                  className="mt-1 block w-full rounded-lg border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* FLUJO PROGRESIVO: SI SELECCIONÓ TRADICIONAL O ROLLER / BANDAS / NOCHE TOTAL / MOSQUERA */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tipo && tipo !== "Aluminio" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* ── PASO 2: Marca (para Roller, Bandas, Noche total) antes de perfilería ── */}
          {tipo !== "Tradicional" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2 • Marca de Proveedor
              </label>
              {tipo === "Mosquera" ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs">
                    MG
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (Marca predeterminada para Mosquera)
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 max-w-sm">
                  {MARCAS_CORTINA.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMarca(m)
                        // Si cambia de RS a otra marca y tenía seleccionado Gris o Beige, reajustar
                        if (m !== "RS" && (perfileria === "Gris" || perfileria === "Beige")) {
                          setPerfileria("Blanco")
                        }
                      }}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition ${
                        marca === m
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PASO 3: Sistema (si es Tradicional) o Perfilería (si es otro) ── */}
          {tipo === "Tradicional" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2 • Sistema Tradicional (Riel o Barral)
              </label>

              <div className="flex gap-2 max-w-sm">
                {SISTEMAS_TRADICIONAL.map((sis) => (
                  <button
                    key={sis}
                    type="button"
                    onClick={() => {
                      setSistemaTradicional(sis)
                      if (sis === "Riel") setColorBarral(null)
                    }}
                    className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition ${
                      sistemaTradicional === sis
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {sis}
                  </button>
                ))}
              </div>

              {/* Si eligió Barral: color del barral */}
              {sistemaTradicional === "Barral" && (
                <div className="pt-2 border-t border-slate-200/80 animate-in fade-in duration-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Acabado / Color del Barral:
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {COLORES_BARRAL.map((cb) => (
                      <button
                        key={cb}
                        type="button"
                        onClick={() => setColorBarral(cb)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                          colorBarral === cb
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {cb}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Perfilería para Roller, Bandas, Roller Noche total, Mosquera */
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3 • Perfilería ({tipo === "Roller Noche total" ? "Roller Noche Total" : tipo})
              </label>
              <div className="flex flex-wrap gap-2">
                {(tipo === "Roller Noche total" || tipo === "Noche total" || tipo === "Mosquera"
                  ? PERFILERIA_NOCHE_TOTAL
                  : marca === "RS"
                  ? (["Blanco", "Negro", "Gris", "Beige"] as const)
                  : (["Blanco", "Negro"] as const)
                ).map((perf) => (
                  <button
                    key={perf}
                    type="button"
                    onClick={() => setPerfileria(perf)}
                    className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
                      perfileria === perf
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {perf}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PASOS: Sujeción, Mando, Caída B.O. ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sujeción */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                {tipo === "Tradicional" ? "3 • Sujeción" : "4 • Sujeción"}
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TIPOS_SUJECION.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSujecion(s)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                      sujecion === s
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Mando: NO APARECE SI ES TRADICIONAL. Para Mosquera incluye Sin mando por default */}
            {tipo !== "Tradicional" && (
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  5 • Mando
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(tipo === "Mosquera"
                    ? (["Izquierda", "Derecha", "Sin mando"] as const)
                    : LADOS_MANDO.filter((m) => m === "Izquierda" || m === "Derecha")
                  ).map((m) => {
                    const activo = (mando || (tipo === "Mosquera" ? "Sin mando" : null)) === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMando(m as LadoMando)}
                        className={`flex-1 rounded-lg border py-1.5 px-2 text-xs font-medium transition text-center ${
                          activo
                            ? "border-indigo-600 bg-indigo-600 text-white font-bold"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Caída B.O. - Solo si Black Out está activo y no es Mosquera */}
            {boActiva && tipo !== "Mosquera" && (
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {tipo === "Tradicional" ? "4 • Caída B.O." : "6 • Caída B.O."}
                </label>
                <div className="mt-1.5 flex gap-1.5">
                  {TIPOS_CAIDA.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCaida(c)}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                        caida === c
                          ? "border-indigo-600 bg-indigo-600 text-white font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Soportes: Grampa o Kent (Tradicional) / Común o Extendido (Roller o Tradicional Roller BO) ── */}
          {tipo === "Tradicional" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Modelo de Soporte (Tradicional Taller):
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    {(["Kent", "Grampa"] as const).map((sop) => (
                      <button
                        key={sop}
                        type="button"
                        onClick={() => setTipoSoporte(sop)}
                        className={`rounded-lg border px-4 py-2 text-xs font-bold transition ${
                          tipoSoporte === sop
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {sop}
                      </button>
                    ))}
                  </div>
                </div>

                {tipoSoporte && (
                  <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs">
                    <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="text-slate-600">
                      Cálculo:{" "}
                      <strong className="text-slate-900">
                        {calcularCantidadSoportes(anchoEfectivo)} Soportes {tipoSoporte}{" "}
                        {determinarVarianteSoporte(gazaActiva, boActiva)}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Si dentro de Tradicional el BO es Roller: Soporte Roller Común o Extendido */}
              {boActiva && formatoBO === "Roller" && (
                <div className="pt-3 border-t border-slate-200 animate-in fade-in duration-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Modelo de Soporte para B.O. Roller:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Soporte para el mecanismo Roller en obra
                  </p>
                  <div className="mt-1.5 flex gap-2 max-w-xs">
                    {(["Común", "Extendido"] as const).map((sr) => (
                      <button
                        key={sr}
                        type="button"
                        onClick={() => setTipoSoporteRoller(sr)}
                        className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                          tipoSoporteRoller === sr
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {sr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Soportes Común / Extendido para Tipo Roller directo */}
          {tipo === "Roller" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <label className="block text-xs font-bold text-slate-700">
                Modelo de Soporte Roller:
              </label>
              <div className="mt-1.5 flex gap-2 max-w-xs">
                {(["Común", "Extendido"] as const).map((sr) => (
                  <button
                    key={sr}
                    type="button"
                    onClick={() => setTipoSoporteRoller(sr)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                      tipoSoporteRoller === sr
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {sr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── TELAS & MEDIDAS DE CORTINA ── */}
          {esTipoDirecto ? (
            /* ── SECCIÓN DEDICADA: MOSQUERA Y ROLLER NOCHE TOTAL ── */
            <div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 p-5 shadow-xs animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Medidas de Cortina ({tipo === "Roller Noche total" ? "Roller Noche Total" : tipo})
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {tramosBO === 1
                      ? "1 cortina en esta abertura. Si necesitás más, podés agregar hasta 5."
                      : `${tramosBO} cortinas independientes en esta abertura con el mismo alto.`}
                  </p>
                </div>

                {/* Botón o selector para agregar más cortinas */}
                <div className="flex items-center gap-2">
                  {maxTramosBOVisibles < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        const prox = (Math.min(5, tramosBO + 1)) as 1 | 2 | 3 | 4 | 5
                        setMaxTramosBOVisibles((prev) => Math.min(5, Math.max(prox, prev + 1)))
                        handleCambioTramosBO(prox)
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition shadow-2xs"
                    >
                      + Agregar cortina ({tramosBO < 5 ? tramosBO + 1 : 5})
                    </button>
                  )}
                  {tramosBO > 1 && (
                    <button
                      type="button"
                      onClick={() => handleCambioTramosBO((tramosBO - 1) as 1 | 2 | 3 | 4 | 5)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Botonera de cantidad de cortinas si son más de 1 */}
              {tramosBO > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Cantidad de Cortinas:
                  </label>
                  <div className="flex gap-2 max-w-xs">
                    {([1, 2, 3, 4, 5] as const)
                      .filter((t) => t <= maxTramosBOVisibles)
                      .map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleCambioTramosBO(t)}
                          className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                            tramosBO === t
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {t} {t > 1 ? "cortinas" : "cortina"}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* MEDIDAS: SIEMPRE ANCHO(S) PRIMERO, LUEGO ALTO */}
              <div className="space-y-3.5">
                {tramosBO === 1 ? (
                  /* 1 Sola cortina: Ancho directo + Alto */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-sky-950">
                        Ancho (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={anchosTramos[0] ?? ""}
                        onChange={(e) =>
                          handleActualizarAnchoTramoBO(
                            0,
                            e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                          )
                        }
                        placeholder="0.00"
                        required
                        className="mt-1 block w-full rounded-xl border border-sky-300 bg-sky-50/70 p-2.5 text-sm font-bold text-sky-950 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-950">
                        Alto (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={altoBO}
                        onChange={(e) =>
                          setAltoBO(
                            e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                          )
                        }
                        placeholder="0.00"
                        required
                        className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                    </div>
                  </div>
                ) : (
                  /* Múltiples cortinas: Ancho Cortina 1, Cortina 2... y Alto compartido */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-sky-950 mb-1.5">
                        Ancho de cada Cortina (m):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {Array.from({ length: tramosBO }).map((_, tIdx) => (
                          <div key={tIdx} className="space-y-1">
                            <span className="text-[10px] text-sky-900 font-bold block">
                              Cortina {tIdx + 1}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={anchosTramos[tIdx] ?? ""}
                              onChange={(e) =>
                                handleActualizarAnchoTramoBO(
                                  tIdx,
                                  e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                )
                              }
                              placeholder="0.00"
                              required
                              className="block w-full rounded-lg border border-sky-300 bg-sky-50/70 p-2 text-xs font-bold text-sky-950 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-950">
                        Alto compartido para todas (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={altoBO}
                        onChange={(e) =>
                          setAltoBO(
                            e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                          )
                        }
                        placeholder="0.00"
                        required
                        className="mt-1 block w-full max-w-xs rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                    </div>
                  </div>
                )}

                {/* Si es Roller Noche Total: Campo para ingresar nombre de tela BO */}
                {(tipo === "Roller Noche total" || tipo === "Noche total") && (
                  <div className="pt-2 border-t border-indigo-100">
                    <label className="block text-xs font-bold text-slate-700">
                      Tela B.O.:
                    </label>
                    <input
                      type="text"
                      value={nombreTelaBO}
                      onChange={(e) => setNombreTelaBO(e.target.value)}
                      placeholder="Ej: Black Out Blanco, Texturado Beige"
                      className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── SECCIÓN DUAL GAZA / B.O. (TRADICIONAL, ROLLER, BANDAS) ── */
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Telas & Medidas de Cortina
              </label>
              <p className="text-xs text-slate-400">
                Tocá en GAZA, B.O. o ambas para ingresar sus medidas y paños
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ── TARJETA GAZA ── */}
                <div
                  className={`rounded-2xl border p-4 transition ${
                    gazaActiva
                      ? "border-indigo-300 bg-indigo-50/30 shadow-xs ring-1 ring-indigo-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const nuevo = !gazaActiva
                        setGazaActiva(nuevo)
                        if (nuevo && anchosPanos.length === 0 && Number(anchoGaza) > 0) {
                          handleCambioPanosGaza(panosGaza, anchoGaza)
                        }
                      }}
                      className="flex items-center gap-2 text-sm font-bold text-slate-900"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                          gazaActiva
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {gazaActiva && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span>GAZA</span>
                    </button>

                    {gazaActiva && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                        Activada
                      </span>
                    )}
                  </div>

                  {/* Formulario de Gaza (aparece solo al tocarla) */}
                  {gazaActiva && (
                    <div className="mt-4 space-y-3.5 pt-3 border-t border-indigo-100 animate-in fade-in duration-100">
                      {/* Selector de Cantidad de Paños / Cortinas */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">
                            {tipo === "Tradicional"
                              ? "Cantidad de Paños:"
                              : "Cantidad de Cortinas Gaza:"}
                          </label>
                          {maxPanosGazaVisibles < 5 && (
                            <button
                              type="button"
                              onClick={() =>
                                setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))
                              }
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                            >
                              + Agregar opción ({maxPanosGazaVisibles + 1})
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5 flex gap-1.5">
                          {([1, 2, 3, 4, 5] as const)
                            .filter((p) => p <= maxPanosGazaVisibles)
                            .map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => handleCambioPanosGaza(p)}
                                className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                                  panosGaza === p
                                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {p} {tipo === "Tradicional" ? `paño${p > 1 ? "s" : ""}` : `cortina${p > 1 ? "s" : ""}`}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Ingreso de Anchos (SIEMPRE PRIMERO ANCHO):
                          - Tradicional: Ancho Total + paños si > 1
                          - Roller / Bandas: Ancho individual para cada cortina */}
                      {tipo === "Tradicional" ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-sky-950">
                              Ancho Total Gaza (m)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              value={anchoGaza}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                setAnchoGaza(val)
                                handleCambioPanosGaza(panosGaza, val)
                              }}
                              placeholder="0.00"
                              required
                              className="mt-1 block w-full rounded-xl border border-sky-300 bg-sky-50/70 p-2.5 text-sm font-bold text-sky-950 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-200"
                            />
                          </div>

                          {panosGaza > 1 && (
                            <div className="rounded-xl bg-white p-3 border border-indigo-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-bold text-slate-600">
                                  Medida de cada paño:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleCambioPanosGaza(panosGaza, anchoGaza)}
                                  className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                                >
                                  Centrar
                                </button>
                              </div>
                              <div className="flex gap-2">
                                {Array.from({ length: panosGaza }).map((_, pIdx) => (
                                  <div key={pIdx} className="flex-1">
                                    <span className="text-[10px] text-sky-900 font-bold block">
                                      Paño {pIdx + 1} (m)
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      value={anchosPanos[pIdx] ?? ""}
                                      onChange={(e) =>
                                        handleActualizarAnchoPanoGaza(
                                          pIdx,
                                          e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                        )
                                      }
                                      className="mt-0.5 block w-full rounded-lg border border-sky-300 bg-sky-50/70 p-1.5 text-xs font-bold text-sky-950 focus:border-sky-500 focus:outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* En Roller / Bandas: anchos individuales directos */
                        <div className="rounded-xl bg-white p-3 border border-indigo-100 space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Medida de cada cortina Gaza:
                          </label>
                          <div className="flex gap-2">
                            {Array.from({ length: panosGaza }).map((_, pIdx) => (
                              <div key={pIdx} className="flex-1">
                                <span className="text-[10px] text-sky-900 font-bold block">
                                  Cortina {pIdx + 1} - Ancho (m)
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={anchosPanos[pIdx] ?? ""}
                                  onChange={(e) =>
                                    handleActualizarAnchoPanoGaza(
                                      pIdx,
                                      e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                    )
                                  }
                                  placeholder="0.00"
                                  required
                                  className="mt-0.5 block w-full rounded-lg border border-sky-300 bg-sky-50/70 p-1.5 text-xs font-bold text-sky-950 focus:border-sky-500 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ALTO GAZA (DESPUÉS DEL ANCHO) */}
                      <div>
                        <label className="block text-xs font-bold text-amber-950">
                          Alto Gaza (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={altoGaza}
                          onChange={(e) =>
                            setAltoGaza(
                              e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                            )
                          }
                          placeholder="0.00"
                          required
                          className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                        />
                      </div>

                      {/* Nombre de la tela */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Nombre de la Tela (Gaza)
                        </label>
                        <input
                          type="text"
                          value={nombreTelaGaza}
                          onChange={(e) => setNombreTelaGaza(e.target.value)}
                          placeholder="Ej: Gasa de Lino Blanco, Gasa Pañalera"
                          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── TARJETA B.O. (Black Out) ── */}
                <div
                  className={`rounded-2xl border p-4 transition ${
                    boActiva
                      ? "border-slate-400 bg-slate-100/60 shadow-xs ring-1 ring-slate-300"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const nuevo = !boActiva
                        setBoActiva(nuevo)
                        if (nuevo && anchosTramos.length === 0 && Number(anchoBO) > 0) {
                          handleCambioTramosBO(tramosBO, anchoBO)
                        }
                      }}
                      className="flex items-center gap-2 text-sm font-bold text-slate-900"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                          boActiva
                            ? "border-slate-800 bg-slate-800 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {boActiva && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span>B.O. (Black Out)</span>
                    </button>

                    {boActiva && (
                      <span className="text-[11px] font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                        Activada
                      </span>
                    )}
                  </div>

                  {/* Formulario de BO (aparece solo al tocarla) */}
                  {boActiva && (
                    <div className="mt-4 space-y-3.5 pt-3 border-t border-slate-200 animate-in fade-in duration-100">
                      {/* Formato de Fabricación del B.O. si es Tradicional */}
                      {tipo === "Tradicional" && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Formato de Fabricación del B.O.:
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setFormatoBO("Tradicional")}
                              className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                                formatoBO === "Tradicional"
                                  ? "border-slate-800 bg-slate-800 text-white shadow-xs"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              Tradicional (Taller)
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormatoBO("Roller")}
                              className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                                formatoBO === "Roller"
                                  ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              Roller (Proveedor)
                            </button>
                          </div>

                          {/* Si el B.O. es Roller: Selección de Marca ANTES de Perfilería */}
                          {formatoBO === "Roller" && (
                            <div className="pt-2 mt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-100">
                              <div>
                                <span className="block text-[11px] font-bold text-slate-600">
                                  Marca de Proveedor B.O. Roller:
                                </span>
                                <div className="mt-1 flex gap-1.5 max-w-xs">
                                  {MARCAS_CORTINA.map((m) => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        setMarcaBO(m)
                                        if (m !== "RS" && (perfileria === "Gris" || perfileria === "Beige")) {
                                          setPerfileria("Blanco")
                                        }
                                      }}
                                      className={`flex-1 rounded-md border py-1.5 text-xs font-bold transition ${
                                        marcaBO === m
                                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      {m}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Perfilería para B.O. Roller */}
                              <div>
                                <span className="block text-[11px] font-bold text-slate-600">
                                  Perfilería B.O. Roller:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {(marcaBO === "RS"
                                    ? (["Blanco", "Negro", "Gris", "Beige"] as const)
                                    : (["Blanco", "Negro"] as const)
                                  ).map((perf) => (
                                    <button
                                      key={perf}
                                      type="button"
                                      onClick={() => setPerfileria(perf)}
                                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                                        perfileria === perf
                                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      {perf}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selector de Cantidad de Cortinas / Tramos */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">
                            {tipo === "Tradicional" && formatoBO === "Roller"
                              ? "Cantidad de Cortinas B.O. Roller:"
                              : tipo === "Tradicional"
                              ? "Cantidad de Tramos B.O.:"
                              : "Cantidad de Cortinas B.O.:"}
                          </label>
                          {maxTramosBOVisibles < 5 && (
                            <button
                              type="button"
                              onClick={() =>
                                setMaxTramosBOVisibles((prev) => Math.min(5, prev + 1))
                              }
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                            >
                              + Agregar opción ({maxTramosBOVisibles + 1})
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5 flex gap-1.5">
                          {([1, 2, 3, 4, 5] as const)
                            .filter((t) => t <= maxTramosBOVisibles)
                            .map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleCambioTramosBO(t)}
                                className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                                  tramosBO === t
                                    ? "border-slate-800 bg-slate-800 text-white shadow-xs"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {t} {tipo === "Tradicional" && formatoBO !== "Roller" ? `tramo${t > 1 ? "s" : ""}` : `cortina${t > 1 ? "s" : ""}`}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Ingreso de Anchos (SIEMPRE PRIMERO ANCHO):
                          - Tradicional Taller: Ancho Total + tramos si > 1
                          - Tradicional con Roller BO: SOLO cortinas individuales (NO ancho total)
                          - Roller / Bandas: SOLO cortinas individuales */}
                      {tipo === "Tradicional" && formatoBO !== "Roller" ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-sky-950">
                              Ancho Total B.O. (m)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              value={anchoBO}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                setAnchoBO(val)
                                handleCambioTramosBO(tramosBO, val)
                              }}
                              placeholder="0.00"
                              required
                              className="mt-1 block w-full rounded-xl border border-sky-300 bg-sky-50/70 p-2.5 text-sm font-bold text-sky-950 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-200"
                            />
                          </div>

                          {tramosBO > 1 && (
                            <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-slate-600">
                                  Medida de cada tramo:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleCambioTramosBO(tramosBO, anchoBO)}
                                  className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition shadow-2xs"
                                >
                                  Centrar
                                </button>
                              </div>

                              <div className="flex gap-2">
                                {Array.from({ length: tramosBO }).map((_, tIdx) => (
                                  <div key={tIdx} className="flex-1">
                                    <span className="text-[10px] text-sky-900 font-bold block">
                                      Tramo {tIdx + 1} (m)
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      value={anchosTramos[tIdx] ?? ""}
                                      onChange={(e) =>
                                        handleActualizarAnchoTramoBO(
                                          tIdx,
                                          e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                        )
                                      }
                                      className="mt-0.5 block w-full rounded-lg border border-sky-300 bg-sky-50/70 p-1.5 text-xs font-bold text-sky-950 focus:border-sky-500 focus:outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : tipo === "Tradicional" && formatoBO === "Roller" ? (
                        /* Tradicional con Roller BO: cada cortina individual con su ancho y mando */
                        <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-3">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Medida y Mando de cada cortina Roller:
                          </label>
                          <div className="flex gap-2">
                            {Array.from({ length: tramosBO }).map((_, tIdx) => (
                              <div key={tIdx} className="flex-1 space-y-1.5">
                                <span className="text-[10px] text-sky-900 font-bold block">
                                  Cortina {tIdx + 1} - Ancho (m)
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={anchosTramos[tIdx] ?? ""}
                                  onChange={(e) =>
                                    handleActualizarAnchoTramoBO(
                                      tIdx,
                                      e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                    )
                                  }
                                  placeholder="0.00"
                                  required
                                  className="mt-0.5 block w-full rounded-lg border border-sky-300 bg-sky-50/70 p-1.5 text-xs font-bold text-sky-950 focus:border-sky-500 focus:outline-none"
                                />

                                {/* Mando individual */}
                                <div className="pt-1 border-t border-slate-100">
                                  <span className="text-[9px] font-bold text-slate-500 block mb-1">
                                    Mando C{tIdx + 1}:
                                  </span>
                                  <div className="flex gap-1">
                                    {(["Izquierda", "Derecha"] as const).map((m) => {
                                      const activo = mandosRollerBO[tIdx] === m
                                      return (
                                        <button
                                          key={m}
                                          type="button"
                                          onClick={() => handleActualizarMandoRollerBO(tIdx, m)}
                                          className={`flex-1 rounded border py-1 text-[10px] font-extrabold transition ${
                                            activo
                                              ? "border-indigo-600 bg-indigo-600 text-white shadow-2xs"
                                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          {m === "Izquierda" ? "Izq" : "Der"}
                                        </button>
                                      )
                                    })}
                                  </div>
                                  {!mandosRollerBO[tIdx] && (
                                    <span className="text-[9px] font-bold text-amber-600 block mt-0.5">
                                      * Elegir mando
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* En Roller / Bandas: anchos individuales directos */
                        <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Medida de cada cortina B.O.:
                          </label>
                          <div className="flex gap-2">
                            {Array.from({ length: tramosBO }).map((_, tIdx) => (
                              <div key={tIdx} className="flex-1">
                                <span className="text-[10px] text-sky-900 font-bold block">
                                  Cortina {tIdx + 1} - Ancho (m)
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={anchosTramos[tIdx] ?? ""}
                                  onChange={(e) =>
                                    handleActualizarAnchoTramoBO(
                                      tIdx,
                                      e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                                    )
                                  }
                                  placeholder="0.00"
                                  required
                                  className="mt-0.5 block w-full rounded-lg border border-sky-300 bg-sky-50/70 p-1.5 text-xs font-bold text-sky-950 focus:border-sky-500 focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ALTO B.O. (DESPUÉS DEL ANCHO) */}
                      <div>
                        <label className="block text-xs font-bold text-amber-950">
                          Alto B.O. (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={altoBO}
                          onChange={(e) =>
                            setAltoBO(
                              e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                            )
                          }
                          placeholder="0.00"
                          required
                          className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                        />
                      </div>

                      {/* Nombre de la tela */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Nombre de la Tela (B.O.)
                        </label>
                        <input
                          type="text"
                          value={nombreTelaBO}
                          onChange={(e) => setNombreTelaBO(e.target.value)}
                          placeholder="Ej: Black Out Texturado Gris, Vinílico Blanco"
                          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── OBSERVACIONES DE LA CORTINA ── */}
      {tipo && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Observaciones de Instalación / Abertura
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas técnicas del vano, falsa escuadra, cañerías cercanas, requerimiento de andamio, etc."
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {/* ── DIBUJO DIDÁCTICO CONCEPTUAL AL FINAL DE TODO ── */}
      {tipo && (
        <div className="pt-4 border-t border-slate-100">
          <CortinaDibujoDidactico
            ancho={anchoEfectivo}
            alto={altoEfectivo}
            caracteristicas={caracteristicasActuales}
            esVistaTaller={true}
          />
        </div>
      )}

      {/* ── BOTONES DE ACCIÓN ── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancelar}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-center flex items-center justify-center"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
        >
          <Check className="h-4 w-4" />
          {itemInicial?.id ? "Guardar Cambios de Cortina" : "Agregar Cortina al Ambiente"}
        </button>
      </div>
    </div>
  )
}
