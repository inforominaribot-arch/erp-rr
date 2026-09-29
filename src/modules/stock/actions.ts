// Módulo: Stock & Inventario
// Server Actions para mutaciones con Prisma ORM

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { ActionResponse } from "@/types"
import { tienePermisoModuloStock } from "./lib/auth"
import {
  productoSchema,
  movimientoManualSchema,
  ingresoRemitoSchema,
  importarFilaCSVStockSchema,
  type ProductoInput,
  type MovimientoManualInput,
  type IngresoRemitoInput,
} from "./schemas"
import { extraerDatosRemitoConIA } from "./lib/gemini-ocr"
import type {
  IProducto,
  IMovimientoStock,
  IResultadoImportacionStock,
  IResultadoEscaneoRemito,
} from "./types"

export async function crearProducto(
  input: ProductoInput
): Promise<ActionResponse<IProducto>> {
  try {
    const auth = await tienePermisoModuloStock("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validado = productoSchema.parse(input)

    // Validar código duplicado si se especificó
    if (validado.codigo) {
      const existeCodigo = await prisma.producto.findUnique({
        where: { codigo: validado.codigo },
      })
      if (existeCodigo) {
        return {
          success: false,
          error: `Ya existe un producto con el código "${validado.codigo}".`,
        }
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoProducto = await tx.producto.create({
        data: {
          codigo: validado.codigo,
          nombre: validado.nombre,
          descripcion: validado.descripcion,
          unidadMedida: validado.unidadMedida,
          stockActual: validado.stockActual,
          stockMinimo: validado.stockMinimo,
          precio: validado.precio,
          imagen: validado.imagen,
          activo: validado.activo,
        },
      })

      // Si se definió un stock inicial mayor a 0, registrar movimiento de ajuste inicial
      if (validado.stockActual > 0) {
        await tx.movimientoStock.create({
          data: {
            productoId: nuevoProducto.id,
            tipo: "AJUSTE",
            cantidad: validado.stockActual,
            stockAnterior: 0,
            stockNuevo: validado.stockActual,
            motivo: "Inventario inicial de alta de producto",
            referenciaTipo: "ALTA_PRODUCTO",
          },
        })
      }

      return nuevoProducto
    })

    revalidatePath("/stock")

    return {
      success: true,
      data: {
        id: resultado.id,
        codigo: resultado.codigo,
        nombre: resultado.nombre,
        descripcion: resultado.descripcion,
        unidadMedida: resultado.unidadMedida,
        stockActual: Number(resultado.stockActual),
        stockMinimo: Number(resultado.stockMinimo),
        precio: resultado.precio ? Number(resultado.precio) : null,
        imagen: resultado.imagen,
        activo: resultado.activo,
        creadoEn: resultado.creadoEn.toISOString(),
        actualizadoEn: resultado.actualizadoEn.toISOString(),
        estadoStock: "NORMAL",
      },
    }
  } catch (error: any) {
    console.error("Error al crear producto:", error)
    return {
      success: false,
      error: error.message || "Error al crear el producto.",
    }
  }
}

export async function actualizarProducto(
  id: string,
  input: Partial<ProductoInput>
): Promise<ActionResponse<IProducto>> {
  try {
    const auth = await tienePermisoModuloStock("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const productoActual = await prisma.producto.findUnique({
      where: { id },
    })

    if (!productoActual) {
      return { success: false, error: "Producto no encontrado." }
    }

    // Si cambió el código, verificar que no esté duplicado
    if (input.codigo && input.codigo !== productoActual.codigo) {
      const existeCodigo = await prisma.producto.findUnique({
        where: { codigo: input.codigo },
      })
      if (existeCodigo && existeCodigo.id !== id) {
        return {
          success: false,
          error: `El código "${input.codigo}" ya pertenece a otro producto.`,
        }
      }
    }

    const dataActualizar: any = {
      ...(input.codigo !== undefined && { codigo: input.codigo }),
      ...(input.nombre !== undefined && { nombre: input.nombre }),
      ...(input.descripcion !== undefined && { descripcion: input.descripcion }),
      ...(input.unidadMedida !== undefined && { unidadMedida: input.unidadMedida }),
      ...(input.stockMinimo !== undefined && { stockMinimo: input.stockMinimo }),
      ...(input.precio !== undefined && { precio: input.precio }),
      ...(input.imagen !== undefined && { imagen: input.imagen }),
      ...(input.activo !== undefined && { activo: input.activo }),
    }

    const resultado = await prisma.producto.update({
      where: { id },
      data: dataActualizar,
    })

    revalidatePath("/stock")

    return {
      success: true,
      data: {
        id: resultado.id,
        codigo: resultado.codigo,
        nombre: resultado.nombre,
        descripcion: resultado.descripcion,
        unidadMedida: resultado.unidadMedida,
        stockActual: Number(resultado.stockActual),
        stockMinimo: Number(resultado.stockMinimo),
        precio: resultado.precio ? Number(resultado.precio) : null,
        imagen: resultado.imagen,
        activo: resultado.activo,
        creadoEn: resultado.creadoEn.toISOString(),
        actualizadoEn: resultado.actualizadoEn.toISOString(),
        estadoStock: "NORMAL",
      },
    }
  } catch (error: any) {
    console.error(`Error al actualizar producto ${id}:`, error)
    return {
      success: false,
      error: error.message || "Error al actualizar el producto.",
    }
  }
}

