"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { tienePermisoModuloMediciones } from "@/lib/auth"
import type { ActionResponse } from "@/types"
import {
  medicionSchema,
  clienteExpressSchema,
  type MedicionInput,
  type ClienteExpressInput,
} from "./schemas"
import type { IMedicionOffline } from "./types"

// ─── Crear Medición (Online) ──────────────────────────────────────────────────

export async function crearMedicion(
  input: MedicionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloMediciones(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = medicionSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { clienteId, observaciones, ambientes } = validacion.data

    // Verificar que el cliente exista
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    })
    if (!cliente) {
      return { success: false, error: "El cliente seleccionado no existe" }
    }

    const usuarioId = auth.usuarioId!

    // Crear medición con ambientes e ítems en una transacción
    const nuevaMedicion = await prisma.$transaction(async (tx) => {
      const med = await tx.medicion.create({
        data: {
          clienteId,
          usuarioId,
          observaciones: observaciones?.trim() || null,
          sincronizado: true,
          ambientes: {
            create: ambientes.map((amb, index) => ({
              nombre: amb.nombre.trim(),
              orden: amb.orden ?? index,
              items: {
                create: amb.items.map((item) => ({
                  descripcion: item.descripcion.trim(),
                  ancho: item.ancho,
                  alto: item.alto,
                  cantidad: item.cantidad,
                  caracteristicas: item.caracteristicas as any,
                  observaciones: item.observaciones?.trim() || null,
                })),
              },
            })),
          },
        },
      })

      // Actualizar estado del cliente a MEDICION_TOMADA si está en un estado inicial
      if (cliente.estado === "MEDICION_TOMADA") {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { estado: "MEDICION_TOMADA" },
        })
      }

      return med
    })

    revalidatePath("/mediciones")
    revalidatePath(`/clientes/${clienteId}`)
    revalidatePath("/clientes")

    return { success: true, data: { id: nuevaMedicion.id } }
  } catch (error) {
    console.error("Error al crear medición:", error)
    return {
      success: false,
      error: "Ocurrió un error al intentar guardar la medición.",
    }
  }
}

// ─── Actualizar Medición ─────────────────────────────────────────────────────

export async function actualizarMedicion(
  id: string,
  input: MedicionInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const auth = await tienePermisoModuloMediciones(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = medicionSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { clienteId, observaciones, ambientes } = validacion.data

    const existe = await prisma.medicion.findUnique({
      where: { id },
      include: { ambientes: { include: { items: true } } },
    })

    if (!existe) {
      return { success: false, error: "La medición no existe" }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar ambientes anteriores (cascada a items)
      await tx.ambiente.deleteMany({
        where: { medicionId: id },
      })

      // 2. Actualizar datos base y crear nuevos ambientes/items
      await tx.medicion.update({
        where: { id },
        data: {
          clienteId,
          observaciones: observaciones?.trim() || null,
          sincronizado: true,
          ambientes: {
            create: ambientes.map((amb, index) => ({
              nombre: amb.nombre.trim(),
              orden: amb.orden ?? index,
              items: {
                create: amb.items.map((item) => ({
                  descripcion: item.descripcion.trim(),
                  ancho: item.ancho,
                  alto: item.alto,
                  cantidad: item.cantidad,
                  caracteristicas: item.caracteristicas as any,
                  observaciones: item.observaciones?.trim() || null,
                })),
              },
            })),
          },
        },
      })
    })

    revalidatePath("/mediciones")
    revalidatePath(`/mediciones/${id}`)
    revalidatePath(`/clientes/${clienteId}`)

    return { success: true, data: { id } }
  } catch (error) {
    console.error("Error al actualizar medición:", error)
    return {
      success: false,
      error: "Ocurrió un error al intentar actualizar la medición.",
    }
  }
}

// ─── Eliminar Medición ───────────────────────────────────────────────────────

