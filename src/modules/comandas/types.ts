// Módulo: Comandas & Producción
// Tipos de TypeScript específicos del módulo

import type { EstadoComanda, TipoItemComanda, EstadoCliente, EstadoPresupuesto } from "@/types"
import type { ICaracteristicasItem } from "@/modules/mediciones/types"

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
  creadoEn: Date
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
