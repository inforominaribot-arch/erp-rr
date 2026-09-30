"use client"

import { useState, useMemo } from "react"
import type { ICaracteristicasItem } from "../types"
import {
  calcularArgollasGaza,
  calcularCantidadSoportes,
  determinarVarianteSoporte,
  calcularAnchoConfeccionGaza,
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

interface CortinaDibujoDidacticoProps {
  ancho: number
  alto: number
  caracteristicas: ICaracteristicasItem | null
  esVistaTaller?: boolean
  modoCompacto?: boolean
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
  Kongo: { bg: "#3e2723", border: "#271613", slatGradient: "from-amber-950 via-stone-900 to-stone-950" },
  Negro: { bg: "#1e293b", border: "#0f172a", slatGradient: "from-slate-800 via-slate-900 to-slate-950" },
}

// Colores de Perfilería
const COLORES_PERFILERIA_HEX: Record<string, { bg: string; border: string }> = {
  Negro: { bg: "#0f172a", border: "#334155" },
  Blanco: { bg: "#ffffff", border: "#cbd5e1" },
  "Bronce Colonial": { bg: "#5c3a21", border: "#784528" },
  "Aluminio Anodizado": { bg: "#94a3b8", border: "#64748b" },
}

export function CortinaDibujoDidactico({
  ancho,
  alto,
  caracteristicas,
  esVistaTaller = false,
  modoCompacto = false,
}: CortinaDibujoDidacticoProps) {
  const [panoHovered, setPanoHovered] = useState<number | null>(null)
  const [panoSeleccionado, setPanoSeleccionado] = useState<number | null>(null)
  const [capaSeleccionada, setCapaSeleccionada] = useState<"Gaza" | "BO">("Gaza")

  const tipo = caracteristicas?.tipo || "Tradicional"

  const tieneGaza = Boolean(caracteristicas?.gaza?.activa)
  const tieneBO = Boolean(caracteristicas?.bo?.activa)
  const anchoGaza = caracteristicas?.gaza?.ancho || ancho
  const altoGaza = caracteristicas?.gaza?.alto || alto
  const panosGaza = caracteristicas?.gaza?.panos || 1
  const anchosPanos = caracteristicas?.gaza?.anchosPanos || []

  const anchoBO = caracteristicas?.bo?.ancho || ancho
  const altoBO = caracteristicas?.bo?.alto || alto
  const tramosBO = caracteristicas?.bo?.tramos || 1
  const anchosTramos = caracteristicas?.bo?.anchosTramos || []

  // Ancho y alto efectivo calculados para el esquema
  const anchoEfectivo =
    tipo === "Aluminio"
      ? ancho
      : tieneGaza
      ? anchoGaza
      : tieneBO
      ? anchoBO
      : ancho
  const altoEfectivo =
    tipo === "Aluminio"
      ? alto
      : tieneGaza
      ? altoGaza
      : tieneBO
      ? altoBO
      : alto

  // Fórmulas de confección y componentes
  const argollas = useMemo(() => {
    if (!tieneGaza) return 0
    return calcularArgollasGaza(anchoGaza)
  }, [tieneGaza, anchoGaza])

  const cantidadSoportes = useMemo(() => {
    return calcularCantidadSoportes(anchoEfectivo)
  }, [anchoEfectivo])

  const varianteSoporte = useMemo(() => {
    return determinarVarianteSoporte(tieneGaza, tieneBO)
  }, [tieneGaza, tieneBO])

  const anchoConfeccionGaza = useMemo(() => {
    return calcularAnchoConfeccionGaza(anchoGaza)
  }, [anchoGaza])

  // Lado de mando:
  // Si es Tradicional: se muestra solo si B.O. está activo y formatoBO === "Roller"
  const esTradicionalConBORoller =
    tipo === "Tradicional" && tieneBO && caracteristicas?.formatoBO === "Roller"

  const mostrarMando = tipo !== "Tradicional" || esTradicionalConBORoller
  const mando =
    tipo === "Aluminio"
      ? caracteristicas?.aluminio?.mando || "Derecho"
      : esTradicionalConBORoller
      ? caracteristicas?.mandoBO || caracteristicas?.mando || "Derecha"
      : caracteristicas?.mando || "Derecha"

  const mandoLadoIzquierdo =
    String(mando) === "Izquierda" || String(mando) === "Izquierdo"

  // Orden de capas según Caída:
  // "Por delante": B.O. adelante de Gaza
  // "Por detrás": Gaza adelante de B.O.
  const caida = caracteristicas?.caida || "Por delante"
  const boAdelante = caida === "Por delante"

  // Proporción geométrica real (aspect ratio): ancho / alto
  const anchoVal = anchoEfectivo > 0 ? anchoEfectivo : 2.0
  const altoVal = altoEfectivo > 0 ? altoEfectivo : 2.0
  const ratio = anchoVal / altoVal
  const clampedRatio = Math.max(0.38, Math.min(2.7, ratio))

  // Dimensiones dinámicas de la cortina para representar si es más larga que ancha o viceversa
  const { boxWidth, boxHeight, formatoTexto } = useMemo(() => {
    if (modoCompacto) {
      if (clampedRatio < 0.92) {
        // Vertical compacto
        const h = 115
        const w = Math.max(48, Math.min(105, Math.round(h * clampedRatio)))
        return {
          boxWidth: w,
          boxHeight: h,
          formatoTexto: "Vertical",
        }
      } else if (clampedRatio > 1.08) {
        // Horizontal compacto
        const w = Math.min(180, Math.max(105, Math.round(80 * clampedRatio)))
        const h = Math.max(50, Math.min(95, Math.round(w / clampedRatio)))
        return {
          boxWidth: w,
          boxHeight: h,
          formatoTexto: "Horizontal",
        }
      } else {
        // Cuadrado compacto
        return {
          boxWidth: 80,
          boxHeight: 80,
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

  // Lista de paños o tramos con sus anchos proporcionales
  const divisiones = useMemo(() => {
    if (tipo === "Aluminio") return []
    if (capaActiva === "Gaza" && tieneGaza) {
      return Array.from({ length: panosGaza }).map((_, idx) => ({
        numero: idx + 1,
        etiqueta: `Paño ${idx + 1}`,
        tipoTela: "Gaza",
        ancho: anchosPanos[idx] || Number((anchoGaza / panosGaza).toFixed(2)),
        mando: null as string | null,
      }))
    }
    if (capaActiva === "BO" && tieneBO) {
      return Array.from({ length: tramosBO }).map((_, idx) => ({
        numero: idx + 1,
        etiqueta: esTradicionalConBORoller ? `Cortina ${idx + 1}` : `Tramo ${idx + 1}`,
        tipoTela: esTradicionalConBORoller ? "B.O. Roller" : "B.O.",
        ancho: anchosTramos[idx] || Number((anchoBO / tramosBO).toFixed(2)),
        mando: esTradicionalConBORoller
          ? caracteristicas?.mandosRollerBO?.[idx] ||
            caracteristicas?.bo?.mandosRoller?.[idx] ||
            null
          : null,
      }))
    }
    return []
  }, [
    tipo,
    capaActiva,
    tieneGaza,
    tieneBO,
    panosGaza,
    anchosPanos,
    anchoGaza,
    tramosBO,
    anchosTramos,
    anchoBO,
    esTradicionalConBORoller,
    caracteristicas,
  ])

  // Suma de los anchos de los paños para calcular el porcentaje exacto de cada uno
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
                  {anchoEfectivo > 0 ? anchoEfectivo.toFixed(2) : "0.00"}m
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
              {altoEfectivo > 0 ? altoEfectivo.toFixed(2) : "0.00"}m
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
          {/* Cota Superior Ancho */}
          <div className="flex w-full items-center justify-between text-[8px] font-bold text-slate-700 mb-0.5">
            <span>|</span>
            <div className="flex flex-1 items-center px-0.5">
              <div className="h-[1px] flex-1 bg-slate-400" />
              <span className="px-0.5 text-[8px] font-extrabold text-slate-900 bg-white">
                {anchoEfectivo > 0 ? anchoEfectivo.toFixed(2) : "0.00"}m
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
            <div className="flex flex-1 w-full h-full overflow-hidden divide-x divide-slate-700">
              {divisiones.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[8px] text-slate-400">
                  {anchoEfectivo > 0 ? anchoEfectivo.toFixed(2) : "0.00"}m
                </div>
              ) : (
                divisiones.map((p, idx) => {
                  const peso = p.ancho > 0 ? p.ancho : 1
                  return (
                    <div
                      key={idx}
                      style={{ flex: `${peso} 1 0%` }}
                      className="flex flex-col justify-between p-0.5 bg-slate-50 text-center"
                    >
                      <span className="text-[7px] font-bold text-slate-600">
                        {p.etiqueta
                          .replace("Cortina", "C")
                          .replace("Paño", "P")
                          .replace("Tramo", "T")}
                      </span>
                      <span className="text-[9px] font-extrabold text-slate-950">
                        {p.ancho.toFixed(2)}m
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Cota Lateral Alto */}
        <div
          className="flex flex-col items-center justify-between text-[8px] font-bold text-slate-700 pt-[14px]"
          style={{ height: `${boxHeight + 14}px` }}
        >
          <span>─</span>
          <span className="text-[8px] font-extrabold text-slate-900 -rotate-90 whitespace-nowrap">
            {altoEfectivo > 0 ? altoEfectivo.toFixed(2) : "0.00"}m
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
                caracteristicas?.marca && (
                  <span>
                    {" "}
                    • Marca: <strong>{caracteristicas.marca}</strong>
                  </span>
                )
              )}
              <span className="ml-1 text-indigo-600 font-semibold">• {formatoTexto}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Selector de capa cuando conviven Gaza y B.O. */}
          {tieneGaza && tieneBO && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCapaSeleccionada("Gaza")}
                className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${
                  capaActiva === "Gaza"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Gaza ({panosGaza} {panosGaza > 1 ? "paños" : "paño"})
              </button>
              <button
                type="button"
                onClick={() => setCapaSeleccionada("BO")}
                className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${
                  capaActiva === "BO"
                    ? "bg-white text-slate-950 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {esTradicionalConBORoller
                  ? `B.O. Roller (${tramosBO} ${tramosBO > 1 ? "cortinas" : "cortina"})`
                  : `B.O. (${tramosBO} ${tramosBO > 1 ? "tramos" : "tramo"})`}
              </button>
            </div>
          )}

          {/* Medidas totales del vano */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200">
            <Ruler className="h-3.5 w-3.5 text-indigo-600" />
            <span>
              {anchoEfectivo > 0 ? anchoEfectivo.toFixed(2) : "0.00"} m (Ancho) ×{" "}
              {altoEfectivo > 0 ? altoEfectivo.toFixed(2) : "0.00"} m (Alto)
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
                    <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-extrabold text-slate-900 shadow-2xs whitespace-nowrap">
                      Ancho Total: {anchoEfectivo > 0 ? anchoEfectivo.toFixed(2) : "0.00"} m
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
                      mandoLadoIzquierdo ? "left-2" : "right-2"
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
                    Alto Total: {altoEfectivo > 0 ? altoEfectivo.toFixed(2) : "0.00"} m
                  </span>
                  <div className="w-[1.5px] flex-1 bg-slate-400" />
                </div>
                <span className="text-slate-400">─</span>
              </div>
            </div>

            {/* Especificación de aluminio */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-700">
              <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 shadow-2xs">
                Mando: <strong>{mando}</strong>
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
          /* Caso 2: TRADICIONAL / ROLLER / BANDAS / NOCHE TOTAL */
          <div className="flex flex-col items-center">
            {divisiones.length === 0 ? (
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
                {/* Contenedor alineado: Cota Superior + Marco de la Cortina + Cota Lateral */}
                <div className="flex items-start justify-center gap-2.5">
                  {/* Columna de la Cortina (con cota superior exactamente encima del marco) */}
                  <div className="flex flex-col items-center" style={{ width: `${boxWidth}px` }}>
                    {/* Cota Superior Ancho Total */}
                    <div className="mb-2 flex w-full items-center justify-between text-xs font-bold text-slate-600">
                      <span className="text-slate-400">|</span>
                      <div className="flex flex-1 items-center gap-1 px-1">
                        <div className="h-[1.5px] flex-1 bg-slate-400" />
                        <span className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-slate-900 shadow-2xs whitespace-nowrap">
                          Ancho Total: {anchoEfectivo > 0 ? anchoEfectivo.toFixed(2) : "0.00"} m
                        </span>
                        <div className="h-[1.5px] flex-1 bg-slate-400" />
                      </div>
                      <span className="text-slate-400">|</span>
                    </div>

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
                          // Perfilería para Roller / Bandas / Noche total
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

                      {/* 2. Cuerpo de la Cortina: Paños Proporcionales */}
                      <div className="flex flex-1 w-full h-full overflow-hidden divide-x-2 divide-slate-800">
                        {divisiones.map((p, idx) => {
                          const peso = p.ancho > 0 ? p.ancho : 1
                          const porcentaje =
                            sumaAnchos > 0
                              ? Math.round((p.ancho / sumaAnchos) * 100)
                              : Math.round(100 / divisiones.length)
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
                              {/* Textura de Tejido y Pliegues de la Tela */}
                              <div className="absolute inset-0 pointer-events-none opacity-40">
                                {/* Caída y superposición de telas */}
                                {tieneGaza && tieneBO ? (
                                  boAdelante ? (
                                    <div className="h-full w-full bg-linear-to-b from-slate-300 via-slate-200 to-slate-400 border-r border-slate-400/40" />
                                  ) : (
                                    <div className="h-full w-full bg-linear-to-b from-indigo-100 via-white to-indigo-200 border-r border-indigo-300/40" />
                                  )
                                ) : tieneGaza ? (
                                  <div className="h-full w-full bg-linear-to-b from-indigo-50/70 via-white to-indigo-100/60" />
                                ) : (
                                  <div className="h-full w-full bg-linear-to-b from-slate-200 via-slate-300 to-slate-400" />
                                )}

                                {/* Pliegues verticales sutiles */}
                                <div className="absolute inset-0 flex justify-around opacity-25">
                                  <div className="w-[1px] h-full bg-slate-900/30" />
                                  <div className="w-[1px] h-full bg-slate-900/30" />
                                </div>
                              </div>

                              {/* Mando de cada cortina B.O. Roller individual */}
                              {esTradicionalConBORoller && capaActiva === "BO" && p.mando && (
                                <div
                                  className={`absolute top-1.5 z-20 flex flex-col items-center pointer-events-none ${
                                    String(p.mando) === "Izquierda" ? "left-1.5" : "right-1.5"
                                  }`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 shadow-xs" />
                                  <div
                                    className="w-[1.5px] bg-slate-600 shadow-xs"
                                    style={{ height: `${Math.round(boxHeight * 0.55)}px` }}
                                  />
                                  <div className="w-auto px-1 h-3 rounded-full border border-slate-700 bg-white text-[7px] flex items-center justify-center font-black text-slate-900 shadow-xs">
                                    {String(p.mando) === "Izquierda" ? "Izq" : "Der"}
                                  </div>
                                </div>
                              )}

                              {/* Encabezado del Paño */}
                              <div className="relative z-10">
                                <span
                                  className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold transition ${
                                    isSeleccionado
                                      ? "bg-indigo-600 text-white"
                                      : "bg-white/90 text-slate-800 shadow-2xs border border-slate-200"
                                  }`}
                                >
                                  {p.etiqueta}
                                </span>
                              </div>

                              {/* Medida Central Proporcional del Paño */}
                              <div className="relative z-10 my-auto text-center">
                                <span className="block text-sm font-extrabold tracking-tight text-slate-950 drop-shadow-xs">
                                  {p.ancho.toFixed(2)} m
                                </span>
                                <span className="block text-[10px] font-bold text-indigo-700">
                                  ({porcentaje}%)
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Mando Colgante (Roller, Bandas, Noche total) cuando no es B.O. Roller individual */}
                      {mostrarMando && (!esTradicionalConBORoller || capaActiva !== "BO") && (
                        <div
                          className={`absolute top-2 z-20 flex flex-col items-center pointer-events-none ${
                            mandoLadoIzquierdo ? "left-2" : "right-2"
                          }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-800 shadow-xs" />
                          <div
                            className="w-[1.5px] bg-slate-500 shadow-xs"
                            style={{ height: `${Math.round(boxHeight * 0.65)}px` }}
                          />
                          <div className="w-2.5 h-4 rounded-full border border-slate-600 bg-white text-[8px] flex items-center justify-center font-bold text-slate-800 shadow-xs">
                            ●
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cota Lateral Alto Total */}
                  <div
                    className="flex flex-col items-center justify-between text-xs font-bold text-slate-600 pt-7"
                    style={{ height: `${boxHeight + 28}px` }}
                  >
                    <span className="text-slate-400">─</span>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 my-1">
                      <div className="w-[1.5px] flex-1 bg-slate-400" />
                      <span className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-extrabold text-slate-900 shadow-2xs -rotate-90 whitespace-nowrap">
                        Alto Total: {altoEfectivo > 0 ? altoEfectivo.toFixed(2) : "0.00"} m
                      </span>
                      <div className="w-[1.5px] flex-1 bg-slate-400" />
                    </div>
                    <span className="text-slate-400">─</span>
                  </div>
                </div>
              </>
            )}

            {/* Fila Informativa de la selección actual */}
            {panoActivo && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-indigo-950 border border-indigo-200 shadow-2xs animate-in fade-in duration-150">
                <Info className="h-3.5 w-3.5 text-indigo-600" />
                <span>
                  {panoActivo.etiqueta}: <strong>{panoActivo.ancho.toFixed(2)} m</strong> (
                  {sumaAnchos > 0
                    ? Math.round((panoActivo.ancho / sumaAnchos) * 100)
                    : 100}
                  % del vano) • Alto: <strong>{altoEfectivo.toFixed(2)} m</strong>
                  {tieneGaza && tipo === "Tradicional" && (
                    <span className="text-amber-800 ml-1">
                      • Confección: {(panoActivo.ancho + 0.1).toFixed(2)} m
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Especificación de Sistema, Mando y Caída ── */}
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

            {mostrarMando && (
              <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                {esTradicionalConBORoller &&
                caracteristicas?.mandosRollerBO &&
                caracteristicas.mandosRollerBO.length > 1 ? (
                  <>
                    Mandos B.O. Roller:{" "}
                    {caracteristicas.mandosRollerBO
                      .map(
                        (m, idx) =>
                          `C${idx + 1} (${m === "Izquierda" ? "Izq" : "Der"})`
                      )
                      .join(" • ")}
                  </>
                ) : (
                  <>Mando{esTradicionalConBORoller ? " (B.O. Roller)" : ""}: {mando}</>
                )}
              </span>
            )}
          </div>

          {/* Caída B.O. y Superposición de Telas */}
          {(tieneGaza || tieneBO) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
              {tieneGaza && tieneBO ? (
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-semibold">Caída B.O. ({caida}):</span>
                  <span className="rounded bg-slate-900 text-white px-2 py-0.5 font-bold">
                    {boAdelante ? "B.O. (Adelante)" : "Gaza (Adelante)"}
                  </span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="rounded bg-indigo-100 text-indigo-900 px-2 py-0.5 font-bold">
                    {boAdelante ? "Gaza (Detrás)" : "B.O. (Detrás)"}
                  </span>
                </div>
              ) : tieneBO ? (
                <span className="text-slate-600">
                  Tela: <strong>Solo B.O.</strong> (Caída B.O.:{" "}
                  <strong>{caida}</strong>)
                </span>
              ) : (
                <span className="text-slate-600">
                  Tela: <strong>Solo GAZA</strong>
                </span>
              )}

              {/* Nombres de Telas */}
              <div className="flex flex-wrap gap-1.5">
                {tieneGaza && caracteristicas?.gaza?.nombreTela && (
                  <span className="rounded-md bg-white border border-indigo-200 px-2 py-0.5 text-indigo-900">
                    <strong>Gaza:</strong> {caracteristicas.gaza.nombreTela}
                  </span>
                )}
                {tieneBO && caracteristicas?.bo?.nombreTela && (
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-white">
                    <strong>B.O.:</strong> {caracteristicas.bo.nombreTela}
                  </span>
                )}
              </div>
            </div>
          )}
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
                  {anchoConfeccionGaza.toFixed(2)} m
                </span>
                <span className="block text-[10px] text-amber-600">
                  ({anchoGaza.toFixed(2)}m + 0.10m de margen)
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
