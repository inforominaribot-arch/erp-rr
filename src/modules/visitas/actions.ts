"use server"

// Módulo: Agendar Visitas
// Server Actions para mutaciones transaccionales en la Base de Datos

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { ActionResponse } from "@/types"
import { tienePermisoModuloVisitas } from "./lib/auth"
import {
  visitaSchema,
  actualizarVisitaSchema,
  cambiarEstadoVisitaSchema,
  reprogramarVisitaSchema,
  clienteRapidoVisitaSchema,
  type VisitaInput,
  type ActualizarVisitaInput,
  type CambiarEstadoVisitaInput,
  type ReprogramarVisitaInput,
  type ClienteRapidoVisitaInput,
} from "./schemas"

/**
 * Agendar una nueva visita técnica o comercial
 */
export async function agendarVisitaAction(
  input: VisitaInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloVisitas()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = visitaSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((i) => i.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const data = validacion.data

    // Verificar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: data.clienteId },
    })

    if (!cliente) {
      return { success: false, error: "El cliente seleccionado no existe" }
    }

    // Usuario asignado: usuario actual o dueño del sistema
    const usuarioId = auth.usuarioId!

    const nuevaVisita = await prisma.$transaction(async (tx) => {
      // 1. Crear visita
      const v = await tx.visita.create({
        data: {
          clienteId: data.clienteId,
          usuarioId,
          fecha: new Date(data.fecha),
          horaInicio: data.horaInicio,
          horaFin: data.horaFin,
          tipoVisita: data.tipoVisita,
          estado: "PROGRAMADA",
          direccion: data.direccion.trim(),
          localidad: data.localidad?.trim() || null,
          notas: data.notas?.trim() || null,
        },
      })

      // 2. Si el cliente no tenía dirección o localidad, actualizarla
      const actualizacionCliente: any = {}
      if (!cliente.direccion && data.direccion) {
        actualizacionCliente.direccion = data.direccion.trim()
      }
      if (!cliente.localidad && data.localidad) {
        actualizacionCliente.localidad = data.localidad.trim()
      }

      // Si el cliente está en estado inicial, asegurar que sea POR_VISITAR
      if (cliente.estado !== "EN_PRODUCCION" && cliente.estado !== "INSTALADO") {
        actualizacionCliente.estado = "POR_VISITAR"
      }

      if (Object.keys(actualizacionCliente).length > 0) {
        await tx.cliente.update({
          where: { id: cliente.id },
          data: actualizacionCliente,
        })
      }

      return v
    })

    revalidatePath("/visitas")
    revalidatePath(`/clientes/${data.clienteId}`)
    revalidatePath("/clientes")
    revalidatePath("/")

    return { success: true, data: { id: nuevaVisita.id } }
  } catch (error) {
    console.error("Error al agendar visita:", error)
    return {
      success: false,
      error: "Ocurrió un error inesperado al agendar la visita.",
    }
  }
}

/**
 * Actualizar datos de una visita existente
 */
export async function actualizarVisitaAction(
  input: ActualizarVisitaInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloVisitas()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = actualizarVisitaSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((i) => i.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { id, ...data } = validacion.data

    const visitaActualizada = await prisma.visita.update({
      where: { id },
      data: {
        clienteId: data.clienteId,
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        tipoVisita: data.tipoVisita,
        direccion: data.direccion.trim(),
        localidad: data.localidad?.trim() || null,
        notas: data.notas?.trim() || null,
        ...(data.estado ? { estado: data.estado } : {}),
      },
    })

    revalidatePath("/visitas")
    revalidatePath(`/clientes/${visitaActualizada.clienteId}`)
    revalidatePath("/")

    return { success: true, data: { id: visitaActualizada.id } }
  } catch (error) {
    console.error("Error al actualizar visita:", error)
    return {
      success: false,
      error: "Ocurrió un error al actualizar los datos de la visita.",
    }
  }
}

/**
 * Cambiar estado de la visita (PROGRAMADA, CONFIRMADA, REALIZADA, REPROGRAMADA, CANCELADA)
 */
