"use server"

// Módulo: Arquitectos
// Alta, edición y baja de arquitectos desde el ERP. Al borrar uno, sus clientes quedan sin ese arquitecto.

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { tienePermisoModuloClientes } from "@/lib/auth"
import type { ActionResponse } from "@/types"
import { arquitectoSchema, datosArquitecto, type ArquitectoInput } from "./schemas"

const revalidar = (id?: string) => {
  revalidatePath("/arquitectos")
  revalidatePath("/clientes")
  if (id) revalidatePath(`/arquitectos/${id}`)
}

export async function crearArquitecto(input: ArquitectoInput): Promise<ActionResponse<{ id: string; nombre: string }>> {
  try {
    const auth = await tienePermisoModuloClientes()
    if (!auth.permitido) return { success: false, error: auth.error || "No autorizado" }
    const v = arquitectoSchema.safeParse(input)
    if (!v.success) return { success: false, error: v.error.issues.map((e) => e.message).join(", ") }

    const creado = await prisma.arquitecto.create({ data: datosArquitecto(v.data), select: { id: true, nombre: true } })
    revalidar(creado.id)
    return { success: true, data: creado }
  } catch (error) {
    console.error("Error al crear el arquitecto:", error)
    return { success: false, error: "No se pudo crear el arquitecto." }
  }
}

export async function actualizarArquitecto(id: string, input: ArquitectoInput): Promise<ActionResponse<void>> {
  try {
    const auth = await tienePermisoModuloClientes()
    if (!auth.permitido) return { success: false, error: auth.error || "No autorizado" }
    const v = arquitectoSchema.safeParse(input)
    if (!v.success) return { success: false, error: v.error.issues.map((e) => e.message).join(", ") }

    const existe = await prisma.arquitecto.findUnique({ where: { id }, select: { id: true } })
    if (!existe) return { success: false, error: "El arquitecto no existe." }
    await prisma.arquitecto.update({ where: { id }, data: datosArquitecto(v.data) })
    revalidar(id)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error al actualizar el arquitecto:", error)
    return { success: false, error: "No se pudo guardar el arquitecto." }
  }
}

/** Borra el arquitecto. Sus clientes no se borran: quedan sin ese arquitecto. */
export async function eliminarArquitecto(id: string): Promise<ActionResponse<{ clientesDesvinculados: number }>> {
  try {
    const auth = await tienePermisoModuloClientes()
    if (!auth.permitido) return { success: false, error: auth.error || "No autorizado" }
    const existe = await prisma.arquitecto.findUnique({
      where: { id },
      select: { id: true, _count: { select: { clientes: true } } },
    })
    if (!existe) return { success: false, error: "El arquitecto no existe." }
    await prisma.arquitecto.delete({ where: { id } })
    revalidar()
    return { success: true, data: { clientesDesvinculados: existe._count.clientes } }
  } catch (error) {
    console.error("Error al eliminar el arquitecto:", error)
    return { success: false, error: "No se pudo eliminar el arquitecto." }
  }
}