export async function eliminarProducto(id: string): Promise<ActionResponse<{ borradoFisico: boolean }>> {
  try {
    const auth = await tienePermisoModuloStock("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const movimientosCount = await prisma.movimientoStock.count({
      where: { productoId: id },
    })

    const itemsComandaCount = await prisma.itemComanda.count({
      where: { productoId: id },
    })

    // Si tiene movimientos o comandas vinculadas, hacemos borrado lógico
    if (movimientosCount > 0 || itemsComandaCount > 0) {
      await prisma.producto.update({
        where: { id },
        data: { activo: false },
      })
      revalidatePath("/stock")
      return { success: true, data: { borradoFisico: false } }
    }

    // Si no tiene historial, borrado físico seguro
    await prisma.producto.delete({
      where: { id },
    })

    revalidatePath("/stock")
    return { success: true, data: { borradoFisico: true } }
  } catch (error: any) {
    console.error(`Error al eliminar producto ${id}:`, error)
    return {
      success: false,
      error: error.message || "No se pudo eliminar el producto.",
    }
  }
}

export async function registrarIngresoRemito(
  input: IngresoRemitoInput
): Promise<ActionResponse<{ movimientosCreados: number }>> {
  try {
    const auth = await tienePermisoModuloStock("ingreso_remito")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validado = ingresoRemitoSchema.parse(input)

    const resultado = await prisma.$transaction(async (tx) => {
      let count = 0

      for (const item of validado.items) {
        const prod = await tx.producto.findUnique({
          where: { id: item.productoId },
        })

        if (!prod) {
          throw new Error(`Insumo no encontrado (ID: ${item.productoId})`)
        }

        const stockAnterior = Number(prod.stockActual)
        const cantidad = Number(item.cantidad)
        const stockNuevo = stockAnterior + cantidad

        const updateData: any = {
          stockActual: stockNuevo,
        }

        // Si la administración ingresa o modifica el costo y tiene permiso de ver/editar costos
        if (
          auth.puedeVerCostos &&
          item.costoUnitario !== undefined &&
          item.costoUnitario !== null &&
          item.costoUnitario > 0
        ) {
          updateData.precio = item.costoUnitario
        }

        await tx.producto.update({
          where: { id: prod.id },
          data: updateData,
        })

        const obsTexto = validado.observaciones
          ? ` | Obs: ${validado.observaciones}`
          : ""

        await tx.movimientoStock.create({
          data: {
            productoId: prod.id,
            tipo: "INGRESO",
            cantidad,
            stockAnterior,
            stockNuevo,
            motivo: `Remito Nº ${validado.numeroRemito} - ${validado.proveedorNombre}${obsTexto}`,
            referenciaTipo: "REMITO",
            referenciaId: validado.numeroRemito,
          },
        })

        count++
      }

      return count
    })

    revalidatePath("/stock")

    return {
      success: true,
      data: { movimientosCreados: resultado },
    }
  } catch (error: any) {
    console.error("Error al registrar ingreso de remito:", error)
    return {
      success: false,
      error: error.message || "Error al procesar el ingreso de mercadería.",
    }
  }
}

export async function analizarFotoRemitoIA(
  imagenBase64: string
): Promise<ActionResponse<IResultadoEscaneoRemito>> {
  try {
    const auth = await tienePermisoModuloStock("ingreso_remito")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    // Traer productos activos para permitir matching semántico
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        unidadMedida: true,
      },
      orderBy: { nombre: "asc" },
      take: 200,
    })

    const resultado = await extraerDatosRemitoConIA(imagenBase64, productos)

    return {
      success: true,
      data: resultado,
    }
  } catch (error: any) {
    console.error("Error al analizar remito con IA:", error)
    return {
      success: false,
      error:
        error.message ||
        "No se pudo extraer información del remito automáticamente. Podés cargarlo de forma manual.",
    }
  }
}

