"use client"

import { useState } from "react"
import {
  TIPOS_CORTINA,
  SUBTIPOS_MOTORIZADA,
  MODELOS_MOTOR_ROLLER_SOMFY,
  MODELOS_MOTOR_ROLLER_TUBE,
  CANALES_CONTROL,
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
  type SubtipoMotorizada,
  type MarcaMotor,
  type CanalesControl,
  type TipoRiel,
  type TipoCapaGaza,
  type TipoCapaBO,
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
  type ModoCortina,
  obtenerModosCapa,
} from "../types"
import { CortinaDibujoDidactico } from "./cortina-dibujo-didactico"
import {
  Check,
  Sparkles,
  Layers,
  Ruler,
  Info,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronUp,
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
  const [sujecionAluminio, setSujecionAluminio] = useState<TipoSujecion | null>(
    caracInicial?.sujecion || null
  )
  const [cantidadAluminio, setCantidadAluminio] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [maxAluminioVisibles, setMaxAluminioVisibles] = useState<number>(3)
  const [anchosAluminio, setAnchosAluminio] = useState<(number | "")[]>([
    itemInicial?.ancho || ""
  ])
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
    caracInicial?.caida || "Por delante"
  )
  const [posicionRoller, setPosicionRoller] = useState<"Adelante" | "Atrás">(
    caracInicial?.posicionRoller || "Adelante"
  )
  const [caidaBO, setCaidaBO] = useState<TipoCaida | null>(
    caracInicial?.caidaBO || "Por delante"
  )
  const [posicionRollerBO, setPosicionRollerBO] = useState<"Adelante" | "Atrás">(
    caracInicial?.posicionRollerBO || "Atrás"
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

  // ─── Subtipo de Cortina Motorizada ───
  const [subtipoMotorizada, setSubtipoMotorizada] = useState<SubtipoMotorizada>(
    caracInicial?.subtipoMotorizada || "Tradicional Mot"
  )

  // ─── Riel Normal / Curvo (para Tradicional común y Tradicional Mot) ───
  const [tipoRiel, setTipoRiel] = useState<TipoRiel>(
    caracInicial?.tipoRiel || "Normal"
  )

  // ─── Tipos dinámicos de capa para Gaza y B.O. ───
  const [tipoCapaGaza, setTipoCapaGaza] = useState<TipoCapaGaza>(
    caracInicial?.tipoCapaGaza ||
      (caracInicial?.tipo === "Roller"
        ? "Roller"
        : caracInicial?.tipo === "Bandas verticales"
        ? "Bandas verticales"
        : "Tradicional")
  )
  const [tipoCapaBO, setTipoCapaBO] = useState<TipoCapaBO>(
    caracInicial?.tipoCapaBO ||
      (caracInicial?.tipo === "Bandas verticales" ? "Bandas verticales" : "Roller")
  )

  // ─── Marcas independientes para Gaza y BO (excluye taller) ───
  const [marcaGaza, setMarcaGaza] = useState<MarcaCortina | null>(
    caracInicial?.marcaGaza !== undefined ? caracInicial.marcaGaza : (caracInicial?.marca || "RS")
  )
  const [marcaBO, setMarcaBO] = useState<MarcaCortina | null>(
    caracInicial?.marcaBO !== undefined ? caracInicial.marcaBO : (caracInicial?.marca || "HD")
  )

  // ─── Configuración de Motores ───
  const [motorGazaMarca, setMotorGazaMarca] = useState<MarcaMotor>(
    caracInicial?.motorGaza?.marca || "Somfy"
  )
  const [motorGazaModelo, setMotorGazaModelo] = useState<string>(
    caracInicial?.motorGaza?.modelo || "LSN 6/28R"
  )
  const [motorGazaControl, setMotorGazaControl] = useState<boolean>(
    caracInicial?.motorGaza?.control !== undefined ? caracInicial.motorGaza.control : true
  )
  const [motorGazaCanales, setMotorGazaCanales] = useState<CanalesControl>(
    caracInicial?.motorGaza?.canales || 1
  )

  const [motorBOMarca, setMotorBOMarca] = useState<MarcaMotor>(
    caracInicial?.motorBO?.marca || "Somfy"
  )
  const [motorBOModelo, setMotorBOModelo] = useState<string>(
    caracInicial?.motorBO?.modelo || "LSN 6/28R"
  )
  const [motorBOControl, setMotorBOControl] = useState<boolean>(
    caracInicial?.motorBO?.control !== undefined ? caracInicial.motorBO.control : true
  )
  const [motorBOCanales, setMotorBOCanales] = useState<CanalesControl>(
    caracInicial?.motorBO?.canales || 1
  )

  // Cantidad de cargadores para motor Li-ion en la abertura
  const [cantidadCargadores, setCantidadCargadores] = useState<number | "">(
    caracInicial?.cantidadCargadores !== undefined ? caracInicial.cantidadCargadores : ""
  )

  // ─── Roller "Sólo tela" vs "Normal" por cortina individual (por default false = normal) ───
  const [modosPanosGaza, setModosPanosGaza] = useState<ModoCortina[]>(() => {
    const m = obtenerModosCapa(caracInicial?.modosPanosGaza, caracInicial?.soloTelaPanosGaza)
    return Array.from({ length: 5 }, (_, i) => m[i] || "Normal")
  })
  const [modosTramosBO, setModosTramosBO] = useState<ModoCortina[]>(() => {
    const m = obtenerModosCapa(caracInicial?.modosTramosBO, caracInicial?.soloTelaTramosBO)
    return Array.from({ length: 5 }, (_, i) => m[i] || "Normal")
  })

  // Opciones de modo: "Solo riel" no aplica a Roller Mot
  const opcionesModo = (permiteSoloRiel: boolean) => [
    { label: "Normal", val: "Normal" as ModoCortina },
    { label: "Sólo tela", val: "Solo tela" as ModoCortina },
    ...(permiteSoloRiel ? [{ label: "Sólo riel", val: "Solo riel" as ModoCortina }] : []),
  ]

  // ─── Acordeones / Secciones colapsables en Tablet ───
  const [seccionMotorAbierta, setSeccionMotorAbierta] = useState<boolean>(true)
  const [seccionComponentesAbierta, setSeccionComponentesAbierta] = useState<boolean>(false)

  // ─── Gaza en Aluminio ───
  const [aluminioTieneGaza, setAluminioTieneGaza] = useState<boolean>(
    caracInicial?.tipo === "Aluminio" && Boolean(caracInicial?.gaza?.activa)
  )

  // ─── Gaza en Roller Noche Total ───
  const [nocheTotalTieneGaza, setNocheTotalTieneGaza] = useState<boolean>(
    (caracInicial?.tipo === "Roller Noche total" || caracInicial?.tipo === "Noche total") && Boolean(caracInicial?.gaza?.activa)
  )

  // Formato B.O. (Tradicional vs Roller) para cuando la cortina es Tradicional
  const [formatoBO, setFormatoBO] = useState<"Tradicional" | "Roller">(
    caracInicial?.formatoBO || "Tradicional"
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

  const [mandosRollerGaza, setMandosRollerGaza] = useState<(LadoMando | null)[]>(() => {
    if (caracInicial?.mandosRollerGaza && caracInicial.mandosRollerGaza.length > 0) {
      return caracInicial.mandosRollerGaza
    }
    const p = caracInicial?.gaza?.panos || 1
    if (p === 1) return ["Derecha"]
    if (p === 2) return ["Izquierda", "Derecha"]
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

  // Determinación de si alguna capa es Tradicional o Motorizada
  const esMotorizada = tipo === "Motorizada"

  // ¿Qué tipo de cortina es la capa izquierda (Gaza) y la capa derecha (BO)?
  // Para los 8 subtipos de Motorizada:
  // 1: Tradicional Mot (Gaza: Tradicional Mot | BO: Tradicional Mot)
  // 2: Tradicional Mot y Tradicional (Gaza: Tradicional Mot | BO: Tradicional)
  // 3: Tradicional Mot y Roller (Gaza: Tradicional Mot | BO: Roller)
  // 4: Tradicional Mot y Roller Mot (Gaza: Tradicional Mot | BO: Roller Mot)
  // 5: Roller Mot (Gaza: Roller Mot | BO: Roller Mot)
  // 6: Roller Mot y Roller (Gaza: Roller Mot | BO: Roller)
  // 7: Roller Mot y Tradicional (Gaza: Roller Mot | BO: Tradicional)
  // 8: Bandas Verticales y Roller Mot (Gaza: Bandas Verticales | BO: Roller Mot)

  const esNocheTotalConGaza =
    (tipo === "Roller Noche total" || tipo === "Noche total") && nocheTotalTieneGaza

  const capaGazaEsTradicional =
    tipo === "Tradicional" ||
    (esMotorizada &&
      (subtipoMotorizada === "Tradicional Mot" ||
        subtipoMotorizada === "Tradicional Mot y Tradicional" ||
        subtipoMotorizada === "Tradicional Mot y Roller" ||
        subtipoMotorizada === "Tradicional Mot y Roller Mot")) ||
    (tipo === "Aluminio" && aluminioTieneGaza && (tipoCapaGaza === "Tradicional" || tipoCapaGaza === "Tradicional Mot")) ||
    (esNocheTotalConGaza && (tipoCapaGaza === "Tradicional" || tipoCapaGaza === "Tradicional Mot"))

  const capaBOEsTradicional =
    (tipo === "Tradicional" && formatoBO === "Tradicional") ||
    (esMotorizada &&
      (subtipoMotorizada === "Tradicional Mot" ||
        subtipoMotorizada === "Tradicional Mot y Tradicional" ||
        subtipoMotorizada === "Roller Mot y Tradicional"))

  const capaGazaEsMotorizada =
    (esMotorizada &&
      (subtipoMotorizada === "Tradicional Mot" ||
        subtipoMotorizada === "Tradicional Mot y Tradicional" ||
        subtipoMotorizada === "Tradicional Mot y Roller" ||
        subtipoMotorizada === "Tradicional Mot y Roller Mot" ||
        subtipoMotorizada === "Roller Mot" ||
        subtipoMotorizada === "Roller Mot y Roller" ||
        subtipoMotorizada === "Roller Mot y Tradicional")) ||
    (tipo === "Aluminio" && aluminioTieneGaza && (tipoCapaGaza === "Tradicional Mot" || tipoCapaGaza === "Roller Mot")) ||
    (esNocheTotalConGaza && (tipoCapaGaza === "Tradicional Mot" || tipoCapaGaza === "Roller Mot"))

  const capaBOEsMotorizada =
    esMotorizada &&
    (subtipoMotorizada === "Tradicional Mot" ||
      subtipoMotorizada === "Tradicional Mot y Roller Mot" ||
      subtipoMotorizada === "Roller Mot" ||
      subtipoMotorizada === "Bandas Verticales y Roller Mot")

  // ¿Hay Tradicional común (no motorizada)?
  const hayTradicionalComun =
    (tipo === "Tradicional" && (!boActiva || formatoBO === "Tradicional")) ||
    (esMotorizada &&
      (subtipoMotorizada === "Tradicional Mot y Tradicional" ||
        subtipoMotorizada === "Roller Mot y Tradicional")) ||
    (tipo === "Aluminio" && aluminioTieneGaza && tipoCapaGaza === "Tradicional") ||
    (esNocheTotalConGaza && tipoCapaGaza === "Tradicional")

  // ¿Hay Tradicional con Riel? (Si es Riel común o motorizada)
  const hayTradicionalRiel =
    (tipo === "Tradicional" && sistemaTradicional === "Riel") ||
    (esMotorizada && (capaGazaEsTradicional || capaBOEsTradicional)) ||
    (tipo === "Aluminio" && aluminioTieneGaza && (tipoCapaGaza === "Tradicional Mot" || (tipoCapaGaza === "Tradicional" && sistemaTradicional === "Riel"))) ||
    (esNocheTotalConGaza && (tipoCapaGaza === "Tradicional Mot" || (tipoCapaGaza === "Tradicional" && sistemaTradicional === "Riel")))

  // ¿Hay alguna Roller o Roller Mot involucrada?
  const hayAlgunaRoller =
    tipo === "Roller" ||
    (tipo === "Tradicional" && boActiva && formatoBO === "Roller") ||
    (tipo === "Roller Noche total" || tipo === "Noche total") ||
    (esMotorizada &&
      (subtipoMotorizada.includes("Roller") || subtipoMotorizada.includes("Roller Mot"))) ||
    (tipo === "Aluminio" && aluminioTieneGaza && (tipoCapaGaza === "Roller" || tipoCapaGaza === "Roller Mot")) ||
    (esNocheTotalConGaza && (tipoCapaGaza === "Roller" || tipoCapaGaza === "Roller Mot"))

  // ¿La capa Gaza es Roller o Roller Mot?
  const capaGazaEsRoller =
    ((tipo === "Roller" || tipo === "Bandas verticales") && tipoCapaGaza === "Roller") ||
    (tipo === "Aluminio" && aluminioTieneGaza && (tipoCapaGaza === "Roller" || tipoCapaGaza === "Roller Mot")) ||
    (esNocheTotalConGaza && (tipoCapaGaza === "Roller" || tipoCapaGaza === "Roller Mot")) ||
    (esMotorizada &&
      (subtipoMotorizada === "Roller Mot" ||
        subtipoMotorizada === "Roller Mot y Roller" ||
        subtipoMotorizada === "Roller Mot y Tradicional"))

  // ¿La capa B.O. es Roller o Roller Mot?
  const capaBOEsRoller =
    (tipo === "Tradicional" && formatoBO === "Roller") ||
    ((tipo === "Roller" || tipo === "Bandas verticales") && tipoCapaBO === "Roller") ||
    (tipo === "Roller Noche total" || tipo === "Noche total") ||
    (esMotorizada &&
      (subtipoMotorizada === "Tradicional Mot y Roller" ||
        subtipoMotorizada === "Tradicional Mot y Roller Mot" ||
        subtipoMotorizada === "Roller Mot" ||
        subtipoMotorizada === "Roller Mot y Roller" ||
        subtipoMotorizada === "Bandas Verticales y Roller Mot"))

  // Títulos dinámicos de las dos tarjetas según el tipo y subtipo:
  const tituloTarjetaGaza = (() => {
    if (tipo === "Tradicional") return "GAZA (Tradicional)"
    if (tipo === "Roller" || tipo === "Bandas verticales") {
      return tipoCapaGaza === "Bandas verticales" ? "GAZA (Bandas Verticales)" : "GAZA (Roller)"
    }
    if (tipo === "Aluminio") return `GAZA (${tipoCapaGaza})`
    if (tipo === "Roller Noche total" || tipo === "Noche total") return `GAZA (${tipoCapaGaza})`
    if (esMotorizada) {
      if (subtipoMotorizada === "Tradicional Mot") return "Tradicional Mot"
      if (subtipoMotorizada === "Tradicional Mot y Tradicional") return "Tradicional Mot"
      if (subtipoMotorizada === "Tradicional Mot y Roller") return "Tradicional Mot"
      if (subtipoMotorizada === "Tradicional Mot y Roller Mot") return "Tradicional Mot"
      if (subtipoMotorizada === "Roller Mot") return "Roller Mot"
      if (subtipoMotorizada === "Roller Mot y Roller") return "Roller Mot"
      if (subtipoMotorizada === "Roller Mot y Tradicional") return "Roller Mot"
      if (subtipoMotorizada === "Bandas Verticales y Roller Mot") return "Bandas Verticales"
    }
    return "GAZA"
  })()

  const tituloTarjetaBO = (() => {
    if (tipo === "Tradicional") return formatoBO === "Roller" ? "B.O. (Roller)" : "B.O. (Tradicional)"
    if (tipo === "Roller" || tipo === "Bandas verticales") {
      return tipoCapaBO === "Bandas verticales" ? "B.O. (Bandas Verticales)" : "B.O. (Roller)"
    }
    if (tipo === "Roller Noche total" || tipo === "Noche total") return "Roller Noche Total"
    if (esMotorizada) {
      if (subtipoMotorizada === "Tradicional Mot") return "Tradicional Mot 2"
      if (subtipoMotorizada === "Tradicional Mot y Tradicional") return "Tradicional"
      if (subtipoMotorizada === "Tradicional Mot y Roller") return "Roller"
      if (subtipoMotorizada === "Tradicional Mot y Roller Mot") return "Roller Mot"
      if (subtipoMotorizada === "Roller Mot") return "Roller Mot 2"
      if (subtipoMotorizada === "Roller Mot y Roller") return "Roller"
      if (subtipoMotorizada === "Roller Mot y Tradicional") return "Tradicional"
      if (subtipoMotorizada === "Bandas Verticales y Roller Mot") return "Roller Mot"
    }
    return "B.O. (Black Out)"
  })()

  // Ancho y alto efectivos calculados para la abertura
  const esTipoDirecto = tipo === "Mosquera" || tipo === "Roller Noche total" || tipo === "Noche total"

  const anchoEfectivo =
    tipo === "Aluminio"
      ? (typeof anchoAluminio === "number" ? anchoAluminio : 0)
      : esTipoDirecto
      ? anchosTramos.length > 0
        ? Number(anchosTramos.slice(0, tramosBO).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2))
        : 0
      : (tipo === "Tradicional" || esMotorizada)
      ? (gazaActiva
          ? (typeof anchoGaza === "number"
              ? anchoGaza
              : anchosPanos.length > 0
              ? Number(anchosPanos.slice(0, panosGaza).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2))
              : 0)
          : capaBOEsTradicional
          ? (typeof anchoBO === "number" ? anchoBO : 0)
          : Number(anchosTramos.slice(0, tramosBO).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2)))
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
    if (tipo === "Aluminio") return aluminioTieneGaza ? 2 : 1
    if (esTipoDirecto) {
      const cantBO = Number(tramosBO) || 1
      if (esNocheTotalConGaza) {
        const cantGaza = capaGazaEsTradicional ? 1 : (Number(panosGaza) || 1)
        return cantBO + cantGaza
      }
      return cantBO
    }
    if (tipo === "Tradicional" || esMotorizada) {
      if (gazaActiva && boActiva) {
        if (formatoBO === "Roller" || tipoCapaBO === "Roller" || tipoCapaBO === "Roller Mot") {
          return 1 + (Number(tramosBO) || 1)
        }
        return 2
      }
      if (gazaActiva) return 1
      if (boActiva) {
        if (formatoBO === "Roller" || tipoCapaBO === "Roller" || tipoCapaBO === "Roller Mot") return Number(tramosBO) || 1
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
        subtipoMotorizada: esMotorizada ? subtipoMotorizada : undefined,
        aluminio:
          tipo === "Aluminio" && tipoLaminaAluminio && colorAluminio && mandoAluminio
            ? {
                tipoLamina: tipoLaminaAluminio,
                color: colorAluminio,
                mando: mandoAluminio,
                tensor: tensorAluminio !== null ? tensorAluminio : undefined,
              }
            : undefined,
        tipoCapaGaza:
          (tipo === "Aluminio" && aluminioTieneGaza) ||
          esNocheTotalConGaza ||
          ((tipo === "Roller" || tipo === "Bandas verticales") && gazaActiva)
            ? tipoCapaGaza
            : undefined,
        tipoCapaBO: (tipo === "Roller" || tipo === "Bandas verticales") ? tipoCapaBO : undefined,
        // Tradicional: si hay tradicional común, puede ser Riel o Barral
        sistema:
          tipo === "Tradicional"
            ? (sistemaTradicional || undefined)
            : hayTradicionalComun
            ? (sistemaTradicional || "Riel")
            : (esMotorizada && (capaGazaEsTradicional || capaBOEsTradicional))
            ? "Riel"
            : undefined,
        tipoRiel:
          (tipo === "Tradicional" && sistemaTradicional === "Riel") ||
          (hayTradicionalComun && sistemaTradicional === "Riel") ||
          (esMotorizada && (capaGazaEsTradicional || capaBOEsTradicional))
            ? tipoRiel
            : undefined,
        colorBarral:
          (tipo === "Tradicional" || hayTradicionalComun) && sistemaTradicional === "Barral"
            ? colorBarral || undefined
            : undefined,
        perfileria:
          hayAlgunaRoller || tipo === "Bandas verticales" || tipo === "Mosquera"
            ? perfileria || undefined
            : undefined,
        sujecion:
          tipo === "Aluminio"
            ? sujecionAluminio || undefined
            : sujecion || undefined,
        // Tradicional: si el B.O. es Roller, lleva mando y marca para ese B.O.
        formatoBO: tipo === "Tradicional" && boActiva ? formatoBO : undefined,
        // Marcas: Tradicional común nunca lleva marca (taller propio)
        marcaBO:
          (tipo === "Tradicional" && boActiva && formatoBO === "Tradicional") ||
          (esMotorizada && (subtipoMotorizada === "Tradicional Mot y Tradicional" || subtipoMotorizada === "Roller Mot y Tradicional"))
            ? null
            : boActiva || esMotorizada
            ? (marcaBO || undefined)
            : undefined,
        marcaGaza:
          (tipo === "Tradicional") ||
          (esMotorizada && subtipoMotorizada === "Tradicional Mot y Tradicional") // si fuera común
            ? null
            : gazaActiva
            ? (marcaGaza || undefined)
            : undefined,
        mandoBO: tipo === "Tradicional" && boActiva && formatoBO === "Roller" ? (mandosRollerBO[0] || undefined) : undefined,
        mandosRollerBO:
          mandosRollerBO.slice(0, tramosBO).map((m) => m || "Derecha") as LadoMando[],
        mandosRollerGaza:
          mandosRollerGaza.slice(0, panosGaza).map((m) => m || "Derecha") as LadoMando[],
        mando:
          tipo === "Tradicional"
            ? (boActiva && formatoBO === "Roller" ? (mandosRollerBO[0] || undefined) : undefined)
            : tipo === "Aluminio"
            ? mandoAluminio || undefined
            : mando || undefined,
        caida: capaGazaEsRoller ? caida || undefined : undefined,
        posicionRoller: capaGazaEsRoller ? posicionRoller : undefined,
        caidaBO: capaBOEsRoller ? caidaBO || undefined : undefined,
        posicionRollerBO:
          capaBOEsRoller || (tipo === "Tradicional" && formatoBO === "Tradicional")
            ? posicionRollerBO
            : undefined,
        marca:
          tipo === "Mosquera"
            ? "MG"
            : tipo === "Tradicional"
            ? undefined
            : marca || marcaBO || undefined,

        // Configuración de Motorización
        motorGaza:
          capaGazaEsMotorizada && gazaActiva
            ? {
                marca: motorGazaMarca,
                modelo: motorGazaModelo,
                control: motorGazaControl,
                canales: motorGazaControl ? motorGazaCanales : undefined,
              }
            : undefined,
        motorBO:
          capaBOEsMotorizada && boActiva
            ? {
                marca: motorBOMarca,
                modelo: motorBOModelo,
                control: motorBOControl,
                canales: motorBOControl ? motorBOCanales : undefined,
              }
            : undefined,
        cantidadCargadores:
          (motorGazaModelo.toLowerCase().includes("li-ion") || motorBOModelo.toLowerCase().includes("li-ion")) &&
          typeof cantidadCargadores === "number"
            ? cantidadCargadores
            : undefined,

        // Sólo tela para Roller
        modosPanosGaza: gazaActiva ? modosPanosGaza.slice(0, panosGaza) : undefined,
        modosTramosBO: boActiva ? modosTramosBO.slice(0, tramosBO) : undefined,
        soloTelaPanosGaza: gazaActiva ? modosPanosGaza.slice(0, panosGaza).map((m) => m === "Solo tela") : undefined,
        soloTelaTramosBO: boActiva ? modosTramosBO.slice(0, tramosBO).map((m) => m === "Solo tela") : undefined,

        // Soportes Kent / Grampa: SOLO EN TRADICIONAL CON BARRAL (si es riel no lleva soportes kent/grampa)
        tipoSoporte:
          ((tipo === "Tradicional" || hayTradicionalComun) && sistemaTradicional === "Barral")
            ? tipoSoporte || undefined
            : undefined,
        varianteSoporte:
          ((tipo === "Tradicional" || hayTradicionalComun) && sistemaTradicional === "Barral")
            ? determinarVarianteSoporte(gazaActiva, boActiva, formatoBO)
            : undefined,
        cantidadSoportes:
          ((tipo === "Tradicional" || hayTradicionalComun) && sistemaTradicional === "Barral")
            ? calcularCantidadSoportes(capaGazaEsTradicional && typeof anchoGaza === "number" ? anchoGaza : anchoEfectivo)
            : undefined,
        // Soporte Roller: Común / Extendido para todo lo que tenga Roller
        tipoSoporteRoller:
          hayAlgunaRoller
            ? tipoSoporteRoller || "Común"
            : undefined,
        gaza:
          (tipo !== "Aluminio" || aluminioTieneGaza) && (!esTipoDirecto || esNocheTotalConGaza) && gazaActiva
            ? {
                activa: true,
                ancho: capaGazaEsTradicional
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
                ancho: esTipoDirecto || !capaBOEsTradicional
                  ? Number(anchosTramos.slice(0, tramosBO).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0).toFixed(2))
                  : (typeof anchoBO === "number" ? anchoBO : 0),
                alto: typeof altoBO === "number" ? altoBO : 0,
                tramos: tramosBO,
                anchosTramos: anchosTramos.slice(0, tramosBO).map((v) => (typeof v === "number" ? v : 0)),
                nombreTela: tipo === "Mosquera" ? "Tela Mosquera" : nombreTelaBO,
                mandosRoller:
                  capaBOEsRoller
                    ? (mandosRollerBO.slice(0, tramosBO).filter(Boolean) as LadoMando[])
                    : undefined,
              }
            : undefined,
        cantidadArgollas:
          gazaActiva && tipo === "Tradicional" && sistemaTradicional === "Barral"
            ? calcularArgollasGaza(typeof anchoGaza === "number" ? anchoGaza : 0)
            : undefined,
        anchoConfeccionGaza:
          gazaActiva && (tipo === "Tradicional" || (esMotorizada && capaGazaEsTradicional) || ((tipo === "Aluminio" || esNocheTotalConGaza) && capaGazaEsTradicional))
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
      if (aluminioTieneGaza && gazaActiva) {
        if (!altoGaza || altoGaza <= 0) {
          setErrorValidacion("Ingresá el Alto para la GAZA delantera.")
          return
        }
        if (capaGazaEsTradicional) {
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
          for (let i = 0; i < panosGaza; i++) {
            if (!anchosPanos[i] || (anchosPanos[i] as number) <= 0) {
              setErrorValidacion(`Ingresá el Ancho de la Cortina ${i + 1} de Gaza.`)
              return
            }
            if ((capaGazaEsRoller || tipoCapaGaza === "Bandas verticales") && !mandosRollerGaza[i]) {
              setErrorValidacion(
                `Tenés que seleccionar el lado del mando para la Cortina ${i + 1} de Gaza.`
              )
              return
            }
          }
        }
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
      if (esNocheTotalConGaza) {
        if (!altoGaza || altoGaza <= 0) {
          setErrorValidacion("Ingresá el Alto para la GAZA delantera.")
          return
        }
        if (capaGazaEsTradicional) {
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
          for (let i = 0; i < panosGaza; i++) {
            if (!anchosPanos[i] || (anchosPanos[i] as number) <= 0) {
              setErrorValidacion(`Ingresá el Ancho de la Cortina ${i + 1} de Gaza.`)
              return
            }
            if ((capaGazaEsRoller || tipoCapaGaza === "Bandas verticales") && !mandosRollerGaza[i]) {
              setErrorValidacion(
                `Tenés que seleccionar el lado del mando para la Cortina ${i + 1} de Gaza.`
              )
              return
            }
          }
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
        if (capaGazaEsTradicional) {
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
        if (capaBOEsTradicional) {
          // Tradicional Taller / común / mot tradicional: Ancho Total + tramos
          if (!anchoBO || anchoBO <= 0) {
            setErrorValidacion(`Ingresá el Ancho Total para ${tituloTarjetaBO}.`)
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
                `La suma de los tramos de ${tituloTarjetaBO} (${suma.toFixed(2)} m) debe ser exactamente igual al Ancho Total (${numAnchoBO.toFixed(2)} m). Podés tocar "Centrar" para ajustarlos.`
              )
              return
            }
          }
        } else {
          // En Roller / Bandas: cada cortina tiene su ancho individual
          for (let i = 0; i < tramosBO; i++) {
            if (!anchosTramos[i] || (anchosTramos[i] as number) <= 0) {
              setErrorValidacion(`Ingresá el Ancho de la Cortina ${i + 1} de ${tituloTarjetaBO}.`)
              return
            }
            if (capaBOEsRoller && !mandosRollerBO[i]) {
              setErrorValidacion(
                `Tenés que seleccionar el lado del mando (Izquierda o Derecha) para la Cortina ${i + 1} de ${tituloTarjetaBO}.`
              )
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
                  if (t === "Roller") {
                    setTipoCapaGaza("Roller")
                    setTipoCapaBO("Roller")
                  } else if (t === "Bandas verticales") {
                    setTipoCapaGaza("Bandas verticales")
                    setTipoCapaBO("Bandas verticales")
                  } else if (t === "Tradicional") {
                    setTipoCapaGaza("Tradicional")
                  }
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


          {/* Sujeción de Aluminio */}
          {colorAluminio && (
            <div className="animate-in fade-in duration-100">
              <label className="block text-xs font-bold text-slate-700">
                Sujeción de Aluminio:
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TIPOS_SUJECION.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSujecionAluminio(s)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                      sujecionAluminio === s
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mando de Aluminio */}
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

          {/* ── MEDIDAS DE ALUMINIO: SIEMPRE VISIBLES (1, 2, 3 hasta 5 cortinas con anchos independientes y alto compartido) ── */}
          <div className="pt-3 border-t border-indigo-100 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-950">
                  Medidas de Cortina Aluminio
                </label>
                <p className="text-xs text-slate-500">
                  {cantidadAluminio === 1
                    ? "1 cortina en esta abertura."
                    : `${cantidadAluminio} cortinas independientes con anchos propios y alto compartido.`}
                </p>
              </div>

              {/* Selector de cantidad de cortinas de aluminio */}
              <div className="flex items-center gap-2">
                {maxAluminioVisibles < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const prox = Math.min(5, cantidadAluminio + 1) as 1 | 2 | 3 | 4 | 5
                      setMaxAluminioVisibles((p) => Math.min(5, Math.max(prox, p + 1)))
                      setCantidadAluminio(prox)
                      const arr = [...anchosAluminio]
                      while (arr.length < prox) arr.push("")
                      setAnchosAluminio(arr)
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition shadow-2xs"
                  >
                    + Agregar opción ({cantidadAluminio < 5 ? cantidadAluminio + 1 : 5})
                  </button>
                )}
                {cantidadAluminio > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const prev = Math.max(1, cantidadAluminio - 1) as 1 | 2 | 3 | 4 | 5
                      setCantidadAluminio(prev)
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            {/* Botones de cantidad de cortinas */}
            <div className="flex gap-2 max-w-xs">
              {([1, 2, 3, 4, 5] as const)
                .filter((c) => c <= maxAluminioVisibles)
                .map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCantidadAluminio(c)
                      const arr = [...anchosAluminio]
                      while (arr.length < c) arr.push("")
                      setAnchosAluminio(arr)
                    }}
                    className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                      cantidadAluminio === c
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {c} {c > 1 ? "cortinas" : "cortina"}
                  </button>
                ))}
            </div>

            {/* Inputs de anchos y alto */}
            {cantidadAluminio === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-sky-950">
                    Ancho Aluminio (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={anchoAluminio}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                      setAnchoAluminio(val)
                      setAnchosAluminio([val])
                    }}
                    placeholder="0.00"
                    required
                    className="mt-1 block w-full rounded-xl border border-sky-300 bg-sky-50/70 p-2.5 text-sm font-bold text-sky-950 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-950">
                    Alto Aluminio (m)
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
                    className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-sky-950 mb-1.5">
                    Ancho de cada Cortina de Aluminio (m):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {Array.from({ length: cantidadAluminio }).map((_, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-[10px] text-sky-900 font-bold block">
                          Cortina {idx + 1}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={anchosAluminio[idx] ?? ""}
                          onChange={(e) => {
                            const arr = [...anchosAluminio]
                            arr[idx] = e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                            setAnchosAluminio(arr)
                            const total = arr.reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0)
                            setAnchoAluminio(Number(total.toFixed(2)))
                          }}
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
                    value={altoAluminio}
                    onChange={(e) =>
                      setAltoAluminio(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                    }
                    placeholder="0.00"
                    required
                    className="mt-1 block w-full max-w-xs rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Opción de Gaza delantera en Aluminio */}
          <div className="pt-3 border-t border-indigo-100 space-y-3 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  ¿Sumar Gaza por delante?
                </label>
                <p className="text-[11px] text-slate-500">
                  La persiana actúa como B.O. y por delante se coloca una Gaza (Tradicional, Roller o Motorizada)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nuevo = !aluminioTieneGaza
                  setAluminioTieneGaza(nuevo)
                  setGazaActiva(nuevo)
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  aluminioTieneGaza
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] ${
                    aluminioTieneGaza ? "border-white bg-white text-indigo-700" : "border-slate-300 bg-white"
                  }`}
                >
                  {aluminioTieneGaza && <Check className="h-3 w-3" />}
                </span>
                <span>{aluminioTieneGaza ? "Gaza Activada" : "+ Sumar Gaza"}</span>
              </button>
            </div>

            {aluminioTieneGaza && (
              <div className="rounded-xl border border-indigo-200 bg-white p-4 space-y-4 animate-in fade-in duration-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Sistema en Gaza Delantera:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                    {(["Tradicional", "Roller", "Bandas verticales", "Tradicional Mot", "Roller Mot"] as const).map((tg) => (
                      <button
                        key={tg}
                        type="button"
                        onClick={() => {
                          setTipoCapaGaza(tg)
                          if (tg === "Tradicional") {
                            // default riel si no estaba
                            if (!sistemaTradicional) setSistemaTradicional("Riel")
                          } else if (tg === "Tradicional Mot") {
                            setSistemaTradicional("Riel")
                          }
                        }}
                        className={`rounded-lg border py-2 px-1 text-xs font-bold transition text-center ${
                          tipoCapaGaza === tg
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {tg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── 1) TRADICIONAL (Común) ── */}
                {tipoCapaGaza === "Tradicional" && (
                  <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                    {/* Selector de Sistema: Riel o Barral */}
                    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Sistema Tradicional Gaza:
                      </label>
                      <div className="flex gap-2 max-w-xs">
                        {SISTEMAS_TRADICIONAL.map((sis) => (
                          <button
                            key={sis}
                            type="button"
                            onClick={() => {
                              setSistemaTradicional(sis)
                              if (sis === "Riel") setColorBarral(null)
                            }}
                            className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                              sistemaTradicional === sis
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {sis}
                          </button>
                        ))}
                      </div>

                      {/* Si es Riel: Normal o Curvo */}
                      {sistemaTradicional === "Riel" && (
                        <div className="pt-2 border-t border-slate-200/80 animate-in fade-in duration-100">
                          <label className="block text-xs font-bold text-slate-700">
                            Tipo de Riel:
                          </label>
                          <div className="mt-1 flex gap-2 max-w-xs">
                            {(["Normal", "Curvo"] as const).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setTipoRiel(r)}
                                className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                  tipoRiel === r
                                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Si es Barral: Color + Modelo Kent/Grampa con cálculo */}
                      {sistemaTradicional === "Barral" && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-100">
                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Acabado / Color del Barral:
                            </label>
                            <div className="mt-1 flex flex-wrap gap-1.5">
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

                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Modelo de Soporte Barral:
                            </label>
                            <div className="mt-1 flex gap-2 max-w-xs">
                              {(["Kent", "Grampa"] as const).map((sop) => (
                                <button
                                  key={sop}
                                  type="button"
                                  onClick={() => setTipoSoporte(sop)}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
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
                                  {calcularCantidadSoportes(typeof anchoGaza === "number" ? anchoGaza : (typeof anchoAluminio === "number" ? anchoAluminio : 0))} Soportes {tipoSoporte} Simple
                                </strong>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Paños Tradicional (como Imagen 2) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Cantidad de Paños:
                        </label>
                        {maxPanosGazaVisibles < 5 && (
                          <button
                            type="button"
                            onClick={() => setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))}
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
                              {p} {p > 1 ? "paños" : "paño"}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Inputs de Ancho Total + Centrar si > 1 */}
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
                        <div className="rounded-xl bg-slate-50 p-3 border border-indigo-100">
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

                    {/* Alto Gaza */}
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
                          setAltoGaza(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                        }
                        placeholder="0.00"
                        required
                        className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                    </div>

                    {/* Tela */}
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

                {/* ── 2) ROLLER & 4) ROLLER MOT ── */}
                {(tipoCapaGaza === "Roller" || tipoCapaGaza === "Roller Mot") && (
                  <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                    {/* Marca Gaza (RS / HD) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Marca de Proveedor para GAZA ({tipoCapaGaza}):
                      </label>
                      <div className="flex gap-2 max-w-xs">
                        {(["RS", "HD"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setMarcaGaza(m)
                              if (m === "HD" && (perfileria === "Gris" || perfileria === "Beige")) {
                                setPerfileria("Blanco")
                              }
                            }}
                            className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                              marcaGaza === m
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Perfilería dependiente de marca */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Perfilería ({tipoCapaGaza}):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(marcaGaza === "RS"
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

                    {/* Soportes Roller (Común default / Extendido) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Modelo de Soporte Roller:
                      </label>
                      <div className="flex gap-2 max-w-xs">
                        {(["Común", "Extendido"] as const).map((sr) => (
                          <button
                            key={sr}
                            type="button"
                            onClick={() => setTipoSoporteRoller(sr)}
                            className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                              (tipoSoporteRoller || "Común") === sr
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {sr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cantidad de Cortinas (como Imagen 3) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Cantidad de Cortinas:
                        </label>
                        {maxPanosGazaVisibles < 5 && (
                          <button
                            type="button"
                            onClick={() => setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))}
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
                              {p} {p > 1 ? "cortinas" : "cortina"}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Caída Roller (Por delante | Por detrás). Posición NO VA porque siempre va adelante del aluminio */}
                    <div className="rounded-xl border border-indigo-100 bg-slate-50/50 p-3 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Caída Roller (GAZA ({tipoCapaGaza})):
                      </label>
                      <div className="flex gap-2 max-w-xs">
                        {TIPOS_CAIDA.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCaida(c)}
                            className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                              caida === c
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Medida, modo y mando de cada cortina (como Imagen 3) */}
                    <div className="rounded-xl bg-white p-3 border border-indigo-100 space-y-3">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Medida, modo y mando de cada cortina (GAZA ({tipoCapaGaza})):
                      </label>
                      <div className="space-y-2">
                        {Array.from({ length: panosGaza }).map((_, pIdx) => (
                          <div
                            key={pIdx}
                            className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2"
                          >
                            <div className="flex-1 min-w-[110px]">
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

                            {/* Mando individual por cortina (en Roller Mot indica lado de salida motor/cable) */}
                            <div className="shrink-0">
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                {tipoCapaGaza === "Roller Mot" ? "Motor / Cable:" : "Mando:"}
                              </span>
                              <div className="flex gap-1">
                                {(["Izquierda", "Derecha"] as const).map((m) => {
                                  const activo = mandosRollerGaza[pIdx] === m
                                  return (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        const arr = [...mandosRollerGaza]
                                        arr[pIdx] = m
                                        setMandosRollerGaza(arr)
                                      }}
                                      className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                        activo
                                          ? "border-indigo-600 bg-indigo-600 text-white"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      {m === "Izquierda" ? "Izq" : "Der"}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Modo: Normal / Sólo tela / Sólo riel */}
                            <div className="shrink-0">
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                Modo:
                              </span>
                              <div className="flex gap-1">
                                {opcionesModo(tipoCapaGaza !== "Roller Mot").map((m) => {
                                  const activo = (modosPanosGaza[pIdx] || "Normal") === m.val
                                  return (
                                    <button
                                      key={m.label}
                                      type="button"
                                      onClick={() => {
                                        const arr = [...modosPanosGaza]
                                        arr[pIdx] = m.val
                                        setModosPanosGaza(arr)
                                      }}
                                      className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                        activo
                                          ? "border-indigo-600 bg-indigo-600 text-white"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      {m.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alto Gaza */}
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
                          setAltoGaza(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                        }
                        placeholder="0.00"
                        required
                        className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                    </div>

                    {/* Nombre de la Tela */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Nombre de la Tela (Gaza)
                      </label>
                      <input
                        type="text"
                        value={nombreTelaGaza}
                        onChange={(e) => setNombreTelaGaza(e.target.value)}
                        placeholder="Ej: Gasa de Lino Blanco, Screen 5%"
                        className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* ── BANDAS VERTICALES ── */}
                {tipoCapaGaza === "Bandas verticales" && (
                  <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                    {/* Marca Gaza (RS / HD) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Marca de Proveedor para GAZA (Bandas Verticales):
                      </label>
                      <div className="flex gap-2 max-w-xs">
                        {(["RS", "HD"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setMarcaGaza(m)
                              if (m === "HD" && (perfileria === "Gris" || perfileria === "Beige")) {
                                setPerfileria("Blanco")
                              }
                            }}
                            className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                              marcaGaza === m
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Perfilería dependiente de marca */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Perfilería (Bandas Verticales):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(marcaGaza === "RS"
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

                    {/* Cantidad de Cortinas */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Cantidad de Cortinas:
                        </label>
                        {maxPanosGazaVisibles < 5 && (
                          <button
                            type="button"
                            onClick={() => setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))}
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
                              {p} {p > 1 ? "cortinas" : "cortina"}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Medida, modo y mando de cada cortina */}
                    <div className="rounded-xl bg-white p-3 border border-indigo-100 space-y-3">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Medida, modo y mando de cada cortina (GAZA (Bandas Verticales)):
                      </label>
                      <div className="space-y-2">
                        {Array.from({ length: panosGaza }).map((_, pIdx) => (
                          <div
                            key={pIdx}
                            className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2"
                          >
                            <div className="flex-1 min-w-[110px]">
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

                            {/* Mando individual por cortina */}
                            <div className="shrink-0">
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                Mando:
                              </span>
                              <div className="flex gap-1">
                                {(["Izquierda", "Derecha"] as const).map((m) => {
                                  const activo = mandosRollerGaza[pIdx] === m
                                  return (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => {
                                        const arr = [...mandosRollerGaza]
                                        arr[pIdx] = m
                                        setMandosRollerGaza(arr)
                                      }}
                                      className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                        activo
                                          ? "border-indigo-600 bg-indigo-600 text-white"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      {m === "Izquierda" ? "Izq" : "Der"}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Modo: Normal / Sólo tela / Sólo riel */}
                            <div className="shrink-0">
                              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                Modo:
                              </span>
                              <div className="flex gap-1">
                                {opcionesModo(true).map((m) => {
                                  const activo = (modosPanosGaza[pIdx] || "Normal") === m.val
                                  return (
                                    <button
                                      key={m.label}
                                      type="button"
                                      onClick={() => {
                                        const arr = [...modosPanosGaza]
                                        arr[pIdx] = m.val
                                        setModosPanosGaza(arr)
                                      }}
                                      className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                        activo
                                          ? "border-indigo-600 bg-indigo-600 text-white"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      {m.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alto Gaza */}
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
                          setAltoGaza(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                        }
                        placeholder="0.00"
                        required
                        className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                    </div>

                    {/* Nombre de la Tela */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Nombre de la Tela (Gaza)
                      </label>
                      <input
                        type="text"
                        value={nombreTelaGaza}
                        onChange={(e) => setNombreTelaGaza(e.target.value)}
                        placeholder="Ej: Screen 5%, Sunscreen Blanco"
                        className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
                {tipoCapaGaza === "Tradicional Mot" && (
                  <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                    {/* Sistema Riel fijo + selector Normal o Curvo */}
                    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                          Riel
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          (Tradicional motorizada utiliza Riel)
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80">
                        <label className="block text-xs font-bold text-slate-700">
                          Tipo de Riel:
                        </label>
                        <div className="mt-1 flex gap-2 max-w-xs">
                          {(["Normal", "Curvo"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setTipoRiel(r)}
                              className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                tipoRiel === r
                                  ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Paños Tradicional Mot (como Imagen 4 pero con título Tradicional Mot) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Cantidad de Paños:
                        </label>
                        {maxPanosGazaVisibles < 5 && (
                          <button
                            type="button"
                            onClick={() => setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))}
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
                              {p} {p > 1 ? "paños" : "paño"}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Inputs de Ancho Total + Centrar si > 1 */}
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
                        <div className="rounded-xl bg-slate-50 p-3 border border-indigo-100">
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

                    {/* Alto Gaza */}
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
                          setAltoGaza(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                        }
                        placeholder="0.00"
                        required
                        className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                    </div>

                    {/* Tela */}
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
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* FLUJO PROGRESIVO: SI SELECCIONÓ TRADICIONAL O ROLLER / BANDAS / NOCHE TOTAL / MOSQUERA / MOTORIZADA */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tipo && tipo !== "Aluminio" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* ── PASO ESPECIAL: Subtipo si es Motorizada ── */}
          {tipo === "Motorizada" && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-950">
                  Subcategoría Motorizada
                </label>
              </div>
              <p className="text-xs text-amber-800/80">
                Elegí la combinación de cortinas motorizadas o combinadas para esta abertura:
              </p>
              {/* Grilla 2 columnas exactas ordenadas de izq a der */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Columna 1 */}
                <div className="space-y-2">
                  {SUBTIPOS_MOTORIZADA.slice(0, 4).map((sub, idx) => {
                    const sel = subtipoMotorizada === sub
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubtipoMotorizada(sub)}
                        className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition text-left ${
                          sel
                            ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${sel ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {idx + 1}
                          </span>
                          {sub}
                        </span>
                        {sel && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {/* Columna 2 */}
                <div className="space-y-2">
                  {SUBTIPOS_MOTORIZADA.slice(4, 8).map((sub, idx) => {
                    const sel = subtipoMotorizada === sub
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubtipoMotorizada(sub)}
                        className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition text-left ${
                          sel
                            ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${sel ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {idx + 5}
                          </span>
                          {sub}
                        </span>
                        {sel && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── PASO: Sistema Tradicional (Riel Normal/Curvo o Barral) ── */}
          {(tipo === "Tradicional" || hayTradicionalComun || (esMotorizada && (capaGazaEsTradicional || capaBOEsTradicional))) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Sistema Tradicional {hayTradicionalComun || tipo === "Tradicional" ? "(Riel o Barral)" : "(Motorizada usa Riel)"}
              </label>

              {/* Si hay tradicional común, puede elegir Riel o Barral */}
              {(tipo === "Tradicional" || hayTradicionalComun) ? (
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
              ) : (
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-indigo-600 bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs">
                    Riel
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (Las cortinas tradicionales motorizadas utilizan riel)
                  </span>
                </div>
              )}

              {/* Si es Riel (común o motorizada): Selector Normal o Curvo */}
              {(sistemaTradicional === "Riel" || (esMotorizada && !hayTradicionalComun)) && (
                <div className="pt-2 border-t border-slate-200/80 animate-in fade-in duration-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Tipo de Riel:
                  </label>
                  <div className="mt-1.5 flex gap-2 max-w-xs">
                    {(["Normal", "Curvo"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTipoRiel(r)}
                        className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                          tipoRiel === r
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Si eligió Barral: color del barral */}
              {(tipo === "Tradicional" || hayTradicionalComun) && sistemaTradicional === "Barral" && (
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
          )}

          {/* ── PASO: Perfilería General si hay Roller o Roller Mot ── */}
          {(hayAlgunaRoller || tipo === "Bandas verticales" || tipo === "Mosquera") && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Perfilería de Cortina {tipo === "Roller Noche total" ? "(Noche Total)" : "(Roller / Bandas)"}
              </label>
              <p className="text-[11px] text-slate-500">
                Aplica a todas las capas roller de la abertura
              </p>
              <div className="flex flex-wrap gap-2">
                {(tipo === "Roller Noche total" || tipo === "Noche total" || tipo === "Mosquera"
                  ? PERFILERIA_NOCHE_TOTAL
                  : (marca === "RS" || marcaBO === "RS" || marcaGaza === "RS")
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

          {/* ── PASO: Sujeción de la Cortina ── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Sujeción de la Cortina:
            </label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_SUJECION.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSujecion(s)}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                    sujecion === s
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Soportes: Grampa o Kent SOLO SI HAY BARRAL (En Riel no llevan soportes) ── */}
          {((tipo === "Tradicional" || hayTradicionalComun) && sistemaTradicional === "Barral") && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Modelo de Soporte Barral (Tradicional Taller):
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

          {/* Soporte Roller: Común / Extendido para todo lo que tenga Roller */}
          {hayAlgunaRoller && (
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

                {/* Opción de Gaza delantera en Roller Noche Total */}
                <div className="pt-3 border-t border-indigo-100 space-y-3 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        ¿Sumar Gaza por delante?
                      </label>
                      <p className="text-[11px] text-slate-500">
                        La noche total actúa como B.O. y por delante se coloca una Gaza (Tradicional, Roller o Motorizada)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nuevo = !nocheTotalTieneGaza
                        setNocheTotalTieneGaza(nuevo)
                        setGazaActiva(nuevo)
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        nocheTotalTieneGaza
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border text-[10px] ${
                          nocheTotalTieneGaza ? "border-white bg-white text-indigo-700" : "border-slate-300 bg-white"
                        }`}
                      >
                        {nocheTotalTieneGaza && <Check className="h-3 w-3" />}
                      </span>
                      <span>{nocheTotalTieneGaza ? "Gaza Activada" : "+ Sumar Gaza"}</span>
                    </button>
                  </div>

                  {nocheTotalTieneGaza && (
                    <div className="rounded-xl border border-indigo-200 bg-white p-4 space-y-4 animate-in fade-in duration-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tipo de Sistema en Gaza Delantera:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                          {(["Tradicional", "Roller", "Bandas verticales", "Tradicional Mot", "Roller Mot"] as const).map((tg) => (
                            <button
                              key={tg}
                              type="button"
                              onClick={() => {
                                setTipoCapaGaza(tg)
                                if (tg === "Tradicional") {
                                  if (!sistemaTradicional) setSistemaTradicional("Riel")
                                } else if (tg === "Tradicional Mot") {
                                  setSistemaTradicional("Riel")
                                }
                              }}
                              className={`rounded-lg border py-2 px-1 text-xs font-bold transition text-center ${
                                tipoCapaGaza === tg
                                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {tg}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── 1) TRADICIONAL (Común) ── */}
                      {tipoCapaGaza === "Tradicional" && (
                        <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                          {/* Selector de Sistema: Riel o Barral */}
                          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                              Sistema Tradicional Gaza:
                            </label>
                            <div className="flex gap-2 max-w-xs">
                              {SISTEMAS_TRADICIONAL.map((sis) => (
                                <button
                                  key={sis}
                                  type="button"
                                  onClick={() => {
                                    setSistemaTradicional(sis)
                                    if (sis === "Riel") setColorBarral(null)
                                  }}
                                  className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                                    sistemaTradicional === sis
                                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {sis}
                                </button>
                              ))}
                            </div>

                            {/* Si es Riel: Normal o Curvo */}
                            {sistemaTradicional === "Riel" && (
                              <div className="pt-2 border-t border-slate-200/80 animate-in fade-in duration-100">
                                <label className="block text-xs font-bold text-slate-700">
                                  Tipo de Riel:
                                </label>
                                <div className="mt-1 flex gap-2 max-w-xs">
                                  {(["Normal", "Curvo"] as const).map((r) => (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => setTipoRiel(r)}
                                      className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                        tipoRiel === r
                                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Si es Barral: Color + Modelo Kent/Grampa con cálculo */}
                            {sistemaTradicional === "Barral" && (
                              <div className="pt-2 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-100">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700">
                                    Acabado / Color del Barral:
                                  </label>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
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

                                <div>
                                  <label className="block text-xs font-bold text-slate-700">
                                    Modelo de Soporte Barral:
                                  </label>
                                  <div className="mt-1 flex gap-2 max-w-xs">
                                    {(["Kent", "Grampa"] as const).map((sop) => (
                                      <button
                                        key={sop}
                                        type="button"
                                        onClick={() => setTipoSoporte(sop)}
                                        className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
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
                                        {calcularCantidadSoportes(typeof anchoGaza === "number" ? anchoGaza : 0)} Soportes {tipoSoporte} Simple
                                      </strong>
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Paños Tradicional */}
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700">
                                Cantidad de Paños:
                              </label>
                              {maxPanosGazaVisibles < 5 && (
                                <button
                                  type="button"
                                  onClick={() => setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))}
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
                                    {p} {p > 1 ? "paños" : "paño"}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {/* Inputs de Ancho Total + Centrar si > 1 */}
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
                              <div className="rounded-xl bg-slate-50 p-3 border border-indigo-100">
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

                          {/* Alto Gaza */}
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
                                setAltoGaza(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                              }
                              placeholder="0.00"
                              required
                              className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                            />
                          </div>

                          {/* Tela */}
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

                      {/* ── 2) ROLLER & 4) ROLLER MOT ── */}
                      {(tipoCapaGaza === "Roller" || tipoCapaGaza === "Roller Mot") && (
                        <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                          {/* Marca Gaza (RS / HD) */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Marca de Proveedor para GAZA ({tipoCapaGaza}):
                            </label>
                            <div className="flex gap-2 max-w-xs">
                              {(["RS", "HD"] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    setMarcaGaza(m)
                                    if (m === "HD" && (perfileria === "Gris" || perfileria === "Beige")) {
                                      setPerfileria("Blanco")
                                    }
                                  }}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                    marcaGaza === m
                                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Perfilería dependiente de marca */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Perfilería ({tipoCapaGaza}):
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {(marcaGaza === "RS"
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

                          {/* Soportes Roller (Común default / Extendido) */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Modelo de Soporte Roller:
                            </label>
                            <div className="flex gap-2 max-w-xs">
                              {(["Común", "Extendido"] as const).map((sr) => (
                                <button
                                  key={sr}
                                  type="button"
                                  onClick={() => setTipoSoporteRoller(sr)}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                    (tipoSoporteRoller || "Común") === sr
                                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {sr}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cantidad de Cortinas */}
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700">
                                Cantidad de Cortinas:
                              </label>
                              {maxPanosGazaVisibles < 5 && (
                                <button
                                  type="button"
                                  onClick={() => setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))}
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
                                    {p} {p > 1 ? "cortinas" : "cortina"}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {/* Caída Roller (Por delante | Por detrás). Posición NO VA porque siempre va adelante del Noche Total */}
                          <div className="rounded-xl border border-indigo-100 bg-slate-50/50 p-3 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                              Caída Roller (GAZA ({tipoCapaGaza})):
                            </label>
                            <div className="flex gap-2 max-w-xs">
                              {TIPOS_CAIDA.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setCaida(c)}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                    caida === c
                                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Medida, modo y mando de cada cortina */}
                          <div className="rounded-xl bg-white p-3 border border-indigo-100 space-y-3">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Medida, modo y mando de cada cortina (GAZA ({tipoCapaGaza})):
                            </label>
                            <div className="space-y-2">
                              {Array.from({ length: panosGaza }).map((_, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2"
                                >
                                  <div className="flex-1 min-w-[110px]">
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

                                  {/* Mando individual por cortina (en Roller Mot indica salida cable/motor) */}
                                  <div className="shrink-0">
                                    <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                      {tipoCapaGaza === "Roller Mot" ? "Motor / Cable:" : "Mando:"}
                                    </span>
                                    <div className="flex gap-1">
                                      {(["Izquierda", "Derecha"] as const).map((m) => {
                                        const activo = mandosRollerGaza[pIdx] === m
                                        return (
                                          <button
                                            key={m}
                                            type="button"
                                            onClick={() => {
                                              const arr = [...mandosRollerGaza]
                                              arr[pIdx] = m
                                              setMandosRollerGaza(arr)
                                            }}
                                            className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                              activo
                                                ? "border-indigo-600 bg-indigo-600 text-white"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                          >
                                            {m === "Izquierda" ? "Izq" : "Der"}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Modo: Normal / Sólo tela / Sólo riel */}
                                  <div className="shrink-0">
                                    <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                      Modo:
                                    </span>
                                    <div className="flex gap-1">
                                      {opcionesModo(tipoCapaGaza !== "Roller Mot").map((m) => {
                                  const activo = (modosPanosGaza[pIdx] || "Normal") === m.val
                                        return (
                                          <button
                                            key={m.label}
                                            type="button"
                                            onClick={() => {
                                              const arr = [...modosPanosGaza]
                                              arr[pIdx] = m.val
                                              setModosPanosGaza(arr)
                                            }}
                                            className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                              activo
                                                ? "border-indigo-600 bg-indigo-600 text-white"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                          >
                                            {m.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Alto Gaza */}
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
                                setAltoGaza(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                              }
                              placeholder="0.00"
                              required
                              className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                            />
                          </div>

                          {/* Nombre de la Tela */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Nombre de la Tela (Gaza)
                            </label>
                            <input
                              type="text"
                              value={nombreTelaGaza}
                              onChange={(e) => setNombreTelaGaza(e.target.value)}
                              placeholder="Ej: Gasa de Lino Blanco, Screen 5%"
                              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 3) BANDAS VERTICALES ── */}
                      {tipoCapaGaza === "Bandas verticales" && (
                        <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                          {/* Marca Gaza (RS / HD) */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Marca de Proveedor para GAZA (Bandas Verticales):
                            </label>
                            <div className="flex gap-2 max-w-xs">
                              {(["RS", "HD"] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    setMarcaGaza(m)
                                    if (m === "HD" && (perfileria === "Gris" || perfileria === "Beige")) {
                                      setPerfileria("Blanco")
                                    }
                                  }}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                    marcaGaza === m
                                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Perfilería dependiente de marca */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Perfilería (Bandas Verticales):
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {(marcaGaza === "RS"
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

                          {/* Cantidad de Cortinas */}
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700">
                                Cantidad de Cortinas:
                              </label>
                              {maxPanosGazaVisibles < 5 && (
                                <button
                                  type="button"
                                  onClick={() => setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))}
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
                                    {p} {p > 1 ? "cortinas" : "cortina"}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {/* Medida, modo y mando de cada cortina */}
                          <div className="rounded-xl bg-white p-3 border border-indigo-100 space-y-3">
                            <label className="block text-[11px] font-bold text-slate-700">
                              Medida, modo y mando de cada cortina (GAZA (Bandas Verticales)):
                            </label>
                            <div className="space-y-2">
                              {Array.from({ length: panosGaza }).map((_, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2"
                                >
                                  <div className="flex-1 min-w-[110px]">
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

                                  {/* Mando individual por cortina */}
                                  <div className="shrink-0">
                                    <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                      Mando:
                                    </span>
                                    <div className="flex gap-1">
                                      {(["Izquierda", "Derecha"] as const).map((m) => {
                                        const activo = mandosRollerGaza[pIdx] === m
                                        return (
                                          <button
                                            key={m}
                                            type="button"
                                            onClick={() => {
                                              const arr = [...mandosRollerGaza]
                                              arr[pIdx] = m
                                              setMandosRollerGaza(arr)
                                            }}
                                            className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                              activo
                                                ? "border-indigo-600 bg-indigo-600 text-white"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                          >
                                            {m === "Izquierda" ? "Izq" : "Der"}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Modo: Normal / Sólo tela / Sólo riel */}
                                  <div className="shrink-0">
                                    <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                      Modo:
                                    </span>
                                    <div className="flex gap-1">
                                      {opcionesModo(true).map((m) => {
                                  const activo = (modosPanosGaza[pIdx] || "Normal") === m.val
                                        return (
                                          <button
                                            key={m.label}
                                            type="button"
                                            onClick={() => {
                                              const arr = [...modosPanosGaza]
                                              arr[pIdx] = m.val
                                              setModosPanosGaza(arr)
                                            }}
                                            className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                              activo
                                                ? "border-indigo-600 bg-indigo-600 text-white"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                          >
                                            {m.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Alto Gaza */}
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
                                setAltoGaza(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                              }
                              placeholder="0.00"
                              required
                              className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                            />
                          </div>

                          {/* Nombre de la Tela */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Nombre de la Tela (Gaza)
                            </label>
                            <input
                              type="text"
                              value={nombreTelaGaza}
                              onChange={(e) => setNombreTelaGaza(e.target.value)}
                              placeholder="Ej: Screen 5%, Sunscreen Blanco"
                              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* ── 4) TRADICIONAL MOT ── */}
                      {tipoCapaGaza === "Tradicional Mot" && (
                        <div className="space-y-3.5 pt-2 border-t border-indigo-100">
                          {/* Sistema Riel fijo + selector Normal o Curvo */}
                          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg border border-indigo-600 bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                                Riel
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                (Tradicional motorizada utiliza Riel)
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-200/80">
                              <label className="block text-xs font-bold text-slate-700">
                                Tipo de Riel:
                              </label>
                              <div className="mt-1 flex gap-2 max-w-xs">
                                {(["Normal", "Curvo"] as const).map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => setTipoRiel(r)}
                                    className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                      tipoRiel === r
                                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Paños Tradicional Mot */}
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700">
                                Cantidad de Paños:
                              </label>
                              {maxPanosGazaVisibles < 5 && (
                                <button
                                  type="button"
                                  onClick={() => setMaxPanosGazaVisibles((prev) => Math.min(5, prev + 1))}
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
                                    {p} {p > 1 ? "paños" : "paño"}
                                  </button>
                                ))}
                            </div>
                          </div>

                          {/* Inputs de Ancho Total + Centrar si > 1 */}
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
                              <div className="rounded-xl bg-slate-50 p-3 border border-indigo-100">
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

                          {/* Alto Gaza */}
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
                                setAltoGaza(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                              }
                              placeholder="0.00"
                              required
                              className="mt-1 block w-full rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-sm font-bold text-amber-950 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                            />
                          </div>

                          {/* Tela */}
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
                  )}
                </div>
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
                      <span>{tituloTarjetaGaza}</span>
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
                            {capaGazaEsTradicional
                              ? "Cantidad de Paños:"
                              : "Cantidad de Cortinas:"}
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
                                {p} {capaGazaEsTradicional ? `paño${p > 1 ? "s" : ""}` : `cortina${p > 1 ? "s" : ""}`}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Si es Roller o Bandas o Motorizada combinada: permite alternar si la Gaza es Roller o Bandas */}
                      {(tipo === "Roller" || tipo === "Bandas verticales" || (esMotorizada && !capaGazaEsTradicional)) && (
                        <div className="rounded-xl border border-indigo-100 bg-white p-3 space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Tipo de Sistema en Gaza:
                          </label>
                          <div className="flex gap-2">
                            {(["Roller", "Bandas verticales"] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setTipoCapaGaza(t)}
                                className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                  tipoCapaGaza === t
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Marca Gaza (RS o HD) si no es tradicional taller */}
                      {!capaGazaEsTradicional && (
                        <div className="rounded-xl border border-indigo-100 bg-white p-3 space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Marca de Proveedor para {tituloTarjetaGaza}:
                          </label>
                          <div className="flex gap-2 max-w-xs">
                            {(["RS", "HD"] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMarcaGaza(m)}
                                className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                  marcaGaza === m
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

                      {/* CAÍDA Y POSICIÓN ROLLER EN TARJETA GAZA (SOLO SI ES ROLLER O ROLLER MOT) */}
                      {capaGazaEsRoller && (
                        <div className="rounded-xl border border-indigo-100 bg-white p-3 space-y-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Caída Roller ({tituloTarjetaGaza}):
                            </label>
                            <div className="mt-1 flex gap-1.5">
                              {TIPOS_CAIDA.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setCaida(c)}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                                    caida === c
                                      ? "border-indigo-600 bg-indigo-600 text-white font-bold"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Posición Roller ({tituloTarjetaGaza}):
                            </label>
                            <div className="mt-1 flex gap-1.5">
                              {(["Adelante", "Atrás"] as const).map((pos) => (
                                <button
                                  key={pos}
                                  type="button"
                                  onClick={() => setPosicionRoller(pos)}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                                    posicionRoller === pos
                                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {pos}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ingreso de Anchos (SIEMPRE PRIMERO ANCHO):
                          - Tradicional: Ancho Total + paños si > 1
                          - Roller / Bandas: Ancho individual para cada cortina */}
                      {capaGazaEsTradicional ? (
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
                        /* En Roller / Bandas: anchos individuales directos + Opción Sólo Tela por cortina + Mando por cortina */
                        <div className="rounded-xl bg-white p-3 border border-indigo-100 space-y-3">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Medida, modo y mando de cada cortina ({tituloTarjetaGaza}):
                          </label>
                          <div className="space-y-2">
                            {Array.from({ length: panosGaza }).map((_, pIdx) => (
                              <div key={pIdx} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
                                <div className="flex-1 min-w-[110px]">
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

                                {/* Mando individual por cortina */}
                                <div className="shrink-0">
                                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                    Mando:
                                  </span>
                                  <div className="flex gap-1">
                                    {(["Izquierda", "Derecha"] as const).map((m) => {
                                      const activo = mandosRollerGaza[pIdx] === m
                                      return (
                                        <button
                                          key={m}
                                          type="button"
                                          onClick={() => {
                                            const arr = [...mandosRollerGaza]
                                            arr[pIdx] = m
                                            setMandosRollerGaza(arr)
                                          }}
                                          className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                            activo
                                              ? "border-indigo-600 bg-indigo-600 text-white"
                                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          {m === "Izquierda" ? "Izq" : "Der"}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Modo: Normal / Sólo tela / Sólo riel */}
                                <div className="shrink-0">
                                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                    Modo:
                                  </span>
                                  <div className="flex gap-1">
                                    {opcionesModo(!capaGazaEsMotorizada).map((m) => {
                                  const activo = (modosPanosGaza[pIdx] || "Normal") === m.val
                                      return (
                                        <button
                                          key={m.label}
                                          type="button"
                                          onClick={() => {
                                            const arr = [...modosPanosGaza]
                                            arr[pIdx] = m.val
                                            setModosPanosGaza(arr)
                                          }}
                                          className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                            activo
                                              ? "border-indigo-600 bg-indigo-600 text-white"
                                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          {m.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
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
                      <span>{tituloTarjetaBO}</span>
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
                      {/* Formato de Fabricación del B.O. si es Tradicional puro */}
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

                          {/* Si el B.O. es Roller: Selección de Marca */}
                          {formatoBO === "Roller" && (
                            <div className="pt-2 mt-2 border-t border-slate-100 space-y-2 animate-in fade-in duration-100">
                              <span className="block text-[11px] font-bold text-slate-600">
                                Marca de Proveedor B.O. Roller:
                              </span>
                              <div className="flex gap-1.5 max-w-xs">
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
                          )}
                        </div>
                      )}

                      {/* Selector de Cantidad de Cortinas / Tramos */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">
                            {capaBOEsTradicional
                              ? "Cantidad de Paños / Tramos:"
                              : "Cantidad de Cortinas:"}
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
                                {t} {capaBOEsTradicional ? `tramo${t > 1 ? "s" : ""}` : `cortina${t > 1 ? "s" : ""}`}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Si es Roller o Bandas o Motorizada combinada: permite alternar si el B.O. es Roller o Bandas */}
                      {(tipo === "Roller" || tipo === "Bandas verticales" || (esMotorizada && !capaBOEsTradicional)) && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Tipo de Sistema en B.O.:
                          </label>
                          <div className="flex gap-2">
                            {(["Roller", "Bandas verticales"] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setTipoCapaBO(t)}
                                className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                  tipoCapaBO === t
                                    ? "border-slate-800 bg-slate-800 text-white shadow-xs"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Marca B.O. independiente (RS o HD): SOLO SI NO ES TRADICIONAL COMÚN */}
                      {(!capaBOEsTradicional && (tipo !== "Tradicional" || formatoBO === "Roller")) && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Marca de Proveedor para {tituloTarjetaBO}:
                          </label>
                          <div className="flex gap-2 max-w-xs">
                            {(["RS", "HD"] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMarcaBO(m)}
                                className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                                  marcaBO === m
                                    ? "border-slate-800 bg-slate-800 text-white shadow-xs"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CAÍDA Y POSICIÓN ROLLER EN TARJETA B.O. (SOLO SI ES ROLLER O ROLLER MOT) */}
                      {capaBOEsRoller && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Caída Roller ({tituloTarjetaBO}):
                            </label>
                            <div className="mt-1 flex gap-1.5">
                              {TIPOS_CAIDA.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setCaidaBO(c)}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                                    caidaBO === c
                                      ? "border-slate-800 bg-slate-800 text-white font-bold"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700">
                              Posición Roller ({tituloTarjetaBO}):
                            </label>
                            <div className="mt-1 flex gap-1.5">
                              {(["Adelante", "Atrás"] as const).map((pos) => (
                                <button
                                  key={pos}
                                  type="button"
                                  onClick={() => setPosicionRollerBO(pos)}
                                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                                    posicionRollerBO === pos
                                      ? "border-slate-800 bg-slate-100 text-slate-900 font-bold"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {pos}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* EXCEPCIÓN NO ROLLER: B.O. Tradicional puro lleva Posición (Adelante / Atrás) pero NO caída */}
                      {tipo === "Tradicional" && formatoBO === "Tradicional" && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Posición B.O. (Tradicional):
                          </label>
                          <div className="mt-1 flex gap-1.5">
                            {(["Adelante", "Atrás"] as const).map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => setPosicionRollerBO(pos)}
                                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                                  posicionRollerBO === pos
                                    ? "border-slate-800 bg-slate-100 text-slate-900 font-bold"
                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ingreso de Anchos (SIEMPRE PRIMERO ANCHO):
                          - Si capaBOEsTradicional: Ancho Total + tramos si > 1 (SIN modo y SIN mando)
                          - Si NO es tradicional (Roller / Bandas / Motorizada): SOLO cortinas individuales con mando y modo */}
                      {capaBOEsTradicional ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-sky-950">
                              Ancho Total {tituloTarjetaBO} (m)
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
                      ) : (
                        /* Si es Roller, Bandas o Motorizada con Roller: anchos individuales directos con opción Sólo Tela y Mando individual */
                        <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-3">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Medida, modo y mando de cada cortina ({tituloTarjetaBO}):
                          </label>
                          <div className="space-y-2">
                            {Array.from({ length: tramosBO }).map((_, tIdx) => (
                              <div key={tIdx} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
                                <div className="flex-1 min-w-[110px]">
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

                                {/* Mando individual por cortina */}
                                <div className="shrink-0">
                                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                    Mando:
                                  </span>
                                  <div className="flex gap-1">
                                    {(["Izquierda", "Derecha"] as const).map((m) => {
                                      const activo = mandosRollerBO[tIdx] === m
                                      return (
                                        <button
                                          key={m}
                                          type="button"
                                          onClick={() => handleActualizarMandoRollerBO(tIdx, m)}
                                          className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                            activo
                                              ? "border-slate-800 bg-slate-800 text-white"
                                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          {m === "Izquierda" ? "Izq" : "Der"}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Modo: Normal / Sólo tela / Sólo riel */}
                                <div className="shrink-0">
                                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                                    Modo:
                                  </span>
                                  <div className="flex gap-1">
                                    {opcionesModo(!capaBOEsMotorizada).map((m) => {
                                  const activo = (modosTramosBO[tIdx] || "Normal") === m.val
                                      return (
                                        <button
                                          key={m.label}
                                          type="button"
                                          onClick={() => {
                                            const arr = [...modosTramosBO]
                                            arr[tIdx] = m.val
                                            setModosTramosBO(arr)
                                          }}
                                          className={`rounded-md px-2 py-1 text-[11px] font-bold border transition ${
                                            activo
                                              ? "border-slate-800 bg-slate-800 text-white"
                                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          {m.label}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
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

      {/* ── ACORDEÓN DE MOTORIZACIÓN (Si alguna capa es motorizada) ── */}
      {(capaGazaEsMotorizada || capaBOEsMotorizada) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/30 overflow-hidden shadow-xs animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => setSeccionMotorAbierta(!seccionMotorAbierta)}
            className="flex w-full items-center justify-between p-4 bg-amber-100/50 hover:bg-amber-100/70 transition text-left"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Configuración de Motorización & Controles
                </h4>
                <p className="text-[11px] text-amber-800/80">
                  Motores Somfy / Tube, modelos, receptores y canales
                </p>
              </div>
            </div>
            {seccionMotorAbierta ? (
              <ChevronUp className="h-4 w-4 text-amber-800" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-800" />
            )}
          </button>

          {seccionMotorAbierta && (
            <div className="p-4 space-y-4 border-t border-amber-200/60 bg-white">
              {/* Motor para Gaza si es motorizada */}
              {capaGazaEsMotorizada && gazaActiva && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">
                      ⚡ Motor Capa Gaza ({capaGazaEsTradicional ? "Tradicional Mot" : "Roller Mot"})
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Gaza
                    </span>
                  </div>

                  {/* Marca del Motor: Somfy o Tube */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Marca del Motor:
                    </label>
                    <div className="flex gap-2 max-w-xs">
                      {(["Somfy", "Tube"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setMotorGazaMarca(m)
                            if (capaGazaEsTradicional) {
                              setMotorGazaModelo(m === "Somfy" ? "Somfy Tradicional" : "Tube Tradicional")
                            } else {
                              setMotorGazaModelo(m === "Somfy" ? "LSN 6/28R" : "6/28R 40mm")
                            }
                          }}
                          className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                            motorGazaMarca === m
                              ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modelo de motor: si es Roller Mot tiene opciones específicas, si es Tradicional Mot es único */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Modelo de Motor:
                    </label>
                    {capaGazaEsTradicional ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800">
                          {motorGazaMarca} Motor Estándar Tradicional
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(motorGazaMarca === "Somfy"
                          ? MODELOS_MOTOR_ROLLER_SOMFY
                          : MODELOS_MOTOR_ROLLER_TUBE
                        ).map((mod) => (
                          <button
                            key={mod}
                            type="button"
                            onClick={() => setMotorGazaModelo(mod)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                              motorGazaModelo === mod
                                ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {mod}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Control Remoto: Sí / No y Canales */}
                  <div className="pt-2 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Control Remoto Gaza:
                      </label>
                      <div className="flex gap-2">
                        {[
                          { label: "SÍ", val: true },
                          { label: "NO", val: false },
                        ].map((c) => (
                          <button
                            key={c.label}
                            type="button"
                            onClick={() => setMotorGazaControl(c.val)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                              motorGazaControl === c.val
                                ? "border-amber-600 bg-amber-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {motorGazaControl && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Canales del Control:
                        </label>
                        <div className="flex gap-1.5">
                          {CANALES_CONTROL.map((can) => (
                            <button
                              key={can}
                              type="button"
                              onClick={() => setMotorGazaCanales(can)}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                                motorGazaCanales === can
                                  ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {can} {can === 1 ? "canal" : "canales"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Motor para Black Out si es motorizada */}
              {capaBOEsMotorizada && boActiva && (
                <div className="rounded-xl border border-slate-300 bg-slate-50/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      ⚡ Motor Capa Black Out ({tipoCapaBO === "Tradicional" ? "Tradicional Mot" : "Roller Mot"})
                    </span>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                      B.O.
                    </span>
                  </div>

                  {/* Marca del Motor: Somfy o Tube */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Marca del Motor:
                    </label>
                    <div className="flex gap-2 max-w-xs">
                      {(["Somfy", "Tube"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setMotorBOMarca(m)
                            if (tipoCapaBO === "Tradicional") {
                              setMotorBOModelo(m === "Somfy" ? "Somfy Tradicional" : "Tube Tradicional")
                            } else {
                              setMotorBOModelo(m === "Somfy" ? "LSN 6/28R" : "6/28R 40mm")
                            }
                          }}
                          className={`flex-1 rounded-lg border py-2 text-xs font-bold transition ${
                            motorBOMarca === m
                              ? "border-slate-800 bg-slate-800 text-white shadow-xs"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modelo de motor */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Modelo de Motor:
                    </label>
                    {tipoCapaBO === "Tradicional" ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800">
                          {motorBOMarca} Motor Estándar Tradicional
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(motorBOMarca === "Somfy"
                          ? MODELOS_MOTOR_ROLLER_SOMFY
                          : MODELOS_MOTOR_ROLLER_TUBE
                        ).map((mod) => (
                          <button
                            key={mod}
                            type="button"
                            onClick={() => setMotorBOModelo(mod)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                              motorBOModelo === mod
                                ? "border-slate-800 bg-slate-800 text-white shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {mod}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Control Remoto: Sí / No y Canales */}
                  <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Control Remoto B.O.:
                      </label>
                      <div className="flex gap-2">
                        {[
                          { label: "SÍ", val: true },
                          { label: "NO", val: false },
                        ].map((c) => (
                          <button
                            key={c.label}
                            type="button"
                            onClick={() => setMotorBOControl(c.val)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                              motorBOControl === c.val
                                ? "border-slate-800 bg-slate-800 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {motorBOControl && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Canales del Control:
                        </label>
                        <div className="flex gap-1.5">
                          {CANALES_CONTROL.map((can) => (
                            <button
                              key={can}
                              type="button"
                              onClick={() => setMotorBOCanales(can)}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                                motorBOCanales === can
                                  ? "border-slate-800 bg-slate-800 text-white shadow-xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {can} {can === 1 ? "canal" : "canales"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Recuadro Cantidad de Cargadores si algún motor es Li-ion ── */}
              {(motorGazaModelo.toLowerCase().includes("li-ion") || motorBOModelo.toLowerCase().includes("li-ion")) && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-indigo-950">
                        Cantidad de Cargadores (Li-ion):
                      </label>
                      <p className="text-[11px] text-indigo-800/80">
                        Total para la abertura completa (dejar vacío si no lleva)
                      </p>
                    </div>
                  </div>
                  <div className="max-w-xs">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={cantidadCargadores}
                      onChange={(e) =>
                        setCantidadCargadores(
                          e.target.value === "" ? "" : parseInt(e.target.value, 10) || ""
                        )
                      }
                      placeholder="0 (o vacío)"
                      className="mt-1 block w-full rounded-xl border border-indigo-300 bg-white p-2.5 text-sm font-bold text-indigo-950 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>
                </div>
              )}
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
