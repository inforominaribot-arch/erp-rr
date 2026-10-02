// Módulo: Agendar Visitas
// Consultas Prisma de Solo Lectura

import { prisma } from "@/lib/prisma"
import type { IVisitaConRelaciones, IVisitaFiltros, IVisitasMetricas } from "./types"
import type { EstadoVisita } from "@/types"

/**
 * Obtener lista de visitas con filtros de rango de fechas, estado y búsqueda
 */
export async function obtenerVisitas(
  filtros?: IVisitaFiltros
): Promise<IVisitaConRelaciones[]> {
  const where: any = {}

  if (filtros?.estado && filtros.estado !== "TODOS") {
    where.estado = filtros.estado as EstadoVisita
  }

  if (filtros?.fechaDesde || filtros?.fechaHasta) {
    where.fecha = {}
    if (filtros.fechaDesde) {
      where.fecha.gte = new Date(filtros.fechaDesde)
    }
    if (filtros.fechaHasta) {
      const hasta = new Date(filtros.fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      where.fecha.lte = hasta
    }
  }

  if (filtros?.busqueda?.trim()) {
    const q = filtros.busqueda.trim()
    where.OR = [
      { cliente: { nombre: { contains: q, mode: "insensitive" } } },
      { cliente: { telefono: { contains: q, mode: "insensitive" } } },
      { direccion: { contains: q, mode: "insensitive" } },
      { localidad: { contains: q, mode: "insensitive" } },
      { notas: { contains: q, mode: "insensitive" } },
    ]
  }

  const visitas = await prisma.visita.findMany({
    where,
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
          email: true,
          direccion: true,
          localidad: true,
        },
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  })

  return visitas as unknown as IVisitaConRelaciones[]
}

/**
 * Obtener visitas programadas para el día de hoy
 */
export async function obtenerVisitasHoy(): Promise<IVisitaConRelaciones[]> {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999)

  const visitas = await prisma.visita.findMany({
    where: {
      fecha: {
        gte: inicio,
        lte: fin,
      },
    },
    orderBy: { horaInicio: "asc" },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
          email: true,
          direccion: true,
          localidad: true,
        },
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  })

  return visitas as unknown as IVisitaConRelaciones[]
}

/**
 * Obtener visita individual por su ID
 */
export async function obtenerVisitaPorId(id: string): Promise<IVisitaConRelaciones | null> {
  const visita = await prisma.visita.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
          email: true,
          direccion: true,
          localidad: true,
        },
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  })

  return (visita as unknown as IVisitaConRelaciones) || null
}

/**
 * Clientes disponibles para autocompletar en el modal de agendar visita
 */
export async function obtenerClientesParaVisita(busqueda?: string) {
  const where: any = {}

  if (busqueda?.trim()) {
    const q = busqueda.trim()
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { telefono: { contains: q, mode: "insensitive" } },
      { direccion: { contains: q, mode: "insensitive" } },
    ]
  }

  const clientes = await prisma.cliente.findMany({
    where,
    take: 30,
    orderBy: { actualizadoEn: "desc" },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      direccion: true,
      localidad: true,
      notas: true,
      estado: true,
    },
  })

  return clientes
}

/**
 * Métricas operativas de visitas para KPIs y Dashboard
 */
export async function obtenerMetricasVisitas(): Promise<IVisitasMetricas> {
  const ahora = new Date()

  // Rango Hoy
  const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0)
  const hoyFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999)

  // Rango Semana (próximos 7 días)
  const semanaFin = new Date(hoyInicio)
  semanaFin.setDate(semanaFin.getDate() + 7)
  semanaFin.setHours(23, 59, 59, 999)

  // Rango Mes (mes actual)
  const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0)

  const [totalHoy, totalSemana, confirmadas, realizadasMes] = await Promise.all([
    // Visitas de hoy activas (no canceladas)
    prisma.visita.count({
      where: {
        fecha: { gte: hoyInicio, lte: hoyFin },
        estado: { not: "CANCELADA" },
      },
    }),
    // Visitas de la semana
    prisma.visita.count({
      where: {
        fecha: { gte: hoyInicio, lte: semanaFin },
        estado: { not: "CANCELADA" },
      },
    }),
    // Visitas confirmadas pendientes
    prisma.visita.count({
      where: {
        estado: "CONFIRMADA",
        fecha: { gte: hoyInicio },
      },
    }),
    // Visitas realizadas en el mes
    prisma.visita.count({
      where: {
        fecha: { gte: mesInicio },
        estado: "REALIZADA",
      },
    }),
  ])

  return {
    totalHoy,
    totalSemana,
    confirmadas,
    realizadasMes,
  }
}
