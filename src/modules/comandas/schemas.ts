// Módulo: Comandas & Producción
// Esquemas de validación Zod end-to-end

import { z } from "zod"

export const ESTADOS_COMANDA = [
  "PENDIENTE",
  "EN_PRODUCCION",
  "ESPERANDO_PROVEEDOR",
  "LISTO_PARA_INSTALAR",
  "INSTALADO",
] as const

export const TIPOS_ITEM_COMANDA = ["FABRICAR", "PEDIR_PROVEEDOR"] as const

// ─── Clasificación individual de cada ítem al generar comanda ────────────────

export const itemClasificacionInputSchema = z.object({
  itemPresupuestoId: z.string().min(1, "El ID de ítem es obligatorio"),
  tipo: z.enum(TIPOS_ITEM_COMANDA).default("FABRICAR"),
  observaciones: z.string().max(500).optional().nullable(),
})

export type ItemClasificacionInput = z.infer<typeof itemClasificacionInputSchema>

// ─── Generación de Comanda desde Presupuesto Aceptado ───────────────────────

export const generarComandaSchema = z.object({
  presupuestoId: z.string().uuid("El ID de presupuesto debe ser un UUID válido"),
  fechaEntrega: z.string().optional().nullable(),
  notas: z.string().max(1000, "Las notas no pueden superar 1000 caracteres").optional().nullable(),
  itemsClasificacion: z.array(itemClasificacionInputSchema).optional().nullable(),
})

export type GenerarComandaInput = z.infer<typeof generarComandaSchema>

// ─── Cambio de Estado de Comanda ─────────────────────────────────────────────

export const cambiarEstadoComandaSchema = z.object({
  id: z.string().uuid("El ID de comanda debe ser un UUID válido"),
  estado: z.enum(ESTADOS_COMANDA),
  notas: z.string().max(1000).optional().nullable(),
  fechaEntrega: z.string().optional().nullable(),
})

export type CambiarEstadoComandaInput = z.infer<typeof cambiarEstadoComandaSchema>

// ─── Actualización de Ítem de Comanda ────────────────────────────────────────

export const actualizarItemComandaSchema = z.object({
  id: z.string().uuid("El ID de ítem debe ser un UUID válido"),
  completado: z.boolean().optional(),
  tipo: z.enum(TIPOS_ITEM_COMANDA).optional(),
  observaciones: z.string().max(500).optional().nullable(),
})

export type ActualizarItemComandaInput = z.infer<typeof actualizarItemComandaSchema>

// ─── Actualización de Notas y Fecha de Comanda ───────────────────────────────

export const actualizarNotasComandaSchema = z.object({
  id: z.string().uuid("El ID de comanda debe ser un UUID válido"),
  notas: z.string().max(1000).optional().nullable(),
  fechaEntrega: z.string().optional().nullable(),
})

export type ActualizarNotasComandaInput = z.infer<typeof actualizarNotasComandaSchema>

// ─── Filtros para Consultas ──────────────────────────────────────────────────

export const filtrosComandasSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.string().optional(),
  pagina: z.coerce.number().int().positive().optional(),
  porPagina: z.coerce.number().int().positive().optional(),
})

export type FiltrosComandasInput = z.infer<typeof filtrosComandasSchema>

export const filtrosProduccionSchema = z.object({
  tipo: z.enum(["TODOS", "FABRICAR", "PEDIR_PROVEEDOR"]).optional().default("TODOS"),
  estadoCompletado: z.enum(["TODOS", "PENDIENTES", "COMPLETADOS"]).optional().default("TODOS"),
  busqueda: z.string().optional(),
})

export type FiltrosProduccionInput = z.infer<typeof filtrosProduccionSchema>
