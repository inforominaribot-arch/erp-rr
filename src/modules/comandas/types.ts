// Módulo: Comandas & Producción
// Tipos de TypeScript específicos del módulo

import type { EstadoComanda, TipoItemComanda, EstadoCliente, EstadoPresupuesto } from "@/types"
import type { ICaracteristicasItem, IAvisoMedidaModificada } from "@/modules/mediciones/types"

export type { EstadoComanda, TipoItemComanda }

// ─── Ítem de Comanda ─────────────────────────────────────────────────────────

export interface IItemComanda {
  id: string
  comandaId: string
  productoId: string | null
  descripcion: string
  ambiente: string | null
  ancho: number
  alto: number
  cantidad: number
  tipo: TipoItemComanda
  caracteristicas: ICaracteristicasItem | null
  observaciones: string | null
  completado: boolean
  avisoMedida: IAvisoMedidaModificada | null
  /** Pedidos a proveedor por capa (solo ítems PEDIR_PROVEEDOR) */
  pedidos: IPedidoProveedor[]
  creadoEn: Date
}

export type EstadoPedidoProveedor = "PENDIENTE_PEDIDO" | "PEDIDO_REALIZADO" | "PEDIDO_RECIBIDO"

export interface IPedidoProveedor {
  id: string
  capa: string
  etiqueta: string
  marca: string | null
  proveedorId: string | null
  proveedorNombre: string | null
  diasEntrega: number | null
  estado: EstadoPedidoProveedor
  fechaPedido: string | null
  fechaRecibido: string | null
  nota: string | null
}

export interface IProveedorPedido {
  id: string
  nombre: string
  marcas: string[]
  diasEntrega: number | null
  email?: string | null
  telefono?: string | null
}

/** Orden de pedido a proveedor ya generada (Excel RS / WhatsApp MG) */
export interface IOrdenPedido {
  id: string
  marca: string
  numeroDia: number
  creadoEn: string
  /** RS: { filas }, MG: { mensaje } */
  detalle: unknown
}

// ─── Comanda Básica ──────────────────────────────────────────────────────────

export interface IComanda {
  id: string
  presupuestoId: string
  numero: number
  estado: EstadoComanda
  notas: string | null
  fechaEntrega: Date | null
  creadoEn: Date
  actualizadoEn: Date
}

// ─── Comanda con Relaciones para Listados ────────────────────────────────────

export interface IComandaConRelaciones extends IComanda {
  presupuesto: {
    id: string
    numero: number
    estado: EstadoPresupuesto
    total: number
    cliente: {
      id: string
      nombre: string
      telefono: string | null
      email: string | null
      direccion: string | null
      localidad: string | null
      estado: EstadoCliente
    }
  }
  _count: {
    items: number
  }
  itemsCompletadosCount: number
  itemsTotalCount: number
}

// ─── Detalle Completo de Comanda ─────────────────────────────────────────────

export interface IComandaDetalle extends IComanda {
  presupuesto: {
    id: string
    numero: number
    estado: EstadoPresupuesto
    total: number
    validezDias: number
    cliente: {
      id: string
      nombre: string
      telefono: string | null
      email: string | null
      direccion: string | null
      localidad: string | null
      notas: string | null
      estado: EstadoCliente
    }
  }
  items: IItemComanda[]
  ordenesPedido?: IOrdenPedido[]
  instalacion?: {
    id: string
    fecha: Date
    estado: string
  } | null
}

// ─── Ítem para el Tablero Visual de Producción / Taller ──────────────────────

export interface IItemProduccion {
  id: string
  comandaId: string
  comandaNumero: number
  comandaEstado: EstadoComanda
  fechaEntrega: Date | null
  clienteId: string
  clienteNombre: string
  clienteTelefono: string | null
  clienteDireccion: string | null
  clienteLocalidad: string | null
  ambiente: string
  descripcion: string
  ancho: number
  alto: number
  cantidad: number
  tipo: TipoItemComanda
  completado: boolean
  caracteristicas: ICaracteristicasItem | null
  observaciones: string | null
  pedidos: IPedidoProveedor[]
  creadoEn: Date
}

// ─── Métricas del Módulo de Comandas ─────────────────────────────────────────

export interface IMetricasComandas {
  totalComandas: number
  pendientes: number
  enProduccion: number
  esperandoProveedor: number
  listasParaInstalar: number
  instaladas: number
  itemsPendientesFabricar: number
  itemsEsperandoProveedor: number
}

// ─── Métricas Operativas del Taller / Producción ────────────────────────────

export interface IMetricasProduccion {
  totalItems: number
  itemsPendientes: number
  itemsCompletados: number
  itemsFabricarPendientes: number
  itemsProveedorPendientes: number
  porcentajeCompletado: number
  comandasActivas: number
}

// ─── Presupuesto Aceptado listo para generar Comanda ────────────────────────

export interface IPresupuestoAceptadoResumen {
  id: string
  numero: number
  estado: EstadoPresupuesto
  total: number
  creadoEn: Date
  /** Cuándo se aceptó (null en presupuestos aceptados antes de guardarla) */
  fechaAceptacion: Date | null
  cliente: {
    id: string
    nombre: string
    telefono: string | null
    direccion: string | null
    localidad: string | null
  }
  itemsAceptados: {
    id: string
    itemMedicionId: string | null
    descripcion: string
    ambiente: string
    ancho: number
    alto: number
    cantidad: number
    caracteristicas: ICaracteristicasItem | null
  }[]
}
