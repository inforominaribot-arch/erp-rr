// Módulo: Presupuestos
// Filas del presupuesto a partir de una medición: una por cortina física (paño / tramo de cada capa),
// con el precio calculado con la lista RS cuando la capa es RS (Roller, Roller Mot, Bandas).
// Además: una fila de cargadores Li-ion por abertura y filas de controles remotos para todo el cliente
// (agrupados por marca y canales).

import type { ICaracteristicasItem, IConfigMotor } from "@/modules/mediciones/types"
import {
  cortinasFisicas,
  etiquetaCortinaFisica,
  type ICortinaFisica,
} from "@/modules/mediciones/lib/cortinas-fisicas"
import type { ItemPresupuestoInput } from "../schemas"
import type { MedicionImportable } from "../types"
import {
  armarCalculoPrecio,
  buscarCargador,
  buscarControl,
  calcularAccesorioMotorizado,
  calcularCortinaRS,
  metodoParaCapa,
  type IItemListaCalculo,
  type OpcionesCalculo,
} from "./lista-precios-rs"

export function nuevoGrupoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const esLiIon = (m: IConfigMotor | null | undefined) =>
  (m?.modelo || "").toLowerCase().replace(/[^a-z]/g, "").includes("liion")

/** Descripción de la fila: "Ventanal – B.O. Roller (RS)" (el paño/tramo se muestra aparte). */
export function descripcionCortina(descripcionAbertura: string, k: ICortinaFisica): string {
  const etiqueta = etiquetaCortinaFisica({ ...k, total: 1 })
  const modo = k.modo !== "Normal" ? ` · ${k.modo}` : ""
  return `${descripcionAbertura || "Cortina"} – ${etiqueta}${k.marca ? ` (${k.marca})` : ""}${modo}`.slice(0, 250)
}

/** Sufijo del paño / tramo: "C2" en la Gaza, "T1" en el B.O. */
export function sufijoCortina(capa: string | null | undefined, indice: number | null | undefined): string {
  if (!capa || indice === null || indice === undefined) return ""
  return `${capa === "GAZA" ? "C" : "T"}${indice + 1}`
}

/** Calcula una cortina física con la lista (si es RS y tiene fórmula). */
export function calcularFilaCortina(
  k: Pick<ICortinaFisica, "tipoCapa" | "modo" | "marca" | "nombreTela" | "motor" | "telaId" | "colorTela">,
  ancho: number,
  alto: number,
  lista: IItemListaCalculo[],
  opciones: OpcionesCalculo = {}
): Pick<ItemPresupuestoInput, "precioUnitario" | "calculoPrecio"> {
  const metodo = metodoParaCapa(k.tipoCapa)
  if (!metodo || k.marca !== "RS" || lista.length === 0) {
    return { precioUnitario: 0, calculoPrecio: null }
  }
  const entrada = {
    tipoCapa: k.tipoCapa,
    modo: k.modo,
    nombreTelaMedicion: k.nombreTela || undefined,
    motor: k.motor ? { marca: k.motor.marca, modelo: k.motor.modelo, control: k.motor.control } : null,
  }
  const resultado = calcularCortinaRS(
    { ...entrada, ancho, alto },
    { telaId: k.telaId ?? undefined, color: k.colorTela ?? undefined, ...opciones },
    lista
  )
  return {
    precioUnitario: resultado.precio ?? 0,
    calculoPrecio: armarCalculoPrecio(metodo, entrada, resultado),
  }
}

