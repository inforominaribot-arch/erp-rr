// Módulo: Proveedores & Compras
// Esquemas de validación Zod end-to-end

import { z } from "zod"

export const ESTADOS_ORDEN_COMPRA = [
  "PENDIENTE",
  "ENVIADA",
  "RECIBIDA_PARCIAL",
  "RECIBIDA_TOTAL",
  "CANCELADA",
] as const

// ─── Proveedor ────────────────────────────────────────────────────────────────

export const proveedorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre o razón social debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  contacto: z
    .string()
    .trim()
    .max(100, "El contacto no puede superar los 100 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  telefono: z
    .string()
    .trim()
    .max(50, "El teléfono no puede superar los 50 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  email: z
    .string()
    .trim()
    .email("Ingrese un email válido")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v && v.trim() !== "" ? v.trim().toLowerCase() : null)),
  direccion: z
    .string()
    .trim()
    .max(250, "La dirección no puede superar los 250 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  notas: z
    .string()
    .trim()
    .max(1000, "Las notas no pueden superar los 1000 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  activo: z.boolean().default(true),
})

export type ProveedorInput = z.infer<typeof proveedorSchema>

// ─── Producto Proveedor (Catálogo de insumos provistos) ────────────────────────

export const productoProveedorSchema = z.object({
  productoId: z.string().uuid("Seleccione un producto válido"),
  proveedorId: z.string().uuid("Seleccione un proveedor válido"),
  codigoProveedor: z
    .string()
    .trim()
    .max(50, "El código de proveedor no puede superar 50 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim().toUpperCase() : null)),
  precioUltimo: z.coerce
    .number()
    .min(0, "El precio no puede ser negativo")
    .optional()
    .nullable()
    .transform((v) => (v !== undefined && v !== null && !isNaN(v) ? v : null)),
  esPrincipal: z.boolean().default(false),
})

export type ProductoProveedorInput = z.infer<typeof productoProveedorSchema>

// ─── Ítem Orden de Compra ─────────────────────────────────────────────────────

export const itemOrdenCompraInputSchema = z.object({
  productoId: z.string().uuid("Seleccione un insumo del catálogo"),
  cantidadPedida: z.coerce
    .number()
    .min(0.01, "La cantidad a pedir debe ser mayor a 0"),
  precioUnitario: z.coerce
    .number()
    .min(0, "El precio unitario no puede ser negativo")
    .optional()
    .nullable()
    .transform((v) => (v !== undefined && v !== null && !isNaN(v) ? v : null)),
})

export type ItemOrdenCompraInput = z.infer<typeof itemOrdenCompraInputSchema>

// ─── Orden de Compra ──────────────────────────────────────────────────────────

export const ordenCompraSchema = z.object({
  proveedorId: z.string().uuid("Seleccione un proveedor"),
  notas: z
    .string()
    .trim()
    .max(1000, "Las notas no pueden superar 1000 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  items: z
    .array(itemOrdenCompraInputSchema)
    .min(1, "Debe agregar al menos un artículo a la orden de compra"),
})

export type OrdenCompraInput = z.infer<typeof ordenCompraSchema>

// ─── Cambio de Estado de Orden ────────────────────────────────────────────────

export const cambioEstadoOrdenSchema = z.object({
  ordenCompraId: z.string().uuid("Identificador de orden inválido"),
  nuevoEstado: z.enum(ESTADOS_ORDEN_COMPRA),
})

export type CambioEstadoOrdenInput = z.infer<typeof cambioEstadoOrdenSchema>

// ─── Recepción de Mercadería contra Orden de Compra ───────────────────────────

export const recepcionItemSchema = z.object({
  itemId: z.string().uuid("Identificador de ítem inválido"),
  productoId: z.string().uuid("Identificador de producto inválido"),
  cantidadRecibidaAhora: z.coerce
    .number()
    .min(0, "La cantidad recibida no puede ser negativa"),
  costoUnitarioActualizado: z.coerce
    .number()
    .min(0, "El costo no puede ser negativo")
    .optional()
    .nullable()
    .transform((v) => (v !== undefined && v !== null && !isNaN(v) ? v : null)),
})

export const recepcionOrdenCompraSchema = z.object({
  ordenCompraId: z.string().uuid("Identificador de orden inválido"),
  fotoRemito: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  numeroRemito: z
    .string()
    .trim()
    .max(100, "El número de remito/factura no puede superar 100 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  observaciones: z
    .string()
    .trim()
    .max(500, "Las observaciones no pueden superar 500 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  items: z
    .array(recepcionItemSchema)
    .min(1, "Debe especificar las cantidades recibidas de los artículos"),
})

export type RecepcionOrdenCompraInput = z.infer<typeof recepcionOrdenCompraSchema>
