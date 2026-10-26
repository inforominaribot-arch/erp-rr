"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  tienePermisoModuloComandas,
  tienePermisoModuloProduccion,
} from "./lib/auth"
import type { ActionResponse, EstadoComanda, TipoItemComanda } from "@/types"
import {
  generarComandaSchema,
  cambiarEstadoComandaSchema,
  actualizarItemComandaSchema,
  actualizarNotasComandaSchema,
  type GenerarComandaInput,
  type CambiarEstadoComandaInput,
  type ActualizarItemComandaInput,
  type ActualizarNotasComandaInput,
} from "./schemas"
import {
  asegurarPedidosItems,
  recalcularEstadoComanda,
} from "./lib/pedidos-proveedor"
import type { EstadoPedidoProveedor } from "@prisma/client"

// ─── 1. Generar Comanda desde Presupuesto Aceptado ───────────────────────────

export async function generarComandaDesdePresupuesto(
  input: GenerarComandaInput
): Promise<ActionResponse<{ id: string; numero: number }>> {
  try {
    const auth = await tienePermisoModuloComandas(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = generarComandaSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { presupuestoId, fechaEntrega, notas, itemsClasificacion } = validacion.data

    // Verificar que el presupuesto exista y esté en estado aceptado
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId },
      include: {
        cliente: true,
        comanda: true,
        items: {
          include: {
            itemMedicion: true,
          },
        },
      },
    })

    if (!presupuesto) {
      return { success: false, error: "El presupuesto especificado no existe." }
    }

    if (
      presupuesto.estado !== "ACEPTADO_TOTAL" &&
      presupuesto.estado !== "ACEPTADO_PARCIAL"
    ) {
      return {
        success: false,
        error:
          "Solo se pueden generar comandas de presupuestos con estado Aceptado Total o Aceptado Parcial.",
      }
    }

    if (presupuesto.comanda) {
      return {
        success: false,
        error: `Este presupuesto ya posee la Comanda #${presupuesto.comanda.numero} generada.`,
      }
    }

    // Filtrar los ítems presupuestados que fueron aceptados
    const itemsAceptados =
      presupuesto.estado === "ACEPTADO_TOTAL"
        ? presupuesto.items
        : presupuesto.items.filter((it) => it.aceptado)

    if (itemsAceptados.length === 0) {
      return {
        success: false,
        error:
          "El presupuesto no tiene ítems aprobados para enviar a producción.",
      }
    }

    // Mapear clasificaciones custom por ítem si fueron enviadas desde el modal
    const clasificacionesMap = new Map<
      string,
      { tipo: TipoItemComanda; observaciones?: string | null }
    >()
    if (itemsClasificacion && itemsClasificacion.length > 0) {
      itemsClasificacion.forEach((ic) => {
        clasificacionesMap.set(ic.itemPresupuestoId, {
          tipo: ic.tipo as TipoItemComanda,
          observaciones: ic.observaciones,
        })
      })
    }

    // Preparar ítems para la comanda
    const itemsParaComanda = itemsAceptados.map((it) => {
      const customClasif = clasificacionesMap.get(it.id)
      const tipoFinal: TipoItemComanda = customClasif?.tipo || "FABRICAR"

      // Especificaciones técnicas tomadas de itemMedicion si existe
      const caracteristicasJson = (it.itemMedicion?.caracteristicas as any) || null
      const obsMedicion = it.itemMedicion?.observaciones
      const obsCustom = customClasif?.observaciones

      let obsFinal = ""
      if (obsCustom && obsMedicion) {
        obsFinal = `${obsCustom} | Medición: ${obsMedicion}`
      } else if (obsCustom) {
        obsFinal = obsCustom
      } else if (obsMedicion) {
        obsFinal = `Medición: ${obsMedicion}`
      }

      return {
        productoId: it.itemMedicion?.productoId || null,
        itemMedicionId: it.itemMedicionId || null,
        descripcion: it.descripcion,
        ambiente: it.ambiente || "General",
        ancho: it.ancho,
        alto: it.alto,
        cantidad: it.cantidad,
        tipo: tipoFinal,
        caracteristicas: caracteristicasJson,
        observaciones: obsFinal.trim() !== "" ? obsFinal.trim() : null,
        completado: false,
      }
    })

    const fechaEntregaDate =
      fechaEntrega && fechaEntrega.trim() !== "" ? new Date(fechaEntrega) : null

    // Transacción Prisma: Crear Comanda e ítems, y actualizar Cliente a EN_PRODUCCION
    const nuevaComanda = await prisma.$transaction(async (tx) => {
      const comandaCreada = await tx.comanda.create({
        data: {
          presupuestoId,
          estado: "PENDIENTE",
          notas: notas?.trim() || null,
          fechaEntrega: fechaEntregaDate,
          items: {
            create: itemsParaComanda,
          },
        },
        select: {
          id: true,
          numero: true,
        },
      })

      // Actualizar el estado del cliente en el CRM a EN_PRODUCCION
      await tx.cliente.update({
        where: { id: presupuesto.clienteId },
        data: {
          estado: "EN_PRODUCCION",
        },
      })

      // Descuento automático de stock para cada ítem que posea producto vinculado
      for (const item of itemsParaComanda) {
        if (item.productoId) {
          const prod = await tx.producto.findUnique({
            where: { id: item.productoId },
          })
          if (prod) {
            const stockAnterior = Number(prod.stockActual)
            const cantEgreso = Number(item.cantidad)
            const stockNuevo = Math.max(0, stockAnterior - cantEgreso)

            await tx.producto.update({
              where: { id: prod.id },
              data: { stockActual: stockNuevo },
            })

            await tx.movimientoStock.create({
              data: {
                productoId: prod.id,
                tipo: "EGRESO",
                cantidad: cantEgreso,
                stockAnterior,
                stockNuevo,
                motivo: `Comanda #${comandaCreada.numero} - Fabricación ${item.descripcion} (${presupuesto.cliente.nombre})`,
                referenciaTipo: "COMANDA",
                referenciaId: comandaCreada.id,
              },
            })
          }
        }
      }

      // Pedidos a proveedor por capa (con proveedor preseleccionado por marca)
      const itemsCreados = await tx.itemComanda.findMany({
        where: { comandaId: comandaCreada.id, tipo: "PEDIR_PROVEEDOR" },
        select: { id: true },
      })
      await asegurarPedidosItems(
        tx,
        itemsCreados.map((i) => i.id)
      )

      return comandaCreada
    }, { timeout: 30000 })

    revalidatePath("/comandas")
    revalidatePath("/produccion")
    revalidatePath("/stock")
    revalidatePath("/presupuestos")
    revalidatePath(`/presupuestos/${presupuestoId}`)
    revalidatePath(`/clientes/${presupuesto.clienteId}`)
    revalidatePath("/clientes/pipeline")

    return {
      success: true,
      data: {
        id: nuevaComanda.id,
        numero: nuevaComanda.numero,
      },
    }
  } catch (error) {
    console.error("Error al generar comanda:", error)
    return {
      success: false,
      error: "Ocurrió un error inesperado al generar la comanda.",
    }
  }
}

