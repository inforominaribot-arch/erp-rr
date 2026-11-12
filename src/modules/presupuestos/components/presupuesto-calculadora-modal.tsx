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
  calcularRollerRS,
  calcularHunterDouglas,
  VALORES_DEFECTO_PRECIOS,
} from "../lib/calculadora-precios"
import { formatearPrecio } from "@/lib/utils"
import { CalculoListaRS } from "./calculo-lista-rs"
import { CalculoToldoPT } from "./calculo-toldo-pt"
import { CalculoTradicional } from "./calculo-tradicional"
import type { ICaracteristicasItem } from "@/modules/mediciones/types"
import { tipoDeCapa } from "@/modules/mediciones/lib/cortinas-fisicas"
import {
  ALTO_MAX_ESTANDAR,
  accesoriosBarral,
  calcularTradicional,
  configDesdeMedicion,
  refrescarCapa,
  type ConfigTradicional,
  type ITelaTradicional,
} from "../lib/tradicional"
import type { IPrecioInsumoPT } from "../lib/toldo-pergola"
import {
  recalcularFila,
  type CalculoPrecio,
  type ICeldaPrecioMedida,
  type IItemListaCalculo,
  type OpcionesCalculo,
} from "../lib/lista-precios-rs"

export type TipoCalculo =
  | "TRADICIONAL_ESTANDAR"
  | "TRADICIONAL_INVERTIDO"
  | "ROLLER_RS"
  | "HUNTER_DOUGLAS"
  | "DIRECTO_MG"
  | "LISTA_RS"

interface PresupuestoCalculadoraModalProps {
  abierto: boolean
  onCerrar: () => void
  /** calculo: el cálculo con la lista (pestaña Lista RS) o null si se usó otra fórmula */
  onAplicarPrecio: (precioUnitario: number, calculo?: CalculoPrecio | null) => void
  anchoInicial?: number
  altoInicial?: number
  cantidadInicial?: number
  descripcionInicial?: string
  /** Cálculo guardado de la fila (si la fila se calcula con la lista RS) */
  calculoInicial?: CalculoPrecio | null
  listaRS?: IItemListaCalculo[]
  tablaMG?: ICeldaPrecioMedida[]
  /** Insumos de la planilla de PRINTEMPS (toldos) */
  preciosPT?: IPrecioInsumoPT[]
  /** La cortina se pide solo tela / solo riel (se avisa al cotizar, ej: en la página de HD) */
  modoCortina?: "Solo tela" | "Solo riel" | null
  /** Telas de las listas de las tiendas (cortinas tradicionales) */
  telasTradicional?: ITelaTradicional[]
  /** Capa de la fila (Gasa / B.O.) y especificación de la medición, para armar la tradicional por defecto */
  capaFila?: "GAZA" | "BO" | null
  caracteristicasFila?: ICaracteristicasItem | null
}

