// Módulo: Proveedores & Compras
// Consultas de solo lectura a la base de datos mediante Prisma ORM

import { prisma } from "@/lib/prisma"
import type { Prisma, Proveedor, OrdenCompra, ItemOrdenCompra } from "@prisma/client"
import type {
  IProveedor,
  IProductoProveedor,
  IOrdenCompra,
  IItemOrdenCompra,
  IMetricasProveedoresYCompras,
  ISugerenciaReposicionItem,
  IReposicionPorProveedor,
  IFiltrosProveedores,
  IFiltrosOrdenesCompra,
} from "./types"
import { formatearNumeroOC } from "./types"

// ─── Helpers de Serialización ────────────────────────────────────────────────

function serializarItemOrden(
  item: any,
  ocultarCostos: boolean = false
): IItemOrdenCompra {
  const pedida = Number(item.cantidadPedida)
  const recibida = Number(item.cantidadRecibida || 0)
  const unitario =
    !ocultarCostos && item.precioUnitario !== null && item.precioUnitario !== undefined
      ? Number(item.precioUnitario)
      : null
  const subtotal = unitario !== null ? pedida * unitario : null

  return {
    id: item.id,
    ordenCompraId: item.ordenCompraId,
    productoId: item.productoId,
    cantidadPedida: pedida,
    cantidadRecibida: recibida,
    precioUnitario: unitario,
    subtotal,
    creadoEn: item.creadoEn ? item.creadoEn.toISOString() : new Date().toISOString(),
    producto: item.producto
      ? {
          id: item.producto.id,
          codigo: item.producto.codigo,
          nombre: item.producto.nombre,
          unidadMedida: item.producto.unidadMedida,
          stockActual: Number(item.producto.stockActual),
          stockMinimo: Number(item.producto.stockMinimo),
          precio:
            !ocultarCostos && item.producto.precio
              ? Number(item.producto.precio)
              : null,
          imagen: item.producto.imagen,
        }
      : undefined,
  }
}

function serializarOrdenCompra(
  oc: any,
  ocultarCostos: boolean = false
): IOrdenCompra {
  const itemsSerializados = (oc.items || []).map((it: any) =>
    serializarItemOrden(it, ocultarCostos)
  )

  const totalItems = itemsSerializados.length
  let totalRecibidos = 0
  let cantPedidaSum = 0
  let cantRecibidaSum = 0

  for (const it of itemsSerializados) {
    cantPedidaSum += it.cantidadPedida
    cantRecibidaSum += Math.min(it.cantidadRecibida, it.cantidadPedida)
    if (it.cantidadRecibida >= it.cantidadPedida && it.cantidadPedida > 0) {
      totalRecibidos++
    }
  }

  const progresoRecepcion =
    cantPedidaSum > 0 ? Math.round((cantRecibidaSum / cantPedidaSum) * 100) : 0

  return {
    id: oc.id,
    proveedorId: oc.proveedorId,
    numero: oc.numero,
    numeroFormateado: formatearNumeroOC(oc.numero),
    estado: oc.estado,
    notas: oc.notas,
    fotoRemito: oc.fotoRemito,
    total: !ocultarCostos && oc.total ? Number(oc.total) : null,
    creadoEn: oc.creadoEn.toISOString(),
    actualizadoEn: oc.actualizadoEn.toISOString(),
    proveedor: {
      id: oc.proveedor.id,
      nombre: oc.proveedor.nombre,
      contacto: oc.proveedor.contacto,
      telefono: oc.proveedor.telefono,
      email: oc.proveedor.email,
      direccion: oc.proveedor.direccion,
    },
    items: itemsSerializados,
    progresoRecepcion,
    totalItems,
    totalRecibidos,
  }
}

// ─── 1. Listado de Proveedores ───────────────────────────────────────────────

export async function obtenerProveedores(
  filtros?: IFiltrosProveedores
): Promise<IProveedor[]> {
  try {
    const where: Prisma.ProveedorWhereInput = {}

    if (filtros?.activo !== undefined) {
      where.activo = filtros.activo
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      const q = filtros.busqueda.trim()
      where.OR = [
        { nombre: { contains: q, mode: "insensitive" } },
        { contacto: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
        { direccion: { contains: q, mode: "insensitive" } },
      ]
    }

    const proveedoresDb = await prisma.proveedor.findMany({
      where,
      include: {
        _count: {
          select: {
            productos: true,
            ordenesCompra: true,
          },
        },
      },
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    })

    return proveedoresDb.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      contacto: p.contacto,
      telefono: p.telefono,
      email: p.email,
      direccion: p.direccion,
      notas: p.notas,
      activo: p.activo,
      creadoEn: p.creadoEn.toISOString(),
      actualizadoEn: p.actualizadoEn.toISOString(),
      _count: p._count,
    }))
  } catch (error) {
    console.error("Error al obtener proveedores:", error)
    return []
  }
}