// ─── 2. Cambiar Estado de la Comanda ─────────────────────────────────────────

export async function cambiarEstadoComanda(
  input: CambiarEstadoComandaInput
): Promise<ActionResponse<{ id: string; estado: EstadoComanda }>> {
  try {
    const auth = await tienePermisoModuloProduccion()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = cambiarEstadoComandaSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { id, estado, notas, fechaEntrega } = validacion.data

    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: {
        presupuesto: true,
      },
    })

    if (!comanda) {
      return { success: false, error: "La comanda no existe." }
    }

    const updateData: any = { estado }
    if (notas !== undefined) {
      updateData.notas = notas?.trim() || null
    }
    if (fechaEntrega !== undefined) {
      updateData.fechaEntrega =
        fechaEntrega && fechaEntrega.trim() !== "" ? new Date(fechaEntrega) : null
    }

    await prisma.$transaction(async (tx) => {
      await tx.comanda.update({
        where: { id },
        data: updateData,
      })

      // Si la comanda pasa a INSTALADO, actualizar el estado del cliente en el CRM
      if (estado === "INSTALADO") {
        await tx.cliente.update({
          where: { id: comanda.presupuesto.clienteId },
          data: { estado: "INSTALADO" },
        })
      }
    })

    revalidatePath("/comandas")
    revalidatePath(`/comandas/${id}`)
    revalidatePath("/produccion")
    revalidatePath(`/clientes/${comanda.presupuesto.clienteId}`)
    revalidatePath("/clientes/pipeline")

    return {
      success: true,
      data: { id, estado },
    }
  } catch (error) {
    console.error("Error al cambiar estado de comanda:", error)
    return {
      success: false,
      error: "No se pudo actualizar el estado de la comanda.",
    }
  }
}