export async function registrarMovimientoManual(
  input: MovimientoManualInput
): Promise<ActionResponse<IMovimientoStock>> {
  try {
    const auth = await tienePermisoModuloStock("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validado = movimientoManualSchema.parse(input)

    const resultado = await prisma.$transaction(async (tx) => {
      const prod = await tx.producto.findUnique({
        where: { id: validado.productoId },
      })

      if (!prod) {
        throw new Error("El producto seleccionado no existe.")
      }

      const stockAnterior = Number(prod.stockActual)
      let stockNuevo = 0
      let cantidadMovida = Number(validado.cantidad)

      if (validado.tipo === "INGRESO") {
        stockNuevo = stockAnterior + cantidadMovida
      } else if (validado.tipo === "EGRESO") {
        if (stockAnterior < cantidadMovida) {
          throw new Error(
            `Stock insuficiente: el stock actual es de ${stockAnterior} ${prod.unidadMedida} y se intentó descontar ${cantidadMovida}.`
          )
        }
        stockNuevo = stockAnterior - cantidadMovida
      } else if (validado.tipo === "AJUSTE") {
        // En ajuste, la cantidad representa el nuevo conteo físico de inventario
        stockNuevo = cantidadMovida
        cantidadMovida = Math.abs(stockNuevo - stockAnterior)
      }

      await tx.producto.update({
        where: { id: prod.id },
        data: { stockActual: stockNuevo },
      })

      const mov = await tx.movimientoStock.create({
        data: {
          productoId: prod.id,
          tipo: validado.tipo,
          cantidad: cantidadMovida,
          stockAnterior,
          stockNuevo,
          motivo: validado.motivo,
          referenciaTipo: "AJUSTE_MANUAL",
        },
      })

      return {
        id: mov.id,
        productoId: mov.productoId,
        productoNombre: prod.nombre,
        productoCodigo: prod.codigo,
        unidadMedida: prod.unidadMedida,
        tipo: mov.tipo,
        cantidad: Number(mov.cantidad),
        stockAnterior: Number(mov.stockAnterior),
        stockNuevo: Number(mov.stockNuevo),
        motivo: mov.motivo,
        referenciaId: mov.referenciaId,
        referenciaTipo: mov.referenciaTipo,
        creadoEn: mov.creadoEn.toISOString(),
      }
    })

    revalidatePath("/stock")

    return {
      success: true,
      data: resultado,
    }
  } catch (error: any) {
    console.error("Error al registrar movimiento manual:", error)
    return {
      success: false,
      error: error.message || "Error al procesar el ajuste de inventario.",
    }
  }
}

export async function importarProductosCSV(
  filas: Array<Record<string, string>>
): Promise<ActionResponse<IResultadoImportacionStock>> {
  try {
    const auth = await tienePermisoModuloStock("administracion")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    if (!filas || filas.length === 0) {
      return { success: false, error: "El archivo no contiene registros válidos." }
    }

    let importados = 0
    let actualizados = 0
    const errores: Array<{ fila: number; identificador: string; error: string }> = []

    for (let i = 0; i < filas.length; i++) {
      const filaCruda = filas[i]
      const nroFila = i + 2 // Considerando fila 1 encabezados

      try {
        const parseado = importarFilaCSVStockSchema.safeParse(filaCruda)
        if (!parseado.success) {
          const mensaje = parseado.error.issues.map((e: any) => e.message).join(", ")
          errores.push({
            fila: nroFila,
            identificador: filaCruda.nombre || filaCruda.codigo || "Desconocido",
            error: mensaje,
          })
          continue
        }

        const data = parseado.data

        // Si viene con código, buscar si ya existe para actualizar
        if (data.codigo) {
          const existente = await prisma.producto.findUnique({
            where: { codigo: data.codigo },
          })

          if (existente) {
            await prisma.producto.update({
              where: { id: existente.id },
              data: {
                nombre: data.nombre,
                descripcion: data.descripcion || existente.descripcion,
                unidadMedida: data.unidad_medida || existente.unidadMedida,
                stockMinimo: data.stock_minimo,
                ...(data.precio_costo !== undefined &&
                  data.precio_costo !== null && { precio: data.precio_costo }),
                ...(data.imagen && { imagen: data.imagen }),
              },
            })
            actualizados++
            continue
          }
        }

        // Crear nuevo
        const nuevo = await prisma.producto.create({
          data: {
            codigo: data.codigo,
            nombre: data.nombre,
            descripcion: data.descripcion,
            unidadMedida: data.unidad_medida,
            stockActual: data.stock_actual,
            stockMinimo: data.stock_minimo,
            precio: data.precio_costo,
            imagen: data.imagen,
            activo: true,
          },
        })

        if (data.stock_actual > 0) {
          await prisma.movimientoStock.create({
            data: {
              productoId: nuevo.id,
              tipo: "AJUSTE",
              cantidad: data.stock_actual,
              stockAnterior: 0,
              stockNuevo: data.stock_actual,
              motivo: "Carga inicial masiva desde CSV",
              referenciaTipo: "IMPORTACION_CSV",
            },
          })
        }

        importados++
      } catch (err: any) {
        errores.push({
          fila: nroFila,
          identificador: filaCruda.nombre || filaCruda.codigo || "Desconocido",
          error: err.message || "Error al procesar fila.",
        })
      }
    }

    revalidatePath("/stock")

    return {
      success: true,
      data: {
        importados,
        actualizados,
        errores,
      },
    }
  } catch (error: any) {
    console.error("Error en importación masiva de productos:", error)
    return {
      success: false,
      error: error.message || "Ocurrió un error inesperado al importar el archivo.",
    }
  }
}
