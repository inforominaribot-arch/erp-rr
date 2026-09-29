// Módulo: Stock & Inventario
// Tipos TypeScript

import type { TipoMovimientoStock } from "@/types"
export type { TipoMovimientoStock }

export type UnidadMedida = "unidad" | "metro" | "metro2" | "kg"

export const UNIDADES_MEDIDA: { valor: UnidadMedida; etiqueta: string; sufijo: string }[] = [
  { valor: "unidad", etiqueta: "Unidades (u)", sufijo: "u" },
  { valor: "metro", etiqueta: "Metros lineales (m)", sufijo: "m" },
  { valor: "metro2", etiqueta: "Metros cuadrados (m²)", sufijo: "m²" },
  { valor: "kg", etiqueta: "Kilogramos (kg)", sufijo: "kg" },
]

export type EstadoStockNivel = "NORMAL" | "BAJO" | "CRITICO" | "AGOTADO"

export interface IProducto {
  id: string
  codigo: string | null
  nombre: string
  descripcion: string | null
  unidadMedida: string
  stockActual: number
  stockMinimo: number
  precio: number | null // Costo de compra (oculto para TALLER)
  imagen: string | null
  activo: boolean
  creadoEn: string
  actualizadoEn: string
  estadoStock: EstadoStockNivel
}

export interface IMovimientoStock {
  id: string
  productoId: string
  productoNombre?: string
  productoCodigo?: string | null
  unidadMedida?: string
  tipo: TipoMovimientoStock
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  motivo: string | null
  referenciaId: string | null
  referenciaTipo: string | null
  creadoEn: string
}

export interface IMetricasStock {
  totalProductos: number
  productosCriticos: number
  productosAgotados: number
  movimientosMes: number
  valorTotalInventario: number | null // null para rol TALLER
}

export interface IFiltrosStock {
  busqueda?: string
  soloCriticos?: boolean
  unidadMedida?: string
  activo?: boolean
}

export interface IFiltrosMovimientos {
  productoId?: string
  tipo?: TipoMovimientoStock | "TODOS"
  fechaDesde?: string
  fechaHasta?: string
  busqueda?: string
}

export interface IItemRemitoIngreso {
  productoId: string
  cantidad: number
  costoUnitario?: number | null
}

export interface IDatosIngresoRemito {
  numeroRemito: string
  proveedorNombre: string
  proveedorId?: string | null
  fecha: string
  fotoRemitoUrl?: string | null
  observaciones?: string | null
  items: IItemRemitoIngreso[]
}

export interface IItemExtraidoRemito {
  productoId?: string | null
  productoNombreSugerido?: string | null
  descripcionRemito: string
  cantidad: number
  unidad?: string
  costoUnitario?: number | null
  confianza?: number
}

export interface IResultadoEscaneoRemito {
  numeroRemito?: string
  proveedor?: string
  fecha?: string
  observaciones?: string
  items: IItemExtraidoRemito[]
}

export interface IDatosMovimientoManual {
  productoId: string
  tipo: TipoMovimientoStock
  cantidad: number // Si es AJUSTE, representa el nuevo stock físico
  motivo: string
}

export interface IResultadoImportacionStock {
  importados: number
  actualizados: number
  errores: Array<{ fila: number; identificador: string; error: string }>
}