export async function eliminarMedicion(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const auth = await tienePermisoModuloMediciones(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const existe = await prisma.medicion.findUnique({
      where: { id },
    })

    if (!existe) {
      return { success: false, error: "La medición a eliminar no existe." }
    }

    // Verificar si algún itemMedicion ya está referenciado en un presupuesto
    const itemReferenciado = await prisma.itemPresupuesto.findFirst({
      where: {
        itemMedicion: {
          ambiente: {
            medicionId: id,
          },
        },
      },
    })

    if (itemReferenciado) {
      return {
        success: false,
        error:
          "No se puede eliminar la medición porque ya fue utilizada en uno o más presupuestos.",
      }
    }

    await prisma.medicion.delete({
      where: { id },
    })

    revalidatePath("/mediciones")
    revalidatePath(`/clientes/${existe.clienteId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error al eliminar medición:", error)
    return {
      success: false,
      error: "Ocurrió un error al intentar eliminar la medición.",
    }
  }
}

// ─── Sincronizar Medición Offline a la Base de Datos ─────────────────────────

export async function sincronizarMedicionOffline(
  medicionOffline: IMedicionOffline
): Promise<ActionResponse<{ idServidor: string; idLocal: string }>> {
  try {
    const auth = await tienePermisoModuloMediciones(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const usuarioId = auth.usuarioId!

    let clienteFinalId = medicionOffline.clienteId

    // Si el cliente no existe en DB (ej. fue creado offline con id temporal), crearlo
    const clienteExiste = await prisma.cliente.findUnique({
      where: { id: clienteFinalId },
    })

    if (!clienteExiste) {
      // Buscar por nombre si ya se sincronizó previamente
      const clientePorNombre = await prisma.cliente.findFirst({
        where: {
          nombre: {
            equals: medicionOffline.clienteNombre,
            mode: "insensitive",
          },
        },
      })

      if (clientePorNombre) {
        clienteFinalId = clientePorNombre.id
      } else {
        const nuevoCliente = await prisma.cliente.create({
          data: {
            nombre: medicionOffline.clienteNombre || "Cliente Relevamiento",
            telefono: medicionOffline.clienteTelefono || null,
            direccion: medicionOffline.clienteDireccion || null,
            localidad: medicionOffline.clienteLocalidad || null,
            estado: "MEDICION_TOMADA",
          },
        })
        clienteFinalId = nuevoCliente.id
      }
    }

    // Insertar la medición en Prisma con sincronizado = true
    const medicionCreada = await prisma.medicion.create({
      data: {
        clienteId: clienteFinalId,
        usuarioId,
        observaciones: medicionOffline.observaciones?.trim() || null,
        sincronizado: true,
        creadoEn: new Date(medicionOffline.guardadoEn || Date.now()),
        ambientes: {
          create: medicionOffline.ambientes.map((amb, index) => ({
            nombre: amb.nombre.trim(),
            orden: amb.orden ?? index,
            items: {
              create: amb.items.map((item) => ({
                descripcion: item.descripcion.trim(),
                ancho: item.ancho,
                alto: item.alto,
                cantidad: item.cantidad || 1,
                caracteristicas: item.caracteristicas as any,
                observaciones: item.observaciones?.trim() || null,
              })),
            },
          })),
        },
      },
    })

    revalidatePath("/mediciones")
    revalidatePath(`/clientes/${clienteFinalId}`)

    return {
      success: true,
      data: {
        idServidor: medicionCreada.id,
        idLocal: medicionOffline.idLocal,
      },
    }
  } catch (error) {
    console.error("Error al sincronizar medición offline:", error)
    return {
      success: false,
      error: "Ocurrió un error al sincronizar la medición offline con el servidor.",
    }
  }
}

// ─── Alta Express de Cliente desde la App de Medición ────────────────────────

export async function crearClienteExpress(
  input: ClienteExpressInput
): Promise<ActionResponse<{ id: string; nombre: string; telefono: string | null }>> {
  try {
    const auth = await tienePermisoModuloMediciones(true)
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = clienteExpressSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { nombre, telefono, email, direccion, localidad, notas } =
      validacion.data

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim().toLowerCase() : null,
        direccion: direccion ? direccion.trim() : null,
        localidad: localidad ? localidad.trim() : null,
        notas: notas ? notas.trim() : null,
        estado: "MEDICION_TOMADA",
      },
    })

    revalidatePath("/mediciones")
    revalidatePath("/clientes")

    return {
      success: true,
      data: {
        id: nuevoCliente.id,
        nombre: nuevoCliente.nombre,
        telefono: nuevoCliente.telefono,
      },
    }
  } catch (error) {
    console.error("Error al crear cliente express:", error)
    return {
      success: false,
      error: "Ocurrió un error al registrar el cliente express.",
    }
  }
}
