// Módulo: Presupuestos
// Lógica de cálculo de explosión de materiales (Rieles, Telas, Accesorios) y cruce contra Stock

export interface IDesgloseRiel {
  cantidadTramos: number
  medidaPorTramo: number // en metros (múltiplo de 0.20)
  totalMetrosLineales: number
  capas: number // 1 si es simple, 2 si es doble (ej: Gasa + BO)
  descripcionRiel: string
}

export interface INecesidadMaterial {
  tipo: "RIEL" | "TELA" | "ACCESORIO"
  nombre: string
  unidadMedida: "metro" | "unidad" | "metro2"
  cantidadRequerida: number
  stockActual: number
  faltante: number
  tieneStockSuficiente: boolean
  detalles: string
  productoId?: string
}

export interface IReporteDisponibilidadStock {
  materiales: INecesidadMaterial[]
  hayFaltantes: boolean
  totalFaltantes: number
  resumenRieles: string[]
  resumenTelas: string[]
}

/**
 * Regla de negocio de Rieles:
 * - Vienen en múltiplos de 0.20m hacia arriba (ej: 2.30m -> 2.40m).
 * - Máximo de un riel continuo: 4.60m.
 * - Si el ancho supera 4.60m: se divide en 2 partes iguales, y cada mitad se redondea al múltiplo de 0.20m superior.
 *   Ejemplo: 4.80m -> 2 partes de 2.40m.
 *   Ejemplo: 5.00m -> 2 partes de 2.50m -> se redondean a 2.60m cada una.
 */
export function calcularCorteRiel(anchoMetros: number): {
  cantidadTramos: number
  medidaPorTramo: number
  totalMetros: number
} {
  const ancho = Math.max(0.1, Number(anchoMetros) || 0)

  // Redondear un número hacia arriba al múltiplo de 0.20
  const redondearMultiplo20cm = (val: number): number => {
    return Number((Math.ceil(Number((val * 10).toFixed(4)) / 2) * 0.2).toFixed(2))
  }

  if (ancho <= 4.6) {
    const medidaTramo = redondearMultiplo20cm(ancho)
    return {
      cantidadTramos: 1,
      medidaPorTramo: medidaTramo,
      totalMetros: medidaTramo,
    }
  } else {
    // Si supera los 4.60m, se divide en 2 tramos iguales
    const mitad = ancho / 2
    const medidaTramo = redondearMultiplo20cm(mitad)
    return {
      cantidadTramos: 2,
      medidaPorTramo: medidaTramo,
      totalMetros: Number((medidaTramo * 2).toFixed(2)),
    }
  }
}

/**
 * Analiza un ítem de presupuesto y sus características de medición (si las tiene)
 * para calcular los rieles necesarios y sus capas (simple o doble).
 */
export function analizarRielesItem(
  descripcion: string,
  ancho: number,
  cantidadCortinas: number = 1,
  caracteristicas?: any
): IDesgloseRiel | null {
  const descLower = descripcion.toLowerCase()

  // Si es Roller, Aluminio, Bandas, Mosquera o Hunter Douglas, no lleva riel tradicional
  if (
    descLower.includes("roller") &&
    !descLower.includes("tradicional") &&
    !descLower.includes("riel")
  ) {
    return null
  }
  if (
    descLower.includes("aluminio") ||
    descLower.includes("mosquera") ||
    descLower.includes("hunter")
  ) {
    return null
  }

  // Verificar si lleva riel
  const tieneRiel =
    descLower.includes("riel") ||
    descLower.includes("tradicional") ||
    descLower.includes("gasa") ||
    descLower.includes("gaza") ||
    caracteristicas?.sistema === "Riel" ||
    !caracteristicas?.sistema // por defecto tradicional suele usar riel

  if (!tieneRiel && caracteristicas?.sistema === "Barral") {
    return null // si especifica Barral, no consume rieles
  }

  // Detectar si es doble capa (Gasa + Blackout)
  let capas = 1
  if (caracteristicas) {
    const gazaActiva = Boolean(caracteristicas.gaza?.activa)
    const boActiva = Boolean(caracteristicas.bo?.activa)
    if (gazaActiva && boActiva) {
      capas = 2
    }
  } else {
    // Si no tiene ficha técnica pero la descripción dice "doble" o menciona gasa y blackout
    if (
      descLower.includes("doble") ||
      ((descLower.includes("gasa") || descLower.includes("gaza")) &&
        descLower.includes("blackout")) ||
      ((descLower.includes("gasa") || descLower.includes("gaza")) &&
        descLower.includes("bo"))
    ) {
      capas = 2
    }
  }

  const calculoBase = calcularCorteRiel(ancho)
  const cantidadTotalTramos = calculoBase.cantidadTramos * capas * cantidadCortinas
  const totalMetrosLineales = Number(
    (calculoBase.medidaPorTramo * cantidadTotalTramos).toFixed(2)
  )

  let descripcionRiel = ""
  if (calculoBase.cantidadTramos === 1) {
    descripcionRiel = `${cantidadTotalTramos} riel(es) de ${calculoBase.medidaPorTramo.toFixed(2)}m (${capas === 2 ? "Doble capa" : "Simple"})`
  } else {
    descripcionRiel = `${cantidadTotalTramos} rieles de ${calculoBase.medidaPorTramo.toFixed(2)}m (ancho ${ancho}m dividido en 2 mitades${capas === 2 ? " x 2 capas" : ""})`
  }

  return {
    cantidadTramos: cantidadTotalTramos,
    medidaPorTramo: calculoBase.medidaPorTramo,
    totalMetrosLineales,
    capas,
    descripcionRiel,
  }
}