// ─── 3. Alternar / Actualizar Ítem Completado (Taller) ───────────────────────

export async function toggleCompletadoItemComanda(
  itemId: string,
  completadoForzado?: boolean
): Promise<
  ActionResponse<{
    id: string
    completado: boolean
    comandaEstado: EstadoComanda
  }>
> {
  try {
    const auth = await tienePermisoModuloProduccion()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const item = await prisma.itemComanda.findUnique({
      where: { id: itemId },
      include: {
        comanda: {
          include: {
            items: true,
            presupuesto: true,
          },
        },
      },
    })

    if (!item) {
      return { success: false, error: "El ítem de comanda no existe." }
    }

    const nuevoCompletado =
      completadoForzado !== undefined ? completadoForzado : !item.completado

    // Evaluar en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      if (item.tipo === "PEDIR_PROVEEDOR") {
        // En cortinas de proveedor "listo" = todas sus capas recibidas
        await asegurarPedidosItems(tx, [itemId])
        await tx.pedidoProveedorItem.updateMany({
          where: { itemComandaId: itemId },
          data: nuevoCompletado
            ? { estado: "PEDIDO_RECIBIDO", fechaRecibido: new Date() }
            : { estado: "PEDIDO_REALIZADO", fechaRecibido: null },
        })
      }
      await tx.itemComanda.update({
        where: { id: itemId },
        data: { completado: nuevoCompletado },
      })

      const nuevoEstadoComanda =
        (await recalcularEstadoComanda(tx, item.comandaId)) ?? item.comanda.estado

      return {
        id: itemId,
        completado: nuevoCompletado,
        comandaEstado: nuevoEstadoComanda as EstadoComanda,
      }
    })

    revalidatePath("/produccion")
    revalidatePath("/comandas")
    revalidatePath(`/comandas/${item.comandaId}`)

    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    console.error("Error al actualizar completado del ítem:", error)
    return {
      success: false,
      error: "No se pudo actualizar el estado del ítem en taller.",
    }
  }
}

// ─── 4. Actualizar Tipo de Ítem (FABRICAR / PEDIR_PROVEEDOR) ─────────────────

export async function actualizarTipoItemComanda(
  itemId: string,
  tipo: TipoItemComanda
): Promise<ActionResponse<{ id: string; tipo: TipoItemComanda }>> {
  try {
    const auth = await tienePermisoModuloProduccion()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const item = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.itemComanda.update({
        where: { id: itemId },
        data: { tipo },
        select: {
          id: true,
          comandaId: true,
          tipo: true,
        },
      })
      if (tipo === "PEDIR_PROVEEDOR") {
        await asegurarPedidosItems(tx, [itemId])
      } else {
        await tx.pedidoProveedorItem.deleteMany({ where: { itemComandaId: itemId } })
      }
      await recalcularEstadoComanda(tx, actualizado.comandaId)
      return actualizado
    })

    revalidatePath("/produccion")
    revalidatePath("/comandas")
    revalidatePath(`/comandas/${item.comandaId}`)

    return {
      success: true,
      data: { id: item.id, tipo: item.tipo },
    }
  } catch (error) {
    console.error("Error al cambiar clasificación del ítem:", error)
    return {
      success: false,
      error: "No se pudo actualizar la clasificación del ítem.",
    }
  }
}

