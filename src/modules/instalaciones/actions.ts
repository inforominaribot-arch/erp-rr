"use server"

// Módulo: Agenda & Instalación
// Server Actions para mutaciones transaccionales

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { ActionResponse } from "@/types"
import { tienePermisoModuloInstalaciones } from "./lib/auth"
import {
  agendarInstalacionSchema,
  reprogramarInstalacionSchema,
  bloqueoAgendaSchema,
  completarInstalacionSchema,
  cancelarInstalacionSchema,
  toggleMaterialesListosSchema,
  type AgendarInstalacionInput,
  type ReprogramarInstalacionInput,
  type BloqueoAgendaInput,
  type CompletarInstalacionInput,
  type CancelarInstalacionInput,
} from "./schemas"

// Helper para verificar superposición horaria
function haySolapamientoHorario(
  inicioA: string,
  finA: string,
  inicioB: string,
  finB: string
): boolean {
  return inicioA < finB && finA > inicioB
}

// Helper para chequear colisión con bloqueos de agenda
async function verificarColisionConBloqueos(
  fechaDate: Date,
  horaInicio: string | undefined | null,
  horaFin: string | undefined | null,
  instaladorIds: string[]
): Promise<string | null> {
  if (!horaInicio || !horaFin) return null

  const inicioDia = new Date(fechaDate)
  inicioDia.setHours(0, 0, 0, 0)
  const finDia = new Date(fechaDate)
  finDia.setHours(23, 59, 59, 999)

  // Buscar bloqueos en esa fecha para esos instaladores o bloqueos generales
  const bloqueos = await prisma.bloqueoAgenda.findMany({
    where: {
      fecha: {
        gte: inicioDia,
        lte: finDia,
      },
      OR: [
        { usuarioId: { in: instaladorIds } },
        { usuarioId: null },
      ],
    },
    include: {
      usuario: true,
    },
  })

  for (const b of bloqueos) {
    if (haySolapamientoHorario(horaInicio, horaFin, b.horaInicio, b.horaFin)) {
      const afectado = b.usuario ? b.usuario.nombre : "El taller/equipo"
      return `${afectado} tiene un bloqueo de agenda registrado para ese horario: "${b.motivo}" (${b.horaInicio} a ${b.horaFin} hs).`
    }
  }

  return null
}

// 1. Agendar nueva instalación
export async function agendarInstalacion(
  input: AgendarInstalacionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloInstalaciones("agendar")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No tiene permisos para agendar instalaciones." }
    }

    const val = agendarInstalacionSchema.safeParse(input)
    if (!val.success) {
      return { success: false, error: val.error.issues?.[0]?.message || val.error.message || "Datos inválidos" }
    }

    const { comandaId, fecha, horaInicio, horaFin, instaladorIds, notas } = val.data
    const fechaObj = new Date(fecha)

    // Validar conflicto con bloqueos de horario
    const colisionBloqueo = await verificarColisionConBloqueos(
      fechaObj,
      horaInicio,
      horaFin,
      instaladorIds
    )
    if (colisionBloqueo) {
      return { success: false, error: `No es posible agendar: ${colisionBloqueo}` }
    }

    // Verificar si la comanda existe
    const comanda = await prisma.comanda.findUnique({
      where: { id: comandaId },
      include: { instalacion: true },
    })

    if (!comanda) {
      return { success: false, error: "La comanda especificada no existe." }
    }

    if (comanda.instalacion && comanda.instalacion.estado !== "CANCELADA") {
      return {
        success: false,
        error: "Esta comanda ya tiene una instalación programada activa.",
      }
    }

    // Transacción atómica
    const resultado = await prisma.$transaction(async (tx) => {
      // Si ya existía una instalación cancelada previa para esta comanda, la eliminamos para crear la nueva
      if (comanda.instalacion) {
        await tx.instaladorInstalacion.deleteMany({
          where: { instalacionId: comanda.instalacion.id },
        })
        await tx.instalacion.delete({
          where: { id: comanda.instalacion.id },
        })
      }

      // Crear la nueva instalación
      const nuevaInstalacion = await tx.instalacion.create({
        data: {
          comandaId,
          fecha: fechaObj,
          horaInicio: horaInicio || null,
          horaFin: horaFin || null,
          notas: notas || null,
          estado: "PROGRAMADA",
          materialesListos: false,
          instaladores: {
            create: instaladorIds.map((uId) => ({
              usuarioId: uId,
            })),
          },
        },
      })

      return nuevaInstalacion
    })

    revalidatePath("/instalaciones")
    revalidatePath("/instalaciones/taller")
    revalidatePath("/comandas")
    revalidatePath("/clientes")

    return { success: true, data: { id: resultado.id } }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado"
    console.error("Error al agendar instalación:", error)
    return { success: false, error: errorMsg }
  }
}

