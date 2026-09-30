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
  const [anchoAluminio, setAnchoAluminio] = useState<number>(
    itemInicial?.ancho || 0
  )
  const [altoAluminio, setAltoAluminio] = useState<number>(
    itemInicial?.alto || 0
  )

  // ─── Tradicional (sin preselección) ───
  const [sistemaTradicional, setSistemaTradicional] =
    useState<SistemaTradicional | null>(caracInicial?.sistema || null)
  const [colorBarral, setColorBarral] = useState<ColorBarral | null>(
    caracInicial?.colorBarral || null
  )

  // ─── Perfilería (Roller, Bandas, Noche total) ───
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

  // ─── Telas: GAZA y B.O. (sin preselección) ───
  const [gazaActiva, setGazaActiva] = useState(
    Boolean(caracInicial?.gaza?.activa)
  )
  const [anchoGaza, setAnchoGaza] = useState<number>(
    caracInicial?.gaza?.ancho || itemInicial?.ancho || 0
  )
  const [altoGaza, setAltoGaza] = useState<number>(
    caracInicial?.gaza?.alto || itemInicial?.alto || 0
  )
  const [panosGaza, setPanosGaza] = useState<1 | 2 | 3>(
    caracInicial?.gaza?.panos || 1
  )
  const [anchosPanos, setAnchosPanos] = useState<number[]>(
    caracInicial?.gaza?.anchosPanos || []
  )
  const [nombreTelaGaza, setNombreTelaGaza] = useState(
    caracInicial?.gaza?.nombreTela || ""
  )

  const [boActiva, setBoActiva] = useState(
    Boolean(caracInicial?.bo?.activa)
  )
  const [anchoBO, setAnchoBO] = useState<number>(
    caracInicial?.bo?.ancho || itemInicial?.ancho || 0
  )
  const [altoBO, setAltoBO] = useState<number>(
    caracInicial?.bo?.alto || itemInicial?.alto || 0
  )
  const [tramosBO, setTramosBO] = useState<1 | 2 | 3>(
    caracInicial?.bo?.tramos || 1
  )
  const [anchosTramos, setAnchosTramos] = useState<number[]>(
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
    return [null, null, null]
  })

  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)

  // Recalcular paños de gaza equitativos
  function handleCambioPanosGaza(cant: 1 | 2 | 3, anc = anchoGaza) {
    setPanosGaza(cant)
    if (anc > 0) {
      if (cant === 1) {
        setAnchosPanos([anc])
      } else if (cant === 2) {
        const p1 = Number((anc / 2).toFixed(2))
        const p2 = Number((anc - p1).toFixed(2))
        setAnchosPanos([p1, p2])
      } else {
        const p1 = Number((anc / 3).toFixed(2))
        const p2 = Number((anc / 3).toFixed(2))
        const p3 = Number((anc - p1 - p2).toFixed(2))
        setAnchosPanos([p1, p2, p3])
      }
    }
  }

  // Auto-balance de paños de Gaza al editar individualmente
  function handleActualizarAnchoPanoGaza(pIdx: number, val: number) {
    if (anchoGaza <= 0) {
      const arr = [...anchosPanos]
      arr[pIdx] = val
      setAnchosPanos(arr)
      return
    }

    const valSeguro = Math.max(0.01, Math.min(val, Number((anchoGaza - 0.01).toFixed(2))))

    if (panosGaza === 2) {
      if (pIdx === 0) {
        const otro = Number((anchoGaza - valSeguro).toFixed(2))
        setAnchosPanos([valSeguro, otro])
      } else {
        const otro = Number((anchoGaza - valSeguro).toFixed(2))
        setAnchosPanos([otro, valSeguro])
      }
    } else if (panosGaza === 3) {
      const arr = [...anchosPanos]
      if (pIdx === 0) {
        arr[0] = valSeguro
        const p2 = arr[1] || Number(((anchoGaza - valSeguro) / 2).toFixed(2))
        arr[1] = Math.max(0.01, Math.min(p2, Number((anchoGaza - valSeguro - 0.01).toFixed(2))))
        arr[2] = Number((anchoGaza - arr[0] - arr[1]).toFixed(2))
      } else if (pIdx === 1) {
        arr[1] = valSeguro
        const p1 = arr[0] || Number(((anchoGaza - valSeguro) / 2).toFixed(2))
        arr[0] = Math.max(0.01, Math.min(p1, Number((anchoGaza - valSeguro - 0.01).toFixed(2))))
        arr[2] = Number((anchoGaza - arr[0] - arr[1]).toFixed(2))
      } else {
        arr[2] = valSeguro
        const p1 = arr[0] || Number(((anchoGaza - valSeguro) / 2).toFixed(2))
        arr[0] = Math.max(0.01, Math.min(p1, Number((anchoGaza - valSeguro - 0.01).toFixed(2))))
        arr[1] = Number((anchoGaza - arr[0] - arr[2]).toFixed(2))
      }
      setAnchosPanos(arr)
    } else {
      setAnchosPanos([anchoGaza])
    }
  }

  // Recalcular tramos de BO equitativos
  function handleCambioTramosBO(cant: 1 | 2 | 3, anc = anchoBO) {
    setTramosBO(cant)
    if (anc > 0) {
      if (cant === 1) {
        setAnchosTramos([anc])
      } else if (cant === 2) {
        const t1 = Number((anc / 2).toFixed(2))
        const t2 = Number((anc - t1).toFixed(2))
        setAnchosTramos([t1, t2])
      } else {
        const t1 = Number((anc / 3).toFixed(2))
        const t2 = Number((anc / 3).toFixed(2))
        const t3 = Number((anc - t1 - t2).toFixed(2))
        setAnchosTramos([t1, t2, t3])
      }
    }

    // Regla de Mandos para B.O. Roller:
    // Si son 2 cortinas: por defecto Izquierda y Derecha.
    // Si son 3 cortinas: por defecto ninguno (null) para obligar a seleccionar.
    // Si es 1 cortina: por defecto Derecha.
    if (cant === 1) {
      setMandosRollerBO(["Derecha"])
    } else if (cant === 2) {
      setMandosRollerBO(["Izquierda", "Derecha"])
    } else {
      setMandosRollerBO([null, null, null])
    }
  }

  function handleActualizarMandoRollerBO(cIdx: number, val: LadoMando) {
    const arr = [...mandosRollerBO]
    arr[cIdx] = val
    setMandosRollerBO(arr)
  }

  // Auto-balance de tramos de BO al editar individualmente
  function handleActualizarAnchoTramoBO(tIdx: number, val: number) {
    if (anchoBO <= 0) {
      const arr = [...anchosTramos]
      arr[tIdx] = val
      setAnchosTramos(arr)
      return
    }

    const valSeguro = Math.max(0.01, Math.min(val, Number((anchoBO - 0.01).toFixed(2))))

    if (tramosBO === 2) {
      if (tIdx === 0) {
        const otro = Number((anchoBO - valSeguro).toFixed(2))
        setAnchosTramos([valSeguro, otro])
      } else {
        const otro = Number((anchoBO - valSeguro).toFixed(2))
        setAnchosTramos([otro, valSeguro])
      }
    } else if (tramosBO === 3) {
      const arr = [...anchosTramos]
      if (tIdx === 0) {
        arr[0] = valSeguro
        const t2 = arr[1] || Number(((anchoBO - valSeguro) / 2).toFixed(2))
        arr[1] = Math.max(0.01, Math.min(t2, Number((anchoBO - valSeguro - 0.01).toFixed(2))))
        arr[2] = Number((anchoBO - arr[0] - arr[1]).toFixed(2))
      } else if (tIdx === 1) {
        arr[1] = valSeguro
        const t1 = arr[0] || Number(((anchoBO - valSeguro) / 2).toFixed(2))
        arr[0] = Math.max(0.01, Math.min(t1, Number((anchoBO - valSeguro - 0.01).toFixed(2))))
        arr[2] = Number((anchoBO - arr[0] - arr[1]).toFixed(2))
      } else {
        arr[2] = valSeguro
        const t1 = arr[0] || Number(((anchoBO - valSeguro) / 2).toFixed(2))
        arr[0] = Math.max(0.01, Math.min(t1, Number((anchoBO - valSeguro - 0.01).toFixed(2))))
        arr[1] = Number((anchoBO - arr[0] - arr[2]).toFixed(2))
      }
      setAnchosTramos(arr)
    } else {
      setAnchosTramos([anchoBO])
    }
  }

  // Medida efectiva calculada
  const anchoEfectivo =
    tipo === "Aluminio"
      ? anchoAluminio
      : gazaActiva
      ? anchoGaza
      : boActiva
      ? anchoBO
      : 0

  const altoEfectivo =
    tipo === "Aluminio"
      ? altoAluminio
      : gazaActiva
      ? altoGaza
      : boActiva
      ? altoBO
      : 0

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
              }
            : undefined,
        sistema: tipo === "Tradicional" ? sistemaTradicional || undefined : undefined,
        colorBarral:
          tipo === "Tradicional" && sistemaTradicional === "Barral"
            ? colorBarral || undefined
            : undefined,
        perfileria:
          tipo !== "Tradicional" && tipo !== "Aluminio"
            ? perfileria || undefined
            : undefined,
        sujecion: tipo !== "Aluminio" ? sujecion || undefined : undefined,
        // Tradicional: si el B.O. es Roller, lleva mando y marca para ese B.O.
        formatoBO: tipo === "Tradicional" && boActiva ? formatoBO : undefined,
        marcaBO: tipo === "Tradicional" && boActiva && formatoBO === "Roller" ? (marcaBO || undefined) : undefined,
        mandoBO: tipo === "Tradicional" && boActiva && formatoBO === "Roller" ? (mandosRollerBO[0] || undefined) : undefined,
        mandosRollerBO:
          tipo === "Tradicional" && boActiva && formatoBO === "Roller"
            ? (mandosRollerBO.filter(Boolean) as LadoMando[])
            : undefined,
        mando:
          tipo === "Tradicional"
            ? (boActiva && formatoBO === "Roller" ? (mandosRollerBO[0] || undefined) : undefined)
            : tipo === "Aluminio"
            ? mandoAluminio || undefined
            : mando || undefined,
        caida: tipo !== "Aluminio" && boActiva ? caida || undefined : undefined,
        marca:
          tipo === "Tradicional"
            ? (boActiva && formatoBO === "Roller" ? (marcaBO || undefined) : undefined)
            : tipo !== "Aluminio"
            ? marca || undefined
            : undefined,
        // Soportes Kent / Grampa: SOLO EN TRADICIONAL
        tipoSoporte: tipo === "Tradicional" ? tipoSoporte || undefined : undefined,
        varianteSoporte: tipo === "Tradicional" ? determinarVarianteSoporte(gazaActiva, boActiva) : undefined,
        cantidadSoportes: tipo === "Tradicional" ? calcularCantidadSoportes(anchoEfectivo) : undefined,
        gaza:
          tipo !== "Aluminio" && gazaActiva
            ? {
                activa: true,
                ancho: anchoGaza,
                alto: altoGaza,
                panos: panosGaza,
                anchosPanos: anchosPanos,
                nombreTela: nombreTelaGaza,
              }
            : undefined,
        bo:
          tipo !== "Aluminio" && boActiva
            ? {
                activa: true,
                ancho: anchoBO,
                alto: altoBO,
                tramos: tramosBO,
                anchosTramos: anchosTramos,
                nombreTela: nombreTelaBO,
                mandosRoller:
                  tipo === "Tradicional" && formatoBO === "Roller"
                    ? (mandosRollerBO.filter(Boolean) as LadoMando[])
                    : undefined,
              }
            : undefined,
        cantidadArgollas:
          gazaActiva && tipo === "Tradicional"
            ? calcularArgollasGaza(anchoGaza)
            : undefined,
        anchoConfeccionGaza: gazaActiva
          ? calcularAnchoConfeccionGaza(anchoGaza)
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
    } else {
      if (!gazaActiva && !boActiva) {
        setErrorValidacion("Tenés que activar al menos una tela (GAZA o B.O.).")
        return
      }
      if (gazaActiva && (!anchoGaza || anchoGaza <= 0 || !altoGaza || altoGaza <= 0)) {
        setErrorValidacion("Ingresá las medidas de Ancho y Alto para la GAZA.")
        return
      }
      if (gazaActiva && panosGaza > 1) {
        const suma = Number(anchosPanos.reduce((a, b) => a + (b || 0), 0).toFixed(2))
        if (Math.abs(suma - anchoGaza) > 0.02) {
          setErrorValidacion(
            `La suma de los paños de Gaza (${suma.toFixed(2)} m) debe ser exactamente igual al Ancho Total (${anchoGaza.toFixed(2)} m). Podés tocar "Centrar" para ajustarlos.`
          )
          return
        }
      }
      if (boActiva && (!anchoBO || anchoBO <= 0 || !altoBO || altoBO <= 0)) {
        setErrorValidacion("Ingresá las medidas de Ancho y Alto para el B.O.")
        return
      }
      if (boActiva && tramosBO > 1) {
        const suma = Number(anchosTramos.reduce((a, b) => a + (b || 0), 0).toFixed(2))
        if (Math.abs(suma - anchoBO) > 0.02) {
          setErrorValidacion(
            `La suma de las cortinas/tramos de B.O. (${suma.toFixed(2)} m) debe ser exactamente igual al Ancho Total (${anchoBO.toFixed(2)} m). Podés tocar "Centrar" para ajustarlos.`
          )
          return
        }
      }
      if (boActiva && tipo === "Tradicional" && formatoBO === "Roller") {
        for (let i = 0; i < tramosBO; i++) {
          if (!mandosRollerBO[i]) {
            setErrorValidacion(
              `Tenés que seleccionar el lado del mando (Izquierda o Derecha) para la Cortina ${i + 1} de B.O. Roller.`
            )
            return
          }
        }
      }
    }

    onGuardar({
      id: itemInicial?.id,
      descripcion: descripcion.trim(),
      ancho: anchoEfectivo,
      alto: altoEfectivo,
      cantidad: Number(cantidad),
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

          {/* Medidas de la persiana de aluminio */}
          {mandoAluminio && (
            <div className="grid grid-cols-2 gap-3 max-w-sm pt-2 border-t border-indigo-100 animate-in fade-in duration-100">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Ancho (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={anchoAluminio || ""}
                  onChange={(e) =>
                    setAnchoAluminio(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Alto (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={altoAluminio || ""}
                  onChange={(e) =>
                    setAltoAluminio(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* FLUJO PROGRESIVO: SI SELECCIONÓ TRADICIONAL O ROLLER / BANDAS / NOCHE TOTAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tipo && tipo !== "Aluminio" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* ── PASO 2: Sistema (si es Tradicional) o Perfilería (si es otro) ── */}
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
            /* Perfilería para Roller, Bandas, Roller Noche total */
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2 • Perfilería ({tipo === "Roller Noche total" ? "Roller Noche Total" : tipo})
              </label>
              <div className="flex flex-wrap gap-2">
                {(tipo === "Roller Noche total" || tipo === "Noche total"
                  ? PERFILERIA_NOCHE_TOTAL
                  : tipo === "Roller"
                  ? PERFILERIA_ROLLER
                  : PERFILERIA_BANDAS
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

          {/* ── PASOS 3, 4, 5, 6: Sujeción, Mando (NO en tradicional), Caída B.O., Marca ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sujeción */}
            <div>
              <label className="block text-xs font-bold text-slate-700">
                3 • Sujeción
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

            {/* Mando: REGLA DE ORO -> NO APARECE SI ES TRADICIONAL */}
            {tipo !== "Tradicional" && (
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  4 • Mando
                </label>
                <div className="mt-1.5 flex gap-1.5">
                  {LADOS_MANDO.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMando(m)}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                        mando === m
                          ? "border-indigo-600 bg-indigo-600 text-white font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caída B.O. - Solo aparece si el Black Out está activo */}
            {boActiva && (
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  {tipo === "Tradicional" ? "4 • Caída B.O." : "5 • Caída B.O."}
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

            {/* Marca de Proveedor */}
            {tipo !== "Tradicional" ? (
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  6 • Marca
                </label>
                <div className="mt-1.5 flex gap-1.5">
                  {MARCAS_CORTINA.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarca(m)}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                        marca === m
                          ? "border-indigo-600 bg-indigo-600 text-white font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Marca de Proveedor
                </span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">
                  {boActiva && formatoBO === "Roller"
                    ? `B.O. Roller: ${marcaBO || "HD"}`
                    : "Confección Taller (Sin marca)"}
                </span>
              </div>
            )}
          </div>

          {/* Soportes: Grampa o Kent - SOLO PARA TIPO TRADICIONAL */}
          {tipo === "Tradicional" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
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
            </div>
          )}

          {/* ── TELAS: GAZA Y B.O. (Aquí es donde se ponen las medidas) ── */}
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
                      if (nuevo && anchosPanos.length === 0 && anchoGaza > 0) {
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Ancho Gaza (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={anchoGaza || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setAnchoGaza(val)
                            handleCambioPanosGaza(panosGaza, val)
                          }}
                          placeholder="0.00"
                          required
                          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Alto Gaza (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={altoGaza || ""}
                          onChange={(e) =>
                            setAltoGaza(parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          required
                          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Paños */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Cantidad de Paños:
                      </label>
                      <div className="mt-1.5 flex gap-1.5">
                        {([1, 2, 3] as const).map((p) => (
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
                            {p} paño{p > 1 ? "s" : ""}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Desglose de medidas si son 2 o 3 paños */}
                    {panosGaza > 1 && (
                      <div className="rounded-lg bg-white p-2.5 border border-indigo-100">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-600">
                            Medida de cada paño (largo: {altoGaza}m):
                          </label>
                          <button
                            type="button"
                            onClick={() => handleCambioPanosGaza(panosGaza, anchoGaza)}
                            className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                          >
                            Centrar
                          </button>
                        </div>
                        <div className="mt-1.5 flex gap-2">
                          {Array.from({ length: panosGaza }).map((_, pIdx) => (
                            <div key={pIdx} className="flex-1">
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Paño {pIdx + 1} (m)
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={anchoGaza > 0 ? anchoGaza : undefined}
                                value={anchosPanos[pIdx] ?? 0}
                                onChange={(e) =>
                                  handleActualizarAnchoPanoGaza(
                                    pIdx,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="mt-0.5 block w-full rounded-md border border-slate-200 bg-slate-50 p-1.5 text-xs font-bold text-slate-900"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                        className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-900"
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
                      if (nuevo && anchosTramos.length === 0 && anchoBO > 0) {
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Ancho B.O. (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={anchoBO || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setAnchoBO(val)
                            handleCambioTramosBO(tramosBO, val)
                          }}
                          placeholder="0.00"
                          required
                          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-slate-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700">
                          Alto B.O. (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={altoBO || ""}
                          onChange={(e) =>
                            setAltoBO(parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          required
                          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-900 focus:border-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>

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

                        {/* Si el B.O. es Roller, configuración de Marca */}
                        {formatoBO === "Roller" && (
                          <div className="pt-2 mt-2 border-t border-slate-100 animate-in fade-in duration-100">
                            <span className="block text-[11px] font-bold text-slate-600">
                              Marca de Proveedor B.O. Roller:
                            </span>
                            <div className="mt-1 flex gap-1.5 max-w-xs">
                              {MARCAS_CORTINA.map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setMarcaBO(m)}
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
                        )}
                      </div>
                    )}

                    {/* Cantidad de Cortinas (Roller) o Tramos (Tradicional) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        {tipo === "Tradicional" && formatoBO === "Roller"
                          ? "Cantidad de Cortinas B.O. Roller:"
                          : "Cantidad de Tramos:"}
                      </label>
                      <div className="mt-1.5 flex gap-1.5">
                        {([1, 2, 3] as const).map((t) => (
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
                            {tipo === "Tradicional" && formatoBO === "Roller"
                              ? `${t} cortina${t > 1 ? "s" : ""}`
                              : `${t} tramo${t > 1 ? "s" : ""}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Desglose de medidas y mandos individuales */}
                    {(tramosBO > 1 || (tipo === "Tradicional" && formatoBO === "Roller")) && (
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-600">
                            {tipo === "Tradicional" && formatoBO === "Roller"
                              ? `Medida y Mando de cada cortina Roller (largo: ${altoBO}m):`
                              : `Medida de cada tramo (largo: ${altoBO}m):`}
                          </label>
                          {tramosBO > 1 && (
                            <button
                              type="button"
                              onClick={() => handleCambioTramosBO(tramosBO, anchoBO)}
                              className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition shadow-2xs"
                            >
                              Centrar
                            </button>
                          )}
                        </div>

                        <div className="mt-1.5 flex gap-2">
                          {Array.from({ length: tramosBO }).map((_, tIdx) => (
                            <div key={tIdx} className="flex-1 space-y-1.5">
                              <span className="text-[10px] text-slate-500 font-semibold block">
                                {tipo === "Tradicional" && formatoBO === "Roller"
                                  ? `Cortina ${tIdx + 1} (m)`
                                  : `Tramo ${tIdx + 1} (m)`}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={anchoBO > 0 ? anchoBO : undefined}
                                value={anchosTramos[tIdx] ?? (tramosBO === 1 ? anchoBO : 0)}
                                onChange={(e) =>
                                  handleActualizarAnchoTramoBO(
                                    tIdx,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                disabled={tramosBO === 1}
                                className={`mt-0.5 block w-full rounded-md border border-slate-200 p-1.5 text-xs font-bold text-slate-900 ${
                                  tramosBO === 1
                                    ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                                    : "bg-slate-50"
                                }`}
                              />

                              {/* Mando individual para B.O. Roller */}
                              {tipo === "Tradicional" && formatoBO === "Roller" && (
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
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                        className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
