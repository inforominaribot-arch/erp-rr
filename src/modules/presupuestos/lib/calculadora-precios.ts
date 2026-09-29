// Módulo: Presupuestos
// Motor de Cálculo de Precios y Cotizaciones
// Replicación exacta de las fórmulas del Excel de taller ("AGENDA 2026 - PARA MAXI.xlsx")

// ─── Valores de Referencia por Defecto ────────────────────────────────────────

export const VALORES_DEFECTO_PRECIOS = {
  // Tradicional Estándar (Alto <= 2.85m)
  precioRielMetroTradicional: 50000,
  precioConfeccionMetroTradicional: 50000,
  precioInstalacionTradicional: 40000,

  // Tradicional Paño Invertido (Alto > 2.85m)
  anchoRolloTelaDefault: 2.8, // 2.80 m o 3.00 m
  precioRielMetroInvertido: 50000,
  precioConfeccionMetroInvertido: 70000,
  precioInstalacionInvertido: 40000,
  factorGananciaTelaInvertido: 1.5, // 50% de ganancia
  factorIvaTelaInvertido: 1.21, // 21% de IVA

  // Roller RS (Rollershade)
  precioSistemaMetroRS: 36000,
  precioZocaloMetroRS: 0,
  coeficienteComercialRS: 1.16025, // +16.025%
  precioInstalacionRS: 40000,

  // Hunter Douglas (HD)
  cotizacionUsdHD: 1500,
  factorIvaHD: 1.21,
  factorGananciaHD: 1.5, // 50% de ganancia
  precioInstalacionHD: 40000,
}

// ─── 1. Cortina Tradicional (Alto <= 2.85m) ──────────────────────────────────

export interface ParamsTradicionalEstandar {
  ancho: number // en metros
  llevaGaza?: boolean
  precioTelaGaza?: number
  llevaBO1_5?: boolean
  precioTelaBO1_5?: number
  llevaBO2?: boolean
  precioTelaBO2?: number
  precioRielMetro?: number
  precioConfeccionMetro?: number
  precioInstalacion?: number
}

export interface ResultadoTradicionalEstandar {
  total: number
  cantCapas: number
  costoRieles: number
  costoConfeccion: number
  costoTelaGaza: number
  costoTelaBO: number
  costoInstalacion: number
  formulaTexto: string
}

export function calcularTradicionalEstandar(
  params: ParamsTradicionalEstandar
): ResultadoTradicionalEstandar {
  const ancho = Math.max(0, params.ancho || 0)
  const precioRiel =
    params.precioRielMetro ??
    VALORES_DEFECTO_PRECIOS.precioRielMetroTradicional
  const precioConfeccion =
    params.precioConfeccionMetro ??
    VALORES_DEFECTO_PRECIOS.precioConfeccionMetroTradicional
  const precioInst =
    params.precioInstalacion ??
    VALORES_DEFECTO_PRECIOS.precioInstalacionTradicional

  const udGaza = params.llevaGaza ? 1 : 0
  const udBO1_5 = params.llevaBO1_5 ? 1 : 0
  const udBO2 = params.llevaBO2 ? 1 : 0
  const cantCapas = udGaza + udBO1_5 + udBO2 || 1

  const costoRieles = ancho * precioRiel * cantCapas
  const costoConfeccion = ancho * precioConfeccion * cantCapas
  const costoTelaGaza = udGaza * (2 * ancho * (params.precioTelaGaza || 0))
  const costoTelaBO =
    udBO1_5 * (1.5 * ancho * (params.precioTelaBO1_5 || 0)) +
    udBO2 * (2 * ancho * (params.precioTelaBO2 || 0))
  const costoInstalacion = precioInst * cantCapas

  const total = Math.round(
    costoRieles +
      costoConfeccion +
      costoTelaGaza +
      costoTelaBO +
      costoInstalacion
  )

  const formulaTexto = `(${ancho}m × $${precioRiel} riel × ${cantCapas}) + (${ancho}m × $${precioConfeccion} conf. × ${cantCapas}) + Telas + ($${precioInst} inst. × ${cantCapas})`

  return {
    total,
    cantCapas,
    costoRieles,
    costoConfeccion,
    costoTelaGaza,
    costoTelaBO,
    costoInstalacion,
    formulaTexto,
  }
}

// ─── 2. Cortina Tradicional Paño Invertido (Alto > 2.85m) ─────────────────────

export interface ParamsTradicionalInvertido {
  ancho: number // en metros
  alto: number // en metros
  precioTelaMetro: number
  anchoRolloTela?: number // ej. 2.80 o 3.00
  precioRielMetro?: number
  precioConfeccionMetro?: number
  precioInstalacion?: number
}

export interface ResultadoTradicionalInvertido {
  total: number
  nroPanos: number
  metrosTela: number
  costoTela: number
  costoRiel: number
  costoConfeccion: number
  costoInstalacion: number
  formulaTexto: string
}

