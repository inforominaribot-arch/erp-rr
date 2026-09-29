// Módulo: Agenda & Instalación
// Consultas de solo lectura con Prisma ORM

import { prisma } from "@/lib/prisma"
import type { Prisma, ItemComanda } from "@prisma/client"
import type {
  IInstalacion,
  IComandaPendienteAgenda,
  IInstalador,
  IBloqueoAgenda,
  MetricasInstalaciones,
  FiltrosInstalaciones,
} from "./types"

type InstalacionConRelaciones = Prisma.InstalacionGetPayload<{
  include: {
    comanda: {
      include: {
        presupuesto: {
          include: {
            cliente: true
          }
        }
        items: true
      }
    }
    instaladores: {
      include: {
        usuario: true
      }
    }
  }
}>

// Helper para serializar ítems de comanda
function serializarItemsComanda(items: ItemComanda[]) {
  return items.map((item) => ({
    id: item.id,
    descripcion: item.descripcion,
    ambiente: item.ambiente,
    ancho: Number(item.ancho),
    alto: Number(item.alto),
    cantidad: item.cantidad,
    tipo: item.tipo,
    caracteristicas: (item.caracteristicas as Record<string, unknown>) || null,
    observaciones: item.observaciones,
    completado: item.completado,
  }))
}

// Helper para serializar una instalación completa
function serializarInstalacion(inst: InstalacionConRelaciones): IInstalacion {
  return {
    id: inst.id,
    comandaId: inst.comandaId,
    fecha: inst.fecha.toISOString(),
    horaInicio: inst.horaInicio,
    horaFin: inst.horaFin,
    estado: inst.estado,
    notas: inst.notas,
    materialesListos: inst.materialesListos,
    creadoEn: inst.creadoEn.toISOString(),
    actualizadoEn: inst.actualizadoEn.toISOString(),
    comanda: {
      id: inst.comanda.id,
      numero: inst.comanda.numero,
      estado: inst.comanda.estado,
      notas: inst.comanda.notas,
      fechaEntrega: inst.comanda.fechaEntrega ? inst.comanda.fechaEntrega.toISOString() : null,
      cliente: {
        id: inst.comanda.presupuesto.cliente.id,
        nombre: inst.comanda.presupuesto.cliente.nombre,
        telefono: inst.comanda.presupuesto.cliente.telefono,
        direccion: inst.comanda.presupuesto.cliente.direccion,
        localidad: inst.comanda.presupuesto.cliente.localidad,
        email: inst.comanda.presupuesto.cliente.email,
        notas: inst.comanda.presupuesto.cliente.notas,
      },
      items: serializarItemsComanda(inst.comanda.items || []),
    },
    instaladores: (inst.instaladores || []).map((rel) => ({
      id: rel.id,
      usuarioId: rel.usuarioId,
      usuario: {
        id: rel.usuario.id,
        nombre: rel.usuario.nombre,
        email: rel.usuario.email,
        rol: rel.usuario.rol,
        activo: rel.usuario.activo,
      },
    })),
  }
}

// 1. Obtener todas las instalaciones con filtros
export async function obtenerInstalaciones(filtros?: FiltrosInstalaciones): Promise<IInstalacion[]> {
  try {
    const where: Prisma.InstalacionWhereInput = {}

    // Filtro por rango de fechas
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

    // Filtro por estado
    if (filtros?.estado && filtros.estado !== "TODOS") {
      where.estado = filtros.estado
    }

    // Filtro por instalador asignado
    if (filtros?.instaladorId) {
      where.instaladores = {
        some: {
          usuarioId: filtros.instaladorId,
        },
      }
    }

    // Búsqueda por texto (nombre de cliente, dirección o número de comanda)
    if (filtros?.busqueda?.trim()) {
      const q = filtros.busqueda.trim()
      const qNumero = parseInt(q)

      where.OR = [
        {
          comanda: {
            presupuesto: {
              cliente: {
                nombre: { contains: q, mode: "insensitive" },
              },
            },
          },
        },
        {
          comanda: {
            presupuesto: {
              cliente: {
                localidad: { contains: q, mode: "insensitive" },
              },
            },
          },
        },
        {
          comanda: {
            presupuesto: {
              cliente: {
                direccion: { contains: q, mode: "insensitive" },
              },
            },
          },
        },
        ...(!isNaN(qNumero)
          ? [
              {
                comanda: {
                  numero: qNumero,
                },
              },
            ]
          : []),
      ]
    }

    const instalaciones = await prisma.instalacion.findMany({
      where,
      include: {
        comanda: {
          include: {
            presupuesto: {
              include: {
                cliente: true,
              },
            },
            items: true,
          },
        },
        instaladores: {
          include: {
            usuario: true,
          },
        },
      },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    })

    return instalaciones.map(serializarInstalacion)
  } catch (error) {
    console.error("Error al obtener instalaciones:", error)
    return []
  }
}

