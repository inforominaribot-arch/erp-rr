// Módulo: Clientes & CRM
// Consultas de solo-lectura con Prisma
// Estas funciones se usan en Server Components (no Server Actions)

import { prisma } from "@/lib/prisma"
import type { EstadoCliente } from "@/types"
import type { FiltrosClienteInput } from "./schemas"
import { ESTADOS_CLIENTE_ORDEN } from "./types"

// ─── Listado de clientes (con filtros y paginación) ───────────────────────────

export async function obtenerClientes(filtros: Partial<FiltrosClienteInput> = {}) {
  const busqueda = filtros.busqueda?.trim() || ""
  const estado = filtros.estado || "TODOS"
  const pagina = filtros.pagina || 1
  const porPagina = filtros.porPagina || 20
  const skip = (pagina - 1) * porPagina

  const where = {
    ...(busqueda && {
      OR: [
        { nombre: { contains: busqueda, mode: "insensitive" as const } },
        { telefono: { contains: busqueda, mode: "insensitive" as const } },
        { email: { contains: busqueda, mode: "insensitive" as const } },
        { direccion: { contains: busqueda, mode: "insensitive" as const } },
        { localidad: { contains: busqueda, mode: "insensitive" as const } },
      ],
    }),
    ...(estado !== "TODOS" && {
      estado: estado as EstadoCliente,
    }),
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      skip,
      take: porPagina,
      orderBy: { creadoEn: "desc" },
      include: {
        _count: {
          select: {
            mediciones: true,
            presupuestos: true,
          },
        },
      },
    }),
    prisma.cliente.count({ where }),
  ])

  return {
    clientes,
    total,
    paginas: Math.ceil(total / porPagina),
    paginaActual: pagina,
  }
}

// ─── Detalle completo de un cliente ──────────────────────────────────────────

export async function obtenerClientePorId(id: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      mediciones: {
        orderBy: { creadoEn: "desc" },
        include: {
          _count: {
            select: { ambientes: true },
          },
        },
      },
      presupuestos: {
        orderBy: { creadoEn: "desc" },
        include: {
          comanda: {
            select: {
              id: true,
              numero: true,
              estado: true,
            },
          },
        },
      },
      visitas: {
        orderBy: [{ fecha: "desc" }, { horaInicio: "desc" }],
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
    },
  })

  if (!cliente) return null

  return {
    ...cliente,
    presupuestos: cliente.presupuestos.map((p) => ({
      ...p,
      subtotal: Number(p.subtotal),
      descuento: Number(p.descuento),
      total: Number(p.total),
    })),
  }
}

// ─── Clientes agrupados por estado (para el Pipeline/Kanban) ─────────────────

export async function obtenerClientesParaPipeline() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { actualizadoEn: "desc" },
    include: {
      _count: {
        select: {
          mediciones: true,
          presupuestos: true,
        },
      },
    },
  })

  // Agrupar por estado manteniendo el orden definido
  const columnas = ESTADOS_CLIENTE_ORDEN.map((estado) => ({
    estado,
    clientes: clientes.filter((c) => c.estado === estado),
  }))

  return columnas
}

// ─── Conteo por estado (para estadísticas rápidas) ───────────────────────────

export async function obtenerConteosPorEstado() {
  const conteos = await prisma.cliente.groupBy({
    by: ["estado"],
    _count: { _all: true },
  })

  const resultado: Partial<Record<EstadoCliente, number>> = {}
  for (const c of conteos) {
    resultado[c.estado] = c._count._all
  }
  return resultado
}