// 2. Reprogramar instalación existente
export async function reprogramarInstalacion(
  input: ReprogramarInstalacionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloInstalaciones("agendar")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No tiene permisos para reprogramar instalaciones." }
    }

    const val = reprogramarInstalacionSchema.safeParse(input)
    if (!val.success) {
      return { success: false, error: val.error.issues?.[0]?.message || val.error.message || "Datos inválidos" }
    }

    const { id, fecha, horaInicio, horaFin, instaladorIds, notas } = val.data
    const fechaObj = new Date(fecha)

    // Validar conflicto con bloqueos de agenda
    const colisionBloqueo = await verificarColisionConBloqueos(
      fechaObj,
      horaInicio,
      horaFin,
      instaladorIds
    )
    if (colisionBloqueo) {
      return { success: false, error: `No es posible reprogramar: ${colisionBloqueo}` }
    }

    const instalacionActual = await prisma.instalacion.findUnique({
      where: { id },
    })

    if (!instalacionActual) {
      return { success: false, error: "La instalación no existe." }
    }

    await prisma.$transaction(async (tx) => {
      // Reemplazar asignaciones de instaladores
      await tx.instaladorInstalacion.deleteMany({
        where: { instalacionId: id },
      })

      await tx.instaladorInstalacion.createMany({
        data: instaladorIds.map((uId) => ({
          instalacionId: id,
          usuarioId: uId,
        })),
      })

      // Actualizar datos de la instalación
      await tx.instalacion.update({
        where: { id },
        data: {
          fecha: fechaObj,
          horaInicio: horaInicio || null,
          horaFin: horaFin || null,
          notas: notas || null,
          estado: "PROGRAMADA",
        },
      })
    })

    revalidatePath("/instalaciones")
    revalidatePath(`/instalaciones/${id}`)
    revalidatePath("/instalaciones/taller")

    return { success: true, data: { id } }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado"
    console.error("Error al reprogramar instalación:", error)
    return { success: false, error: errorMsg }
  }
}

// 3. Switch de taller: Materiales listos para entrega
export async function toggleMaterialesListos(
  id: string,
  materialesListos: boolean
): Promise<ActionResponse<{ materialesListos: boolean }>> {
  try {
    const auth = await tienePermisoModuloInstalaciones("taller")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No tiene permisos para modificar el estado de materiales." }
    }

    const val = toggleMaterialesListosSchema.safeParse({ id, materialesListos })
    if (!val.success) {
      return { success: false, error: val.error.issues?.[0]?.message || val.error.message || "Datos inválidos" }
    }

    const instalacion = await prisma.instalacion.update({
      where: { id },
      data: { materialesListos },
    })

    revalidatePath("/instalaciones")
    revalidatePath("/instalaciones/taller")
    revalidatePath(`/instalaciones/${id}`)

    return { success: true, data: { materialesListos: instalacion.materialesListos } }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado"
    console.error("Error al cambiar estado de materiales listos:", error)
    return { success: false, error: errorMsg }
  }
}

