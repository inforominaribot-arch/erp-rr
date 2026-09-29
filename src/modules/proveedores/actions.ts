// Módulo: Proveedores & Compras
// Server Actions para mutaciones transaccionales con Prisma ORM

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { ActionResponse } from "@/types"
import { tienePermisoModuloProveedores } from "./lib/auth"
import {
  proveedorSchema,
  productoProveedorSchema,
  ordenCompraSchema,
  cambioEstadoOrdenSchema,
  recepcionOrdenCompraSchema,
  type ProveedorInput,
  type ProductoProveedorInput,
  type OrdenCompraInput,
  type CambioEstadoOrdenInput,
  type RecepcionOrdenCompraInput,
} from "./schemas"
import type { IProveedor, IOrdenCompra, IProductoProveedor } from "./types"
import { formatearNumeroOC } from "./types"

// ─── 1. Crear Proveedor ───────────────────────────────────────────────────────

export async function crearProveedor(
  input: ProveedorInput
): Promise<ActionResponse<IProveedor>> {
  try {
    const auth = await tienePermisoModuloProveedores("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validado = proveedorSchema.parse(input)

    const nuevo = await prisma.proveedor.create({
      data: {
        nombre: validado.nombre,
        contacto: validado.contacto,
        telefono: validado.telefono,
        email: validado.email,
        direccion: validado.direccion,
        notas: validado.notas,
        activo: validado.activo,
      },
    })

    revalidatePath("/proveedores")
    revalidatePath("/stock")

    return {
      success: true,
      data: {
        id: nuevo.id,
        nombre: nuevo.nombre,
        contacto: nuevo.contacto,
        telefono: nuevo.telefono,
        email: nuevo.email,
        direccion: nuevo.direccion,
        notas: nuevo.notas,
        activo: nuevo.activo,
        creadoEn: nuevo.creadoEn.toISOString(),
        actualizadoEn: nuevo.actualizadoEn.toISOString(),
      },
    }
  } catch (error: any) {
    console.error("Error al crear proveedor:", error)
    return {
      success: false,
      error: error.message || "Error al crear el proveedor.",
    }
  }
}

// ─── 2. Actualizar Proveedor ──────────────────────────────────────────────────

export async function actualizarProveedor(
  id: string,
  input: Partial<ProveedorInput>
): Promise<ActionResponse<IProveedor>> {
  try {
    const auth = await tienePermisoModuloProveedores("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const proveedorActual = await prisma.proveedor.findUnique({
      where: { id },
    })

    if (!proveedorActual) {
      return { success: false, error: "El proveedor especificado no existe." }
    }

    const dataActualizar: any = {}
    if (input.nombre !== undefined) dataActualizar.nombre = input.nombre.trim()
    if (input.contacto !== undefined) dataActualizar.contacto = input.contacto
    if (input.telefono !== undefined) dataActualizar.telefono = input.telefono
    if (input.email !== undefined) dataActualizar.email = input.email
    if (input.direccion !== undefined) dataActualizar.direccion = input.direccion
    if (input.notas !== undefined) dataActualizar.notas = input.notas
    if (input.activo !== undefined) dataActualizar.activo = input.activo

    const actualizado = await prisma.proveedor.update({
      where: { id },
      data: dataActualizar,
    })

    revalidatePath("/proveedores")
    revalidatePath(`/proveedores/${id}`)

    return {
      success: true,
      data: {
        id: actualizado.id,
        nombre: actualizado.nombre,
        contacto: actualizado.contacto,
        telefono: actualizado.telefono,
        email: actualizado.email,
        direccion: actualizado.direccion,
        notas: actualizado.notas,
        activo: actualizado.activo,
        creadoEn: actualizado.creadoEn.toISOString(),
        actualizadoEn: actualizado.actualizadoEn.toISOString(),
      },
    }
  } catch (error: any) {
    console.error(`Error al actualizar proveedor ${id}:`, error)
    return {
      success: false,
      error: error.message || "Error al actualizar los datos del proveedor.",
    }
  }
}

// ─── 3. Eliminar Proveedor ────────────────────────────────────────────────────

