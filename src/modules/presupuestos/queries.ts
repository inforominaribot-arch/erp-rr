// Módulo: Presupuestos
// Consultas de solo lectura con Prisma y serialización Decimal -> number

import { prisma } from "@/lib/prisma"
import type { Prisma, ItemPresupuesto, Presupuesto, Cliente, Comanda } from "@prisma/client"
import type { FiltrosPresupuestoInput } from "./schemas"
import type {
  IPresupuesto,
  IItemPresupuesto,
  IPresupuestoDetalle,
  IMetricasPresupuestos,
  IMedicionPendientePresupuesto,
} from "./types"

type PresupuestoConRelaciones = Presupuesto & {
  cliente?: Cliente | null
  items?: ItemPresupuesto[]
  comanda?: Pick<Comanda, "id" | "numero" | "estado"> | null
}

// ─── Helpers de Serialización (Decimal -> number) ────────────────────────────

function serializarItemPresupuesto(item: ItemPresupuesto): IItemPresupuesto {
  return {
    id: item.id,
    presupuestoId: item.presupuestoId,
    itemMedicionId: item.itemMedicionId || null,
    descripcion: item.descripcion,
    ambiente: item.ambiente || "General",
    ancho: Number(item.ancho),
    alto: Number(item.alto),
    cantidad: item.cantidad,
    precioUnitario: Number(item.precioUnitario),
    subtotal: Number(item.subtotal),
    aceptado: Boolean(item.aceptado),
    creadoEn: item.creadoEn,
  }
}

function serializarPresupuesto(p: PresupuestoConRelaciones): IPresupuesto {
  return {
    id: p.id,
    clienteId: p.clienteId,
    numero: p.numero,
    estado: p.estado,
    subtotal: Number(p.subtotal),
    descuento: Number(p.descuento),
    total: Number(p.total),
    notas: p.notas || null,
    validezDias: p.validezDias || 14,
    creadoEn: p.creadoEn,
    actualizadoEn: p.actualizadoEn,
    cliente: p.cliente
      ? {
          id: p.cliente.id,
          nombre: p.cliente.nombre,
          telefono: p.cliente.telefono || null,
          email: p.cliente.email || null,
          direccion: p.cliente.direccion || null,
          localidad: p.cliente.localidad || null,
          estado: p.cliente.estado,
        }
      : undefined,
    items: (p.items || []).map(serializarItemPresupuesto),
    comanda: p.comanda
      ? {
          id: p.comanda.id,
          numero: p.comanda.numero,
          estado: p.comanda.estado,
        }
      : null,
  }
}

// ─── Listado Paginado y Filtrado ─────────────────────────────────────────────

export async function obtenerPresupuestos(
  filtros: Partial<FiltrosPresupuestoInput> = {}
) {
  const busqueda = filtros.busqueda?.trim() || ""
  const estado = filtros.estado || "TODOS"
  const clienteId = filtros.clienteId
  const pagina = filtros.pagina || 1
  const porPagina = filtros.porPagina || 50
  const skip = (pagina - 1) * porPagina

  // Si la búsqueda contiene número ej #PRE-0004 o 4
  let numeroBusqueda: number | null = null
  const limpioNum = busqueda.replace(/#?PRE-?/i, "").trim()
  if (limpioNum && /^\d+$/.test(limpioNum)) {
    numeroBusqueda = parseInt(limpioNum, 10)
  }

  const where: Prisma.PresupuestoWhereInput = {
    ...(clienteId && { clienteId }),
    ...(estado !== "TODOS" && { estado }),
    ...(busqueda && {
      OR: [
        ...(numeroBusqueda !== null ? [{ numero: numeroBusqueda }] : []),
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
          notas: { contains: busqueda, mode: "insensitive" },
        },
      ],
    }),
  }

  const [presupuestosRaw, total] = await Promise.all([
    prisma.presupuesto.findMany({
      where,
      skip,
      take: porPagina,
      orderBy: { creadoEn: "desc" },
      include: {
        cliente: true,
        items: {
          orderBy: { creadoEn: "asc" },
        },
        comanda: {
          select: { id: true, numero: true, estado: true },
        },
      },
    }),
    prisma.presupuesto.count({ where }),
  ])

  const presupuestos = presupuestosRaw.map(serializarPresupuesto)

  return {
    presupuestos,
    total,
    paginas: Math.ceil(total / porPagina),
    paginaActual: pagina,
  }
}