// 4. Completar instalación (Cierre de circuito: Instalación COMPLETADA + Comanda INSTALADO + Cliente INSTALADO)
export async function completarInstalacion(
  input: CompletarInstalacionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloInstalaciones("completar")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No tiene permisos para completar la instalación." }
    }

    const val = completarInstalacionSchema.safeParse(input)
    if (!val.success) {
      return { success: false, error: val.error.issues?.[0]?.message || val.error.message || "Datos inválidos" }
    }

    const { id, observacionesFinales } = val.data

    const instalacion = await prisma.instalacion.findUnique({
      where: { id },
      include: {
        comanda: {
          include: {
            presupuesto: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    })

    if (!instalacion) {
      return { success: false, error: "La instalación no existe." }
    }

    const clienteId = instalacion.comanda.presupuesto.cliente.id
    const comandaId = instalacion.comandaId

    // Transacción Prisma atómica que cierra el ciclo
    await prisma.$transaction(async (tx) => {
      // 1. Instalación -> COMPLETADA
      const notasActualizadas = observacionesFinales?.trim()
        ? instalacion.notas
          ? `${instalacion.notas}\n\n[Conformidad de Obra]: ${observacionesFinales.trim()}`
          : `[Conformidad de Obra]: ${observacionesFinales.trim()}`
        : instalacion.notas

      await tx.instalacion.update({
        where: { id },
        data: {
          estado: "COMPLETADA",
          notas: notasActualizadas,
        },
      })

      // 2. Comanda -> INSTALADO
      await tx.comanda.update({
        where: { id: comandaId },
        data: { estado: "INSTALADO" },
      })

      // 3. Cliente -> INSTALADO (cierre del ciclo comercial y operativo)
      await tx.cliente.update({
        where: { id: clienteId },
        data: { estado: "INSTALADO" },
      })
    })

    revalidatePath("/instalaciones")
    revalidatePath(`/instalaciones/${id}`)
    revalidatePath("/instalaciones/taller")
    revalidatePath("/comandas")
    revalidatePath("/clientes")
    revalidatePath(`/clientes/${clienteId}`)

    return { success: true, data: { id } }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado"
    console.error("Error al completar instalación:", error)
    return { success: false, error: errorMsg }
  }
}

// 5. Cancelar instalación
export async function cancelarInstalacion(
  input: CancelarInstalacionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloInstalaciones("agendar")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No tiene permisos para cancelar instalaciones." }
    }

    const val = cancelarInstalacionSchema.safeParse(input)
    if (!val.success) {
      return { success: false, error: val.error.issues?.[0]?.message || val.error.message || "Datos inválidos" }
    }

    const { id, motivo } = val.data

    const instalacion = await prisma.instalacion.findUnique({
      where: { id },
    })

    if (!instalacion) {
      return { success: false, error: "La instalación no existe." }
    }

    const notasActualizadas = motivo?.trim()
      ? instalacion.notas
        ? `${instalacion.notas}\n\n[Cancelada]: ${motivo.trim()}`
        : `[Cancelada]: ${motivo.trim()}`
      : instalacion.notas

    await prisma.instalacion.update({
      where: { id },
      data: {
        estado: "CANCELADA",
        notas: notasActualizadas,
      },
    })

    revalidatePath("/instalaciones")
    revalidatePath(`/instalaciones/${id}`)
    revalidatePath("/instalaciones/taller")
    revalidatePath("/comandas")

    return { success: true, data: { id } }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado"
    console.error("Error al cancelar instalación:", error)
    return { success: false, error: errorMsg }
  }
}

// 6. Crear bloqueo de agenda (Indisponibilidad / Turno médico / Trámite)
export async function crearBloqueoAgenda(
  input: BloqueoAgendaInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloInstalaciones("bloquear")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No tiene permisos para registrar bloqueos de horario." }
    }

    const val = bloqueoAgendaSchema.safeParse(input)
    if (!val.success) {
      return { success: false, error: val.error.issues?.[0]?.message || val.error.message || "Datos inválidos" }
    }

    const { usuarioId, fecha, horaInicio, horaFin, motivo } = val.data
    const fechaObj = new Date(fecha)

    // Si el usuario no especificó usuarioId y tiene rol INSTALACION, asociamos su propio usuario
    let targetUsuarioId = usuarioId || null
    if (!targetUsuarioId && auth.rol === "INSTALACION" && auth.usuarioId) {
      targetUsuarioId = auth.usuarioId
    }

    const nuevoBloqueo = await prisma.bloqueoAgenda.create({
      data: {
        usuarioId: targetUsuarioId,
        fecha: fechaObj,
        horaInicio,
        horaFin,
        motivo: motivo.trim(),
      },
    })

    revalidatePath("/instalaciones")
    revalidatePath("/instalaciones/taller")

    return { success: true, data: { id: nuevoBloqueo.id } }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado"
    console.error("Error al crear bloqueo de agenda:", error)
    return { success: false, error: errorMsg }
  }
}

// 7. Eliminar bloqueo de agenda
export async function eliminarBloqueoAgenda(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloInstalaciones("bloquear")
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No tiene permisos para eliminar bloqueos de agenda." }
    }

    await prisma.bloqueoAgenda.delete({
      where: { id },
    })

    revalidatePath("/instalaciones")
    revalidatePath("/instalaciones/taller")

    return { success: true, data: { id } }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado"
    console.error("Error al eliminar bloqueo de agenda:", error)
    return { success: false, error: errorMsg }
  }
}
