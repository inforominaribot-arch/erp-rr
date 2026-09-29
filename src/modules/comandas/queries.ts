// Módulo: Comandas & Producción
// Consultas de solo lectura a la base de datos mediante Prisma ORM

import { prisma } from "@/lib/prisma"
import type { Prisma, Comanda, ItemComanda, Presupuesto, Cliente } from "@prisma/client"
import type { FiltrosComandasInput, FiltrosProduccionInput } from "./schemas"
import type {
  IComandaConRelaciones,
  IComandaDetalle,
  IItemComanda,
  IItemProduccion,
  IMetricasComandas,
  IMetricasProduccion,
  IPresupuestoAceptadoResumen,
} from "./types"
import type { ICaracteristicasItem } from "@/modules/mediciones/types"

// ─── Helpers de Serialización ────────────────────────────────────────────────

function serializarItemComanda(item: ItemComanda): IItemComanda {
  return {
    id: item.id,
    comandaId: item.comandaId,
    productoId: item.productoId,
    descripcion: item.descripcion,
    ambiente: item.ambiente,
    ancho: Number(item.ancho),
    alto: Number(item.alto),
    cantidad: item.cantidad,
    tipo: item.tipo,
    caracteristicas: (item.caracteristicas as unknown as ICaracteristicasItem) || null,
    observaciones: item.observaciones,
    completado: item.completado,
    creadoEn: item.creadoEn,
  }
}

// ─── 1. Obtener Comandas (Listado con Filtros) ───────────────────────────────

