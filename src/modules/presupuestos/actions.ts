"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { tienePermisoModuloPresupuestos } from "./lib/auth"
import type { ActionResponse, EstadoPresupuesto } from "@/types"
import {
  presupuestoFormSchema,
  cambiarEstadoPresupuestoSchema,
  type PresupuestoFormInput,
  type CambiarEstadoPresupuestoInput,
} from "./schemas"
import type { IPresupuesto, MedicionImportable } from "./types"
import {
  analizarRielesItem,
  type IReporteDisponibilidadStock,
  type INecesidadMaterial,
} from "./lib/explosion-materiales"

// ─── 1. Crear Presupuesto ────────────────────────────────────────────────────

export async function crearPresupuesto(
  input: PresupuestoFormInput
): Promise<ActionResponse<{ id: string; numero: number }>> {
  try {
    const auth = await tienePermisoModuloPresupuestos(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = presupuestoFormSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { clienteId, validezDias, descuento, notas, items } = validacion.data

    // Verificar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    })

    if (!cliente) {
      return {
        success: false,
        error: "El cliente seleccionado no existe en la base de datos.",
      }
    }

    // Calcular subtotales
    let subtotalGeneral = 0
    const itemsParaGuardar = items.map((it) => {
      const cant = Math.max(1, it.cantidad || 1)
      const pUnit = Math.max(0, it.precioUnitario || 0)
      const itemSubtotal = Math.round(cant * pUnit * 100) / 100
      subtotalGeneral += itemSubtotal

      return {
        itemMedicionId: it.itemMedicionId || null,
        descripcion: it.descripcion.trim(),
        ambiente: it.ambiente?.trim() || "General",
        ancho: it.ancho,
        alto: it.alto,
        cantidad: cant,
        precioUnitario: pUnit,
        subtotal: itemSubtotal,
        aceptado: false,
      }
    })

    subtotalGeneral = Math.round(subtotalGeneral * 100) / 100
    const descPorc = Math.min(100, Math.max(0, descuento || 0))
    const montoDescuento =
      Math.round(subtotalGeneral * (descPorc / 100) * 100) / 100
    const totalFinal = Math.max(0, subtotalGeneral - montoDescuento)

    // Transacción Prisma
    const nuevoPresupuesto = await prisma.$transaction(async (tx) => {
      const creado = await tx.presupuesto.create({
        data: {
          clienteId,
          validezDias,
          descuento: descPorc,
          subtotal: subtotalGeneral,
          total: totalFinal,
          notas: notas?.trim() || null,
          estado: "BORRADOR",
          items: {
            create: itemsParaGuardar,
          },
        },
        select: {
          id: true,
          numero: true,
        },
      })

      return creado
    })

    revalidatePath("/presupuestos")
    revalidatePath(`/clientes/${clienteId}`)
    revalidatePath("/clientes/pipeline")

    return {
      success: true,
      data: nuevoPresupuesto,
    }
  } catch (error) {
    console.error("Error al crear presupuesto:", error)
    return {
      success: false,
      error: "Ocurrió un error inesperado al intentar crear el presupuesto.",
    }
  }
}

// ─── 2. Actualizar Presupuesto ───────────────────────────────────────────────

export async function actualizarPresupuesto(
  id: string,
  input: PresupuestoFormInput
): Promise<ActionResponse<{ id: string; numero: number }>> {
  try {
    const auth = await tienePermisoModuloPresupuestos(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    if (!id) {
      return { success: false, error: "Identificador de presupuesto inválido" }
    }

    const validacion = presupuestoFormSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { clienteId, validezDias, descuento, notas, items } = validacion.data

    const existente = await prisma.presupuesto.findUnique({
      where: { id },
      include: {
        comanda: true,
      },
    })

    if (!existente) {
      return { success: false, error: "El presupuesto no fue encontrado." }
    }

    // Calcular subtotales
    let subtotalGeneral = 0
    const itemsParaGuardar = items.map((it) => {
      const cant = Math.max(1, it.cantidad || 1)
      const pUnit = Math.max(0, it.precioUnitario || 0)
      const itemSubtotal = Math.round(cant * pUnit * 100) / 100
      subtotalGeneral += itemSubtotal

      return {
        presupuestoId: id,
        itemMedicionId: it.itemMedicionId || null,
        descripcion: it.descripcion.trim(),
        ambiente: it.ambiente?.trim() || "General",
        ancho: it.ancho,
        alto: it.alto,
        cantidad: cant,
        precioUnitario: pUnit,
        subtotal: itemSubtotal,
        aceptado: it.aceptado ?? false,
      }
    })

    subtotalGeneral = Math.round(subtotalGeneral * 100) / 100
    const descPorc = Math.min(100, Math.max(0, descuento || 0))
    const montoDescuento =
      Math.round(subtotalGeneral * (descPorc / 100) * 100) / 100
    const totalFinal = Math.max(0, subtotalGeneral - montoDescuento)

    await prisma.$transaction(async (tx) => {
      // Reemplazar items
      await tx.itemPresupuesto.deleteMany({
        where: { presupuestoId: id },
      })

      await tx.itemPresupuesto.createMany({
        data: itemsParaGuardar,
      })

      // Actualizar cabecera
      await tx.presupuesto.update({
        where: { id },
        data: {
          clienteId,
          validezDias,
          descuento: descPorc,
          subtotal: subtotalGeneral,
          total: totalFinal,
          notas: notas?.trim() || null,
        },
      })
    })

    revalidatePath("/presupuestos")
    revalidatePath(`/presupuestos/${id}`)
    revalidatePath(`/clientes/${clienteId}`)

    return {
      success: true,
      data: { id, numero: existente.numero },
    }
  } catch (error) {
    console.error("Error al actualizar presupuesto:", error)
    return {
      success: false,
      error: "No se pudo actualizar el presupuesto.",
    }
  }
}

// ─── 3. Cambiar Estado y Aprobación Parcial ───────────────────────────────────

export async function cambiarEstadoPresupuesto(
  input: CambiarEstadoPresupuestoInput
): Promise<ActionResponse<{ id: string; estado: EstadoPresupuesto }>> {
  try {
    const auth = await tienePermisoModuloPresupuestos(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = cambiarEstadoPresupuestoSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { id, estado, itemsAceptadosIds } = validacion.data

    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id },
      include: {
        cliente: true,
        items: true,
      },
    })

    if (!presupuesto) {
      return { success: false, error: "El presupuesto no existe." }
    }

    await prisma.$transaction(async (tx) => {
      // Actualizar estado del presupuesto
      await tx.presupuesto.update({
        where: { id },
        data: { estado },
      })

      // Actualizar aceptación de ítems individuales
      if (estado === "ACEPTADO_TOTAL") {
        await tx.itemPresupuesto.updateMany({
          where: { presupuestoId: id },
          data: { aceptado: true },
        })
      } else if (estado === "ACEPTADO_PARCIAL") {
        const idsAceptados = itemsAceptadosIds || []
        // Marcar los aceptados en true
        await tx.itemPresupuesto.updateMany({
          where: {
            presupuestoId: id,
            id: { in: idsAceptados },
          },
          data: { aceptado: true },
        })
        // Marcar el resto en false
        await tx.itemPresupuesto.updateMany({
          where: {
            presupuestoId: id,
            id: { notIn: idsAceptados },
          },
          data: { aceptado: false },
        })
      } else if (estado === "RECHAZADO" || estado === "BORRADOR") {
        await tx.itemPresupuesto.updateMany({
          where: { presupuestoId: id },
          data: { aceptado: false },
        })
      }

      // Impacto en el Estado del Cliente en el Pipeline / CRM
      if (estado === "ENVIADO") {
        if (presupuesto.cliente.estado === "MEDICION_TOMADA") {
          await tx.cliente.update({
            where: { id: presupuesto.clienteId },
            data: { estado: "PRESUPUESTO_ENVIADO" },
          })
        }
      } else if (
        estado === "ACEPTADO_TOTAL" ||
        estado === "ACEPTADO_PARCIAL"
      ) {
        if (
          presupuesto.cliente.estado === "MEDICION_TOMADA" ||
          presupuesto.cliente.estado === "PRESUPUESTO_ENVIADO"
        ) {
          await tx.cliente.update({
            where: { id: presupuesto.clienteId },
            data: { estado: "PRESUPUESTO_ACEPTADO" },
          })
        }
      }
    })

    revalidatePath("/presupuestos")
    revalidatePath(`/presupuestos/${id}`)
    revalidatePath(`/clientes/${presupuesto.clienteId}`)
    revalidatePath("/clientes/pipeline")

    return {
      success: true,
      data: { id, estado },
    }
  } catch (error) {
    console.error("Error al cambiar estado del presupuesto:", error)
    return {
      success: false,
      error: "Ocurrió un error al cambiar el estado del presupuesto.",
    }
  }
}

