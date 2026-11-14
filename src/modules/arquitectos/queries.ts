// Módulo: Arquitectos
// Consultas de solo lectura (Server Components)

import { prisma } from "@/lib/prisma"

export interface IArquitectoResumen {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  notas: string | null
  clientes: number
}

export interface IArquitectoOpcion {
  id: string
  nombre: string
}

/** Todos los arquitectos con la cantidad de clientes (orden alfabético). */
export async function obtenerArquitectos(): Promise<IArquitectoResumen[]> {
  try {
    const lista = await prisma.arquitecto.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { clientes: true } } },
    })
    return lista.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      telefono: a.telefono,
      email: a.email,
      notas: a.notas,
      clientes: a._count.clientes,
    }))
  } catch (error) {
    console.error("Error al obtener los arquitectos:", error)
    return []
  }
}

/** Lista corta para elegir arquitectos en el formulario del cliente. */
export async function obtenerArquitectosParaSelector(): Promise<IArquitectoOpcion[]> {
  try {
    return await prisma.arquitecto.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } })
  } catch (error) {
    console.error("Error al obtener los arquitectos:", error)
    return []
  }
}

/** Arquitecto con sus clientes y las mediciones de cada uno. */
export async function obtenerArquitectoPorId(id: string) {
  return prisma.arquitecto.findUnique({
    where: { id },
    include: {
      clientes: {
        orderBy: { nombre: "asc" },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          direccion: true,
          localidad: true,
          estado: true,
          mediciones: { orderBy: { creadoEn: "desc" }, select: { id: true, creadoEn: true } },
          _count: { select: { presupuestos: true } },
        },
      },
    },
  })
}

export type IArquitectoDetalle = NonNullable<Awaited<ReturnType<typeof obtenerArquitectoPorId>>>
