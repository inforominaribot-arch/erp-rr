// Módulo: App Medición (PWA)
// Consultas de solo-lectura con Prisma

import { prisma } from "@/lib/prisma"
import type { FiltrosMedicionInput } from "./schemas"
import type { IMedicion, IItemMedicion, IAmbiente } from "./types"

// Helper para convertir Decimales de Prisma a numbers
function serializarItem(item: any): IItemMedicion {
  return {
    id: item.id,
    ambienteId: item.ambienteId,
    productoId: item.productoId,
    descripcion: item.descripcion,
    ancho: Number(item.ancho),
    alto: Number(item.alto),
    cantidad: item.cantidad,
    caracteristicas: item.caracteristicas as any,
    observaciones: item.observaciones,
    creadoEn: item.creadoEn,
  }
}

function serializarAmbiente(amb: any): IAmbiente {
  return {
    id: amb.id,
    medicionId: amb.medicionId,
    nombre: amb.nombre,
    orden: amb.orden,
    creadoEn: amb.creadoEn,
    items: (amb.items || []).map(serializarItem),
  }
}

function serializarMedicion(med: any): IMedicion {
  return {
    id: med.id,
    clienteId: med.clienteId,
    usuarioId: med.usuarioId,
    observaciones: med.observaciones,
    sincronizado: med.sincronizado,
    creadoEn: med.creadoEn,
    actualizadoEn: med.actualizadoEn,
    cliente: med.cliente
      ? {
          id: med.cliente.id,
          nombre: med.cliente.nombre,
          telefono: med.cliente.telefono,
          email: med.cliente.email,
          direccion: med.cliente.direccion,
          localidad: med.cliente.localidad,
          estado: med.cliente.estado,
        }
      : undefined,
    usuario: med.usuario
      ? {
          id: med.usuario.id,
          nombre: med.usuario.nombre,
          email: med.usuario.email,
          rol: med.usuario.rol,
        }
      : undefined,
    ambientes: (med.ambientes || []).map(serializarAmbiente),
  }
}

// ─── Listado Paginado de Mediciones ──────────────────────────────────────────

export async function obtenerMediciones(
  filtros: Partial<FiltrosMedicionInput> = {}
) {
  const busqueda = filtros.busqueda?.trim() || ""
  const sincronizado = filtros.sincronizado || "TODOS"
  const clienteId = filtros.clienteId
  const pagina = filtros.pagina || 1
  const porPagina = filtros.porPagina || 50
  const skip = (pagina - 1) * porPagina

  const where: any = {
    ...(clienteId && { clienteId }),
    ...(sincronizado === "SINCRONIZADO" && { sincronizado: true }),
    ...(sincronizado === "PENDIENTE" && { sincronizado: false }),
    ...(busqueda && {
      OR: [
        {
          cliente: {
            nombre: { contains: busqueda, mode: "insensitive" },
          },
        },
        {
          cliente: {
            telefono: { contains: busqueda, mode: "insensitive" },
          },
        },
        {
          cliente: {
            localidad: { contains: busqueda, mode: "insensitive" },
          },
        },
        {
          cliente: {
            direccion: { contains: busqueda, mode: "insensitive" },
          },
        },
        {
          observaciones: { contains: busqueda, mode: "insensitive" },
        },
      ],
    }),
  }

  const [medicionesRaw, total] = await Promise.all([
    prisma.medicion.findMany({
      where,
      skip,
      take: porPagina,
      orderBy: { creadoEn: "desc" },
      include: {
        cliente: true,
        usuario: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        ambientes: {
          orderBy: { orden: "asc" },
          include: {
            items: true,
          },
        },
      },
    }),
    prisma.medicion.count({ where }),
  ])

  const mediciones = medicionesRaw.map(serializarMedicion)

  return {
    mediciones,
    total,
    paginas: Math.ceil(total / porPagina),
    paginaActual: pagina,
  }
}

// ─── Detalle Completo de una Medición ────────────────────────────────────────

export async function obtenerMedicionPorId(
  id: string
): Promise<IMedicion | null> {
  const med = await prisma.medicion.findUnique({
    where: { id },
    include: {
      cliente: true,
      usuario: {
        select: { id: true, nombre: true, email: true, rol: true },
      },
      ambientes: {
        orderBy: { orden: "asc" },
        include: {
          items: true,
        },
      },
    },
  })

  if (!med) return null
  return serializarMedicion(med)
}

// ─── Clientes con sus Mediciones (Para la vista dividida por Clientes) ─────────

export async function obtenerClientesConMediciones(busqueda?: string) {
  const where: any = busqueda?.trim()
    ? {
        OR: [
          { nombre: { contains: busqueda.trim(), mode: "insensitive" } },
          { telefono: { contains: busqueda.trim(), mode: "insensitive" } },
          { direccion: { contains: busqueda.trim(), mode: "insensitive" } },
          { localidad: { contains: busqueda.trim(), mode: "insensitive" } },
        ],
      }
    : {}

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { creadoEn: "desc" },
    include: {
      mediciones: {
        orderBy: { creadoEn: "desc" },
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true, rol: true },
          },
          ambientes: {
            orderBy: { orden: "asc" },
            include: {
              items: true,
            },
          },
        },
      },
    },
  })

  return clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    email: c.email,
    direccion: c.direccion,
    localidad: c.localidad,
    estado: c.estado,
    creadoEn: c.creadoEn,
    mediciones: c.mediciones.map(serializarMedicion),
  }))
}

// ─── Lista Rápida de Clientes para el Selector / Caché ────────────────────────

export async function obtenerClientesParaMedicion() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      email: true,
      direccion: true,
      localidad: true,
      estado: true,
    },
  })

  return clientes
}

// ─── Métricas Rápidas de Mediciones ──────────────────────────────────────────

export async function obtenerMetricasMediciones() {
  const [total, sincronizadas, pendientes, itemsCount] = await Promise.all([
    prisma.medicion.count(),
    prisma.medicion.count({ where: { sincronizado: true } }),
    prisma.medicion.count({ where: { sincronizado: false } }),
    prisma.itemMedicion.count(),
  ])

  return {
    total,
    sincronizadas,
    pendientes,
    totalAberturas: itemsCount,
  }
}