export function calcularTradicionalInvertido(
  params: ParamsTradicionalInvertido
): ResultadoTradicionalInvertido {
  const ancho = Math.max(0, params.ancho || 0)
  const alto = Math.max(0, params.alto || 0)
  const anchoRollo =
    params.anchoRolloTela || VALORES_DEFECTO_PRECIOS.anchoRolloTelaDefault
  const precioTela = params.precioTelaMetro || 0
  const precioRiel =
    params.precioRielMetro ??
    VALORES_DEFECTO_PRECIOS.precioRielMetroInvertido
  const precioConfeccion =
    params.precioConfeccionMetro ??
    VALORES_DEFECTO_PRECIOS.precioConfeccionMetroInvertido
  const precioInst =
    params.precioInstalacion ??
    VALORES_DEFECTO_PRECIOS.precioInstalacionInvertido

  // Frunce x2
  const anchoFrunce = ancho * 2
  const nroPanos = Math.ceil(anchoFrunce / anchoRollo) || 1
  // Cada paño mide Alto + 20cm (0.20m)
  const metrosTela = Number((nroPanos * (alto + 0.2)).toFixed(2))

  // Tela con factor 1.5 ganancia e IVA 1.21
  const costoTela = Math.round(
    precioTela *
      VALORES_DEFECTO_PRECIOS.factorGananciaTelaInvertido *
      VALORES_DEFECTO_PRECIOS.factorIvaTelaInvertido *
      metrosTela
  )
  const costoRiel = Math.round(precioRiel * ancho)
  const costoConfeccion = Math.round(precioConfeccion * ancho)
  const costoInstalacion = precioInst

  const total = costoTela + costoRiel + costoConfeccion + costoInstalacion
  const formulaTexto = `${nroPanos} paños (${metrosTela}m de tela con ganancia e IVA) + $${costoRiel} riel + $${costoConfeccion} confección + $${costoInstalacion} inst.`

  return {
    total,
    nroPanos,
    metrosTela,
    costoTela,
    costoRiel,
    costoConfeccion,
    costoInstalacion,
    formulaTexto,
  }
}

// ─── 3. Cortina Roller RS (Rollershade) ───────────────────────────────────────

export interface ParamsRollerRS {
  ancho: number
  alto: number
  precioTelaM2: number
  precioSistemaMetro?: number
  precioZocaloMetro?: number
  precioInstalacion?: number
  unidades?: number
}

export interface ResultadoRollerRS {
  total: number
  precioUnitario: number
  m2Tela: number
  costoTela: number
  costoSistema: number
  costoZocalo: number
  subtotalMaterialesConCoeficiente: number
  costoInstalacionTotal: number
  formulaTexto: string
}

export function calcularRollerRS(params: ParamsRollerRS): ResultadoRollerRS {
  const ancho = Math.max(0, params.ancho || 0)
  const alto = Math.max(0, params.alto || 0)
  const unidades = Math.max(1, params.unidades || 1)
  const m2Tela = Number((ancho * alto).toFixed(2))

  const costoTela = m2Tela * (params.precioTelaM2 || 0)
  const precioSistema =
    params.precioSistemaMetro ??
    VALORES_DEFECTO_PRECIOS.precioSistemaMetroRS
  const costoSistema = ancho * precioSistema
  const precioZocalo =
    params.precioZocaloMetro ?? VALORES_DEFECTO_PRECIOS.precioZocaloMetroRS
  const costoZocalo = ancho * precioZocalo

  const subtotalMateriales = costoTela + costoSistema + costoZocalo
  const subtotalMaterialesConCoeficiente = Math.round(
    subtotalMateriales *
      unidades *
      VALORES_DEFECTO_PRECIOS.coeficienteComercialRS
  )

  const precioInst =
    params.precioInstalacion ?? VALORES_DEFECTO_PRECIOS.precioInstalacionRS
  const costoInstalacionTotal = precioInst * unidades

  const total = subtotalMaterialesConCoeficiente + costoInstalacionTotal
  const precioUnitario = Math.round(total / unidades)

  const formulaTexto = `(${m2Tela}m² tela + sistema + zócalo) × ${unidades}u × 1.16025 coef. + (${unidades}u × $${precioInst} inst.)`

  return {
    total,
    precioUnitario,
    m2Tela,
    costoTela,
    costoSistema,
    costoZocalo,
    subtotalMaterialesConCoeficiente,
    costoInstalacionTotal,
    formulaTexto,
  }
}

// ─── 4. Hunter Douglas (HD) ──────────────────────────────────────────────────

export interface ParamsHunterDouglas {
  precioHD_USD: number
  cotizacionUSD?: number
  precioInstalacion?: number
  unidades?: number
}

export interface ResultadoHunterDouglas {
  total: number
  precioUnitario: number
  subtotalPesos: number
  costoInstalacionTotal: number
  formulaTexto: string
}

export function calcularHunterDouglas(
  params: ParamsHunterDouglas
): ResultadoHunterDouglas {
  const precioUSD = Math.max(0, params.precioHD_USD || 0)
  const cotizacion =
    params.cotizacionUSD ?? VALORES_DEFECTO_PRECIOS.cotizacionUsdHD
  const unidades = Math.max(1, params.unidades || 1)
  const precioInst =
    params.precioInstalacion ?? VALORES_DEFECTO_PRECIOS.precioInstalacionHD

  // Fórmula HD: 1.21 (IVA) * 1.5 (Ganancia) * PrecioUSD
  const factorGananciaEIVA =
    VALORES_DEFECTO_PRECIOS.factorIvaHD *
    VALORES_DEFECTO_PRECIOS.factorGananciaHD // 1.21 * 1.5 = 1.815
  const subtotalPesos = Math.round(precioUSD * factorGananciaEIVA * cotizacion)
  const costoInstalacionTotal = precioInst * unidades
  const total = subtotalPesos + costoInstalacionTotal
  const precioUnitario = Math.round(total / unidades)

  const formulaTexto = `(U$S ${precioUSD} × 1.21 IVA × 1.5 ganancia × $${cotizacion}) + (${unidades}u × $${precioInst} inst.)`

  return {
    total,
    precioUnitario,
    subtotalPesos,
    costoInstalacionTotal,
    formulaTexto,
  }
}