// ─── 2. Detalle de Proveedor por ID ──────────────────────────────────────────

export async function obtenerProveedorPorId(
  id: string,
  ocultarCostos: boolean = false
): Promise<{
  proveedor: IProveedor
  productosProvistos: IProductoProveedor[]
  ordenesCompra: IOrdenCompra[]
} | null> {
  try {
    const p = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productos: true,
            ordenesCompra: true,
          },
        },
        productos: {
          include: {
            producto: true,
          },
          orderBy: [{ esPrincipal: "desc" }, { producto: { nombre: "asc" } }],
        },
        ordenesCompra: {
          include: {
            proveedor: true,
            items: {
              include: {
                producto: true,
              },
            },
          },
          orderBy: { creadoEn: "desc" },
          take: 20,
        },
      },
    })

    if (!p) return null

    const proveedor: IProveedor = {
      id: p.id,
      nombre: p.nombre,
      contacto: p.contacto,
      telefono: p.telefono,
      email: p.email,
      direccion: p.direccion,
      notas: p.notas,
      activo: p.activo,
      creadoEn: p.creadoEn.toISOString(),
      actualizadoEn: p.actualizadoEn.toISOString(),
      _count: p._count,
    }

    const productosProvistos: IProductoProveedor[] = p.productos.map((pp) => ({
      id: pp.id,
      productoId: pp.productoId,
      proveedorId: pp.proveedorId,
      codigoProveedor: pp.codigoProveedor,
      precioUltimo:
        !ocultarCostos && pp.precioUltimo ? Number(pp.precioUltimo) : null,
      esPrincipal: pp.esPrincipal,
      producto: pp.producto
        ? {
            id: pp.producto.id,
            codigo: pp.producto.codigo,
            nombre: pp.producto.nombre,
            unidadMedida: pp.producto.unidadMedida,
            stockActual: Number(pp.producto.stockActual),
            stockMinimo: Number(pp.producto.stockMinimo),
            precio:
              !ocultarCostos && pp.producto.precio
                ? Number(pp.producto.precio)
                : null,
            imagen: pp.producto.imagen,
            activo: pp.producto.activo,
          }
        : undefined,
    }))

    const ordenesCompra: IOrdenCompra[] = p.ordenesCompra.map((oc) =>
      serializarOrdenCompra(oc, ocultarCostos)
    )

    return {
      proveedor,
      productosProvistos,
      ordenesCompra,
    }
  } catch (error) {
    console.error(`Error al obtener proveedor ${id}:`, error)
    return null
  }
}

// ─── 3. Listado de Órdenes de Compra ──────────────────────────────────────────

export async function obtenerOrdenesCompra(
  filtros?: IFiltrosOrdenesCompra,
  ocultarCostos: boolean = false
): Promise<IOrdenCompra[]> {
  try {
    const where: Prisma.OrdenCompraWhereInput = {}

    if (filtros?.estado && filtros.estado !== "TODAS") {
      where.estado = filtros.estado
    }

    if (filtros?.proveedorId) {
      where.proveedorId = filtros.proveedorId
    }

    if (filtros?.busqueda && filtros.busqueda.trim() !== "") {
      const q = filtros.busqueda.trim()
      const nro = parseInt(q.replace(/\D/g, ""), 10)

      where.OR = [
        { proveedor: { nombre: { contains: q, mode: "insensitive" } } },
        { notas: { contains: q, mode: "insensitive" } },
        ...(!isNaN(nro) ? [{ numero: nro }] : []),
      ]
    }

    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      where.creadoEn = {
        ...(filtros.fechaDesde && { gte: new Date(filtros.fechaDesde) }),
        ...(filtros.fechaHasta && {
          lte: new Date(`${filtros.fechaHasta}T23:59:59.999Z`),
        }),
      }
    }

    const ordenesDb = await prisma.ordenCompra.findMany({
      where,
      include: {
        proveedor: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { creadoEn: "desc" },
    })

    return ordenesDb.map((oc) => serializarOrdenCompra(oc, ocultarCostos))
  } catch (error) {
    console.error("Error al obtener órdenes de compra:", error)
    return []
  }
}

