// Módulo: Proveedores & Compras
// Definiciones de tipos TypeScript para el módulo

import type { EstadoOrdenCompra, Rol } from "@/types"

export type { EstadoOrdenCompra }

// ─── Interfaces Principales ──────────────────────────────────────────────────

export interface IProveedor {
  id: string
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  notas: string | null
  activo: boolean
  creadoEn: string
  actualizadoEn: string
  _count?: {
    productos: number
    ordenesCompra: number
  }
}

export interface IProductoProveedor {
  id: string
  productoId: string
  proveedorId: string
  codigoProveedor: string | null
  precioUltimo: number | null
  esPrincipal: boolean
  producto?: {
    id: string
    codigo: string | null
    nombre: string
    unidadMedida: string
    stockActual: number
    stockMinimo: number
    precio: number | null
    imagen: string | null
    activo: boolean
  }
  proveedor?: {
    id: string
    nombre: string
    telefono: string | null
  }
}

export interface IItemOrdenCompra {
  id: string
  ordenCompraId: string
  productoId: string
  cantidadPedida: number
  cantidadRecibida: number
  precioUnitario: number | null
  subtotal: number | null
  creadoEn: string
  producto?: {
    id: string
    codigo: string | null
    nombre: string
    unidadMedida: string
    stockActual: number
    stockMinimo: number
    precio: number | null
    imagen: string | null
  }
}

export interface IOrdenCompra {
  id: string
  proveedorId: string
  numero: number
  numeroFormateado: string // Ej: "#OC-0001"
  estado: EstadoOrdenCompra
  notas: string | null
  fotoRemito: string | null
  total: number | null
  creadoEn: string
  actualizadoEn: string
  proveedor: {
    id: string
    nombre: string
    contacto: string | null
    telefono: string | null
    email: string | null
    direccion: string | null
  }
  items: IItemOrdenCompra[]
  progresoRecepcion: number // 0 a 100%
  totalItems: number
  totalRecibidos: number
}

// ─── Métricas y KPIs ─────────────────────────────────────────────────────────

export interface IMetricasProveedoresYCompras {
  totalProveedores: number
  proveedoresActivos: number
  ordenesPendientes: number
  ordenesEnviadas: number
  ordenesRecibidasMes: number
  insumosCriticosParaReponer: number
  gastoComprasMes: number
}

// ─── Reposición Sugerida ──────────────────────────────────────────────────────

export interface ISugerenciaReposicionItem {
  productoId: string
  productoCodigo: string | null
  productoNombre: string
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  cantidadSugerida: number
  ultimoPrecio: number | null
  origen: "STOCK_CRITICO" | "COMANDA_PEDIR_PROVEEDOR" | "AMBOS"
  detallesComandas?: Array<{
    comandaId: string
    comandaNumero: number
    clienteNombre: string
    cantidad: number
    ambiente: string | null
    descripcion: string
  }>
  proveedorSugeridoId: string | null
  proveedorSugeridoNombre: string | null
}

export interface IReposicionPorProveedor {
  proveedorId: string
  proveedorNombre: string
  proveedorTelefono: string | null
  items: ISugerenciaReposicionItem[]
  totalItems: number
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

export interface IFiltrosProveedores {
  busqueda?: string
  activo?: boolean
}

export interface IFiltrosOrdenesCompra {
  busqueda?: string
  estado?: EstadoOrdenCompra | "TODAS"
  proveedorId?: string
  fechaDesde?: string
  fechaHasta?: string
}

// ─── Helpers de formateo ─────────────────────────────────────────────────────

export function formatearNumeroOC(numero: number): string {
  return `#OC-${String(numero).padStart(4, "0")}`
}

export const ESTADOS_ORDEN_COMPRA_CONFIG: Record<
  EstadoOrdenCompra,
  {
    label: string
    color: string
    badgeClass: string
    descripcion: string
  }
> = {
  PENDIENTE: {
    label: "Borrador",
    color: "amber",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    descripcion: "Orden creada en borrador interno sin enviar al proveedor",
  },
  ENVIADA: {
    label: "Enviada",
    color: "blue",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    descripcion: "Pedido formalizado y enviado al proveedor",
  },
  RECIBIDA_PARCIAL: {
    label: "Recibida Parcial",
    color: "indigo",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    descripcion: "Se recibieron algunos bultos/ítems de la orden",
  },
  RECIBIDA_TOTAL: {
    label: "Recibida Total",
    color: "emerald",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    descripcion: "Completada en su totalidad con ingreso a stock",
  },
  CANCELADA: {
    label: "Cancelada",
    color: "rose",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    descripcion: "Orden anulada sin ingreso de mercadería",
  },
}
