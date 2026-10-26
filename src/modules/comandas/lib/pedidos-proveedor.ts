// Módulo: Comandas & Producción
// Pedidos a proveedor por capa de cortina (Gaza / B.O.).
// Una cortina "PEDIR_PROVEEDOR" puede tener dos capas de marcas distintas (ej: Gaza RS + B.O. HD):
// cada capa es un pedido con su propio estado. Si ambas capas son de la misma marca, es un solo pedido.

import type { Prisma } from "@prisma/client"
import type { ICaracteristicasItem } from "@/modules/mediciones/types"

type Tx = Prisma.TransactionClient

export interface CapaPedido {
  capa: "GAZA" | "BO" | "GAZA_BO" | "UNICA"
  etiqueta: string
  marca: string | null
}

export const ETIQUETA_ESTADO_PEDIDO = {
  PENDIENTE_PEDIDO: "Pendiente de pedido",
  PEDIDO_REALIZADO: "Pedido realizado",
  PEDIDO_RECIBIDO: "Pedido recibido",
} as const

/** ¿La capa es confección propia de taller (Tradicional común, sin marca)? */
function esCapaDeTaller(c: ICaracteristicasItem, capa: "gaza" | "bo"): boolean {
  const tipo = c.tipo
  if (tipo === "Tradicional") {
    return capa === "gaza" ? true : c.formatoBO !== "Roller"
  }
  if (tipo === "Motorizada") {
    // En estas combinaciones la segunda capa (B.O.) es Tradicional común de taller
    return (
      capa === "bo" &&
      (c.subtipoMotorizada === "Tradicional Mot y Tradicional" ||
        c.subtipoMotorizada === "Roller Mot y Tradicional")
    )
  }
  if (capa === "gaza" && (tipo === "Aluminio" || tipo === "Roller Noche total" || tipo === "Noche total")) {
    return c.tipoCapaGaza === "Tradicional"
  }
  return false
}

/** Capas de la cortina que se piden a proveedor, agrupando las de la misma marca. */
export function capasPedidoProveedor(c: ICaracteristicasItem | null | undefined): CapaPedido[] {
  if (!c) return [{ capa: "UNICA", etiqueta: "Cortina", marca: null }]

  const capas: Array<{ capa: "gaza" | "bo"; etiqueta: string; marca: string | null }> = []

  if (c.tipo === "Aluminio") {
    // La persiana de aluminio en sí cuenta como la capa "B.O."
    capas.push({ capa: "bo", etiqueta: "Aluminio", marca: c.marcaBO || c.marca || null })
    if (c.gaza?.activa && !esCapaDeTaller(c, "gaza")) {
      capas.push({ capa: "gaza", etiqueta: "Gaza", marca: c.marcaGaza || c.marca || null })
    }
  } else {
    if (c.gaza?.activa && !esCapaDeTaller(c, "gaza")) {
      capas.push({ capa: "gaza", etiqueta: "Gaza", marca: c.marcaGaza || c.marca || null })
    }
    if (c.bo?.activa && !esCapaDeTaller(c, "bo")) {
      capas.push({ capa: "bo", etiqueta: "B.O.", marca: c.marcaBO || c.marca || null })
    }
  }

  if (capas.length === 0) return [{ capa: "UNICA", etiqueta: "Cortina", marca: c.marca || null }]
  if (capas.length === 1) {
    return [{ capa: capas[0].capa === "gaza" ? "GAZA" : "BO", etiqueta: capas[0].etiqueta, marca: capas[0].marca }]
  }
  // Dos capas: si son de la misma marca es un solo pedido
  if (capas[0].marca === capas[1].marca) {
    return [{ capa: "GAZA_BO", etiqueta: `${capas[0].etiqueta} + ${capas[1].etiqueta}`, marca: capas[0].marca }]
  }
  return capas.map((k) => ({
    capa: k.capa === "gaza" ? "GAZA" : "BO",
    etiqueta: k.etiqueta,
    marca: k.marca,
  }))
}

