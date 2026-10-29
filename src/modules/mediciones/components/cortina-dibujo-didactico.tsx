"use client"

import { useState, useMemo } from "react"
import { textoMosquitero } from "../lib/mosquiteros"
import { textoNocheTotal } from "../lib/noche-total"
import type { ICaracteristicasItem } from "../types"
import {
  calcularArgollasGaza,
  calcularCantidadSoportes,
  determinarVarianteSoporte,
  calcularAnchoConfeccionGaza,
  describirModosEspeciales,
} from "../types"
import {
  Ruler,
  Wrench,
  Sparkles,
  ArrowRight,
  Layers,
  Check,
  Info,
  Maximize2,
} from "lucide-react"
import { fmtMedida } from "@/lib/utils"
import { textoMarcaCortina } from "../lib/marcas"

interface CortinaDibujoDidacticoProps {
  ancho: number
  alto: number
  caracteristicas: ICaracteristicasItem | null
  esVistaTaller?: boolean
  modoCompacto?: boolean
  /** Comanda de taller: la Gasa tradicional se dibuja con el ancho de confección (+10 cm repartidos en los paños) */
  medidasConfeccion?: boolean
}

// Colores de Barral
const COLORES_BARRAL_HEX: Record<string, { bg: string; border: string; highlight: string }> = {
  Negro: { bg: "#0f172a", border: "#334155", highlight: "#475569" },
  "Níquel Mate": { bg: "#94a3b8", border: "#64748b", highlight: "#cbd5e1" },
  "Níquel Brilloso": { bg: "#cbd5e1", border: "#94a3b8", highlight: "#f8fafc" },
  "Bronce Viejo": { bg: "#78350f", border: "#92400e", highlight: "#b45309" },
  Blanco: { bg: "#f8fafc", border: "#cbd5e1", highlight: "#ffffff" },
}

// Colores de Aluminio
const COLORES_ALUMINIO_HEX: Record<string, { bg: string; border: string; slatGradient: string }> = {
  Blanco: { bg: "#f8fafc", border: "#e2e8f0", slatGradient: "from-slate-50 via-white to-slate-200" },
  Beige: { bg: "#f5f5dc", border: "#e6e2be", slatGradient: "from-amber-50 via-stone-100 to-amber-100" },
  Natural: { bg: "#e2e8f0", border: "#cbd5e1", slatGradient: "from-slate-100 via-slate-200 to-slate-300" },
  Aluminio: { bg: "#94a3b8", border: "#64748b", slatGradient: "from-slate-300 via-slate-400 to-slate-500" },
  Congo: { bg: "#3e2723", border: "#271613", slatGradient: "from-amber-950 via-stone-900 to-stone-950" },
  Negro: { bg: "#1e293b", border: "#0f172a", slatGradient: "from-slate-800 via-slate-900 to-slate-950" },
}

// Colores de Perfilería
const COLORES_PERFILERIA_HEX: Record<string, { bg: string; border: string }> = {
  Negro: { bg: "#0f172a", border: "#334155" },
  Blanco: { bg: "#ffffff", border: "#cbd5e1" },
  Gris: { bg: "#64748b", border: "#475569" },
  Beige: { bg: "#d6c7b2", border: "#b8a68f" },
  "Bronce Colonial": { bg: "#5c3a21", border: "#784528" },
  "Aluminio Anodizado": { bg: "#94a3b8", border: "#64748b" },
}