export async function obtenerComandas(filtros?: FiltrosComandasInput): Promise<{
  comandas: IComandaConRelaciones[]
  total: number
}> {
  try {
    const where: Prisma.ComandaWhereInput = {}

    // Filtro por estado
    if (filtros?.estado && filtros.estado !== "TODOS") {
      where.estado = filtros.estado as any
    }

    // Filtro por texto de búsqueda
    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      const term = filtros.busqueda.trim()
      const termNum = parseInt(term, 10)

      where.OR = [
        {
          presupuesto: {
            cliente: {
              nombre: { contains: term, mode: "insensitive" },
            },
          },
        },
        {
          presupuesto: {
            cliente: {
              telefono: { contains: term, mode: "insensitive" },
            },
          },
        },
        {
          notas: { contains: term, mode: "insensitive" },
        },
        {
          items: {
            some: {
              OR: [
                { descripcion: { contains: term, mode: "insensitive" } },
                { ambiente: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
        ...(!isNaN(termNum) ? [{ numero: termNum }] : []),
      ]
    }

    const total = await prisma.comanda.count({ where })

    const skip =
      filtros?.pagina && filtros?.porPagina
        ? (filtros.pagina - 1) * filtros.porPagina
        : 0
    const take = filtros?.porPagina ?? 50

    const comandasDb = await prisma.comanda.findMany({
      where,
      include: {
        presupuesto: {
          select: {
            id: true,
            numero: true,
            estado: true,
            total: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
                telefono: true,
                email: true,
                direccion: true,
                localidad: true,
                estado: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            completado: true,
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      skip,
      take,
    })

    const comandas: IComandaConRelaciones[] = comandasDb.map((c) => {
      const totalItems = c.items.length
      const completados = c.items.filter((i) => i.completado).length

      return {
        id: c.id,
        presupuestoId: c.presupuestoId,
        numero: c.numero,
        estado: c.estado,
        notas: c.notas,
        fechaEntrega: c.fechaEntrega,
        creadoEn: c.creadoEn,
        actualizadoEn: c.actualizadoEn,
        presupuesto: {
          id: c.presupuesto.id,
          numero: c.presupuesto.numero,
          estado: c.presupuesto.estado,
          total: Number(c.presupuesto.total),
          cliente: c.presupuesto.cliente,
        },
        _count: {
          items: totalItems,
        },
        itemsCompletadosCount: completados,
        itemsTotalCount: totalItems,
      }
    })

    return { comandas, total }
  } catch (error) {
    console.error("Error al obtener comandas:", error)
    return { comandas: [], total: 0 }
  }
}

// ─── 2. Obtener Detalle de Comanda por ID ────────────────────────────────────

export async function obtenerComandaPorId(
  id: string
): Promise<IComandaDetalle | null> {
  try {
    if (!id || typeof id !== "string") return null

    const c = await prisma.comanda.findUnique({
      where: { id },
      include: {
        presupuesto: {
          include: {
            cliente: true,
          },
        },
        items: {
          orderBy: [{ ambiente: "asc" }, { creadoEn: "asc" }],
        },
        instalacion: {
          select: {
            id: true,
            fecha: true,
            estado: true,
          },
        },
      },
    })

    if (!c) return null

    return {
      id: c.id,
      presupuestoId: c.presupuestoId,
      numero: c.numero,
      estado: c.estado,
      notas: c.notas,
      fechaEntrega: c.fechaEntrega,
      creadoEn: c.creadoEn,
      actualizadoEn: c.actualizadoEn,
      presupuesto: {
        id: c.presupuesto.id,
        numero: c.presupuesto.numero,
        estado: c.presupuesto.estado,
        total: Number(c.presupuesto.total),
        validezDias: c.presupuesto.validezDias,
        cliente: {
          id: c.presupuesto.cliente.id,
          nombre: c.presupuesto.cliente.nombre,
          telefono: c.presupuesto.cliente.telefono,
          email: c.presupuesto.cliente.email,
          direccion: c.presupuesto.cliente.direccion,
          localidad: c.presupuesto.cliente.localidad,
          notas: c.presupuesto.cliente.notas,
          estado: c.presupuesto.cliente.estado,
        },
      },
      items: c.items.map(serializarItemComanda),
      instalacion: c.instalacion
        ? {
            id: c.instalacion.id,
            fecha: c.instalacion.fecha,
            estado: c.instalacion.estado,
          }
        : null,
    }
  } catch (error) {
    console.error("Error al obtener detalle de comanda:", error)
    return null
  }
}

// ─── 3. Obtener Métricas Generales de Comandas ───────────────────────────────

export async function obtenerMetricasComandas(): Promise<IMetricasComandas> {
  try {
    const [
      totalComandas,
      pendientes,
      enProduccion,
      esperandoProveedor,
      listasParaInstalar,
      instaladas,
      itemsFabricarPendientes,
      itemsProveedorPendientes,
    ] = await Promise.all([
      prisma.comanda.count(),
      prisma.comanda.count({ where: { estado: "PENDIENTE" } }),
      prisma.comanda.count({ where: { estado: "EN_PRODUCCION" } }),
      prisma.comanda.count({ where: { estado: "ESPERANDO_PROVEEDOR" } }),
      prisma.comanda.count({ where: { estado: "LISTO_PARA_INSTALAR" } }),
      prisma.comanda.count({ where: { estado: "INSTALADO" } }),
      prisma.itemComanda.count({
        where: {
          tipo: "FABRICAR",
          completado: false,
          comanda: { estado: { not: "INSTALADO" } },
        },
      }),
      prisma.itemComanda.count({
        where: {
          tipo: "PEDIR_PROVEEDOR",
          completado: false,
          comanda: { estado: { not: "INSTALADO" } },
        },
      }),
    ])

    return {
      totalComandas,
      pendientes,
      enProduccion,
      esperandoProveedor,
      listasParaInstalar,
      instaladas,
      itemsPendientesFabricar: itemsFabricarPendientes,
      itemsEsperandoProveedor: itemsProveedorPendientes,
    }
  } catch (error) {
    console.error("Error al obtener métricas de comandas:", error)
    return {
      totalComandas: 0,
      pendientes: 0,
      enProduccion: 0,
      esperandoProveedor: 0,
      listasParaInstalar: 0,
      instaladas: 0,
      itemsPendientesFabricar: 0,
      itemsEsperandoProveedor: 0,
    }
  }
}

// ─── 4. Obtener Métricas Operativas de Taller (Producción) ───────────────────

export async function obtenerMetricasProduccion(): Promise<IMetricasProduccion> {
  try {
    // Comandas activas en taller (no instaladas)
    const comandasActivas = await prisma.comanda.count({
      where: { estado: { not: "INSTALADO" } },
    })

    const itemsEnTaller = await prisma.itemComanda.findMany({
      where: {
        comanda: { estado: { not: "INSTALADO" } },
      },
      select: {
        id: true,
        tipo: true,
        completado: true,
      },
    })

    const totalItems = itemsEnTaller.length
    const itemsCompletados = itemsEnTaller.filter((i) => i.completado).length
    const itemsPendientes = totalItems - itemsCompletados
    const itemsFabricarPendientes = itemsEnTaller.filter(
      (i) => i.tipo === "FABRICAR" && !i.completado
    ).length
    const itemsProveedorPendientes = itemsEnTaller.filter(
      (i) => i.tipo === "PEDIR_PROVEEDOR" && !i.completado
    ).length
    const porcentajeCompletado =
      totalItems > 0 ? Math.round((itemsCompletados / totalItems) * 100) : 100

    return {
      totalItems,
      itemsPendientes,
      itemsCompletados,
      itemsFabricarPendientes,
      itemsProveedorPendientes,
      porcentajeCompletado,
      comandasActivas,
    }
  } catch (error) {
    console.error("Error al obtener métricas de producción:", error)
    return {
      totalItems: 0,
      itemsPendientes: 0,
      itemsCompletados: 0,
      itemsFabricarPendientes: 0,
      itemsProveedorPendientes: 0,
      porcentajeCompletado: 0,
      comandasActivas: 0,
    }
  }
}

// ─── 5. Obtener Ítems para el Tablero Visual de Taller (/produccion) ─────────

export async function obtenerItemsProduccion(
  filtros?: FiltrosProduccionInput
): Promise<IItemProduccion[]> {
  try {
    const where: Prisma.ItemComandaWhereInput = {
      comanda: { estado: { not: "INSTALADO" } },
    }

    if (filtros?.tipo && filtros.tipo !== "TODOS") {
      where.tipo = filtros.tipo as any
    }

    if (filtros?.estadoCompletado === "PENDIENTES") {
      where.completado = false
    } else if (filtros?.estadoCompletado === "COMPLETADOS") {
      where.completado = true
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      const term = filtros.busqueda.trim()
      const termNum = parseInt(term, 10)

      where.OR = [
        { descripcion: { contains: term, mode: "insensitive" } },
        { ambiente: { contains: term, mode: "insensitive" } },
        {
          comanda: {
            presupuesto: {
              cliente: {
                nombre: { contains: term, mode: "insensitive" },
              },
            },
          },
        },
        ...(!isNaN(termNum) ? [{ comanda: { numero: termNum } }] : []),
      ]
    }

    const itemsDb = await prisma.itemComanda.findMany({
      where,
      include: {
        comanda: {
          select: {
            id: true,
            numero: true,
            estado: true,
            fechaEntrega: true,
            presupuesto: {
              select: {
                cliente: {
                  select: {
                    id: true,
                    nombre: true,
                    telefono: true,
                    direccion: true,
                    localidad: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { completado: "asc" },
        { comanda: { fechaEntrega: "asc" } },
        { creadoEn: "desc" },
      ],
    })

    return itemsDb.map((item) => ({
      id: item.id,
      comandaId: item.comanda.id,
      comandaNumero: item.comanda.numero,
      comandaEstado: item.comanda.estado,
      fechaEntrega: item.comanda.fechaEntrega,
      clienteId: item.comanda.presupuesto.cliente.id,
      clienteNombre: item.comanda.presupuesto.cliente.nombre,
      clienteTelefono: item.comanda.presupuesto.cliente.telefono,
      clienteDireccion: item.comanda.presupuesto.cliente.direccion,
      clienteLocalidad: item.comanda.presupuesto.cliente.localidad,
      ambiente: item.ambiente || "General",
      descripcion: item.descripcion,
      ancho: Number(item.ancho),
      alto: Number(item.alto),
      cantidad: item.cantidad,
      tipo: item.tipo,
      completado: item.completado,
      caracteristicas: (item.caracteristicas as unknown as ICaracteristicasItem) || null,
      observaciones: item.observaciones,
      creadoEn: item.creadoEn,
    }))
  } catch (error) {
    console.error("Error al obtener items de producción:", error)
    return []
  }
}

// ─── 6. Obtener Presupuestos Aceptados sin Comanda ───────────────────────────

export async function obtenerPresupuestosAceptadosSinComanda(): Promise<
  IPresupuestoAceptadoResumen[]
> {
  try {
    const presupuestos = await prisma.presupuesto.findMany({
      where: {
        estado: { in: ["ACEPTADO_TOTAL", "ACEPTADO_PARCIAL"] },
        comanda: null, // Solo los que aún no tienen comanda generada
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            direccion: true,
            localidad: true,
          },
        },
        items: {
          include: {
            itemMedicion: {
              select: {
                caracteristicas: true,
                observaciones: true,
              },
            },
          },
          orderBy: { ambiente: "asc" },
        },
      },
      orderBy: { creadoEn: "desc" },
    })

    return presupuestos.map((p) => {
      // Filtrar ítems aceptados (si es total, todos; si es parcial, solo aceptados)
      const itemsAceptadosFiltrados =
        p.estado === "ACEPTADO_TOTAL"
          ? p.items
          : p.items.filter((it) => it.aceptado)

      return {
        id: p.id,
        numero: p.numero,
        estado: p.estado,
        total: Number(p.total),
        creadoEn: p.creadoEn,
        cliente: p.cliente,
        itemsAceptados: itemsAceptadosFiltrados.map((it) => ({
          id: it.id,
          itemMedicionId: it.itemMedicionId,
          descripcion: it.descripcion,
          ambiente: it.ambiente || "General",
          ancho: Number(it.ancho),
          alto: Number(it.alto),
          cantidad: it.cantidad,
          caracteristicas:
            (it.itemMedicion?.caracteristicas as unknown as ICaracteristicasItem) || null,
        })),
      }
    })
  } catch (error) {
    console.error("Error al obtener presupuestos aceptados sin comanda:", error)
    return []
  }
}