/** Filas de una abertura (una por cortina física). Si la medición no tiene capas, una sola fila como antes. */
export function filasDeAbertura(
  it: { id: string; descripcion: string; ancho: number; alto: number; cantidad: number; caracteristicas: unknown },
  ambiente: string,
  lista: IItemListaCalculo[],
  opcion?: { caracteristicas: Record<string, unknown> | null; nombreOpcion: string; esOpcionPrincipal: boolean },
  soloCapa?: string | null
): ItemPresupuestoInput[] {
  const carac = (opcion?.caracteristicas ?? it.caracteristicas) as ICaracteristicasItem | null
  const cortinas = cortinasFisicas(carac, it.ancho, it.alto).filter((k) => !soloCapa || k.capa === soloCapa)

  if (cortinas.length === 0) {
    if (soloCapa) return []
    return [
      {
        itemMedicionId: it.id,
        descripcion: carac?.tipo ? `${carac.tipo} - ${it.descripcion}` : it.descripcion || "Cortina",
        ambiente,
        ancho: it.ancho,
        alto: it.alto,
        cantidad: it.cantidad || 1,
        precioUnitario: 0,
        subtotal: 0,
        aceptado: false,
        esOpcionPrincipal: true,
      },
    ]
  }

  return cortinas.map((k) => {
    const calculo = calcularFilaCortina(k, k.ancho, k.alto, lista)
    return {
      itemMedicionId: it.id,
      descripcion: descripcionCortina(it.descripcion, k),
      ambiente,
      ancho: k.ancho,
      alto: k.alto,
      cantidad: 1,
      precioUnitario: calculo.precioUnitario,
      subtotal: calculo.precioUnitario,
      aceptado: false,
      caracteristicas: opcion?.caracteristicas ?? null,
      grupoAlternativa: null,
      nombreOpcion: opcion?.nombreOpcion ?? null,
      esOpcionPrincipal: opcion?.esOpcionPrincipal ?? true,
      capa: k.capa,
      indiceCortina: k.indice,
      tipoFila: "CORTINA",
      calculoPrecio: calculo.calculoPrecio,
    }
  })
}

/** Importa toda la medición: cortinas físicas, cargadores por abertura y controles del cliente. */
export function filasDesdeMedicion(
  medicion: MedicionImportable,
  lista: IItemListaCalculo[]
): ItemPresupuestoInput[] {
  const filas: ItemPresupuestoInput[] = []
  const controles = new Map<string, { marca: string; canales: number; cantidad: number }>()

  for (const amb of medicion.ambientes) {
    const ambiente = amb.nombre || "General"
    for (const it of amb.items) {
      const deAbertura = filasDeAbertura(it, ambiente, lista)
      // Cada capa es un grupo (se acepta entera y puede tener alternativas)
      const grupos = new Map<string, string>()
      for (const f of deAbertura) {
        if (!f.capa) continue
        if (!grupos.has(f.capa)) grupos.set(f.capa, nuevoGrupoId())
        f.grupoAlternativa = grupos.get(f.capa)!
      }
      filas.push(...deAbertura)

      // Motores RS de la abertura: controles (por capa con control) y cargadores Li-ion
      const carac = it.caracteristicas as ICaracteristicasItem | null
      const cortinas = cortinasFisicas(carac, it.ancho, it.alto)
      const capasMot = [...new Map(
        cortinas.filter((k) => k.tipoCapa === "Roller Mot" && k.marca === "RS" && k.motor).map((k) => [k.capa, k])
      ).values()]
      for (const k of capasMot) {
        if (!k.motor?.control) continue
        const canales = k.motor.canales || 1
        const clave = `${k.motor.marca}|${canales}`
        const actual = controles.get(clave) ?? { marca: k.motor.marca, canales, cantidad: 0 }
        actual.cantidad++
        controles.set(clave, actual)
      }
      const cantCargadores = Number(carac?.cantidadCargadores) || 0
      if (cantCargadores > 0 && capasMot.some((k) => esLiIon(k.motor))) {
        const calculo = calcularAccesorioMotorizado(buscarCargador(lista))
        const precio = calculo.precio ?? 0
        filas.push({
          itemMedicionId: it.id,
          descripcion: `${it.descripcion || "Cortina"} – Cargador Li-ion`,
          ambiente,
          ancho: 0,
          alto: 0,
          cantidad: cantCargadores,
          precioUnitario: precio,
          subtotal: precio * cantCargadores,
          aceptado: false,
          esOpcionPrincipal: true,
          tipoFila: "CARGADOR",
          calculoPrecio: lista.length > 0 ? armarCalculoPrecio("RS_CARGADOR", {}, calculo) : null,
        })
      }
    }
  }

  for (const c of controles.values()) {
    const calculo = calcularAccesorioMotorizado(buscarControl(lista, c.marca, c.canales))
    const precio = calculo.precio ?? 0
    filas.push({
      itemMedicionId: null,
      descripcion: `Control remoto ${c.marca} ${c.canales} ${c.canales === 1 ? "canal" : "canales"}`,
      ambiente: "Controles",
      ancho: 0,
      alto: 0,
      cantidad: c.cantidad,
      precioUnitario: precio,
      subtotal: precio * c.cantidad,
      aceptado: false,
      esOpcionPrincipal: true,
      tipoFila: "CONTROL",
      calculoPrecio:
        lista.length > 0
          ? armarCalculoPrecio("RS_CONTROL", { marcaMotor: c.marca, canales: c.canales }, calculo)
          : null,
    })
  }

  return filas
}