export async function eliminarProveedor(
  id: string
): Promise<ActionResponse<{ borradoFisico: boolean }>> {
  try {
    const auth = await tienePermisoModuloProveedores("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const ordenesCount = await prisma.ordenCompra.count({
      where: { proveedorId: id },
    })

    const productosCount = await prisma.productoProveedor.count({
      where: { proveedorId: id },
    })

    // Si tiene historial de compras o insumos provistos vinculados, borrado lógico
    if (ordenesCount > 0 || productosCount > 0) {
      await prisma.proveedor.update({
        where: { id },
        data: { activo: false },
      })
      revalidatePath("/proveedores")
      return { success: true, data: { borradoFisico: false } }
    }

    // Si no tiene relaciones, borrado físico
    await prisma.proveedor.delete({
      where: { id },
    })

    revalidatePath("/proveedores")
    return { success: true, data: { borradoFisico: true } }
  } catch (error: any) {
    console.error(`Error al eliminar proveedor ${id}:`, error)
    return {
      success: false,
      error: error.message || "No se pudo eliminar el proveedor.",
    }
  }
}

// ─── 4. Vincular Insumo a Catálogo de Proveedor ────────────────────────────────

export async function vincularProductoProveedor(
  input: ProductoProveedorInput
): Promise<ActionResponse<IProductoProveedor>> {
  try {
    const auth = await tienePermisoModuloProveedores("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validado = productoProveedorSchema.parse(input)

    const resultado = await prisma.$transaction(async (tx) => {
      // Si se marca como principal, desmarcar otros proveedores de este producto
      if (validado.esPrincipal) {
        await tx.productoProveedor.updateMany({
          where: {
            productoId: validado.productoId,
            NOT: { proveedorId: validado.proveedorId },
          },
          data: { esPrincipal: false },
        })
      }

      // Upsert en la tabla relacional
      const vinculo = await tx.productoProveedor.upsert({
        where: {
          productoId_proveedorId: {
            productoId: validado.productoId,
            proveedorId: validado.proveedorId,
          },
        },
        create: {
          productoId: validado.productoId,
          proveedorId: validado.proveedorId,
          codigoProveedor: validado.codigoProveedor,
          precioUltimo: validado.precioUltimo,
          esPrincipal: validado.esPrincipal,
        },
        update: {
          codigoProveedor: validado.codigoProveedor,
          precioUltimo: validado.precioUltimo,
          esPrincipal: validado.esPrincipal,
        },
        include: {
          producto: true,
          proveedor: true,
        },
      })

      // Si se pactó un precio y el producto no tenía precio de costo, actualizarlo
      if (validado.precioUltimo && validado.precioUltimo > 0) {
        await tx.producto.update({
          where: { id: validado.productoId },
          data: { precio: validado.precioUltimo },
        })
      }

      return vinculo
    })

    revalidatePath(`/proveedores/${validado.proveedorId}`)
    revalidatePath("/proveedores")
    revalidatePath("/stock")

    return {
      success: true,
      data: {
        id: resultado.id,
        productoId: resultado.productoId,
        proveedorId: resultado.proveedorId,
        codigoProveedor: resultado.codigoProveedor,
        precioUltimo: resultado.precioUltimo
          ? Number(resultado.precioUltimo)
          : null,
        esPrincipal: resultado.esPrincipal,
        producto: {
          id: resultado.producto.id,
          codigo: resultado.producto.codigo,
          nombre: resultado.producto.nombre,
          unidadMedida: resultado.producto.unidadMedida,
          stockActual: Number(resultado.producto.stockActual),
          stockMinimo: Number(resultado.producto.stockMinimo),
          precio: resultado.producto.precio
            ? Number(resultado.producto.precio)
            : null,
          imagen: resultado.producto.imagen,
          activo: resultado.producto.activo,
        },
      },
    }
  } catch (error: any) {
    console.error("Error al vincular producto con proveedor:", error)
    return {
      success: false,
      error: error.message || "Error al vincular el producto al proveedor.",
    }
  }
}

// ─── 5. Desvincular Insumo de Catálogo de Proveedor ────────────────────────────

export async function desvincularProductoProveedor(
  id: string
): Promise<ActionResponse<{ borrado: boolean }>> {
  try {
    const auth = await tienePermisoModuloProveedores("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const vinculo = await prisma.productoProveedor.findUnique({
      where: { id },
    })

    if (!vinculo) {
      return { success: false, error: "Vínculo no encontrado." }
    }

    await prisma.productoProveedor.delete({
      where: { id },
    })

    revalidatePath(`/proveedores/${vinculo.proveedorId}`)
    revalidatePath("/proveedores")

    return { success: true, data: { borrado: true } }
  } catch (error: any) {
    console.error(`Error al desvincular producto proveedor ${id}:`, error)
    return {
      success: false,
      error: error.message || "Error al desvincular el producto del proveedor.",
    }
  }
}

