// Módulo: Presupuestos
// Recálculo de los presupuestos abiertos cuando cambia la lista de precios RS.
// - Se actualizan Borradores, Enviados y Rechazados, y las capas NO aceptadas de los Aceptados parciales.
// - Lo aceptado (y los Aceptados totales) no se toca.
// - Las filas con precio corregido a mano no se tocan: quedan con el aviso "No se actualizó".

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { obtenerListaCalculoRS } from "../queries"
import { subtotalPrincipales } from "./alternativas"
import { leerCalculoPrecio, recalcularFila, type CalculoPrecio } from "./lista-precios-rs"

export const AVISO_PRECIO_MANUAL = "No se actualizó con la lista: precio corregido a mano."
export const AVISO_SIN_PRECIO = "No se actualizó con la lista: falta elegir algo en la calculadora."

export interface ResultadoRecalculo {
  presupuestos: number
  filasActualizadas: number
  filasManuales: number
}

export async function recalcularPresupuestosConLista(): Promise<ResultadoRecalculo> {
  const lista = await obtenerListaCalculoRS()
  const resultado: ResultadoRecalculo = { presupuestos: 0, filasActualizadas: 0, filasManuales: 0 }
  if (lista.length === 0) return resultado

  const presupuestos = await prisma.presupuesto.findMany({
    where: {
      estado: { in: ["BORRADOR", "ENVIADO", "RECHAZADO", "ACEPTADO_PARCIAL"] },
      items: { some: { NOT: { calculoPrecio: { equals: Prisma.AnyNull } } } },
    },
    include: { items: true },
  })

  for (const p of presupuestos) {
    const cambios: Array<{ id: string; precioUnitario: number; subtotal: number; calculoPrecio: CalculoPrecio }> = []

    for (const it of p.items) {
      if (p.estado === "ACEPTADO_PARCIAL" && it.aceptado) continue
      const calc = leerCalculoPrecio(it.calculoPrecio)
      if (!calc) continue
      const nuevo = recalcularFila({ ancho: Number(it.ancho), alto: Number(it.alto), calculoPrecio: calc }, lista)
      if (!nuevo) continue
      const precioActual = Number(it.precioUnitario)

      if (calc.precioManual) {
        const aviso = nuevo.precio !== null && nuevo.precio !== precioActual ? AVISO_PRECIO_MANUAL : null
        if (aviso !== (calc.avisoActualizacion ?? null)) {
          cambios.push({
            id: it.id,
            precioUnitario: precioActual,
            subtotal: Number(it.subtotal),
            calculoPrecio: { ...calc, precioCalculado: nuevo.precio, avisoActualizacion: aviso },
          })
        }
        if (aviso) resultado.filasManuales++
        continue
      }

      if (nuevo.precio === null) {
        if (calc.avisoActualizacion !== AVISO_SIN_PRECIO) {
          cambios.push({
            id: it.id,
            precioUnitario: precioActual,
            subtotal: Number(it.subtotal),
            calculoPrecio: { ...calc, avisos: nuevo.avisos, avisoActualizacion: AVISO_SIN_PRECIO },
          })
        }
        continue
      }

      if (nuevo.precio === precioActual && !calc.avisoActualizacion) continue
      const cantidad = Math.max(1, it.cantidad || 1)
      cambios.push({
        id: it.id,
        precioUnitario: nuevo.precio,
        subtotal: Math.round(nuevo.precio * cantidad * 100) / 100,
        calculoPrecio: {
          ...calc,
          opciones: nuevo.opciones,
          desglose: nuevo.desglose,
          formula: nuevo.formula,
          precioCalculado: nuevo.precio,
          avisos: nuevo.avisos,
          avisoActualizacion: null,
          calculadoEn: new Date().toISOString(),
        },
      })
      if (nuevo.precio !== precioActual) resultado.filasActualizadas++
    }

    if (cambios.length === 0) continue

    const porId = new Map(cambios.map((c) => [c.id, c]))
    const itemsNuevos = p.items.map((it) => ({
      esOpcionPrincipal: it.esOpcionPrincipal,
      subtotal: porId.get(it.id)?.subtotal ?? Number(it.subtotal),
    }))
    const subtotal = subtotalPrincipales(itemsNuevos)
    const descuento = Number(p.descuento) || 0
    const total = Math.max(0, subtotal - Math.round(subtotal * (descuento / 100) * 100) / 100)

    await prisma.$transaction([
      ...cambios.map((c) =>
        prisma.itemPresupuesto.update({
          where: { id: c.id },
          data: {
            precioUnitario: c.precioUnitario,
            subtotal: c.subtotal,
            calculoPrecio: c.calculoPrecio as Prisma.InputJsonValue,
          },
        })
      ),
      prisma.presupuesto.update({ where: { id: p.id }, data: { subtotal, total } }),
    ])
    resultado.presupuestos++
  }

  return resultado
}