export function PresupuestoCalculadoraModal({
  abierto,
  onCerrar,
  onAplicarPrecio,
  anchoInicial = 2.0,
  altoInicial = 2.2,
  cantidadInicial = 1,
  descripcionInicial = "",
  calculoInicial = null,
  listaRS = [],
  tablaMG = [],
  preciosPT = [],
  modoCortina = null,
  telasTradicional = [],
  capaFila = null,
  caracteristicasFila = null,
}: PresupuestoCalculadoraModalProps) {
  const esTrad = calculoInicial?.metodo === "TRADICIONAL"
  const esMG = calculoInicial?.metodo === "MG_MOSQUITERO" || calculoInicial?.metodo === "MG_NOCHE_TOTAL"
  const esPT =
    calculoInicial?.metodo === "PT_PERGOLA" ||
    calculoInicial?.metodo === "PT_VERTICAL_TP1" ||
    calculoInicial?.metodo === "PT_VERTICAL_TP2" ||
    calculoInicial?.metodo === "PT_SOLO_TELA"
  const conListaRS =
    Boolean(calculoInicial) && !esTrad && (esPT ? preciosPT.length > 0 : esMG ? tablaMG.length > 0 : listaRS.length > 0)
  // Dimensiones base
  const [ancho, setAncho] = useState<number>(anchoInicial)
  const [alto, setAlto] = useState<number>(altoInicial)
  const [cantidad, setCantidad] = useState<number>(cantidadInicial)

  // Determinar pestaña sugerida según descripción y medidas
  const sugerirTipo = (): TipoCalculo => {
    if (conListaRS) return "LISTA_RS"
    if (esTrad && calculoInicial?.tradicional) {
      return calculoInicial.tradicional.modo === "INVERTIDO" ? "TRADICIONAL_INVERTIDO" : "TRADICIONAL_ESTANDAR"
    }
    const desc = descripcionInicial.toLowerCase()
    if (desc.includes("hd") || desc.includes("hunter")) return "HUNTER_DOUGLAS"
    if (desc.includes("mg")) return "DIRECTO_MG"
    if (desc.includes("roller") || desc.includes("rs")) return "ROLLER_RS"
    if (desc.includes("tradicional") || desc.includes("gaza") || desc.includes("riel") || desc.includes("barral")) {
      return altoInicial > ALTO_MAX_ESTANDAR ? "TRADICIONAL_INVERTIDO" : "TRADICIONAL_ESTANDAR"
    }
    return altoInicial > ALTO_MAX_ESTANDAR ? "TRADICIONAL_INVERTIDO" : "TRADICIONAL_ESTANDAR"
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

  // 1 y 2. Tradicional (estándar / paño invertido): lo guardado en la fila, o armado desde la medición
  const accesoriosTrad = accesoriosBarral(listaRS)
  const [cfgTrad, setCfgTrad] = useState<ConfigTradicional>(() => {
    const guardada = calculoInicial?.tradicional
    if (guardada) {
      return {
        ...guardada,
        gasa: refrescarCapa(guardada.gasa, telasTradicional),
        bo: refrescarCapa(guardada.bo, telasTradicional),
        tela: refrescarCapa(guardada.tela, telasTradicional),
      }
    }
    const c = caracteristicasFila
    const dosCapas =
      Boolean(c?.gaza?.activa && c?.bo?.activa) &&
      tipoDeCapa(c as ICaracteristicasItem, "GAZA") === "Tradicional" &&
      tipoDeCapa(c as ICaracteristicasItem, "BO") === "Tradicional"
    return configDesdeMedicion(
      anchoInicial,
      altoInicial,
      {
        capa: capaFila,
        nombreTela: capaFila === "BO" ? c?.bo?.nombreTela : c?.gaza?.nombreTela,
        sistema: c?.sistema ?? null,
        tipoSoporte: c?.tipoSoporte ?? null,
        varianteSoporte: c?.varianteSoporte ?? null,
        cantidadSoportes: c?.cantidadSoportes ?? null,
        dosCapasTradicionales: dosCapas,
      },
      telasTradicional,
      accesoriosTrad
    )
  })
  // La pestaña elegida define el modo; la confección por defecto cambia con el modo
  const modoTrad = tipo === "TRADICIONAL_INVERTIDO" ? "INVERTIDO" : "ESTANDAR"
  const cfgTradActual: ConfigTradicional =
    cfgTrad.modo === modoTrad
      ? cfgTrad
      : {
          ...cfgTrad,
          modo: modoTrad,
          precioConfeccionMetro:
            modoTrad === "INVERTIDO" && cfgTrad.precioConfeccionMetro === VALORES_DEFECTO_PRECIOS.precioConfeccionMetroTradicional
              ? VALORES_DEFECTO_PRECIOS.precioConfeccionMetroInvertido
              : modoTrad === "ESTANDAR" && cfgTrad.precioConfeccionMetro === VALORES_DEFECTO_PRECIOS.precioConfeccionMetroInvertido
              ? VALORES_DEFECTO_PRECIOS.precioConfeccionMetroTradicional
              : cfgTrad.precioConfeccionMetro,
          // Paño invertido sin tela elegida: la de la capa de la fila
          ...(modoTrad === "INVERTIDO" && !cfgTrad.tela.nombre
            ? { tela: { ...(cfgTrad.bo.lleva && !cfgTrad.gasa.lleva ? cfgTrad.bo : cfgTrad.gasa), lleva: true } }
            : {}),
        }
  const resultadoTrad = calcularTradicional(ancho, alto, cfgTradActual)

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

  // 6. Lista de precios RS (opciones elegidas: tela, color, zócalo, caño, motor...)
  const [opcionesRS, setOpcionesRS] = useState<OpcionesCalculo>(calculoInicial?.opciones ?? {})
  const resultadoRS =
    calculoInicial && conListaRS
      ? recalcularFila(
          { ancho, alto, calculoPrecio: { ...calculoInicial, opciones: opcionesRS } },
          listaRS,
          tablaMG,
          preciosPT
        )
      : null

  // Cálculos reactivos
  let precioCalculadoUnitario = 0
  let desgloseTexto = ""

  if (tipo === "TRADICIONAL_ESTANDAR" || tipo === "TRADICIONAL_INVERTIDO") {
    precioCalculadoUnitario = resultadoTrad.precio ?? 0
    desgloseTexto =
      resultadoTrad.precio === null
        ? "Falta elegir algo para calcular el precio (ver avisos)."
        : `${resultadoTrad.formula} = ${formatearPrecio(resultadoTrad.precio)}`
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
  } else if (tipo === "LISTA_RS") {
    precioCalculadoUnitario = resultadoRS?.precio ?? 0
    desgloseTexto =
      resultadoRS?.precio === null || !resultadoRS
        ? "Falta elegir algo para calcular el precio (ver avisos)."
        : `${resultadoRS.formula} = ${formatearPrecio(resultadoRS.precio)}`
  } else {
    precioCalculadoUnitario = precioDirecto
    desgloseTexto = "Precio cargado directamente sin fórmula de cálculo."
  }

  /** Cálculo con la lista para guardar en la fila (al aplicar desde la pestaña Lista RS) */
  function calculoParaAplicar(): CalculoPrecio | null {
    if (tipo === "TRADICIONAL_ESTANDAR" || tipo === "TRADICIONAL_INVERTIDO") {
      return {
        metodo: "TRADICIONAL",
        entrada: {},
        opciones: {},
        desglose: resultadoTrad.desglose,
        formula: resultadoTrad.formula,
        precioCalculado: resultadoTrad.precio,
        precioManual: false,
        avisos: resultadoTrad.avisos,
        avisoActualizacion: null,
        calculadoEn: new Date().toISOString(),
        tradicional: cfgTradActual,
      }
    }
    if (tipo !== "LISTA_RS" || !calculoInicial || !resultadoRS) return null
    return {
      ...calculoInicial,
      opciones: resultadoRS.opciones,
      desglose: resultadoRS.desglose,
      formula: resultadoRS.formula,
      precioCalculado: resultadoRS.precio,
      precioManual: false,
      avisos: resultadoRS.avisos,
      avisoActualizacion: null,
      calculadoEn: new Date().toISOString(),
    }
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

        {/* Aviso: la cortina se pide solo tela / solo riel (ej: al cotizarla en la página de HD) */}
        {modoCortina && (
          <div className="flex items-center gap-2 border-b border-amber-300 bg-amber-100 px-4 sm:px-6 py-2.5 shrink-0">
            <Info className="h-4 w-4 shrink-0 text-amber-800" />
            <p className="text-xs font-bold text-amber-950">
              {modoCortina === "Solo tela"
                ? "Esta cortina es SOLO TELA: cotizá solo la tela, sin mecanismo."
                : "Esta cortina es SOLO RIEL / MECANISMO: cotizá solo el mecanismo, sin tela."}
              {descripcionInicial && <span className="ml-1 font-semibold text-amber-800">({descripcionInicial})</span>}
            </p>
          </div>
        )}

        {/* Pestañas de Fórmulas */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 overflow-x-auto touch-scroll text-xs font-semibold shrink-0">
          {conListaRS && (
            <button
              type="button"
              onClick={() => setTipo("LISTA_RS")}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center transition ${
                tipo === "LISTA_RS"
                  ? "bg-white text-violet-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {esPT ? "Toldo PT" : esMG ? "Lista MG" : "Lista RS"}
            </button>
          )}
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
                {calculoInicial?.metodo === "PT_PERGOLA" || calculoInicial?.metodo === "PT_SOLO_TELA" ? "Largo (metros)" : "Alto (metros)"}
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
                  if (val > ALTO_MAX_ESTANDAR && tipo === "TRADICIONAL_ESTANDAR") {
                    setTipo("TRADICIONAL_INVERTIDO")
                  } else if (val <= ALTO_MAX_ESTANDAR && tipo === "TRADICIONAL_INVERTIDO") {
                    setTipo("TRADICIONAL_ESTANDAR")
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 1 y 2. TRADICIONAL (estándar o paño invertido) */}
          {(tipo === "TRADICIONAL_ESTANDAR" || tipo === "TRADICIONAL_INVERTIDO") && (
            <div className="space-y-4">
              <div
                className={`rounded-lg p-3 border text-xs ${
                  tipo === "TRADICIONAL_INVERTIDO"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-blue-50/60 border-blue-100 text-blue-900"
                }`}
              >
                {tipo === "TRADICIONAL_INVERTIDO"
                  ? "Alto mayor a 2,85 m: paños = ancho × 2 / ancho del rollo (redondeado para arriba), metros de tela = paños × (alto + 0,20). Tela con el recargo de cada tienda."
                  : "Por capa: riel o barral + confección (por metro) + tela (ancho × frunce) + instalación. Tela con el recargo de cada tienda; con barral se suman argollas, terminales y soportes."}
              </div>
              <CalculoTradicional
                cfg={cfgTradActual}
                onCambiar={setCfgTrad}
                ancho={ancho}
                telas={telasTradicional}
                accesorios={accesoriosTrad}
                resultado={resultadoTrad}
              />
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

          {/* 6. LISTA DE PRECIOS RS */}
          {tipo === "LISTA_RS" && calculoInicial && esPT && (
            <CalculoToldoPT
              calculo={calculoInicial}
              ancho={ancho}
              opciones={opcionesRS}
              onCambiarOpciones={setOpcionesRS}
              resultado={resultadoRS}
            />
          )}
          {tipo === "LISTA_RS" && calculoInicial && !esPT && (
            <CalculoListaRS
              calculo={calculoInicial}
              lista={listaRS}
              tablaMG={tablaMG}
              ancho={ancho}
              alto={alto}
              opciones={opcionesRS}
              onCambiarOpciones={setOpcionesRS}
              resultado={resultadoRS}
            />
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
              disabled={
                (tipo === "LISTA_RS" && resultadoRS?.precio == null) ||
                ((tipo === "TRADICIONAL_ESTANDAR" || tipo === "TRADICIONAL_INVERTIDO") && resultadoTrad.precio === null)
              }
              onClick={() => {
                onAplicarPrecio(precioCalculadoUnitario, calculoParaAplicar())
                onCerrar()
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 min-h-[44px] text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
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