// ─── 5. Actualizar Notas y Fecha de Entrega de la Comanda ─────────────────────

export async function actualizarNotasComanda(
  input: ActualizarNotasComandaInput
): Promise<ActionResponse<void>> {
  try {
    const auth = await tienePermisoModuloComandas(false)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = actualizarNotasComandaSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { id, notas, fechaEntrega } = validacion.data

    const fechaEntregaDate =
      fechaEntrega && fechaEntrega.trim() !== "" ? new Date(fechaEntrega) : null

    await prisma.comanda.update({
      where: { id },
      data: {
        notas: notas?.trim() || null,
        fechaEntrega: fechaEntregaDate,
      },
    })

    revalidatePath("/comandas")
    revalidatePath(`/comandas/${id}`)
    revalidatePath("/produccion")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error al actualizar notas de la comanda:", error)
    return {
      success: false,
      error: "No se pudieron actualizar las observaciones de la comanda.",
    }
  }
}

// ─── 6. Eliminar Comanda ─────────────────────────────────────────────────────

export async function eliminarComanda(id: string): Promise<ActionResponse<void>> {
  try {
    const auth = await tienePermisoModuloComandas(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: {
        presupuesto: true,
      },
    })

    if (!comanda) {
      return { success: false, error: "La comanda no existe." }
    }

    await prisma.comanda.delete({
      where: { id },
    })

    revalidatePath("/comandas")
    revalidatePath("/produccion")
    revalidatePath("/presupuestos")
    revalidatePath(`/presupuestos/${comanda.presupuestoId}`)
    revalidatePath(`/clientes/${comanda.presupuesto.clienteId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error al eliminar comanda:", error)
    return {
      success: false,
      error: "No se pudo eliminar la comanda seleccionada.",
    }
  }
}

// ─── Pedidos a Proveedor por capa (Producción: Administración y Taller) ──────

export async function actualizarPedidoProveedor(input: {
  pedidoId: string
  estado: EstadoPedidoProveedor
  proveedorId?: string | null
  nota?: string | null
}): Promise<ActionResponse<{ comandaEstado: string | null }>> {
  try {
    const auth = await tienePermisoModuloProduccion()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const ESTADOS: EstadoPedidoProveedor[] = ["PENDIENTE_PEDIDO", "PEDIDO_REALIZADO", "PEDIDO_RECIBIDO"]
    if (!ESTADOS.includes(input.estado)) {
      return { success: false, error: "Estado de pedido inválido." }
    }

    const pedido = await prisma.pedidoProveedorItem.findUnique({
      where: { id: input.pedidoId },
      select: { id: true, fechaPedido: true, itemComanda: { select: { comandaId: true } } },
    })
    if (!pedido) {
      return { success: false, error: "El pedido no existe." }
    }

    const ahora = new Date()
    const comandaEstado = await prisma.$transaction(async (tx) => {
      await tx.pedidoProveedorItem.update({
        where: { id: input.pedidoId },
        data: {
          estado: input.estado,
          ...(input.proveedorId !== undefined ? { proveedorId: input.proveedorId || null } : {}),
          ...(input.nota !== undefined ? { nota: input.nota?.trim() || null } : {}),
          // Fechas según el estado
          fechaPedido:
            input.estado === "PENDIENTE_PEDIDO" ? null : pedido.fechaPedido ?? ahora,
          fechaRecibido: input.estado === "PEDIDO_RECIBIDO" ? ahora : null,
        },
      })
      return recalcularEstadoComanda(tx, pedido.itemComanda.comandaId)
    })

    revalidatePath("/produccion")
    revalidatePath("/comandas")
    revalidatePath(`/comandas/${pedido.itemComanda.comandaId}`)
    revalidatePath("/")

    return { success: true, data: { comandaEstado: comandaEstado ?? null } }
  } catch (error) {
    console.error("Error al actualizar pedido a proveedor:", error)
    return { success: false, error: "No se pudo actualizar el pedido." }
  }
}