// 2. Obtener instalación por ID
export async function obtenerInstalacionPorId(id: string): Promise<IInstalacion | null> {
  try {
    const inst = await prisma.instalacion.findUnique({
      where: { id },
      include: {
        comanda: {
          include: {
            presupuesto: {
              include: {
                cliente: true,
              },
            },
            items: true,
          },
        },
        instaladores: {
          include: {
            usuario: true,
          },
        },
      },
    })

    if (!inst) return null
    return serializarInstalacion(inst)
  } catch (error) {
    console.error("Error al obtener instalacion por id:", error)
    return null
  }
}

// 3. Obtener comandas pendientes de agendar (listas para instalar o en producción avanzada sin colocación activa)
export async function obtenerComandasPendientesAgendar(): Promise<IComandaPendienteAgenda[]> {
  try {
    const comandas = await prisma.comanda.findMany({
      where: {
        estado: {
          in: ["LISTO_PARA_INSTALAR", "EN_PRODUCCION"],
        },
        OR: [
          { instalacion: null },
          {
            instalacion: {
              estado: "CANCELADA",
            },
          },
        ],
      },
      include: {
        presupuesto: {
          include: {
            cliente: true,
          },
        },
        items: true,
      },
      orderBy: [{ estado: "desc" }, { creadoEn: "asc" }],
    })

    return comandas.map((comanda) => {
      const itemsListos = comanda.items.filter((i) => i.completado).length
      return {
        id: comanda.id,
        numero: comanda.numero,
        estado: comanda.estado,
        notas: comanda.notas,
        fechaEntrega: comanda.fechaEntrega ? comanda.fechaEntrega.toISOString() : null,
        cliente: {
          id: comanda.presupuesto.cliente.id,
          nombre: comanda.presupuesto.cliente.nombre,
          telefono: comanda.presupuesto.cliente.telefono,
          direccion: comanda.presupuesto.cliente.direccion,
          localidad: comanda.presupuesto.cliente.localidad,
        },
        totalItems: comanda.items.length,
        itemsListos,
        items: comanda.items.map((i) => ({
          id: i.id,
          descripcion: i.descripcion,
          ambiente: i.ambiente,
          ancho: Number(i.ancho),
          alto: Number(i.alto),
          cantidad: i.cantidad,
        })),
      }
    })
  } catch (error) {
    console.error("Error al obtener comandas pendientes de agendar:", error)
    return []
  }
}

// 4. Obtener instalaciones para vista de Taller (próximos días)
export async function obtenerInstalacionesTaller(dias: number = 7): Promise<IInstalacion[]> {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const limite = new Date(hoy)
    limite.setDate(limite.getDate() + dias)
    limite.setHours(23, 59, 59, 999)

    const instalaciones = await prisma.instalacion.findMany({
      where: {
        fecha: {
          gte: hoy,
          lte: limite,
        },
        estado: "PROGRAMADA",
      },
      include: {
        comanda: {
          include: {
            presupuesto: {
              include: {
                cliente: true,
              },
            },
            items: true,
          },
        },
        instaladores: {
          include: {
            usuario: true,
          },
        },
      },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    })

    return instalaciones.map(serializarInstalacion)
  } catch (error) {
    console.error("Error al obtener instalaciones de taller:", error)
    return []
  }
}

// 5. Obtener itinerario para un instalador específico en una fecha
export async function obtenerItinerarioInstalador(
  usuarioId?: string,
  fechaStr?: string
): Promise<IInstalacion[]> {
  try {
    const fechaBase = fechaStr ? new Date(fechaStr) : new Date()
    const inicioDia = new Date(fechaBase)
    inicioDia.setHours(0, 0, 0, 0)
    const finDia = new Date(fechaBase)
    finDia.setHours(23, 59, 59, 999)

    const where: Prisma.InstalacionWhereInput = {
      fecha: {
        gte: inicioDia,
        lte: finDia,
      },
      estado: {
        in: ["PROGRAMADA", "COMPLETADA"],
      },
    }

    if (usuarioId) {
      where.instaladores = {
        some: {
          usuarioId,
        },
      }
    }

    const instalaciones = await prisma.instalacion.findMany({
      where,
      include: {
        comanda: {
          include: {
            presupuesto: {
              include: {
                cliente: true,
              },
            },
            items: true,
          },
        },
        instaladores: {
          include: {
            usuario: true,
          },
        },
      },
      orderBy: [{ horaInicio: "asc" }],
    })

    return instalaciones.map(serializarInstalacion)
  } catch (error) {
    console.error("Error al obtener itinerario de instalador:", error)
    return []
  }
}