// ─── 4. Detalle de Orden de Compra por ID ─────────────────────────────────────

export async function obtenerOrdenCompraPorId(
  id: string,
  ocultarCostos: boolean = false
): Promise<IOrdenCompra | null> {
  try {
    const oc = await prisma.ordenCompra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        items: {
          include: {
            producto: true,
          },
          orderBy: { creadoEn: "asc" },
        },
      },
    })

    if (!oc) return null

    return serializarOrdenCompra(oc, ocultarCostos)
  } catch (error) {
    console.error(`Error al obtener orden de compra ${id}:`, error)
    return null
  }
}

// ─── 5. Métricas Consolidadas de Proveedores & Compras ────────────────────────

export async function obtenerMetricasProveedoresYCompras(): Promise<IMetricasProveedoresYCompras> {
  try {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const [
      totalProveedores,
      proveedoresActivos,
      ordenesPendientes,
      ordenesEnviadas,
      ordenesRecibidasMes,
      comprasMesDb,
      productosActivos,
    ] = await Promise.all([
      prisma.proveedor.count(),
      prisma.proveedor.count({ where: { activo: true } }),
      prisma.ordenCompra.count({ where: { estado: "PENDIENTE" } }),
      prisma.ordenCompra.count({ where: { estado: "ENVIADA" } }),
      prisma.ordenCompra.count({
        where: {
          estado: { in: ["RECIBIDA_PARCIAL", "RECIBIDA_TOTAL"] },
          actualizadoEn: { gte: inicioMes },
        },
      }),
      prisma.ordenCompra.findMany({
        where: {
          estado: { in: ["RECIBIDA_PARCIAL", "RECIBIDA_TOTAL", "ENVIADA"] },
          creadoEn: { gte: inicioMes },
        },
        select: { total: true },
      }),
      prisma.producto.findMany({
        where: { activo: true },
        select: { stockActual: true, stockMinimo: true },
      }),
    ])

    // Calcular insumos bajo stock mínimo
    const insumosCriticos = productosActivos.filter(
      (p) => Number(p.stockActual) <= Number(p.stockMinimo)
    ).length

    // Gasto total acumulado del mes
    const gastoComprasMes = comprasMesDb.reduce(
      (sum, oc) => sum + (oc.total ? Number(oc.total) : 0),
      0
    )

    return {
      totalProveedores,
      proveedoresActivos,
      ordenesPendientes,
      ordenesEnviadas,
      ordenesRecibidasMes,
      insumosCriticosParaReponer: insumosCriticos,
      gastoComprasMes,
    }
  } catch (error) {
    console.error("Error al calcular métricas de compras:", error)
    return {
      totalProveedores: 0,
      proveedoresActivos: 0,
      ordenesPendientes: 0,
      ordenesEnviadas: 0,
      ordenesRecibidasMes: 0,
      insumosCriticosParaReponer: 0,
      gastoComprasMes: 0,
    }
  }
}

// ─── 6. Detección Inteligente de Sugerencias de Reposición ─────────────────────

