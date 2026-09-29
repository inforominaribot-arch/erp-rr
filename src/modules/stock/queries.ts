// Módulo: Stock & Inventario
// Consultas de Base de Datos con Prisma ORM

import { prisma } from "@/lib/prisma"
import type {
  IProducto,
  IMovimientoStock,
  IMetricasStock,
  IFiltrosStock,
  IFiltrosMovimientos,
  EstadoStockNivel,
} from "./types"

function calcularEstadoStock(actual: number, minimo: number): EstadoStockNivel {
  if (actual <= 0) return "AGOTADO"
  if (actual <= minimo) return "CRITICO"
  if (minimo > 0 && actual <= minimo * 1.3) return "BAJO"
  return "NORMAL"
}

export async function obtenerProductos(
  filtros?: IFiltrosStock,
  ocultarCostos: boolean = false
): Promise<IProducto[]> {
  try {
    const where: any = {}

    if (filtros?.activo !== undefined) {
      where.activo = filtros.activo
    }

    if (filtros?.unidadMedida && filtros.unidadMedida !== "TODAS") {
      where.unidadMedida = filtros.unidadMedida
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      const q = filtros.busqueda.trim()
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { codigo: { contains: q, mode: "insensitive" } },
        { descripcion: { contains: q, mode: "insensitive" } },
      ]
    }

    const productosDb = await prisma.producto.findMany({
      where,
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    })

    const lista = productosDb.map((p) => {
      const actual = Number(p.stockActual)
      const minimo = Number(p.stockMinimo)
      const estadoStock = calcularEstadoStock(actual, minimo)

      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        unidadMedida: p.unidadMedida,
        stockActual: actual,
        stockMinimo: minimo,
        precio: ocultarCostos ? null : p.precio ? Number(p.precio) : null,
        imagen: p.imagen,
        activo: p.activo,
        creadoEn: p.creadoEn.toISOString(),
        actualizadoEn: p.actualizadoEn.toISOString(),
        estadoStock,
      }
    })

    if (filtros?.soloCriticos) {
      return lista.filter(
        (p) => p.estadoStock === "CRITICO" || p.estadoStock === "AGOTADO"
      )
    }

    return lista
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

export async function obtenerProductoPorId(
  id: string,
  ocultarCostos: boolean = false
): Promise<IProducto | null> {
  try {
    const p = await prisma.producto.findUnique({
      where: { id },
    })

    if (!p) return null

    const actual = Number(p.stockActual)
    const minimo = Number(p.stockMinimo)

    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      unidadMedida: p.unidadMedida,
      stockActual: actual,
      stockMinimo: minimo,
      precio: ocultarCostos ? null : p.precio ? Number(p.precio) : null,
      imagen: p.imagen,
      activo: p.activo,
      creadoEn: p.creadoEn.toISOString(),
      actualizadoEn: p.actualizadoEn.toISOString(),
      estadoStock: calcularEstadoStock(actual, minimo),
    }
  } catch (error) {
    console.error(`Error al obtener producto ${id}:`, error)
    return null
  }
}

export async function obtenerMetricasStock(
  ocultarCostos: boolean = false
): Promise<IMetricasStock> {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: {
        stockActual: true,
        stockMinimo: true,
        precio: true,
      },
    })

    let criticos = 0
    let agotados = 0
    let valorTotal = 0

    productos.forEach((p) => {
      const act = Number(p.stockActual)
      const min = Number(p.stockMinimo)
      const precio = p.precio ? Number(p.precio) : 0

      if (act <= 0) {
        agotados++
      } else if (act <= min) {
        criticos++
      }

      if (precio > 0 && act > 0) {
        valorTotal += act * precio
      }
    })

    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const movimientosMes = await prisma.movimientoStock.count({
      where: {
        creadoEn: { gte: inicioMes },
      },
    })

    return {
      totalProductos: productos.length,
      productosCriticos: criticos,
      productosAgotados: agotados,
      movimientosMes,
      valorTotalInventario: ocultarCostos ? null : Math.round(valorTotal),
    }
  } catch (error) {
    console.error("Error al obtener métricas de stock:", error)
    return {
      totalProductos: 0,
      productosCriticos: 0,
      productosAgotados: 0,
      movimientosMes: 0,
      valorTotalInventario: null,
    }
  }
}

export async function obtenerMovimientosStock(
  filtros?: IFiltrosMovimientos
): Promise<IMovimientoStock[]> {
  try {
    const where: any = {}

    if (filtros?.productoId && filtros.productoId !== "TODOS") {
      where.productoId = filtros.productoId
    }

    if (filtros?.tipo && filtros.tipo !== "TODOS") {
      where.tipo = filtros.tipo
    }

    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      where.creadoEn = {}
      if (filtros.fechaDesde) {
        where.creadoEn.gte = new Date(filtros.fechaDesde)
      }
      if (filtros.fechaHasta) {
        const hasta = new Date(filtros.fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        where.creadoEn.lte = hasta
      }
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      const q = filtros.busqueda.trim()
      where.OR = [
        { motivo: { contains: q, mode: "insensitive" } },
        { referenciaId: { contains: q, mode: "insensitive" } },
        { producto: { nombre: { contains: q, mode: "insensitive" } } },
        { producto: { codigo: { contains: q, mode: "insensitive" } } },
      ]
    }

    const movimientosDb = await prisma.movimientoStock.findMany({
      where,
      include: {
        producto: {
          select: {
            nombre: true,
            codigo: true,
            unidadMedida: true,
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: 150,
    })

    return movimientosDb.map((m) => ({
      id: m.id,
      productoId: m.productoId,
      productoNombre: m.producto.nombre,
      productoCodigo: m.producto.codigo,
      unidadMedida: m.producto.unidadMedida,
      tipo: m.tipo,
      cantidad: Number(m.cantidad),
      stockAnterior: Number(m.stockAnterior),
      stockNuevo: Number(m.stockNuevo),
      motivo: m.motivo,
      referenciaId: m.referenciaId,
      referenciaTipo: m.referenciaTipo,
      creadoEn: m.creadoEn.toISOString(),
    }))
  } catch (error) {
    console.error("Error al obtener movimientos de stock:", error)
    return []
  }
}

export async function obtenerProveedoresActivos() {
  try {
    return await prisma.proveedor.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        contacto: true,
        telefono: true,
      },
      orderBy: { nombre: "asc" },
    })
  } catch (error) {
    console.error("Error al obtener proveedores:", error)
    return []
  }
}
