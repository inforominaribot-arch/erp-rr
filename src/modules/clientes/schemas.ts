// Módulo: Clientes & CRM
// Schemas de validación Zod

import { z } from "zod"

// ─── Schema base del cliente ───────────────────────────────────────────────────

export const clienteSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres")
    .trim(),
  telefono: z
    .string()
    .max(30, "El teléfono no puede superar 30 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("El email no es válido")
    .max(120, "El email no puede superar 120 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  direccion: z
    .string()
    .max(200, "La dirección no puede superar 200 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  localidad: z
    .string()
    .max(100, "La localidad no puede superar 100 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  notas: z
    .string()
    .max(1000, "Las notas no pueden superar 1000 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
})

export type ClienteInput = z.infer<typeof clienteSchema>

// ─── Schema para actualizar estado ────────────────────────────────────────────

export const actualizarEstadoSchema = z.object({
  id: z.string().uuid("ID de cliente inválido"),
  estado: z.enum([
    "POR_VISITAR",
    "MEDICION_TOMADA",
    "PRESUPUESTO_ENVIADO",
    "PRESUPUESTO_ACEPTADO",
    "EN_PRODUCCION",
    "INSTALADO",
  ]),
})

export type ActualizarEstadoInput = z.infer<typeof actualizarEstadoSchema>

// ─── Schema para filtros de listado ───────────────────────────────────────────

export const filtrosClienteSchema = z.object({
  busqueda: z.string().trim().optional(),
  estado: z
    .enum([
      "TODOS",
      "POR_VISITAR",
      "MEDICION_TOMADA",
      "PRESUPUESTO_ENVIADO",
      "PRESUPUESTO_ACEPTADO",
      "EN_PRODUCCION",
      "INSTALADO",
    ])
    .optional()
    .default("TODOS"),
  pagina: z.number().int().min(1).optional().default(1),
  porPagina: z.number().int().min(1).max(100).optional().default(20),
})

export type FiltrosClienteInput = z.infer<typeof filtrosClienteSchema>

// ─── Schema para importación CSV ──────────────────────────────────────────────

export const filaCSVSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre es obligatorio (mín. 2 caracteres)")
    .max(120)
    .trim(),
  telefono: z.string().max(30).trim().optional().or(z.literal("")),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .or(z.undefined()),
  direccion: z.string().max(200).trim().optional().or(z.literal("")),
  localidad: z.string().max(100).trim().optional().or(z.literal("")),
  notas: z.string().max(1000).trim().optional().or(z.literal("")),
})

export type FilaCSVInput = z.infer<typeof filaCSVSchema>
