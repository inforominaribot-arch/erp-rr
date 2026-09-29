// Módulo: Stock & Inventario
// Esquemas de validación Zod

import { z } from "zod"

export const UNIDADES_PRODUCTO = ["unidad", "metro", "metro2", "kg"] as const
export const TIPOS_MOVIMIENTO = ["INGRESO", "EGRESO", "AJUSTE"] as const

export const productoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .max(50, "El código no puede superar los 50 caracteres")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim().toUpperCase() : null)),
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  unidadMedida: z.enum(UNIDADES_PRODUCTO).default("unidad"),
  stockActual: z.coerce
    .number()
    .min(0, "El stock no puede ser negativo")
    .default(0),
  stockMinimo: z.coerce
    .number()
    .min(0, "El stock mínimo no puede ser negativo")
    .default(0),
  precio: z.coerce
    .number()
    .min(0, "El precio no puede ser negativo")
    .optional()
    .nullable()
    .transform((val) => (val !== undefined && val !== null && !isNaN(val) ? val : null)),
  imagen: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  activo: z.boolean().default(true),
})

export type ProductoInput = z.infer<typeof productoSchema>

export const movimientoManualSchema = z.object({
  productoId: z.string().uuid("Seleccione un producto válido"),
  tipo: z.enum(TIPOS_MOVIMIENTO),
  cantidad: z.coerce
    .number()
    .min(0.01, "La cantidad debe ser mayor a 0"),
  motivo: z
    .string()
    .trim()
    .min(3, "El motivo debe tener al menos 3 caracteres")
    .max(250, "El motivo no puede superar los 250 caracteres"),
})

export type MovimientoManualInput = z.infer<typeof movimientoManualSchema>

export const itemRemitoSchema = z.object({
  productoId: z.string().uuid("Producto requerido"),
  cantidad: z.coerce
    .number()
    .min(0.01, "La cantidad debe ser mayor a 0"),
  costoUnitario: z.coerce
    .number()
    .min(0, "El costo unitario no puede ser negativo")
    .optional()
    .nullable(),
})

export const ingresoRemitoSchema = z.object({
  numeroRemito: z
    .string()
    .trim()
    .min(1, "El número de remito es obligatorio")
    .max(50, "El número de remito no puede superar 50 caracteres"),
  proveedorNombre: z
    .string()
    .trim()
    .min(2, "El nombre del proveedor es obligatorio")
    .max(100, "El nombre del proveedor no puede superar 100 caracteres"),
  proveedorId: z.string().uuid().optional().nullable(),
  fecha: z
    .string()
    .trim()
    .min(1, "La fecha es obligatoria"),
  fotoRemitoUrl: z.string().optional().nullable(),
  observaciones: z
    .string()
    .trim()
    .max(500, "Las observaciones no pueden superar 500 caracteres")
    .optional()
    .nullable(),
  items: z.array(itemRemitoSchema).min(1, "Debe ingresar al menos un ítem al remito"),
})

export type IngresoRemitoInput = z.infer<typeof ingresoRemitoSchema>

export const importarFilaCSVStockSchema = z.object({
  codigo: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim().toUpperCase() : null)),
  nombre: z.string().min(1, "El nombre del producto es obligatorio"),
  descripcion: z.string().optional().nullable(),
  unidad_medida: z.string().default("unidad"),
  stock_actual: z.coerce.number().default(0),
  stock_minimo: z.coerce.number().default(0),
  precio_costo: z.coerce.number().optional().nullable(),
  imagen: z.string().optional().nullable(),
})

export type ImportarFilaCSVStockInput = z.infer<typeof importarFilaCSVStockSchema>