export function CortinaDibujoDidactico({
  ancho,
  alto,
  caracteristicas,
  esVistaTaller = false,
  modoCompacto = false,
  medidasConfeccion = false,
}: CortinaDibujoDidacticoProps) {
  const [panoHovered, setPanoHovered] = useState<number | null>(null)
  const [panoSeleccionado, setPanoSeleccionado] = useState<number | null>(null)
  const [capaSeleccionada, setCapaSeleccionada] = useState<"Gaza" | "BO">("Gaza")

  const tipo = caracteristicas?.tipo || "Tradicional"

  // En Aluminio, puede haber Gaza delantera agregada
  const esAluminioConGaza = tipo === "Aluminio" && Boolean(caracteristicas?.gaza?.activa)

  const tieneGaza = Boolean(caracteristicas?.gaza?.activa)
  const tieneBO = tipo === "Aluminio" ? true : Boolean(caracteristicas?.bo?.activa)
  const anchoGaza = caracteristicas?.gaza?.ancho || ancho
  const altoGaza = caracteristicas?.gaza?.alto || alto
  const panosGaza = caracteristicas?.gaza?.panos || 1
  const anchosPanos = caracteristicas?.gaza?.anchosPanos || []

  const anchoBO = tipo === "Aluminio" ? ancho : (caracteristicas?.bo?.ancho || ancho)
  const altoBO = tipo === "Aluminio" ? alto : (caracteristicas?.bo?.alto || alto)
  const tramosBO = tipo === "Aluminio" ? 1 : (caracteristicas?.bo?.tramos || 1)
  const anchosTramos = tipo === "Aluminio" ? [ancho] : (caracteristicas?.bo?.anchosTramos || [])

  // Ancho y alto efectivo calculados para el esquema
  const anchoEfectivo =
    tipo === "Aluminio"
      ? (anchoGaza > 0 && tieneGaza ? Math.max(ancho, anchoGaza) : ancho)
      : tieneGaza
      ? anchoGaza
      : tieneBO
      ? anchoBO
      : ancho
  const altoEfectivo =
    tipo === "Aluminio"
      ? (altoGaza > 0 && tieneGaza ? Math.max(alto, altoGaza) : alto)
      : tieneGaza
      ? altoGaza
      : tieneBO
      ? altoBO
      : alto

  // Fórmulas de confección y componentes
  const argollas = useMemo(() => {
    if (!tieneGaza || caracteristicas?.sistema !== "Barral") return 0
    return calcularArgollasGaza(anchoGaza)
  }, [tieneGaza, anchoGaza, caracteristicas?.sistema])

  const cantidadSoportes = useMemo(() => {
    return calcularCantidadSoportes(anchoEfectivo)
  }, [anchoEfectivo])

  const varianteSoporte = useMemo(() => {
    return determinarVarianteSoporte(tieneGaza, tieneBO, caracteristicas?.formatoBO)
  }, [tieneGaza, tieneBO, caracteristicas?.formatoBO])

  const anchoConfeccionGaza = useMemo(() => {
    return calcularAnchoConfeccionGaza(anchoGaza)
  }, [anchoGaza])

  // Si es Tradicional con B.O. en formato Roller
  const esTradicionalConBORoller =
    tipo === "Tradicional" && tieneBO && caracteristicas?.formatoBO === "Roller"

  // Identificación precisa de sistemas por capa:
  const gazaEsTradicionalComun =
    tipo === "Tradicional" ||
    caracteristicas?.tipoCapaGaza === "Tradicional"

  const boEsTradicionalComun =
    (tipo === "Tradicional" && (!caracteristicas?.formatoBO || caracteristicas?.formatoBO === "Tradicional")) ||
    (tipo === "Motorizada" && (
      caracteristicas?.subtipoMotorizada === "Tradicional Mot y Tradicional" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot y Tradicional"
    ))

  const gazaEsRoller =
    tipo === "Roller" ||
    caracteristicas?.tipoCapaGaza === "Roller" ||
    caracteristicas?.tipoCapaGaza === "Roller Mot" ||
    (tipo === "Motorizada" && (
      caracteristicas?.subtipoMotorizada === "Roller Mot" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot y Roller" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot y Tradicional"
    ))

  const boEsRoller =
    tipo === "Roller" ||
    (tipo === "Tradicional" && caracteristicas?.formatoBO === "Roller") ||
    tipo === "Roller Noche total" ||
    tipo === "Noche total" ||
    caracteristicas?.tipoCapaBO === "Roller" ||
    caracteristicas?.tipoCapaBO === "Roller Mot" ||
    (tipo === "Motorizada" && (
      caracteristicas?.subtipoMotorizada === "Tradicional Mot y Roller" ||
      caracteristicas?.subtipoMotorizada === "Tradicional Mot y Roller Mot" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot y Roller" ||
      caracteristicas?.subtipoMotorizada === "Bandas Verticales y Roller Mot"
    ))

  const gazaEsMotorizada =
    (tipo === "Motorizada" && (
      caracteristicas?.subtipoMotorizada === "Tradicional Mot" ||
      caracteristicas?.subtipoMotorizada === "Tradicional Mot y Tradicional" ||
      caracteristicas?.subtipoMotorizada === "Tradicional Mot y Roller" ||
      caracteristicas?.subtipoMotorizada === "Tradicional Mot y Roller Mot" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot y Roller" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot y Tradicional"
    )) ||
    caracteristicas?.tipoCapaGaza === "Tradicional Mot" ||
    caracteristicas?.tipoCapaGaza === "Roller Mot"

  const boEsMotorizada =
    (tipo === "Motorizada" && (
      caracteristicas?.subtipoMotorizada === "Tradicional Mot" ||
      caracteristicas?.subtipoMotorizada === "Tradicional Mot y Roller Mot" ||
      caracteristicas?.subtipoMotorizada === "Roller Mot" ||
      caracteristicas?.subtipoMotorizada === "Bandas Verticales y Roller Mot"
    )) ||
    caracteristicas?.tipoCapaBO === "Tradicional Mot" ||
    caracteristicas?.tipoCapaBO === "Roller Mot"

  // Gasa tradicional (común o motorizada): en la comanda se dibuja con el ancho de confección
  const gazaEsTradicional =
    gazaEsTradicionalComun ||
    caracteristicas?.tipoCapaGaza === "Tradicional Mot" ||
    (tipo === "Motorizada" && Boolean(caracteristicas?.subtipoMotorizada?.startsWith("Tradicional Mot")))
  const conConfeccionGaza = medidasConfeccion && tieneGaza && gazaEsTradicional
  // B.O. tradicional: también con los +10 cm
  const conConfeccionBO =
    medidasConfeccion && tieneBO && (boEsTradicionalComun || caracteristicas?.tipoCapaBO === "Tradicional Mot")
  /** Ancho de una capa con los +10 cm de confección (repartidos entre sus paños) */
  const conConfeccion = (anchoM: number, aplica: boolean, partes = 1) =>
    aplica && anchoM > 0 ? anchoM + 0.1 / Math.max(1, partes) : anchoM
  // En la comanda los números del dibujo van al doble de tamaño
  const tam = (normal: string, grande: string) => (medidasConfeccion ? grande : normal)

  // ¿Lleva mando la capa Gaza? Solo si NO es tradicional común
  const gazaLlevaMando = tieneGaza && !gazaEsTradicionalComun

  // ¿Lleva mando la capa BO? Solo si NO es tradicional común y no es aluminio puro
  const boLlevaMando = tieneBO && !boEsTradicionalComun && tipo !== "Aluminio"

  // Posición física real (quién va adelante y quién atrás):
  const boAdelante = (() => {
    if (tipo === "Aluminio" || tipo === "Roller Noche total" || tipo === "Noche total") return false
    if (caracteristicas?.posicionRollerBO === "Adelante") return true
    if (caracteristicas?.posicionRollerBO === "Atrás") return false
    if (caracteristicas?.posicionRoller === "Adelante") return false
    if (caracteristicas?.posicionRoller === "Atrás") return true
    return false // Por defecto Gaza va adelante y B.O. atrás
  })()

  // Caídas de telas independientes:
  const caidaGaza = caracteristicas?.caida || "Por delante"
  const caidaBO = caracteristicas?.caidaBO || "Por delante"

  // Mando de persiana de aluminio
  const mandoAluminioLadoIzquierdo =
    String(caracteristicas?.aluminio?.mando || "Derecho").startsWith("Izq")

  // Proporción geométrica real (aspect ratio): ancho / alto
  const anchoVal = anchoEfectivo > 0 ? anchoEfectivo : 2.0
  const altoVal = altoEfectivo > 0 ? altoEfectivo : 2.0
  const ratio = anchoVal / altoVal
  const clampedRatio = Math.max(0.38, Math.min(2.7, ratio))

  // Dimensiones dinámicas de la cortina para representar si es más larga que ancha o viceversa
  const { boxWidth, boxHeight, formatoTexto } = useMemo(() => {
    if (modoCompacto) {
      if (clampedRatio < 0.92) {
        // Vertical compacto ampliado (para aprovechar bien el alto)
        const h = 185
        const w = Math.max(80, Math.min(170, Math.round(h * clampedRatio)))
        return {
          boxWidth: w,
          boxHeight: h,
          formatoTexto: "Vertical",
        }
      } else if (clampedRatio > 1.08) {
        // Horizontal compacto ampliado (para aprovechar bien el ancho)
        const w = Math.min(260, Math.max(160, Math.round(130 * clampedRatio)))
        const h = Math.max(85, Math.min(160, Math.round(w / clampedRatio)))
        return {
          boxWidth: w,
          boxHeight: h,
          formatoTexto: "Horizontal",
        }
      } else {
        // Cuadrado compacto ampliado
        return {
          boxWidth: 155,
          boxHeight: 155,
          formatoTexto: "Cuadrado",
        }
      }
    }

    if (clampedRatio < 0.92) {
      // Más larga / alta que ancha (Vertical / Portrait)
      const h = 270
      const w = Math.max(120, Math.min(250, Math.round(h * clampedRatio)))
      return {
        boxWidth: w,
        boxHeight: h,
        formatoTexto: "Vertical (Más alta que ancha)",
      }
    } else if (clampedRatio > 1.08) {
      // Más ancha que larga (Horizontal / Landscape)
      const w = Math.min(350, Math.max(220, Math.round(180 * clampedRatio)))
      const h = Math.max(130, Math.min(250, Math.round(w / clampedRatio)))
      return {
        boxWidth: w,
        boxHeight: h,
        formatoTexto: "Horizontal (Más ancha que alta)",
      }
    } else {
      // Formato Cuadrado (Ancho ≈ Alto)
      return {
        boxWidth: 220,
        boxHeight: 220,
        formatoTexto: "Cuadrado (Ancho ≈ Alto)",
      }
    }
  }, [clampedRatio, modoCompacto])

  const capaActiva = tieneGaza && tieneBO ? capaSeleccionada : tieneGaza ? "Gaza" : "BO"

  // Lista de paños de Gaza con sus anchos y mandos
  const listaPanosGaza = useMemo(() => {
    if (!tieneGaza) return []
    return Array.from({ length: panosGaza }).map((_, idx) => ({
      numero: idx + 1,
      etiqueta: gazaEsTradicionalComun ? `Paño ${idx + 1}` : `Cortina ${idx + 1}`,
      ancho: anchosPanos[idx] || Number((anchoGaza / panosGaza).toFixed(3)),
      mando: gazaLlevaMando
        ? (caracteristicas?.mandosRollerGaza?.[idx] || (idx === 0 ? "Derecha" : idx === 1 ? "Izquierda" : "Derecha"))
        : null,
      esMotor: gazaEsMotorizada,
    }))
  }, [tieneGaza, panosGaza, anchosPanos, anchoGaza, gazaLlevaMando, gazaEsMotorizada, gazaEsTradicionalComun, caracteristicas?.mandosRollerGaza])

  // Lista de cortinas/tramos de Black Out con sus anchos y mandos
  const listaTramosBO = useMemo(() => {
    if (!tieneBO) return []
    return Array.from({ length: tramosBO }).map((_, idx) => ({
      numero: idx + 1,
      etiqueta: boEsTradicionalComun ? `Paño ${idx + 1}` : `Cortina ${idx + 1}`,
      ancho: anchosTramos[idx] || Number((anchoBO / tramosBO).toFixed(3)),
      mando: boLlevaMando
        ? (caracteristicas?.mandosRollerBO?.[idx] || (idx === 0 ? "Derecha" : idx === 1 ? "Izquierda" : "Derecha"))
        : null,
      esMotor: boEsMotorizada,
    }))
  }, [tieneBO, tramosBO, anchosTramos, anchoBO, boLlevaMando, boEsMotorizada, boEsTradicionalComun, caracteristicas?.mandosRollerBO])

  // Sumas de anchos para proporciones
  const sumaAnchosGaza = useMemo(() => {
    return listaPanosGaza.reduce((acc, p) => acc + (p.ancho > 0 ? p.ancho : 0), 0)
  }, [listaPanosGaza])

  const sumaAnchosBO = useMemo(() => {
    return listaTramosBO.reduce((acc, p) => acc + (p.ancho > 0 ? p.ancho : 0), 0)
  }, [listaTramosBO])

  // Lista de paños principal (para compatibilidad de interacción y vista única)
  const divisiones = useMemo(() => {
    if (tipo === "Aluminio") return []
    if (tieneGaza && !tieneBO) {
      return listaPanosGaza.map((p) => ({
        ...p,
        tipoTela: "Gaza",
        mando: null as string | null,
      }))
    }
    if (tieneBO && !tieneGaza) {
      return listaTramosBO.map((p) => ({
        ...p,
        tipoTela: esTradicionalConBORoller ? "B.O. Roller" : "B.O.",
      }))
    }
    // Si conviven ambas, usamos Gaza como base de referencia principal
    return listaPanosGaza.map((p) => ({
      ...p,
      tipoTela: "Gaza",
      mando: null as string | null,
    }))
  }, [tipo, tieneGaza, tieneBO, listaPanosGaza, listaTramosBO, esTradicionalConBORoller])

  // Suma de los anchos de los paños
  const sumaAnchos = useMemo(() => {
    return divisiones.reduce((acc, p) => acc + (p.ancho > 0 ? p.ancho : 0), 0)
  }, [divisiones])

  // Paño activo enfocado
  const panoActivoIdx = panoHovered ?? panoSeleccionado ?? null
  const panoActivo = panoActivoIdx !== null ? divisiones[panoActivoIdx] : null

  // ── MODO COMPACTO PARA IMPRESIÓN Y HOJAS A4 ──
  if (modoCompacto) {
    if (tipo === "Aluminio") {
      return (
        <div className="flex items-start justify-center gap-1.5 p-0.5">
          {/* Columna de Persiana (Cota superior perfectamente sobre el marco) */}
          <div className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
            {/* Cota Superior */}
            <div className="flex w-full items-center justify-between text-[8px] font-bold text-slate-700 mb-0.5">
              <span>|</span>
              <div className="flex flex-1 items-center px-0.5">
                <div className="h-[1px] flex-1 bg-slate-400" />
                <span className="px-0.5 text-[8px] font-extrabold text-slate-900 bg-white">
                  {anchoEfectivo > 0 ? fmtMedida(anchoEfectivo) : "0.00"}m
                </span>
                <div className="h-[1px] flex-1 bg-slate-400" />
              </div>
              <span>|</span>
            </div>

            {/* Marco de Persiana */}
            <div
              className="relative flex flex-col justify-between border border-slate-800 bg-white p-0.5 overflow-hidden w-full"
              style={{ height: `${boxHeight}px` }}
            >
              {/* Cabezal */}
              <div
                className="h-1.5 w-full border-[0.5px] border-slate-600"
                style={{
                  backgroundColor:
                    COLORES_ALUMINIO_HEX[caracteristicas?.aluminio?.color || "Aluminio"]?.bg ||
                    "#94a3b8",
                }}
              />
              {/* Láminas */}
              <div className="my-0.5 flex flex-1 flex-col justify-between overflow-hidden">
                {Array.from({
                  length: Math.max(4, Math.min(8, Math.floor(boxHeight / 14))),
                }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-full border-[0.5px] border-slate-400"
                    style={{
                      backgroundColor:
                        COLORES_ALUMINIO_HEX[
                          caracteristicas?.aluminio?.color || "Aluminio"
                        ]?.bg || "#cbd5e1",
                    }}
                  />
                ))}
              </div>
              {/* Zócalo */}
              <div
                className="h-1.5 w-full border-[0.5px] border-slate-600"
                style={{
                  backgroundColor:
                    COLORES_ALUMINIO_HEX[caracteristicas?.aluminio?.color || "Aluminio"]?.bg ||
                    "#94a3b8",
                }}
              />
            </div>
          </div>

          {/* Cota Lateral Alto */}
          <div
            className="flex flex-col items-center justify-between text-[8px] font-bold text-slate-700 pt-[14px]"
            style={{ height: `${boxHeight + 14}px` }}
          >
            <span>─</span>
            <span className="text-[8px] font-extrabold text-slate-900 -rotate-90 whitespace-nowrap">
              {altoEfectivo > 0 ? fmtMedida(altoEfectivo) : "0.00"}m
            </span>
            <span>─</span>
          </div>
        </div>
      )
    }

    // Caso Tradicional / Roller / Bandas / Noche Total compacto
    return (
      <div className="flex items-start justify-center gap-1.5 p-0.5">
        {/* Columna de Cortina (Cota superior perfectamente sobre el marco) */}
        <div className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
          {/* Cota Superior Ancho Gaza (o total) */}
          <div className={`flex w-full items-center justify-between ${tam("text-[8px]", "text-[16px]")} font-bold text-slate-700 mb-0.5`}>
            <span>|</span>
            <div className="flex flex-1 items-center px-0.5">
              <div className="h-[1px] flex-1 bg-slate-400" />
              <span className={`px-0.5 ${tam("text-[8px]", "text-[16px]")} font-extrabold text-slate-900 bg-white whitespace-nowrap`}>
                {tieneGaza && tieneBO ? "Gasa: " : ""}
                {anchoEfectivo > 0
                  ? fmtMedida(conConfeccion(anchoEfectivo, tieneGaza ? conConfeccionGaza : conConfeccionBO))
                  : "0.00"}m
              </span>
              <div className="h-[1px] flex-1 bg-slate-400" />
            </div>
            <span>|</span>
          </div>

          {/* Marco de Cortina */}
          <div
            className="relative flex flex-col border border-slate-800 bg-white overflow-hidden w-full"
            style={{ height: `${boxHeight}px` }}
          >
            {/* Cabezal */}
            <div className="h-1.5 w-full bg-slate-300 border-b border-slate-700 shrink-0" />

            {/* Paños */}
            <div className="relative flex flex-1 w-full h-full overflow-hidden">
              {divisiones.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[8px] text-slate-400">
                  {anchoEfectivo > 0 ? fmtMedida(anchoEfectivo) : "0.00"}m
                </div>
              ) : (
                <div className="flex flex-1 w-full h-full divide-x divide-slate-700">
                  {divisiones.map((p, idx) => {
                    const peso = p.ancho > 0 ? p.ancho : 1
                    return (
                      <div
                        key={idx}
                        style={{ flex: `${peso} 1 0%` }}
                        className="flex flex-col justify-between p-0.5 bg-slate-50 text-center"
                      >
                        <span className={`${tam("text-[7px] text-slate-600", "text-[11px] text-slate-900")} font-bold`}>
                          {p.etiqueta
                            .replace("Cortina", "C")
                            .replace("Paño", "P")
                            .replace("Tramo", "T")}
                        </span>
                        <span className={`${tam("text-[9px]", "text-[18px]")} font-extrabold text-slate-950 whitespace-nowrap`}>
                          {fmtMedida(
                            conConfeccion(
                              p.ancho,
                              p.tipoTela === "Gaza" ? conConfeccionGaza : conConfeccionBO,
                              divisiones.length
                            )
                          )}
                          m
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Si conviven ambas: líneas de corte entrecortadas de BO */}
              {tieneGaza && tieneBO && listaTramosBO.length > 1 && (
                <div className="absolute inset-0 flex pointer-events-none">
                  {listaTramosBO.map((b, bIdx) => {
                    const peso = b.ancho > 0 ? b.ancho : 1
                    return (
                      <div
                        key={bIdx}
                        style={{ flex: `${peso} 1 0%` }}
                        className={`h-full ${bIdx > 0 ? "border-l-2 border-dashed border-slate-800" : ""}`}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cota Inferior BO si conviven ambas */}
          {tieneGaza && tieneBO && (
            <div className={`flex w-full items-center justify-between ${tam("text-[7px]", "text-[14px]")} font-bold text-slate-700 mt-0.5`}>
              <span>|</span>
              <div className="flex flex-1 items-center px-0.5">
                <div className="h-[1px] flex-1 bg-slate-500 border-b border-dashed" />
                <span className={`px-0.5 ${tam("text-[7px]", "text-[14px]")} font-extrabold text-slate-900 bg-white whitespace-nowrap`}>
                  B.O.: {anchoBO > 0 ? fmtMedida(conConfeccion(anchoBO, conConfeccionBO)) : "0.00"}m
                </span>
                <div className="h-[1px] flex-1 bg-slate-500 border-b border-dashed" />
              </div>
              <span>|</span>
            </div>
          )}
        </div>

        {/* Cota Lateral Alto */}
        <div
          className={`flex flex-col items-center justify-between ${tam("text-[8px] pt-[14px]", "text-[16px] pt-[26px]")} font-bold text-slate-700`}
          style={{ height: `${boxHeight + (medidasConfeccion ? 26 : 14)}px` }}
        >
          <span>─</span>
          <span className={`${tam("text-[8px]", "text-[16px]")} font-extrabold text-slate-900 -rotate-90 whitespace-nowrap`}>
            {altoEfectivo > 0 ? fmtMedida(altoEfectivo) : "0.00"}m
          </span>
          <span>─</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* ── Cabecera del Esquema ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Esquema Interactivo y Proporcional
            </h4>
            <p className="text-[11px] text-slate-500">
              Tipo:{" "}
              <strong className="text-slate-800">
                {tipo === "Roller Noche total" ? "Roller Noche Total" : tipo}
              </strong>
              {tipo === "Tradicional" ? (
                esTradicionalConBORoller ? (
                  <span>
                    {" "}
                    • B.O.:{" "}
                    <strong>
                      Roller ({caracteristicas?.marcaBO || caracteristicas?.marca || "HD"})
                    </strong>
                  </span>
                ) : (
                  <span>
                    {" "}
                    • Fabricación: <strong>Taller Propio</strong>
                  </span>
                )
              ) : (
                textoMarcaCortina(caracteristicas) && (
                  <span>
                    {" "}
                    • Marca: <strong>{textoMarcaCortina(caracteristicas)}</strong>
                  </span>
                )
              )}
              <span className="ml-1 text-indigo-600 font-semibold">• {formatoTexto}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Referencia técnica si conviven ambas telas */}
          {tieneGaza && tieneBO && (
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3.5 h-[2px] bg-slate-900" />
                <span>Gaza</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3.5 h-[2px] border-b-2 border-dashed border-slate-800" />
                <span>B.O.</span>
              </span>
            </div>
          )}

          {/* Medidas totales del vano */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200">
            <Ruler className="h-3.5 w-3.5 text-indigo-600" />
            <span>
              {anchoEfectivo > 0 ? fmtMedida(anchoEfectivo) : "0.00"} m (Ancho) ×{" "}
              {altoEfectivo > 0 ? fmtMedida(altoEfectivo) : "0.00"} m (Alto)
            </span>
          </div>
        </div>
      </div>

      {/* ── Área de Dibujo Proporcional e Interactivo ── */}
      <div className="relative mt-4 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-radial from-slate-50 to-slate-100/70 p-2 sm:p-6 min-h-[280px] overflow-x-auto touch-scroll w-full">
        {/* Caso 1: ALUMINIO (Persiana Veneciana) */}
        {tipo === "Aluminio" ? (
          <div className="flex flex-col items-center">
            {/* Contenedor alineado: Cota Superior + Marco de Aluminio + Cota Lateral */}
            <div className="flex items-start justify-center gap-2.5">
              {/* Columna de la Persiana */}
              <div className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
                {/* Cota Superior Ancho */}
                <div className="mb-2 flex w-full items-center justify-between text-xs font-bold text-slate-600">
                  <span className="text-slate-400">|</span>
                  <div className="flex flex-1 items-center gap-1 px-1">
                    <div className="h-[1.5px] flex-1 bg-slate-400" />
                    <span className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-slate-900 shadow-2xs whitespace-nowrap">
                      Ancho Total: {anchoEfectivo > 0 ? fmtMedida(anchoEfectivo) : "0.00"} m
                    </span>
                    <div className="h-[1.5px] flex-1 bg-slate-400" />
                  </div>
                  <span className="text-slate-400">|</span>
                </div>

                {/* Contenedor Proporcional de la Persiana */}
                <div
                  className="relative flex flex-col justify-between rounded-lg border-2 border-slate-800 bg-white shadow-md transition-all duration-300 p-2 overflow-hidden w-full"
                  style={{ height: `${boxHeight}px` }}
                >
                  {/* Cabezal de Aluminio */}
                  <div
                    className="h-3.5 w-full rounded-xs shadow-xs border"
                    style={{
                      backgroundColor:
                        COLORES_ALUMINIO_HEX[caracteristicas?.aluminio?.color || "Aluminio"]?.bg ||
                        "#94a3b8",
                      borderColor:
                        COLORES_ALUMINIO_HEX[caracteristicas?.aluminio?.color || "Aluminio"]?.border ||
                        "#64748b",
                    }}
                  />

                  {/* Láminas Horizontales dinámicas según el alto real */}
                  <div className="my-1.5 flex flex-1 flex-col justify-between overflow-hidden relative">
                    {/* Cintas/Hilos verticales pasantes */}
                    <div className="absolute inset-0 flex justify-around pointer-events-none z-10 px-4 opacity-50">
                      <div className="w-[1px] h-full bg-slate-600 dashed" />
                      <div className="w-[1px] h-full bg-slate-600 dashed" />
                    </div>

                    {Array.from({
                      length: Math.max(6, Math.min(16, Math.floor(boxHeight / 20))),
                    }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-full rounded-[1px] shadow-2xs border-[0.5px] border-black/10 transition-all ${
                          caracteristicas?.aluminio?.tipoLamina === "Perforado"
                            ? "opacity-85 border-dashed"
                            : "opacity-95"
                        }`}
                        style={{
                          backgroundColor:
                            COLORES_ALUMINIO_HEX[
                              caracteristicas?.aluminio?.color || "Aluminio"
                            ]?.bg || "#cbd5e1",
                        }}
                      />
                    ))}
                  </div>

                  {/* Zócalo inferior */}
                  <div
                    className="h-2.5 w-full rounded-xs shadow-xs border"
                    style={{
                      backgroundColor:
                        COLORES_ALUMINIO_HEX[caracteristicas?.aluminio?.color || "Aluminio"]?.bg ||
                        "#94a3b8",
                      borderColor:
                        COLORES_ALUMINIO_HEX[caracteristicas?.aluminio?.color || "Aluminio"]?.border ||
                        "#64748b",
                    }}
                  />

                  {/* Mando Colgante (Izquierdo o Derecho) */}
                  <div
                    className={`absolute top-2 z-20 flex flex-col items-center pointer-events-none ${
                      mandoAluminioLadoIzquierdo ? "left-2" : "right-2"
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    <div className="w-[1.5px] bg-slate-500 shadow-xs" style={{ height: `${Math.round(boxHeight * 0.6)}px` }} />
                    <div className="w-2 h-4 rounded-sm border border-slate-700 bg-amber-100 text-[8px] flex items-center justify-center font-bold text-slate-800 shadow-xs">
                      ●
                    </div>
                  </div>
                </div>
              </div>

              {/* Cota Lateral Alto */}
              <div
                className="flex flex-col items-center justify-between text-xs font-bold text-slate-600 pt-7"
                style={{ height: `${boxHeight + 28}px` }}
              >
                <span className="text-slate-400">─</span>
                <div className="flex flex-1 flex-col items-center justify-center gap-1 my-1">
                  <div className="w-[1.5px] flex-1 bg-slate-400" />
                  <span className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-extrabold text-slate-900 shadow-2xs -rotate-90 whitespace-nowrap">
                    Alto Total: {altoEfectivo > 0 ? fmtMedida(altoEfectivo) : "0.00"} m
                  </span>
                  <div className="w-[1.5px] flex-1 bg-slate-400" />
                </div>
                <span className="text-slate-400">─</span>
              </div>
            </div>

            {/* Especificación de aluminio */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-700">
              <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 shadow-2xs">
                Mando: <strong>{caracteristicas?.aluminio?.mando || "Derecho"}</strong>
              </span>
              <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 shadow-2xs">
                Lámina: <strong>{caracteristicas?.aluminio?.tipoLamina || "25 mm"}</strong>
              </span>
              <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 shadow-2xs">
                Color: <strong>{caracteristicas?.aluminio?.color || "Aluminio"}</strong>
              </span>
            </div>
          </div>
        ) : (
          /* Caso 2: TRADICIONAL / ROLLER / BANDAS / NOCHE TOTAL / MOSQUERA */
          <div className="flex flex-col items-center">
            {(!tieneGaza && !tieneBO) ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500 max-w-sm">
                <Sparkles className="h-6 w-6 text-indigo-400 mb-2" />
                <p className="font-semibold text-slate-700">
                  Activá GAZA o B.O. para visualizar la cortina
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  El dibujo se ajustará automáticamente a las proporciones de alto y ancho que ingreses.
                </p>
              </div>
            ) : (
              <>
                {/* Contenedor alineado: Cotas Superiores + Marco de la Cortina + Cotas Inferiores + Cota Lateral */}
                <div className="flex items-start justify-center gap-2.5">
                  {/* Columna de la Cortina con sus cotas arriba y abajo */}
                  <div className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
                    {/* ── COTAS SUPERIORES: GAZA (O TOTAL SI SOLO HAY BO) ── */}
                    {tieneGaza && tieneBO ? (
                      /* Si conviven ambas: Cotas individuales de Gaza arriba */
                      <div className="mb-2 w-full flex flex-col gap-1">
                        <div className="flex w-full items-center justify-between text-[11px] font-bold text-indigo-900">
                          <span className="text-slate-400">|</span>
                          <div className="flex flex-1 items-center gap-1 px-1">
                            <div className="h-[1.5px] flex-1 bg-indigo-300" />
                            <span className="rounded-full border border-indigo-200 bg-indigo-50/90 px-2 py-0.5 text-[9px] font-extrabold text-indigo-900 shadow-2xs whitespace-nowrap">
                              Gaza Total: {anchoGaza > 0 ? fmtMedida(anchoGaza) : "0.00"} m
                            </span>
                            <div className="h-[1.5px] flex-1 bg-indigo-300" />
                          </div>
                          <span className="text-slate-400">|</span>
                        </div>

                        {/* Desglose de paños de Gaza arriba con línea continua */}
                        <div className="flex w-full gap-1">
                          {listaPanosGaza.map((p, idx) => {
                            const peso = p.ancho > 0 ? p.ancho : 1
                            return (
                              <div
                                key={idx}
                                style={{ flex: `${peso} 1 0%` }}
                                className="flex items-center justify-between text-[10px] font-bold text-indigo-950 px-0.5"
                              >
                                <span className="text-slate-400">|</span>
                                <div className="flex flex-1 items-center px-0.5">
                                  <div className="h-[1.5px] flex-1 bg-indigo-400" />
                                  <span className="px-1 text-[9px] font-extrabold text-indigo-950 bg-white rounded border border-indigo-200 shadow-2xs whitespace-nowrap">
                                    G{p.numero}: {fmtMedida(p.ancho)} m
                                  </span>
                                  <div className="h-[1.5px] flex-1 bg-indigo-400" />
                                </div>
                                <span className="text-slate-400">|</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Cota Superior única */
                      <div className="mb-2 flex w-full items-center justify-between text-xs font-bold text-slate-600">
                        <span className="text-slate-400">|</span>
                        <div className="flex flex-1 items-center gap-1 px-1">
                          <div className="h-[1.5px] flex-1 bg-slate-400" />
                          <span className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-slate-900 shadow-2xs whitespace-nowrap">
                            Ancho Total: {anchoEfectivo > 0 ? fmtMedida(anchoEfectivo) : "0.00"} m
                          </span>
                          <div className="h-[1.5px] flex-1 bg-slate-400" />
                        </div>
                        <span className="text-slate-400">|</span>
                      </div>
                    )}

                    {/* Marco Proporcional de la Cortina */}
                    <div
                      className="relative flex flex-col rounded-lg border-2 border-slate-800 bg-white shadow-md transition-all duration-300 overflow-hidden w-full"
                      style={{ height: `${boxHeight}px` }}
                    >
                      {/* 1. Cabezal: Sistema (Riel/Barral) o Perfilería */}
                      <div className="relative z-10 shrink-0 border-b border-slate-700 bg-slate-100 p-1">
                        {tipo === "Tradicional" ? (
                          caracteristicas?.sistema === "Barral" ? (
                            // Barral con remates y color seleccionado
                            <div className="relative flex items-center">
                              {/* Remate izquierdo */}
                              <div
                                className="h-3 w-3 rounded-full shadow-xs shrink-0"
                                style={{
                                  backgroundColor:
                                    COLORES_BARRAL_HEX[caracteristicas?.colorBarral || "Negro"]?.bg ||
                                    "#0f172a",
                                  border: `1px solid ${
                                    COLORES_BARRAL_HEX[caracteristicas?.colorBarral || "Negro"]?.border ||
                                    "#334155"
                                  }`,
                                }}
                              />
                              {/* Tubo de Barral */}
                              <div
                                className="h-2 flex-1 rounded-xs shadow-xs mx-0.5"
                                style={{
                                  backgroundColor:
                                    COLORES_BARRAL_HEX[caracteristicas?.colorBarral || "Negro"]?.bg ||
                                    "#0f172a",
                                }}
                              />
                              {/* Remate derecho */}
                              <div
                                className="h-3 w-3 rounded-full shadow-xs shrink-0"
                                style={{
                                  backgroundColor:
                                    COLORES_BARRAL_HEX[caracteristicas?.colorBarral || "Negro"]?.bg ||
                                    "#0f172a",
                                  border: `1px solid ${
                                    COLORES_BARRAL_HEX[caracteristicas?.colorBarral || "Negro"]?.border ||
                                    "#334155"
                                  }`,
                                }}
                              />

                              {/* Representación de Argollas a lo largo del barral */}
                              {tieneGaza && argollas > 0 && (
                                <div className="absolute inset-0 flex justify-around items-center px-4 pointer-events-none">
                                  {Array.from({ length: Math.min(8, Math.max(3, divisiones.length * 3)) }).map(
                                    (_, aIdx) => (
                                      <div
                                        key={aIdx}
                                        className="h-2 w-2 rounded-full border border-amber-500/80 bg-white/40 shadow-2xs"
                                      />
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Riel Tradicional de aluminio
                            <div className="h-2 w-full rounded-xs bg-slate-300 border border-slate-400 shadow-2xs" />
                          )
                        ) : (
                          // Perfilería para Roller / Bandas / Noche total / Mosquera
                          <div
                            className="h-3 w-full rounded-xs border shadow-2xs"
                            style={{
                              backgroundColor:
                                COLORES_PERFILERIA_HEX[caracteristicas?.perfileria || "Blanco"]?.bg ||
                                "#ffffff",
                              borderColor:
                                COLORES_PERFILERIA_HEX[caracteristicas?.perfileria || "Blanco"]?.border ||
                                "#cbd5e1",
                            }}
                          />
                        )}

                        {/* Marcadores de Soportes en el riel/barral (2 o 3 según ancho) */}
                        <div className="absolute -top-1.5 inset-x-2 flex justify-between pointer-events-none">
                          <div className="h-1.5 w-2 rounded-xs bg-amber-600 shadow-xs" title="Soporte Izquierdo" />
                          {cantidadSoportes === 3 && (
                            <div className="h-1.5 w-2 rounded-xs bg-amber-600 shadow-xs" title="Soporte Central" />
                          )}
                          <div className="h-1.5 w-2 rounded-xs bg-amber-600 shadow-xs" title="Soporte Derecho" />
                        </div>
                      </div>

                      {/* 2. Cuerpo de la Cortina: Paños y Cortes */}
                      <div className="relative flex flex-1 w-full h-full overflow-hidden">
                        {/* CAPA 1: PAÑOS DE GAZA (LÍNEAS CONTINUAS SÓLIDAS) */}
                        {tieneGaza ? (
                          <div className="flex flex-1 w-full h-full divide-x-2 divide-slate-900">
                            {listaPanosGaza.map((p, idx) => {
                              const peso = p.ancho > 0 ? p.ancho : 1
                              const isHovered = panoHovered === idx
                              const isSeleccionado = panoSeleccionado === idx

                              return (
                                <div
                                  key={idx}
                                  onMouseEnter={() => setPanoHovered(idx)}
                                  onMouseLeave={() => setPanoHovered(null)}
                                  onClick={() =>
                                    setPanoSeleccionado((prev) => (prev === idx ? null : idx))
                                  }
                                  style={{
                                    flex: `${peso} 1 0%`,
                                    minWidth: "48px",
                                  }}
                                  className={`group relative flex flex-col justify-between p-2 cursor-pointer transition-all duration-200 select-none ${
                                    isSeleccionado
                                      ? "ring-2 ring-inset ring-indigo-600 bg-indigo-100/60"
                                      : isHovered
                                      ? "bg-indigo-50/70"
                                      : "hover:bg-slate-50"
                                  }`}
                                >
                                  {/* Textura sutil de tela limpia */}
                                  <div className="absolute inset-0 pointer-events-none opacity-40">
                                    <div className="h-full w-full bg-linear-to-b from-indigo-50/70 via-white to-indigo-100/60" />
                                    <div className="absolute inset-0 flex justify-around opacity-25">
                                      <div className="w-[1px] h-full bg-slate-900/30" />
                                      <div className="w-[1px] h-full bg-slate-900/30" />
                                    </div>
                                  </div>

                                  {/* Mando superior de Gaza (Opción A): Solo si la capa Gaza lleva mando (Roller, Bandas o Motorizada) */}
                                  {p.mando && (
                                    <div
                                      className={`absolute top-1 z-30 flex flex-col items-center pointer-events-none ${
                                        String(p.mando) === "Izquierda" ? "left-1.5" : "right-1.5"
                                      }`}
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full shadow-xs ${
                                          p.esMotor ? "bg-amber-500" : "bg-indigo-600"
                                        }`}
                                      />
                                      <div
                                        className={`w-[1.5px] shadow-xs ${
                                          p.esMotor ? "bg-amber-400" : "bg-indigo-400"
                                        }`}
                                        style={{ height: `${Math.round(boxHeight * 0.35)}px` }}
                                      />
                                      <div
                                        className={`px-1 py-0.5 rounded border text-[7px] leading-none font-black shadow-xs flex items-center gap-0.5 ${
                                          p.esMotor
                                            ? "border-amber-400 bg-amber-50 text-amber-900"
                                            : "border-indigo-300 bg-indigo-50 text-indigo-900"
                                        }`}
                                      >
                                        {p.esMotor && <span>⚡</span>}
                                        <span>
                                          {panosGaza > 1 || tieneBO ? `G${p.numero}: ` : ""}
                                          {String(p.mando) === "Izquierda" ? "Izq" : "Der"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          /* Si solo tiene BO: cuerpo limpio con divisiones continuas */
                          <div className="flex flex-1 w-full h-full divide-x-2 divide-slate-800">
                            {listaTramosBO.map((b, idx) => {
                              const peso = b.ancho > 0 ? b.ancho : 1
                              return (
                                <div
                                  key={idx}
                                  style={{ flex: `${peso} 1 0%`, minWidth: "48px" }}
                                  className="relative flex flex-col justify-between p-2 select-none bg-slate-100/80"
                                >
                                  {/* Mando superior cuando solo hay B.O. */}
                                  {b.mando && (
                                    <div
                                      className={`absolute top-1 z-30 flex flex-col items-center pointer-events-none ${
                                        String(b.mando) === "Izquierda" ? "left-1.5" : "right-1.5"
                                      }`}
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full shadow-xs ${
                                          b.esMotor ? "bg-amber-500" : "bg-slate-900"
                                        }`}
                                      />
                                      <div
                                        className={`w-[1.5px] shadow-xs ${
                                          b.esMotor ? "bg-amber-400" : "bg-slate-600"
                                        }`}
                                        style={{ height: `${Math.round(boxHeight * 0.45)}px` }}
                                      />
                                      <div
                                        className={`px-1 py-0.5 rounded border text-[7px] leading-none font-black shadow-xs flex items-center gap-0.5 ${
                                          b.esMotor
                                            ? "border-amber-500 bg-amber-50 text-amber-950"
                                            : "border-slate-800 bg-slate-900 text-white"
                                        }`}
                                      >
                                        {b.esMotor && <span>⚡</span>}
                                        <span>
                                          {tramosBO > 1 ? `C${b.numero}: ` : ""}
                                          {String(b.mando) === "Izquierda" ? "Izq" : "Der"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* CAPA 2 SUPERPUESTA: LÍNEAS ENTRECORTADAS / DASHED DE BLACK OUT (CUANDO COEXISTEN AMBAS) */}
                        {tieneGaza && tieneBO && (
                          <div className="absolute inset-0 flex pointer-events-none z-20">
                            {listaTramosBO.map((b, bIdx) => {
                              const peso = b.ancho > 0 ? b.ancho : 1
                              return (
                                <div
                                  key={bIdx}
                                  style={{ flex: `${peso} 1 0%` }}
                                  className={`relative h-full flex flex-col justify-between p-1.5 ${
                                    bIdx > 0 ? "border-l-2 border-dashed border-slate-900" : ""
                                  }`}
                                >
                                  {/* Mando inferior de B.O. (Opción A): Solo si B.O. lleva mando */}
                                  {b.mando && (
                                    <div
                                      className={`absolute bottom-1 z-30 flex flex-col-reverse items-center pointer-events-none ${
                                        String(b.mando) === "Izquierda" ? "left-1.5" : "right-1.5"
                                      }`}
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full shadow-xs ${
                                          b.esMotor ? "bg-amber-600" : "bg-slate-950"
                                        }`}
                                      />
                                      <div
                                        className={`w-[1.5px] shadow-xs ${
                                          b.esMotor ? "bg-amber-500" : "bg-slate-600"
                                        }`}
                                        style={{ height: `${Math.round(boxHeight * 0.35)}px` }}
                                      />
                                      <div
                                        className={`px-1 py-0.5 rounded border text-[7px] leading-none font-black shadow-xs flex items-center gap-0.5 ${
                                          b.esMotor
                                            ? "border-amber-500 bg-amber-50 text-amber-950"
                                            : "border-slate-800 bg-slate-900 text-white"
                                        }`}
                                      >
                                        {b.esMotor && <span>⚡</span>}
                                        <span>
                                          {`BO${b.numero}: `}
                                          {String(b.mando) === "Izquierda" ? "Izq" : "Der"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── COTAS INFERIORES: BLACK OUT (CUANDO COEXISTEN AMBAS) ── */}
                    {tieneGaza && tieneBO && (
                      <div className="mt-2 w-full flex flex-col gap-1">
                        {/* Desglose de cortinas/tramos de B.O. abajo con línea entrecortada */}
                        <div className="flex w-full gap-1">
                          {listaTramosBO.map((b, idx) => {
                            const peso = b.ancho > 0 ? b.ancho : 1
                            return (
                              <div
                                key={idx}
                                style={{ flex: `${peso} 1 0%` }}
                                className="flex items-center justify-between text-[10px] font-bold text-slate-800 px-0.5"
                              >
                                <span className="text-slate-400">|</span>
                                <div className="flex flex-1 items-center px-0.5">
                                  <div className="h-[1.5px] flex-1 bg-slate-600 border-b border-dashed" />
                                  <span className="px-1 text-[9px] font-extrabold text-white bg-slate-900 rounded shadow-2xs whitespace-nowrap">
                                    BO{b.numero}: {fmtMedida(b.ancho)} m
                                  </span>
                                  <div className="h-[1.5px] flex-1 bg-slate-600 border-b border-dashed" />
                                </div>
                                <span className="text-slate-400">|</span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Cota Total BO al pie */}
                        <div className="flex w-full items-center justify-between text-[11px] font-bold text-slate-700">
                          <span className="text-slate-400">|</span>
                          <div className="flex flex-1 items-center gap-1 px-1">
                            <div className="h-[1.5px] flex-1 bg-slate-400 border-b border-dashed" />
                            <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[9px] font-extrabold text-slate-800 shadow-2xs whitespace-nowrap">
                              B.O. Total: {anchoBO > 0 ? fmtMedida(anchoBO) : "0.00"} m
                            </span>
                            <div className="h-[1.5px] flex-1 bg-slate-400 border-b border-dashed" />
                          </div>
                          <span className="text-slate-400">|</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cota Lateral Alto Total */}
                  <div
                    className="flex flex-col items-center justify-between text-xs font-bold text-slate-600 pt-7"
                    style={{ height: `${boxHeight + (tieneGaza && tieneBO ? 65 : 28)}px` }}
                  >
                    <span className="text-slate-400">─</span>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 my-1">
                      <div className="w-[1.5px] flex-1 bg-slate-400" />
                      <span className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-extrabold text-slate-900 shadow-2xs -rotate-90 whitespace-nowrap">
                        Alto Total: {altoEfectivo > 0 ? fmtMedida(altoEfectivo) : "0.00"} m
                      </span>
                      <div className="w-[1.5px] flex-1 bg-slate-400" />
                    </div>
                    <span className="text-slate-400">─</span>
                  </div>
                </div>
              </>
            )}

            {/* Fila Informativa de la selección actual (SIN PORCENTAJES) */}
            {panoActivo && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-indigo-950 border border-indigo-200 shadow-2xs animate-in fade-in duration-150">
                <Info className="h-3.5 w-3.5 text-indigo-600" />
                <span>
                  {panoActivo.etiqueta}: <strong>{fmtMedida(panoActivo.ancho)} m</strong> • Alto:{" "}
                  <strong>{fmtMedida(altoEfectivo)} m</strong>
                  {tieneGaza && tipo === "Tradicional" && (
                    <span className="text-amber-800 ml-1">
                      • Confección: {fmtMedida(panoActivo.ancho + 0.1)} m
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Especificación de Sistema, Caída y Posición ── */}
      {tipo !== "Aluminio" && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <span className="font-semibold text-slate-700">
              {tipo === "Tradicional"
                ? `Sistema: ${caracteristicas?.sistema || "Riel"}${
                    caracteristicas?.sistema === "Barral"
                      ? ` (${caracteristicas?.colorBarral || "Negro"})`
                      : ""
                  }`
                : `Perfilería: ${caracteristicas?.perfileria || "Blanco"}`}
            </span>

            {caracteristicas?.sujecion && (
              <span className="font-medium text-slate-600">
                Sujeción: <strong>{caracteristicas.sujecion}</strong>
              </span>
            )}
          </div>

          {/* Mosquitero MagicRoll: modelo, cajón, mando / sentido, puertas */}
          {caracteristicas?.mosquitero?.modelo && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-900">
              {textoMosquitero(caracteristicas.mosquitero)}
            </div>
          )}

          {/* Roller Noche Total MagicRoll: sistema, colores y cajón */}
          {caracteristicas?.nocheTotal?.sistema && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-900">
              Noche Total: {textoNocheTotal(caracteristicas.nocheTotal)}
            </div>
          )}

          {/* Posición de Telas y Caídas de Rollo */}
          <div className="flex flex-col gap-2 pt-1 text-[11px]">
            {/* Fila 1: Posición de Telas (quién va adelante y quién atrás) */}
            {tieneGaza && tieneBO ? (
              <div className="flex flex-wrap items-center gap-2 text-slate-700">
                <span className="font-semibold text-slate-600">Posición de Telas:</span>
                <span className="rounded bg-slate-900 text-white px-2 py-0.5 font-bold shadow-2xs">
                  {boAdelante ? "B.O. (Adelante)" : "Gaza (Adelante)"}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="rounded bg-indigo-100 text-indigo-900 px-2 py-0.5 font-bold border border-indigo-200 shadow-2xs">
                  {boAdelante ? "Gaza (Detrás)" : "B.O. (Detrás)"}
                </span>
              </div>
            ) : (
              <div className="text-slate-600">
                Tela: <strong>{tieneGaza ? "Solo Gaza" : "Solo B.O."}</strong>
              </div>
            )}

            {/* Fila 2: Caídas de Rollo (solo si la capa es Roller) */}
            {(gazaEsRoller || boEsRoller) && (
              <div className="flex flex-wrap items-center gap-3 text-slate-600">
                {gazaEsRoller && (
                  <span>
                    Caída Gaza: <strong className="text-slate-800">{caidaGaza}</strong>
                  </span>
                )}
                {boEsRoller && (
                  <span>
                    Caída B.O.: <strong className="text-slate-800">{caidaBO}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Fila 3: Nombres de Telas */}
            {((tieneGaza && caracteristicas?.gaza?.nombreTela) ||
              (tieneBO && caracteristicas?.bo?.nombreTela)) && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {tieneGaza && caracteristicas?.gaza?.nombreTela && (
                  <span className="rounded-md bg-white border border-indigo-200 px-2 py-0.5 text-indigo-900 font-medium">
                    <strong>Gaza:</strong> {caracteristicas.gaza.nombreTela}
                  </span>
                )}
                {tieneBO && caracteristicas?.bo?.nombreTela && (
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-white font-medium">
                    <strong>B.O.:</strong> {caracteristicas.bo.nombreTela}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modo especial por cortina (Sólo tela / Sólo riel) ── */}
      {describirModosEspeciales(caracteristicas).length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px]">
          <span className="font-bold text-amber-900">Modo:</span>
          {describirModosEspeciales(caracteristicas).map((txt) => (
            <span
              key={txt}
              className="rounded bg-amber-600 px-2 py-0.5 font-extrabold text-white"
            >
              {txt}
            </span>
          ))}
        </div>
      )}

      {/* ── Datos Técnicos de Fabricación & Confección para Taller ── */}
      {(esVistaTaller || (tipo === "Tradicional" && (tieneGaza || tieneBO))) && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
            <Wrench className="h-4 w-4 text-amber-700" />
            <span>Especificaciones Técnicas para Producción / Taller</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Medida de Corte Gaza (+10 cm) */}
            {tieneGaza && (
              <div className="rounded-lg border border-amber-200 bg-white p-2.5 shadow-2xs">
                <span className="block text-[10px] font-semibold text-amber-800">
                  Ancho Confección Gaza (+10 cm)
                </span>
                <span className="text-base font-extrabold text-amber-950">
                  {fmtMedida(anchoConfeccionGaza)} m
                </span>
                <span className="block text-[10px] text-amber-600">
                  ({fmtMedida(anchoGaza)}m + 0.10m de margen)
                </span>
              </div>
            )}

            {/* Argollas para Gaza */}
            {tieneGaza && tipo === "Tradicional" && (
              <div className="rounded-lg border border-amber-200 bg-white p-2.5 shadow-2xs">
                <span className="block text-[10px] font-semibold text-amber-800">
                  Argollas (Solo Gaza)
                </span>
                <span className="text-base font-extrabold text-indigo-700">
                  {argollas} unidades
                </span>
                <span className="block text-[10px] text-slate-500">
                  ({panosGaza} paño{panosGaza > 1 ? "s" : ""})
                </span>
              </div>
            )}

            {/* Soportes - Exclusivo Tradicional */}
            {tipo === "Tradicional" && caracteristicas?.tipoSoporte && (
              <div className="rounded-lg border border-amber-200 bg-white p-2.5 shadow-2xs">
                <span className="block text-[10px] font-semibold text-amber-800">
                  Soportes Requeridos (Kent / Grampa)
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {cantidadSoportes} {caracteristicas.tipoSoporte}{" "}
                  {varianteSoporte}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {anchoEfectivo <= 1.8 ? "(≤ 1.80m = 2)" : "(> 1.80m = 3)"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