// ─── Detalle Completo de Presupuesto por ID ──────────────────────────────────

export async function obtenerPresupuestoPorId(
  id: string
): Promise<IPresupuestoDetalle | null> {
  const p = await prisma.presupuesto.findUnique({
    where: { id },
    include: {
      cliente: true,
      items: {
        orderBy: { creadoEn: "asc" },
      },
      comanda: {
        select: { id: true, numero: true, estado: true },
      },
    },
  })

  if (!p) return null
  return serializarPresupuesto(p) as IPresupuestoDetalle
}

// ─── Métricas Rápidas del Módulo ─────────────────────────────────────────────

export async function obtenerMetricasPresupuestos(): Promise<IMetricasPresupuestos> {
  const [
    totalPresupuestos,
    borradores,
    enviados,
    aceptadosTotal,
    aceptadosParcial,
    rechazados,
    montosRaw,
  ] = await Promise.all([
    prisma.presupuesto.count(),
    prisma.presupuesto.count({ where: { estado: "BORRADOR" } }),
    prisma.presupuesto.count({ where: { estado: "ENVIADO" } }),
    prisma.presupuesto.count({ where: { estado: "ACEPTADO_TOTAL" } }),
    prisma.presupuesto.count({ where: { estado: "ACEPTADO_PARCIAL" } }),
    prisma.presupuesto.count({ where: { estado: "RECHAZADO" } }),
    prisma.presupuesto.findMany({
      select: {
        estado: true,
        total: true,
      },
    }),
  ])

  const aceptados = aceptadosTotal + aceptadosParcial

  let montoTotalPresupuestado = 0
  let montoTotalAceptado = 0

  for (const item of montosRaw) {
    const totalNum = Number(item.total) || 0
    montoTotalPresupuestado += totalNum
    if (
      item.estado === "ACEPTADO_TOTAL" ||
      item.estado === "ACEPTADO_PARCIAL"
    ) {
      montoTotalAceptado += totalNum
    }
  }

  const tasaConversion =
    totalPresupuestos > 0
      ? Math.round((aceptados / totalPresupuestos) * 100)
      : 0

  return {
    totalPresupuestos,
    borradores,
    enviados,
    aceptados,
    rechazados,
    montoTotalPresupuestado,
    montoTotalAceptado,
    tasaConversion,
  }
}

// ─── Lista de Clientes para el Selector ──────────────────────────────────────

export async function obtenerClientesParaPresupuesto() {
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
      _count: {
        select: {
          mediciones: true,
          presupuestos: true,
        },
      },
    },
  })

  return clientes
}

// ─── Mediciones de Clientes Pendientes de Presupuestar ───────────────────────

export async function obtenerMedicionesPendientesPresupuesto(): Promise<
  IMedicionPendientePresupuesto[]
> {
  const clientes = await prisma.cliente.findMany({
    where: {
      estado: "MEDICION_TOMADA",
      mediciones: {
        some: {},
      },
    },
    orderBy: { actualizadoEn: "desc" },
    include: {
      mediciones: {
        orderBy: { creadoEn: "desc" },
        include: {
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

  const lista: IMedicionPendientePresupuesto[] = []

  for (const c of clientes) {
    for (const m of c.mediciones) {
      let totalCortinas = 0
      const ambientesNombres: string[] = []

      for (const amb of m.ambientes) {
        ambientesNombres.push(amb.nombre)
        for (const item of amb.items) {
          totalCortinas += item.cantidad || 1
        }
      }

      lista.push({
        medicionId: m.id,
        clienteId: c.id,
        clienteNombre: c.nombre,
        clienteTelefono: c.telefono,
        clienteDireccion: c.direccion,
        clienteLocalidad: c.localidad,
        creadoEn: m.creadoEn,
        totalAmbientes: m.ambientes.length,
        totalCortinas,
        ambientesNombres,
        observaciones: m.observaciones,
      })
    }
  }

  return lista
}

export async function obtenerConteoMedicionesPendientes(): Promise<number> {
  const conteo = await prisma.medicion.count({
    where: {
      cliente: {
        estado: "MEDICION_TOMADA",
      },
    },
  })
  return conteo
}