/** Busca el proveedor activo que provee esa marca (para preseleccionarlo). */
async function proveedorPorMarca(tx: Tx, marca: string | null): Promise<string | null> {
  if (!marca) return null
  const prov = await tx.proveedor.findFirst({
    where: { activo: true, marcas: { has: marca } },
    orderBy: { nombre: "asc" },
    select: { id: true },
  })
  return prov?.id ?? null
}

/**
 * Crea los pedidos por capa que falten para los ítems PEDIR_PROVEEDOR indicados.
 * Si el ítem ya estaba "completado" (dato anterior a esta función), sus pedidos nacen como recibidos.
 */
export async function asegurarPedidosItems(tx: Tx, itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return
  const items = await tx.itemComanda.findMany({
    where: { id: { in: itemIds }, tipo: "PEDIR_PROVEEDOR" },
    select: { id: true, completado: true, caracteristicas: true, pedidos: { select: { capa: true } } },
  })
  for (const item of items) {
    if (item.pedidos.length > 0) continue
    const capas = capasPedidoProveedor(item.caracteristicas as unknown as ICaracteristicasItem)
    for (const capa of capas) {
      await tx.pedidoProveedorItem.create({
        data: {
          itemComandaId: item.id,
          capa: capa.capa,
          marca: capa.marca,
          proveedorId: await proveedorPorMarca(tx, capa.marca),
          ...(item.completado
            ? { estado: "PEDIDO_RECIBIDO" as const, fechaRecibido: new Date() }
            : {}),
        },
      })
    }
  }
}

/**
 * Recalcula el "completado" de un ítem de proveedor (= todas sus capas recibidas)
 * y el estado automático de la comanda:
 *  - todo listo → LISTO_PARA_INSTALAR
 *  - taller listo pero falta recibir de proveedor → ESPERANDO_PROVEEDOR
 */
export async function recalcularEstadoComanda(tx: Tx, comandaId: string) {
  const comanda = await tx.comanda.findUnique({
    where: { id: comandaId },
    include: { items: { include: { pedidos: true } } },
  })
  if (!comanda) return null

  for (const it of comanda.items) {
    if (it.tipo !== "PEDIR_PROVEEDOR" || it.pedidos.length === 0) continue
    const recibido = it.pedidos.every((p) => p.estado === "PEDIDO_RECIBIDO")
    if (recibido !== it.completado) {
      await tx.itemComanda.update({ where: { id: it.id }, data: { completado: recibido } })
      it.completado = recibido
    }
  }

  if (comanda.estado === "INSTALADO") return comanda.estado

  const todosListos = comanda.items.every((i) => i.completado)
  const tallerListo = comanda.items.filter((i) => i.tipo === "FABRICAR").every((i) => i.completado)

  let estado = comanda.estado
  if (todosListos) estado = "LISTO_PARA_INSTALAR"
  else if (tallerListo && comanda.items.some((i) => i.tipo === "PEDIR_PROVEEDOR")) estado = "ESPERANDO_PROVEEDOR"
  else if (estado === "LISTO_PARA_INSTALAR" || estado === "ESPERANDO_PROVEEDOR") estado = "EN_PRODUCCION"

  if (estado !== comanda.estado) {
    await tx.comanda.update({ where: { id: comandaId }, data: { estado } })
  }
  return estado
}

/** Fecha esperada de llegada y si está demorado. */
export function calcularDemora(
  estado: string,
  fechaPedido: Date | string | null,
  diasEntrega: number | null | undefined
): { fechaEsperada: Date | null; demorado: boolean; diasTranscurridos: number | null } {
  if (estado !== "PEDIDO_REALIZADO" || !fechaPedido) {
    return { fechaEsperada: null, demorado: false, diasTranscurridos: null }
  }
  const pedido = new Date(fechaPedido)
  const diasTranscurridos = Math.floor((Date.now() - pedido.getTime()) / 86_400_000)
  if (!diasEntrega) return { fechaEsperada: null, demorado: false, diasTranscurridos }
  const fechaEsperada = new Date(pedido.getTime() + diasEntrega * 86_400_000)
  return { fechaEsperada, demorado: Date.now() > fechaEsperada.getTime(), diasTranscurridos }
}
