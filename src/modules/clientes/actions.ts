"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { tienePermisoModuloClientes } from "@/lib/auth"
import type { ActionResponse } from "@/types"
import type { Cliente } from "@prisma/client"
import {
  clienteSchema,
  actualizarEstadoSchema,
  filaCSVSchema,
  type ClienteInput,
  type ActualizarEstadoInput,
} from "./schemas"
import type { IResultadoImportacion } from "./types"

// ─── Crear Cliente ────────────────────────────────────────────────────────────

export async function crearCliente(
  input: ClienteInput
): Promise<ActionResponse<Cliente>> {
  try {
    const auth = await tienePermisoModuloClientes()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = clienteSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { nombre, telefono, email, direccion, localidad, notas } = validacion.data

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

    revalidatePath("/clientes")
    revalidatePath("/clientes/pipeline")

    return { success: true, data: nuevoCliente }
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return {
      success: false,
      error: "Ocurrió un error al intentar crear el cliente.",
    }
  }
}

// ─── Actualizar Cliente ───────────────────────────────────────────────────────

export async function actualizarCliente(
  id: string,
  input: ClienteInput
): Promise<ActionResponse<Cliente>> {
  try {
    const auth = await tienePermisoModuloClientes()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    if (!id) {
      return { success: false, error: "Identificador de cliente no proporcionado." }
    }

    const validacion = clienteSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const existe = await prisma.cliente.findUnique({
      where: { id },
    })

    if (!existe) {
      return { success: false, error: "El cliente seleccionado no existe." }
    }

    const { nombre, telefono, email, direccion, localidad, notas } = validacion.data

    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: {
        nombre,
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim().toLowerCase() : null,
        direccion: direccion ? direccion.trim() : null,
        localidad: localidad ? localidad.trim() : null,
        notas: notas ? notas.trim() : null,
      },
    })

    revalidatePath("/clientes")
    revalidatePath(`/clientes/${id}`)
    revalidatePath("/clientes/pipeline")

    return { success: true, data: clienteActualizado }
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return {
      success: false,
      error: "Ocurrió un error al intentar actualizar el cliente.",
    }
  }
}

// ─── Cambiar Estado de Cliente ───────────────────────────────────────────────

export async function actualizarEstadoCliente(
  input: ActualizarEstadoInput
): Promise<ActionResponse<Cliente>> {
  try {
    const auth = await tienePermisoModuloClientes()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    const validacion = actualizarEstadoSchema.safeParse(input)
    if (!validacion.success) {
      const errorMsg = validacion.error.issues.map((e) => e.message).join(", ")
      return { success: false, error: errorMsg }
    }

    const { id, estado } = validacion.data

    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: { estado },
    })

    revalidatePath("/clientes")
    revalidatePath(`/clientes/${id}`)
    revalidatePath("/clientes/pipeline")

    return { success: true, data: clienteActualizado }
  } catch (error) {
    console.error("Error al actualizar estado del cliente:", error)
    return {
      success: false,
      error: "No se pudo actualizar el estado del cliente.",
    }
  }
}

// ─── Eliminar Cliente ─────────────────────────────────────────────────────────

export async function eliminarCliente(id: string): Promise<ActionResponse<void>> {
  try {
    const auth = await tienePermisoModuloClientes()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    if (!id) {
      return { success: false, error: "Identificador de cliente inválido." }
    }

    // Verificar si tiene mediciones o presupuestos asociados
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            mediciones: true,
            presupuestos: true,
          },
        },
      },
    })

    if (!cliente) {
      return { success: false, error: "El cliente a eliminar no existe." }
    }

    if (cliente._count.mediciones > 0 || cliente._count.presupuestos > 0) {
      return {
        success: false,
        error: `No es posible eliminar el cliente porque posee ${cliente._count.mediciones} medición/es y ${cliente._count.presupuestos} presupuesto/s asociados.`,
      }
    }

    await prisma.cliente.delete({
      where: { id },
    })

    revalidatePath("/clientes")
    revalidatePath("/clientes/pipeline")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return {
      success: false,
      error: "Ocurrió un error al intentar eliminar el cliente.",
    }
  }
}

// ─── Importar Clientes desde CSV ──────────────────────────────────────────────

export async function importarClientesCSV(
  filas: unknown[]
): Promise<ActionResponse<IResultadoImportacion>> {
  try {
    const auth = await tienePermisoModuloClientes()
    if (!auth.permitido) {
      return { success: false, error: auth.error || "No autorizado" }
    }

    if (!Array.isArray(filas) || filas.length === 0) {
      return {
        success: false,
        error: "El archivo no contiene filas válidas para importar.",
      }
    }

    const resultado: IResultadoImportacion = {
      importados: 0,
      errores: [],
    }

    const clientesAInsertar: Array<{
      nombre: string
      telefono: string | null
      email: string | null
      direccion: string | null
      localidad: string | null
      notas: string | null
      estado: "MEDICION_TOMADA"
    }> = []

    for (let index = 0; index < filas.length; index++) {
      const fila = filas[index]
      const validacion = filaCSVSchema.safeParse(fila)

      if (!validacion.success) {
        resultado.errores.push({
          fila: index + 1,
          nombre: (fila as Record<string, unknown>)?.nombre ? String((fila as Record<string, unknown>).nombre) : `Fila ${index + 1}`,
          error: validacion.error.issues.map((e) => e.message).join(", "),
        })
        continue
      }

      const { nombre, telefono, email, direccion, localidad, notas } = validacion.data
      clientesAInsertar.push({
        nombre,
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim().toLowerCase() : null,
        direccion: direccion ? direccion.trim() : null,
        localidad: localidad ? localidad.trim() : null,
        notas: notas ? notas.trim() : null,
        estado: "MEDICION_TOMADA",
      })
    }

    if (clientesAInsertar.length > 0) {
      const batchResult = await prisma.cliente.createMany({
        data: clientesAInsertar,
      })
      resultado.importados = batchResult.count
    }

    revalidatePath("/clientes")
    revalidatePath("/clientes/pipeline")

    return {
      success: true,
      data: resultado,
    }
  } catch (error) {
    console.error("Error al importar clientes CSV:", error)
    return {
      success: false,
      error: "Ocurrió un error inesperado al procesar la importación masiva.",
    }
  }
}