// ─── 6. Crear Orden de Compra (Manual o Sugerida) ─────────────────────────────

export async function crearOrdenCompra(
  input: OrdenCompraInput
): Promise<ActionResponse<{ id: string; numero: number; numeroFormateado: string }>> {
  try {
    const auth = await tienePermisoModuloProveedores("emision_orden")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validado = ordenCompraSchema.parse(input)

    // Validar existencia del proveedor
    const prov = await prisma.proveedor.findUnique({
      where: { id: validado.proveedorId },
    })

    if (!prov) {
      return { success: false, error: "El proveedor seleccionado no existe." }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // Calcular monto total sumando subtotales
      let totalOrden = 0

      for (const it of validado.items) {
        if (it.precioUnitario && it.precioUnitario > 0) {
          totalOrden += it.cantidadPedida * it.precioUnitario
        }
      }

      // Crear orden de compra
      const nuevaOC = await tx.ordenCompra.create({
        data: {
          proveedorId: validado.proveedorId,
          estado: "PENDIENTE",
          notas: validado.notas,
          total: totalOrden > 0 ? totalOrden : null,
          items: {
            create: validado.items.map((it) => ({
              productoId: it.productoId,
              cantidadPedida: it.cantidadPedida,
              cantidadRecibida: 0,
              precioUnitario: it.precioUnitario || null,
            })),
          },
        },
      })

      return nuevaOC
    })

    revalidatePath("/proveedores")
    revalidatePath("/proveedores/ordenes")
    revalidatePath(`/proveedores/${validado.proveedorId}`)

    return {
      success: true,
      data: {
        id: resultado.id,
        numero: resultado.numero,
        numeroFormateado: formatearNumeroOC(resultado.numero),
      },
    }
  } catch (error: any) {
    console.error("Error al crear orden de compra:", error)
    return {
      success: false,
      error: error.message || "Error al emitir la orden de compra.",
    }
  }
}

// ─── 7. Cambiar Estado de Orden de Compra ─────────────────────────────────────