// ─── 4. Eliminar Presupuesto ─────────────────────────────────────────────────

export async function eliminarPresupuesto(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const auth = await tienePermisoModuloPresupuestos(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    if (!id) {
      return { success: false, error: "Identificador inválido." }
    }

    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id },
      include: {
        comanda: true,
      },
    })

    if (!presupuesto) {
      return { success: false, error: "El presupuesto no existe." }
    }

    if (presupuesto.comanda) {
      return {
        success: false,
        error: `No es posible eliminar el presupuesto porque ya tiene generada la Comanda de Producción #${presupuesto.comanda.numero}.`,
      }
    }

    await prisma.presupuesto.delete({
      where: { id },
    })

    revalidatePath("/presupuestos")
    revalidatePath(`/clientes/${presupuesto.clienteId}`)
    revalidatePath("/clientes/pipeline")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error al eliminar presupuesto:", error)
    return {
      success: false,
      error: "No se pudo eliminar el presupuesto.",
    }
  }
}

// ─── 5. Obtener Mediciones de un Cliente (Server Action para el Form) ─────────

export async function obtenerMedicionesClienteAction(
  clienteId: string
): Promise<MedicionImportable[]> {
  try {
    if (!clienteId) return []

    const mediciones = await prisma.medicion.findMany({
      where: { clienteId },
      orderBy: { creadoEn: "desc" },
      include: {
        ambientes: {
          orderBy: { orden: "asc" },
          include: {
            items: true,
          },
        },
      },
    })

    return mediciones.map((m) => ({
      id: m.id,
      creadoEn: m.creadoEn.toISOString(),
      observaciones: m.observaciones,
      ambientes: m.ambientes.map((amb) => ({
        id: amb.id,
        nombre: amb.nombre,
        items: amb.items.map((it) => ({
          id: it.id,
          descripcion: it.descripcion,
          ancho: Number(it.ancho),
          alto: Number(it.alto),
          cantidad: it.cantidad,
          caracteristicas: (it.caracteristicas as Record<string, unknown>) || null,
          observaciones: it.observaciones,
        })),
      })),
    }))
  } catch (error) {
    console.error("Error al obtener mediciones para importar:", error)
    return []
  }
}