export async function obtenerSugerenciasReposicion(): Promise<{
  sugerencias: ISugerenciaReposicionItem[]
  porProveedor: IReposicionPorProveedor[]
}> {
  try {
    // A) Traer productos activos con sus proveedores asociados
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: {
        productoProveedores: {
          include: {
            proveedor: true,
          },
          orderBy: [{ esPrincipal: "desc" }, { precioUltimo: "asc" }],
        },
      },
      orderBy: { nombre: "asc" },
    })

    // B) Traer ítems de comanda marcados como PEDIR_PROVEEDOR no completados
    const itemsComandaPendientes = await prisma.itemComanda.findMany({
      where: {
        tipo: "PEDIR_PROVEEDOR",
        completado: false,
        comanda: {
          estado: { in: ["PENDIENTE", "EN_PRODUCCION", "ESPERANDO_PROVEEDOR"] },
        },
      },
      include: {
        comanda: {
          select: {
            id: true,
            numero: true,
            presupuesto: {
              select: {
                cliente: {
                  select: { nombre: true },
                },
              },
            },
          },
        },
      },
    })

    // Mapa de requerimientos por producto desde comandas
    const mapaComandasPorProducto = new Map<
      string,
      {
        totalRequerido: number
        detalles: Array<{
          comandaId: string
          comandaNumero: number
          clienteNombre: string
          cantidad: number
          ambiente: string | null
          descripcion: string
        }>
      }
    >()

    for (const item of itemsComandaPendientes) {
      if (!item.productoId) continue
      const cant = item.cantidad || 1
      const actual = mapaComandasPorProducto.get(item.productoId) || {
        totalRequerido: 0,
        detalles: [],
      }

      actual.totalRequerido += cant
      actual.detalles.push({
        comandaId: item.comanda.id,
        comandaNumero: item.comanda.numero,
        clienteNombre: item.comanda.presupuesto?.cliente?.nombre || "Sin cliente",
        cantidad: cant,
        ambiente: item.ambiente,
        descripcion: item.descripcion,
      })

      mapaComandasPorProducto.set(item.productoId, actual)
    }

    const sugerencias: ISugerenciaReposicionItem[] = []

    for (const prod of productos) {
      const actual = Number(prod.stockActual)
      const minimo = Number(prod.stockMinimo)
      const esCritico = actual <= minimo
      const reqComanda = mapaComandasPorProducto.get(prod.id)
      const tienePedidoComanda = (reqComanda?.totalRequerido || 0) > 0

      if (!esCritico && !tienePedidoComanda) {
        continue
      }

      // Proveedor sugerido (el principal o el primero que lo provee)
      const provPrincipal =
        prod.productoProveedores.find((pp) => pp.esPrincipal) ||
        prod.productoProveedores[0]

      let origen: "STOCK_CRITICO" | "COMANDA_PEDIR_PROVEEDOR" | "AMBOS" =
        "STOCK_CRITICO"
      if (esCritico && tienePedidoComanda) {
        origen = "AMBOS"
      } else if (tienePedidoComanda) {
        origen = "COMANDA_PEDIR_PROVEEDOR"
      }

      // Cantidad sugerida: cubrir faltante de stock mínimo + pedidos de comanda
      const deficitStock = esCritico ? Math.max(minimo - actual, 1) : 0
      const deficitComanda = reqComanda?.totalRequerido || 0
      const cantidadSugerida = Math.ceil(deficitStock + deficitComanda)

      sugerencias.push({
        productoId: prod.id,
        productoCodigo: prod.codigo,
        productoNombre: prod.nombre,
        unidadMedida: prod.unidadMedida,
        stockActual: actual,
        stockMinimo: minimo,
        cantidadSugerida,
        ultimoPrecio: provPrincipal?.precioUltimo
          ? Number(provPrincipal.precioUltimo)
          : prod.precio
          ? Number(prod.precio)
          : null,
        origen,
        detallesComandas: reqComanda?.detalles,
        proveedorSugeridoId: provPrincipal?.proveedor?.id || null,
        proveedorSugeridoNombre: provPrincipal?.proveedor?.nombre || null,
      })
    }

    // Agrupar por proveedor sugerido
    const agrupadoMap = new Map<string, IReposicionPorProveedor>()

    for (const sug of sugerencias) {
      const pId = sug.proveedorSugeridoId || "SIN_PROVEEDOR"
      const pNombre = sug.proveedorSugeridoNombre || "Sin proveedor asignado"

      const grupo = agrupadoMap.get(pId) || {
        proveedorId: pId,
        proveedorNombre: pNombre,
        proveedorTelefono: null,
        items: [],
        totalItems: 0,
      }

      grupo.items.push(sug)
      grupo.totalItems = grupo.items.length
      agrupadoMap.set(pId, grupo)
    }

    return {
      sugerencias,
      porProveedor: Array.from(agrupadoMap.values()),
    }
  } catch (error) {
    console.error("Error al obtener sugerencias de reposición:", error)
    return { sugerencias: [], porProveedor: [] }
  }
}

// ─── 7. Productos activos para selección ──────────────────────────────────────

export async function obtenerCatalogoProductosParaCompras(): Promise<
  Array<{
    id: string
    codigo: string | null
    nombre: string
    unidadMedida: string
    stockActual: number
    stockMinimo: number
    precio: number | null
  }>
> {
  try {
    const prods = await prisma.producto.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        unidadMedida: true,
        stockActual: true,
        stockMinimo: true,
        precio: true,
      },
      orderBy: { nombre: "asc" },
    })

    return prods.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      unidadMedida: p.unidadMedida,
      stockActual: Number(p.stockActual),
      stockMinimo: Number(p.stockMinimo),
      precio: p.precio ? Number(p.precio) : null,
    }))
  } catch (error) {
    console.error("Error al obtener catálogo para compras:", error)
    return []
  }
}
