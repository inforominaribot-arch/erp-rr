"use client"

import { useState, useEffect } from "react"
import {
  Calculator,
  X,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  Check,
} from "lucide-react"
import {
  calcularTradicionalEstandar,
  calcularTradicionalInvertido,
  calcularRollerRS,
  calcularHunterDouglas,
  VALORES_DEFECTO_PRECIOS,
} from "../lib/calculadora-precios"
import { formatearPrecio } from "@/lib/utils"

export type TipoCalculo =
  | "TRADICIONAL_ESTANDAR"
  | "TRADICIONAL_INVERTIDO"
  | "ROLLER_RS"
  | "HUNTER_DOUGLAS"
  | "DIRECTO_MG"

interface PresupuestoCalculadoraModalProps {
  abierto: boolean
  onCerrar: () => void
  onAplicarPrecio: (precioUnitario: number) => void
  anchoInicial?: number
  altoInicial?: number
  cantidadInicial?: number
  descripcionInicial?: string
}

export function PresupuestoCalculadoraModal({
  abierto,
  onCerrar,
  onAplicarPrecio,
  anchoInicial = 2.0,
  altoInicial = 2.2,
  cantidadInicial = 1,
  descripcionInicial = "",
}: PresupuestoCalculadoraModalProps) {
  // Dimensiones base
  const [ancho, setAncho] = useState<number>(anchoInicial)
  const [alto, setAlto] = useState<number>(altoInicial)
  const [cantidad, setCantidad] = useState<number>(cantidadInicial)

  // Determinar pestaña sugerida según descripción y medidas
  const sugerirTipo = (): TipoCalculo => {
    const desc = descripcionInicial.toLowerCase()
    if (desc.includes("hd") || desc.includes("hunter")) return "HUNTER_DOUGLAS"
    if (desc.includes("mg")) return "DIRECTO_MG"
    if (desc.includes("roller") || desc.includes("rs")) return "ROLLER_RS"
    if (desc.includes("tradicional") || desc.includes("gaza") || desc.includes("riel") || desc.includes("barral")) {
      return altoInicial > 2.85 ? "TRADICIONAL_INVERTIDO" : "TRADICIONAL_ESTANDAR"
    }
    return altoInicial > 2.85 ? "TRADICIONAL_INVERTIDO" : "TRADICIONAL_ESTANDAR"
  }

  const [tipo, setTipo] = useState<TipoCalculo>(sugerirTipo())

  // Sincronizar cuando abre con nuevos valores
  useEffect(() => {
    if (abierto) {
      setAncho(anchoInicial || 2.0)
      setAlto(altoInicial || 2.2)
      setCantidad(cantidadInicial || 1)
      setTipo(sugerirTipo())
    }
  }, [abierto, anchoInicial, altoInicial, cantidadInicial, descripcionInicial])

  // 1. Estado Tradicional Estándar (<= 2.85 m)
  const [tradLlevaGaza, setTradLlevaGaza] = useState(true)
  const [tradPrecioGaza, setTradPrecioGaza] = useState(25000)
  const [tradLlevaBO1_5, setTradLlevaBO1_5] = useState(false)
  const [tradPrecioBO1_5, setTradPrecioBO1_5] = useState(28000)
  const [tradLlevaBO2, setTradLlevaBO2] = useState(false)
  const [tradPrecioBO2, setTradPrecioBO2] = useState(30000)
  const [tradPrecioRiel, setTradPrecioRiel] = useState(
    VALORES_DEFECTO_PRECIOS.precioRielMetroTradicional
  )
  const [tradPrecioConfeccion, setTradPrecioConfeccion] = useState(
    VALORES_DEFECTO_PRECIOS.precioConfeccionMetroTradicional
  )
  const [tradPrecioInstalacion, setTradPrecioInstalacion] = useState(
    VALORES_DEFECTO_PRECIOS.precioInstalacionTradicional
  )

  // 2. Estado Tradicional Invertido (> 2.85 m)
  const [invPrecioTelaMetro, setInvPrecioTelaMetro] = useState(35000)
  const [invAnchoRollo, setInvAnchoRollo] = useState(2.8)
  const [invPrecioRiel, setInvPrecioRiel] = useState(
    VALORES_DEFECTO_PRECIOS.precioRielMetroInvertido
  )
  const [invPrecioConfeccion, setInvPrecioConfeccion] = useState(
    VALORES_DEFECTO_PRECIOS.precioConfeccionMetroInvertido
  )
  const [invPrecioInstalacion, setInvPrecioInstalacion] = useState(
    VALORES_DEFECTO_PRECIOS.precioInstalacionInvertido
  )

  // 3. Estado Roller RS
  const [rsPrecioTelaM2, setRsPrecioTelaM2] = useState(35000)
  const [rsPrecioSistema, setRsPrecioSistema] = useState(
    VALORES_DEFECTO_PRECIOS.precioSistemaMetroRS
  )
  const [rsPrecioZocalo, setRsPrecioZocalo] = useState(0)
  const [rsPrecioInstalacion, setRsPrecioInstalacion] = useState(
    VALORES_DEFECTO_PRECIOS.precioInstalacionRS
  )

  // 4. Estado Hunter Douglas
  const [hdPrecioUSD, setHdPrecioUSD] = useState(300)
  const [hdCotizacionUSD, setHdCotizacionUSD] = useState(
    VALORES_DEFECTO_PRECIOS.cotizacionUsdHD
  )
  const [hdPrecioInstalacion, setHdPrecioInstalacion] = useState(
    VALORES_DEFECTO_PRECIOS.precioInstalacionHD
  )

  // 5. Estado Directo MG / Manual
  const [precioDirecto, setPrecioDirecto] = useState(150000)

  // Cálculos reactivos
  let precioCalculadoUnitario = 0
  let desgloseTexto = ""

  if (tipo === "TRADICIONAL_ESTANDAR") {
    const res = calcularTradicionalEstandar({
      ancho,
      llevaGaza: tradLlevaGaza,
      precioTelaGaza: tradPrecioGaza,
      llevaBO1_5: tradLlevaBO1_5,
      precioTelaBO1_5: tradPrecioBO1_5,
      llevaBO2: tradLlevaBO2,
      precioTelaBO2: tradPrecioBO2,
      precioRielMetro: tradPrecioRiel,
      precioConfeccionMetro: tradPrecioConfeccion,
      precioInstalacion: tradPrecioInstalacion,
    })
    precioCalculadoUnitario = res.total
    desgloseTexto = res.formulaTexto
  } else if (tipo === "TRADICIONAL_INVERTIDO") {
    const res = calcularTradicionalInvertido({
      ancho,
      alto,
      precioTelaMetro: invPrecioTelaMetro,
      anchoRolloTela: invAnchoRollo,
      precioRielMetro: invPrecioRiel,
      precioConfeccionMetro: invPrecioConfeccion,
      precioInstalacion: invPrecioInstalacion,
    })
    precioCalculadoUnitario = res.total
    desgloseTexto = res.formulaTexto
  } else if (tipo === "ROLLER_RS") {
    const res = calcularRollerRS({
      ancho,
      alto,
      precioTelaM2: rsPrecioTelaM2,
      precioSistemaMetro: rsPrecioSistema,
      precioZocaloMetro: rsPrecioZocalo,
      precioInstalacion: rsPrecioInstalacion,
      unidades: 1,
    })
    precioCalculadoUnitario = res.precioUnitario
    desgloseTexto = res.formulaTexto
  } else if (tipo === "HUNTER_DOUGLAS") {
    const res = calcularHunterDouglas({
      precioHD_USD: hdPrecioUSD,
      cotizacionUSD: hdCotizacionUSD,
      precioInstalacion: hdPrecioInstalacion,
      unidades: 1,
    })
    precioCalculadoUnitario = res.precioUnitario
    desgloseTexto = res.formulaTexto
  } else {
    precioCalculadoUnitario = precioDirecto
    desgloseTexto = "Precio cargado directamente sin fórmula de cálculo."
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Calculadora de Cotización (Fórmulas Excel)
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                Calculá el precio unitario con la fórmula exacta de tu fábrica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pestañas de Fórmulas */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 overflow-x-auto touch-scroll text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setTipo("TRADICIONAL_ESTANDAR")}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center transition ${
              tipo === "TRADICIONAL_ESTANDAR"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tradicional (≤ 2.85m)
          </button>
          <button
            type="button"
            onClick={() => setTipo("TRADICIONAL_INVERTIDO")}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center transition ${
              tipo === "TRADICIONAL_INVERTIDO"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Paño Invertido (&gt; 2.85m)
          </button>
          <button
            type="button"
            onClick={() => setTipo("ROLLER_RS")}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center transition ${
              tipo === "ROLLER_RS"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Roller RS (×1.16)
          </button>
          <button
            type="button"
            onClick={() => setTipo("HUNTER_DOUGLAS")}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center transition ${
              tipo === "HUNTER_DOUGLAS"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hunter Douglas
          </button>
          <button
            type="button"
            onClick={() => setTipo("DIRECTO_MG")}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center transition ${
              tipo === "DIRECTO_MG"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            MG / Manual
          </button>
        </div>

        {/* Cuerpo del formulario según pestaña */}
        <div className="overflow-y-auto touch-scroll p-4 sm:p-6 space-y-5 flex-1 min-h-0">
          {/* Medidas de la abertura */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700">
                Ancho (metros)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={ancho}
                onChange={(e) => setAncho(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">
                Alto (metros)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={alto}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  setAlto(val)
                  // Sugerir cambio de pestaña si supera 2.85m en tradicionales
                  if (val > 2.85 && tipo === "TRADICIONAL_ESTANDAR") {
                    setTipo("TRADICIONAL_INVERTIDO")
                  } else if (val <= 2.85 && tipo === "TRADICIONAL_INVERTIDO") {
                    setTipo("TRADICIONAL_ESTANDAR")
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 1. TRADICIONAL ESTÁNDAR */}
          {tipo === "TRADICIONAL_ESTANDAR" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50/60 p-3 border border-blue-100 text-xs text-blue-900">
                Fórmula de taller: Riel ($50k/m) + Confección ($50k/m) + Telas (Gaza x2 o BO) + Instalación ($40k por capa).
              </div>

              {/* Capas de Tela */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Capas y Telas Seleccionadas
                </label>

                {/* Gaza */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-white">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={tradLlevaGaza}
                      onChange={(e) => setTradLlevaGaza(e.target.checked)}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Gaza (Frunce x2)
                  </label>
                  {tradLlevaGaza && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Precio/m: $</span>
                      <input
                        type="number"
                        step="500"
                        value={tradPrecioGaza}
                        onChange={(e) =>
                          setTradPrecioGaza(parseFloat(e.target.value) || 0)
                        }
                        className="w-28 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-right font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* BO 1.5 */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-white">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={tradLlevaBO1_5}
                      onChange={(e) => {
                        setTradLlevaBO1_5(e.target.checked)
                        if (e.target.checked) setTradLlevaBO2(false)
                      }}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Blackout (Frunce x1.5)
                  </label>
                  {tradLlevaBO1_5 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Precio/m: $</span>
                      <input
                        type="number"
                        step="500"
                        value={tradPrecioBO1_5}
                        onChange={(e) =>
                          setTradPrecioBO1_5(parseFloat(e.target.value) || 0)
                        }
                        className="w-28 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-right font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* BO 2 */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-white">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={tradLlevaBO2}
                      onChange={(e) => {
                        setTradLlevaBO2(e.target.checked)
                        if (e.target.checked) setTradLlevaBO1_5(false)
                      }}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Blackout (Frunce x2)
                  </label>
                  {tradLlevaBO2 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Precio/m: $</span>
                      <input
                        type="number"
                        step="500"
                        value={tradPrecioBO2}
                        onChange={(e) =>
                          setTradPrecioBO2(parseFloat(e.target.value) || 0)
                        }
                        className="w-28 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-right font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Ajustes de Costos Fijos */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Riel ($/m)
                  </span>
                  <input
                    type="number"
                    value={tradPrecioRiel}
                    onChange={(e) =>
                      setTradPrecioRiel(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Confección ($/m)
                  </span>
                  <input
                    type="number"
                    value={tradPrecioConfeccion}
                    onChange={(e) =>
                      setTradPrecioConfeccion(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Instalación ($/capa)
                  </span>
                  <input
                    type="number"
                    value={tradPrecioInstalacion}
                    onChange={(e) =>
                      setTradPrecioInstalacion(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. TRADICIONAL PAÑO INVERTIDO */}
          {tipo === "TRADICIONAL_INVERTIDO" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900">
                Alto mayor a 2.85m: calcula unión de paños verticales. Metros de tela = Paños × (Alto + 0.20m). Ganancia 1.5 e IVA 1.21 sobre tela.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Precio tela por metro lineal ($)
                  </label>
                  <input
                    type="number"
                    value={invPrecioTelaMetro}
                    onChange={(e) =>
                      setInvPrecioTelaMetro(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Ancho rollo de tela (metros)
                  </label>
                  <select
                    value={invAnchoRollo}
                    onChange={(e) =>
                      setInvAnchoRollo(parseFloat(e.target.value) || 2.8)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold bg-white"
                  >
                    <option value="2.8">2.80 m (Estándar)</option>
                    <option value="3.0">3.00 m (Extra ancho)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Riel ($/m)
                  </span>
                  <input
                    type="number"
                    value={invPrecioRiel}
                    onChange={(e) =>
                      setInvPrecioRiel(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Confección Invertida ($/m)
                  </span>
                  <input
                    type="number"
                    value={invPrecioConfeccion}
                    onChange={(e) =>
                      setInvPrecioConfeccion(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Instalación ($)
                  </span>
                  <input
                    type="number"
                    value={invPrecioInstalacion}
                    onChange={(e) =>
                      setInvPrecioInstalacion(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. ROLLER RS */}
          {tipo === "ROLLER_RS" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-purple-50 p-3 border border-purple-200 text-xs text-purple-900">
                Fórmula Rollershade: Tela m² + Sistema ($36k/m) + Zócalo, multiplicado por coeficiente comercial <strong>1.16025</strong> (+16%) + Instalación ($40k).
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Precio Tela por m² ($)
                  </label>
                  <input
                    type="number"
                    value={rsPrecioTelaM2}
                    onChange={(e) =>
                      setRsPrecioTelaM2(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Precio Sistema por metro ($)
                  </label>
                  <input
                    type="number"
                    value={rsPrecioSistema}
                    onChange={(e) =>
                      setRsPrecioSistema(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Precio Zócalo por metro ($)
                  </label>
                  <input
                    type="number"
                    value={rsPrecioZocalo}
                    onChange={(e) =>
                      setRsPrecioZocalo(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Instalación por cortina ($)
                  </label>
                  <input
                    type="number"
                    value={rsPrecioInstalacion}
                    onChange={(e) =>
                      setRsPrecioInstalacion(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. HUNTER DOUGLAS */}
          {tipo === "HUNTER_DOUGLAS" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-xs text-emerald-900">
                Fórmula oficial HD: Precio USD × 1.21 (IVA) × 1.5 (Ganancia 50%) × Cotización ($) + Instalación ($40k).
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Precio de lista Hunter Douglas (U$S)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                      U$S
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={hdPrecioUSD}
                      onChange={(e) =>
                        setHdPrecioUSD(parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-1.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Cotización Hunter Douglas ($ ARS)
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="10"
                      value={hdCotizacionUSD}
                      onChange={(e) =>
                        setHdCotizacionUSD(parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Instalación ($)
                </label>
                <input
                  type="number"
                  value={hdPrecioInstalacion}
                  onChange={(e) =>
                    setHdPrecioInstalacion(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                />
              </div>
            </div>
          )}

          {/* 5. DIRECTO / MG */}
          {tipo === "DIRECTO_MG" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
                Para marca MG o productos con cotización cerrada, ingresá el precio unitario final directamente.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Precio Unitario Final ($ ARS)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={precioDirecto}
                  onChange={(e) =>
                    setPrecioDirecto(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base font-bold text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Desglose visual */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Desglose de cálculo
            </span>
            <p className="mt-1 text-xs text-indigo-950 font-medium font-mono leading-relaxed">
              {desgloseTexto}
            </p>
          </div>
        </div>

        {/* Pie con resultado y botón aplicar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3.5 shrink-0">
          <div className="flex items-center justify-between sm:block">
            <span className="text-xs text-slate-500 font-semibold block">
              Precio Sugerido
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-700">
              {formatearPrecio(precioCalculadoUnitario)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-700 hover:bg-slate-100 transition text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onAplicarPrecio(precioCalculadoUnitario)
                onCerrar()
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Check className="h-4 w-4 shrink-0" />
              <span>Aplicar al Ítem</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