// 6. Obtener instaladores activos disponibles
export async function obtenerInstaladoresDisponibles(): Promise<IInstalador[]> {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: {
          in: ["INSTALACION", "ADMIN_GENERAL", "ADMINISTRACION"],
        },
      },
      orderBy: { nombre: "asc" },
    })

    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
    }))
  } catch (error) {
    console.error("Error al obtener instaladores disponibles:", error)
    return []
  }
}

// 7. Obtener bloqueos de agenda
export async function obtenerBloqueosAgenda(
  fechaDesde?: string,
  fechaHasta?: string,
  usuarioId?: string
): Promise<IBloqueoAgenda[]> {
  try {
    const where: Prisma.BloqueoAgendaWhereInput = {}

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        where.fecha.lte = hasta
      }
    }

    if (usuarioId) {
      where.OR = [{ usuarioId }, { usuarioId: null }]
    }

    const bloqueos = await prisma.bloqueoAgenda.findMany({
      where,
      include: {
        usuario: true,
      },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    })

    return bloqueos.map((b) => ({
      id: b.id,
      usuarioId: b.usuarioId,
      usuario: b.usuario
        ? {
            id: b.usuario.id,
            nombre: b.usuario.nombre,
            email: b.usuario.email,
            rol: b.usuario.rol,
          }
        : null,
      fecha: b.fecha.toISOString(),
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
      motivo: b.motivo,
      creadoEn: b.creadoEn.toISOString(),
    }))
  } catch (error) {
    console.error("Error al obtener bloqueos de agenda:", error)
    return []
  }
}

// 8. Métricas de Agenda e Instalación
export async function obtenerMetricasAgenda(): Promise<MetricasInstalaciones> {
  try {
    const ahora = new Date()

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999)

    const hoyInicio = new Date(ahora)
    hoyInicio.setHours(0, 0, 0, 0)
    const hoyFin = new Date(ahora)
    hoyFin.setHours(23, 59, 59, 999)

    const mananaInicio = new Date(hoyInicio)
    mananaInicio.setDate(mananaInicio.getDate() + 1)
    const mananaFin = new Date(hoyFin)
    mananaFin.setDate(mananaFin.getDate() + 1)

    const semanaFin = new Date(hoyInicio)
    semanaFin.setDate(semanaFin.getDate() + 7)

    const [
      totalMes,
      hoy,
      manana,
      materialesPendientesManana,
      completadasMes,
      bloqueosSemana,
    ] = await Promise.all([
      prisma.instalacion.count({
        where: {
          fecha: { gte: inicioMes, lte: finMes },
          estado: "PROGRAMADA",
        },
      }),
      prisma.instalacion.count({
        where: {
          fecha: { gte: hoyInicio, lte: hoyFin },
          estado: "PROGRAMADA",
        },
      }),
      prisma.instalacion.count({
        where: {
          fecha: { gte: mananaInicio, lte: mananaFin },
          estado: "PROGRAMADA",
        },
      }),
      prisma.instalacion.count({
        where: {
          fecha: { gte: mananaInicio, lte: mananaFin },
          estado: "PROGRAMADA",
          materialesListos: false,
        },
      }),
      prisma.instalacion.count({
        where: {
          fecha: { gte: inicioMes, lte: finMes },
          estado: "COMPLETADA",
        },
      }),
      prisma.bloqueoAgenda.count({
        where: {
          fecha: { gte: hoyInicio, lte: semanaFin },
        },
      }),
    ])

    return {
      totalMes,
      hoy,
      manana,
      materialesPendientesManana,
      completadasMes,
      bloqueosSemana,
    }
  } catch (error) {
    console.error("Error al obtener métricas de agenda:", error)
    return {
      totalMes: 0,
      hoy: 0,
      manana: 0,
      materialesPendientesManana: 0,
      completadasMes: 0,
      bloqueosSemana: 0,
    }
  }
}