export async function cambiarEstadoVisitaAction(
  input: CambiarEstadoVisitaInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloVisitas()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = cambiarEstadoVisitaSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((i) => i.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { id, estado, notasAdicionales } = validacion.data

    const visita = await prisma.visita.findUnique({
      where: { id },
    })

    if (!visita) {
      return { success: false, error: "La visita no existe" }
    }

    let notasFinales = visita.notas || ""
    if (notasAdicionales?.trim()) {
      const timestamp = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
      })
      notasFinales = notasFinales
        ? `${notasFinales}\n[${timestamp} - ${estado}]: ${notasAdicionales.trim()}`
        : `[${timestamp} - ${estado}]: ${notasAdicionales.trim()}`
    }

    await prisma.visita.update({
      where: { id },
      data: {
        estado,
        notas: notasFinales || null,
      },
    })

    revalidatePath("/visitas")
    revalidatePath(`/clientes/${visita.clienteId}`)
    revalidatePath("/")

    return { success: true, data: { id } }
  } catch (error) {
    console.error("Error al cambiar estado de visita:", error)
    return {
      success: false,
      error: "Ocurrió un error al cambiar el estado de la visita.",
    }
  }
}

/**
 * Reprogramar visita con nueva fecha y horario
 */
export async function reprogramarVisitaAction(
  input: ReprogramarVisitaInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloVisitas()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = reprogramarVisitaSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((i) => i.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { id, fecha, horaInicio, horaFin, motivo } = validacion.data

    const visita = await prisma.visita.findUnique({
      where: { id },
    })

    if (!visita) {
      return { success: false, error: "La visita no existe" }
    }

    let notasFinales = visita.notas || ""
    if (motivo?.trim()) {
      const timestamp = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
      })
      notasFinales = notasFinales
        ? `${notasFinales}\n[${timestamp} - REPROGRAMADA]: ${motivo.trim()}`
        : `[${timestamp} - REPROGRAMADA]: ${motivo.trim()}`
    }

    await prisma.visita.update({
      where: { id },
      data: {
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
        estado: "REPROGRAMADA",
        notas: notasFinales || null,
      },
    })

    revalidatePath("/visitas")
    revalidatePath(`/clientes/${visita.clienteId}`)
    revalidatePath("/")

    return { success: true, data: { id } }
  } catch (error) {
    console.error("Error al reprogramar visita:", error)
    return {
      success: false,
      error: "Ocurrió un error al reprogramar la visita.",
    }
  }
}

/**
 * Eliminar visita de la base de datos
 */
export async function eliminarVisitaAction(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const auth = await tienePermisoModuloVisitas()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const visita = await prisma.visita.findUnique({
      where: { id },
    })

    if (!visita) {
      return { success: false, error: "La visita no existe" }
    }

    await prisma.visita.delete({
      where: { id },
    })

    revalidatePath("/visitas")
    revalidatePath(`/clientes/${visita.clienteId}`)
    revalidatePath("/")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error al eliminar visita:", error)
    return {
      success: false,
      error: "Ocurrió un error al eliminar la visita.",
    }
  }
}

/**
 * Alta rápida de un cliente nuevo directamente desde el modal de visita
 */
export async function crearClienteRapidoVisitaAction(
  input: ClienteRapidoVisitaInput
): Promise<
  ActionResponse<{
    id: string
    nombre: string
    telefono: string | null
    direccion: string | null
    localidad: string | null
  }>
> {
  try {
    const auth = await tienePermisoModuloVisitas()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = clienteRapidoVisitaSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((i) => i.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const data = validacion.data

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre: data.nombre.trim(),
        telefono: data.telefono.trim(),
        direccion: data.direccion.trim(),
        localidad: data.localidad?.trim() || null,
        email: data.email?.trim() || null,
        notas: data.notas?.trim() || null,
        estado: "POR_VISITAR",
      },
    })

    revalidatePath("/clientes")
    revalidatePath("/visitas")

    return {
      success: true,
      data: {
        id: nuevoCliente.id,
        nombre: nuevoCliente.nombre,
        telefono: nuevoCliente.telefono,
        direccion: nuevoCliente.direccion,
        localidad: nuevoCliente.localidad,
      },
    }
  } catch (error) {
    console.error("Error al crear cliente rápido para visita:", error)
    return {
      success: false,
      error: "Ocurrió un error al guardar el nuevo cliente.",
    }
  }
}