// ─── 6. Conteo de Mediciones Pendientes de Presupuesto (Para Badges / Sidebar) ──

export async function obtenerConteoPendientesPresupuestoAction(): Promise<number> {
  try {
    const conteo = await prisma.medicion.count({
      where: {
        cliente: {
          estado: "MEDICION_TOMADA",
        },
      },
    })
    return conteo
  } catch (error) {
    console.error("Error al obtener conteo de pendientes:", error)
    return 0
  }
}

// ─── 7. Verificar Disponibilidad de Stock para Presupuesto (Rieles, Telas) ───

export async function verificarStockPresupuestoAction(
  presupuestoId: string,
  itemsIdsAceptados?: string[]
): Promise<ActionResponse<IReporteDisponibilidadStock>> {
  try {
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId },
      include: {
        items: {
          include: {
            itemMedicion: true,
          },
        },
      },
    })

    if (!presupuesto) {
      return { success: false, error: "Presupuesto no encontrado" }
    }

    // Filtrar sólo ítems aprobados si se indicó
    const itemsAEvaluar = itemsIdsAceptados && itemsIdsAceptados.length > 0
      ? presupuesto.items.filter((it) => itemsIdsAceptados.includes(it.id))
      : presupuesto.items

    // Obtener catálogo de productos activos de stock
    const productosStock = await prisma.producto.findMany({
      where: { activo: true },
    })

    const necesidadesMap = new Map<string, INecesidadMaterial>()
    const resumenRieles: string[] = []
    const resumenTelas: string[] = []

    for (const it of itemsAEvaluar) {
      const ancho = Number(it.ancho) || 0
      const alto = Number(it.alto) || 0
      const cantidad = it.cantidad || 1
      const carac = it.itemMedicion?.caracteristicas as any

      // 1. Análisis de Rieles
      const rielesCalculados = analizarRielesItem(it.descripcion, ancho, cantidad, carac)
      if (rielesCalculados) {
        resumenRieles.push(
          `${it.descripcion} (${ancho}m): ${rielesCalculados.descripcionRiel}`
        )

        // Buscar producto de riel en catálogo (ej: "Riel Europeo Blanco", "Riel", etc.)
        const prodRiel =
          productosStock.find(
            (p) =>
              p.nombre.toLowerCase().includes("riel") ||
              (p.descripcion && p.descripcion.toLowerCase().includes("riel"))
          ) || null

        const claveRiel = prodRiel ? prodRiel.id : "RIEL_GENERAL"
        const nombreRiel = prodRiel ? prodRiel.nombre : "Riel Tradicional (Metros lineales)"
        const stockActual = prodRiel ? Number(prodRiel.stockActual) : 0

        const existente = necesidadesMap.get(claveRiel) || {
          tipo: "RIEL",
          nombre: nombreRiel,
          unidadMedida: "metro",
          cantidadRequerida: 0,
          stockActual,
          faltante: 0,
          tieneStockSuficiente: true,
          detalles: "",
          productoId: prodRiel?.id,
        }

        existente.cantidadRequerida += rielesCalculados.totalMetrosLineales
        existente.detalles += `${existente.detalles ? " • " : ""}${rielesCalculados.descripcionRiel}`
        necesidadesMap.set(claveRiel, existente)
      }

      // 2. Análisis de Telas (si la medición tiene tela o la descripción lo indica)
      const nombreTela =
        carac?.gaza?.nombreTela ||
        carac?.bo?.nombreTela ||
        (it.descripcion.toLowerCase().includes("gaza")
          ? "Gasa"
          : it.descripcion.toLowerCase().includes("blackout")
          ? "Black Out"
          : null)

      if (nombreTela) {
        // En cortina tradicional, aprox frunce x 2 + dobladillo
        const metrosAprox = Number(((ancho * 2 + 0.4) * cantidad).toFixed(2))
        resumenTelas.push(`${nombreTela}: ${metrosAprox}m para ${it.descripcion}`)

        const prodTela = productosStock.find((p) =>
          p.nombre.toLowerCase().includes(nombreTela.toLowerCase())
        )

        const claveTela = prodTela ? prodTela.id : `TELA_${nombreTela.toUpperCase()}`
        const nombreProductoTela = prodTela ? prodTela.nombre : `Tela: ${nombreTela}`
        const stockActual = prodTela ? Number(prodTela.stockActual) : 0

        const existenteTela = necesidadesMap.get(claveTela) || {
          tipo: "TELA",
          nombre: nombreProductoTela,
          unidadMedida: "metro",
          cantidadRequerida: 0,
          stockActual,
          faltante: 0,
          tieneStockSuficiente: true,
          detalles: "",
          productoId: prodTela?.id,
        }

        existenteTela.cantidadRequerida = Number(
          (existenteTela.cantidadRequerida + metrosAprox).toFixed(2)
        )
        necesidadesMap.set(claveTela, existenteTela)
      }
    }

    // Calcular faltantes y estado de suficiencia
    let hayFaltantes = false
    let totalFaltantes = 0
    const materiales: INecesidadMaterial[] = []

    necesidadesMap.forEach((mat) => {
      mat.cantidadRequerida = Number(mat.cantidadRequerida.toFixed(2))
      if (mat.stockActual < mat.cantidadRequerida) {
        mat.faltante = Number((mat.cantidadRequerida - mat.stockActual).toFixed(2))
        mat.tieneStockSuficiente = false
        hayFaltantes = true
        totalFaltantes++
      } else {
        mat.faltante = 0
        mat.tieneStockSuficiente = true
      }
      materiales.push(mat)
    })

    return {
      success: true,
      data: {
        materiales,
        hayFaltantes,
        totalFaltantes,
        resumenRieles,
        resumenTelas,
      },
    }
  } catch (error: any) {
    console.error("Error al verificar stock del presupuesto:", error)
    return {
      success: false,
      error: error.message || "Error al verificar stock de materiales.",
    }
  }
}