export async function cambiarEstadoOrdenCompra(
  input: CambioEstadoOrdenInput
): Promise<ActionResponse<{ id: string; nuevoEstado: string }>> {
  try {
    const auth = await tienePermisoModuloProveedores("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validado = cambioEstadoOrdenSchema.parse(input)

    const oc = await prisma.ordenCompra.findUnique({
      where: { id: validado.ordenCompraId },
    })

    if (!oc) {
      return { success: false, error: "Orden de compra no encontrada." }
    }

    const actualizado = await prisma.ordenCompra.update({
      where: { id: validado.ordenCompraId },
      data: { estado: validado.nuevoEstado },
    })

    revalidatePath("/proveedores/ordenes")
    revalidatePath(`/proveedores/ordenes/${validado.ordenCompraId}`)
    revalidatePath(`/proveedores/${oc.proveedorId}`)

    return {
      success: true,
      data: { id: actualizado.id, nuevoEstado: actualizado.estado },
    }
  } catch (error: any) {
    console.error("Error al cambiar estado de orden de compra:", error)
    return {
      success: false,
      error: error.message || "Error al actualizar el estado de la orden.",
    }
  }
}

// ─── 8. Registrar Recepción de Mercadería (Conexión Automática con Stock) ──────

export async function registrarRecepcionMercaderia(
  input: RecepcionOrdenCompraInput
): Promise<
  ActionResponse<{
    ordenCompraId: string
    nuevoEstado: string
    movimientosGenerados: number
  }>
> {
  try {
    const auth = await tienePermisoModuloProveedores("recepcion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validado = recepcionOrdenCompraSchema.parse(input)

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener la orden de compra con sus ítems y datos del proveedor
      const oc = await tx.ordenCompra.findUnique({
        where: { id: validado.ordenCompraId },
        include: {
          proveedor: true,
          items: true,
        },
      })

      if (!oc) {
        throw new Error("La orden de compra no existe.")
      }

      if (oc.estado === "CANCELADA") {
        throw new Error("No se puede recibir mercadería de una orden cancelada.")
      }

      let movimientosGenerados = 0
      const itemsMap = new Map(oc.items.map((i) => [i.id, i]))

      // 2. Procesar ítems recibidos
      for (const recepcionItem of validado.items) {
        const itemActual = itemsMap.get(recepcionItem.itemId)
        if (!itemActual) continue

        const cantNueva = Number(recepcionItem.cantidadRecibidaAhora)
        if (cantNueva <= 0) continue

        const anteriorRecibido = Number(itemActual.cantidadRecibida)
        const acumuladoRecibido = anteriorRecibido + cantNueva

        // A) Actualizar ItemOrdenCompra
        await tx.itemOrdenCompra.update({
          where: { id: itemActual.id },
          data: {
            cantidadRecibida: acumuladoRecibido,
            ...(recepcionItem.costoUnitarioActualizado !== undefined &&
              recepcionItem.costoUnitarioActualizado !== null && {
                precioUnitario: recepcionItem.costoUnitarioActualizado,
              }),
          },
        })

        // B) Obtener producto actual para actualizar stock
        const prod = await tx.producto.findUnique({
          where: { id: itemActual.productoId },
        })

        if (!prod) {
          throw new Error(`Insumo no encontrado (ID: ${itemActual.productoId})`)
        }

        const stockAnterior = Number(prod.stockActual)
        const stockNuevo = stockAnterior + cantNueva

        // Actualizar stock del producto (y opcionalmente costo)
        await tx.producto.update({
          where: { id: prod.id },
          data: {
            stockActual: stockNuevo,
            ...(recepcionItem.costoUnitarioActualizado !== undefined &&
              recepcionItem.costoUnitarioActualizado !== null &&
              recepcionItem.costoUnitarioActualizado > 0 && {
                precio: recepcionItem.costoUnitarioActualizado,
              }),
          },
        })

        // C) Actualizar precio pactado en ProductoProveedor si aplica
        if (
          recepcionItem.costoUnitarioActualizado !== undefined &&
          recepcionItem.costoUnitarioActualizado !== null &&
          recepcionItem.costoUnitarioActualizado > 0
        ) {
          await tx.productoProveedor.updateMany({
            where: {
              productoId: prod.id,
              proveedorId: oc.proveedorId,
            },
            data: {
              precioUltimo: recepcionItem.costoUnitarioActualizado,
            },
          })
        }

        // D) Crear Movimiento de Stock tipo INGRESO
        const nroOcTxt = formatearNumeroOC(oc.numero)
        const remitoTxt = validado.numeroRemito
          ? ` (Remito: ${validado.numeroRemito})`
          : ""

        await tx.movimientoStock.create({
          data: {
            productoId: prod.id,
            tipo: "INGRESO",
            cantidad: cantNueva,
            stockAnterior,
            stockNuevo,
            motivo: `Recepción ${nroOcTxt} - ${oc.proveedor.nombre}${remitoTxt}`,
            referenciaTipo: "ORDEN_COMPRA",
            referenciaId: oc.id,
          },
        })

        movimientosGenerados++
      }

      // 3. Determinar nuevo estado de la orden de compra
      // Traemos todos los ítems actualizados
      const itemsActualizados = await tx.itemOrdenCompra.findMany({
        where: { ordenCompraId: oc.id },
      })

      let todosRecibidosAlCien = true
      let algunoRecibido = false

      for (const it of itemsActualizados) {
        const pedida = Number(it.cantidadPedida)
        const recibida = Number(it.cantidadRecibida)

        if (recibida > 0) algunoRecibido = true
        if (recibida < pedida) todosRecibidosAlCien = false
      }

      let nuevoEstado: "RECIBIDA_PARCIAL" | "RECIBIDA_TOTAL" = "RECIBIDA_PARCIAL"
      if (todosRecibidosAlCien && itemsActualizados.length > 0) {
        nuevoEstado = "RECIBIDA_TOTAL"
      } else if (!algunoRecibido) {
        nuevoEstado = oc.estado as any
      }

      // 4. Actualizar orden de compra
      await tx.ordenCompra.update({
        where: { id: oc.id },
        data: {
          estado: nuevoEstado,
          ...(validado.fotoRemito && { fotoRemito: validado.fotoRemito }),
          ...(validado.observaciones && {
            notas: oc.notas
              ? `${oc.notas}\n[Recepción]: ${validado.observaciones}`
              : `[Recepción]: ${validado.observaciones}`,
          }),
        },
      })

      return {
        ordenCompraId: oc.id,
        nuevoEstado,
        movimientosGenerados,
      }
    })

    revalidatePath("/proveedores/ordenes")
    revalidatePath(`/proveedores/ordenes/${validado.ordenCompraId}`)
    revalidatePath("/proveedores")
    revalidatePath("/stock")

    return {
      success: true,
      data: resultado,
    }
  } catch (error: any) {
    console.error("Error al registrar recepción de orden de compra:", error)
    return {
      success: false,
      error: error.message || "Error al procesar la recepción de mercadería.",
    }
  }
}
