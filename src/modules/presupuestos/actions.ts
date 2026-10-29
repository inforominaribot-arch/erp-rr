"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
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
import { agruparCortinas, esPrincipal, subtotalPrincipales } from "./lib/alternativas"
import { unirFilasPorAbertura } from "./lib/filas-por-abertura"
import { recalcularPresupuestosConLista, type ResultadoRecalculo } from "./lib/recalcular-con-lista"

// ─── Helper: normalizar ítems (incluye alternativas) antes de guardar ─────────

function prepararItemsParaGuardar(items: PresupuestoFormInput["items"]) {
  // creadoEn escalonado para conservar el orden de las cortinas y sus opciones
  const base = Date.now()
  return items.map((it, idx) => {
    const cant = Math.max(1, it.cantidad || 1)
    const pUnit = Math.max(0, it.precioUnitario || 0)
    const conGrupo = Boolean(it.grupoAlternativa)
    return {
      itemMedicionId: it.itemMedicionId || null,
      descripcion: it.descripcion.trim(),
      ambiente: it.ambiente?.trim() || "General",
      ancho: it.ancho,
      alto: it.alto,
      cantidad: cant,
      precioUnitario: pUnit,
      subtotal: Math.round(cant * pUnit * 100) / 100,
      aceptado: it.aceptado ?? false,
      caracteristicas: it.caracteristicas
        ? (it.caracteristicas as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      grupoAlternativa: conGrupo ? it.grupoAlternativa! : null,
      nombreOpcion: conGrupo ? it.nombreOpcion?.trim() || null : null,
      esOpcionPrincipal: conGrupo ? it.esOpcionPrincipal !== false : true,
      capa: it.capa ?? null,
      indiceCortina: it.capa ? (it.indiceCortina ?? 0) : null,
      tipoFila: it.tipoFila ?? null,
      calculoPrecio: it.calculoPrecio
        ? (it.calculoPrecio as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      creadoEn: new Date(base + idx),
    }
  })
}

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

    // Calcular subtotales (solo las opciones principales suman al total)
    const itemsParaGuardar = prepararItemsParaGuardar(items).map((it) => ({
      ...it,
      aceptado: false,
    }))
    const subtotalGeneral = subtotalPrincipales(itemsParaGuardar)
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

    // Calcular subtotales (solo las opciones principales suman al total)
    const itemsParaGuardar = prepararItemsParaGuardar(items).map((it) => ({
      ...it,
      presupuestoId: id,
    }))
    const subtotalGeneral = subtotalPrincipales(itemsParaGuardar)
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

    // Se acepta por capa: la opción elegida con todas sus cortinas (como máximo una opción por capa).
    // En la aceptación total, las capas sin opción indicada toman su principal.
    const idsSolicitados = new Set(itemsAceptadosIds || [])
    const cortinas = agruparCortinas(presupuesto.items.map((it) => ({ ...it, subtotal: Number(it.subtotal) })))
    const idsAceptados: string[] = []
    if (estado === "ACEPTADO_TOTAL" || estado === "ACEPTADO_PARCIAL") {
      for (const c of cortinas) {
        const elegidas = c.opciones.filter((o) => o.filas.some((f) => idsSolicitados.has(f.id)))
        if (elegidas.length > 1) {
          return {
            success: false,
            error: `En "${c.principal.descripcion}" se eligió más de una opción. Elegí solo una.`,
          }
        }
        const elegida = elegidas[0] ?? (estado === "ACEPTADO_TOTAL" ? c.principal : null)
        if (elegida) idsAceptados.push(...elegida.filas.map((f) => f.id))
      }
      if (estado === "ACEPTADO_PARCIAL" && idsAceptados.length === 0) {
        return { success: false, error: "Debés aceptar al menos una capa o ítem." }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Actualizar estado del presupuesto
      // Fecha de aceptación: se guarda al aceptar (si ya estaba aceptado se mantiene la primera)
      const aceptado = estado === "ACEPTADO_TOTAL" || estado === "ACEPTADO_PARCIAL"
      const yaAceptado = presupuesto.estado === "ACEPTADO_TOTAL" || presupuesto.estado === "ACEPTADO_PARCIAL"
      await tx.presupuesto.update({
        where: { id },
        data: {
          estado,
          fechaAceptacion: aceptado
            ? yaAceptado && presupuesto.fechaAceptacion
              ? presupuesto.fechaAceptacion
              : new Date()
            : null,
        },
      })

      // Actualizar aceptación de ítems individuales (opción elegida = aceptado)
      if (estado === "ACEPTADO_TOTAL" || estado === "ACEPTADO_PARCIAL") {
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

    // Filtrar sólo ítems aprobados si se indicó; si no, las opciones principales
    const itemsAEvaluar = itemsIdsAceptados && itemsIdsAceptados.length > 0
      ? presupuesto.items.filter((it) => itemsIdsAceptados.includes(it.id))
      : presupuesto.items.filter(esPrincipal)

    // Obtener catálogo de productos activos de stock
    const productosStock = await prisma.producto.findMany({
      where: { activo: true },
    })

    const necesidadesMap = new Map<string, INecesidadMaterial>()
    const resumenRieles: string[] = []
    const resumenTelas: string[] = []

    // Las cortinas de una misma abertura se evalúan juntas (como en la comanda); controles y cargadores no llevan riel ni tela
    const aberturas = unirFilasPorAbertura(
      itemsAEvaluar.filter((it) => it.tipoFila !== "CONTROL" && it.tipoFila !== "CARGADOR")
    )
    for (const ab of aberturas) {
      // El tipo va en la descripción (como al importar antes): el análisis de rieles lo usa para descartar roller, etc.
      const tipo = (ab.caracteristicas as { tipo?: string } | null)?.tipo
      const it = { descripcion: tipo && ab.base.capa ? `${tipo} - ${ab.descripcion}` : ab.descripcion }
      const ancho = ab.ancho
      const alto = ab.alto
      const cantidad = ab.cantidad
      // Especificación de la opción (alternativa) o la de la medición, sin las capas no aceptadas
      const carac = ab.caracteristicas as any

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

// ─── 8. Recalcular presupuestos abiertos con la lista de precios vigente ──────

export async function recalcularPresupuestosConListaAction(): Promise<ActionResponse<ResultadoRecalculo>> {
  try {
    const auth = await tienePermisoModuloPresupuestos(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }
    const resultado = await recalcularPresupuestosConLista()
    revalidatePath("/presupuestos")
    return { success: true, data: resultado }
  } catch (error) {
    console.error("Error al recalcular presupuestos con la lista:", error)
    return { success: false, error: "No se pudieron recalcular los presupuestos." }
  }
}
