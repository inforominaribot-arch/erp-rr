// Módulo: Agendar Visitas
// Schemas de validación Zod

import { z } from "zod"

const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const tipoVisitaEnum = z.enum([
  "PRIMERA_MEDICION",
  "REMEDICION",
  "MUESTRA_TELAS",
  "ASESORAMIENTO",
])

export const estadoVisitaEnum = z.enum([
  "PROGRAMADA",
  "CONFIRMADA",
  "REALIZADA",
  "REPROGRAMADA",
  "CANCELADA",
])

// ─── Schema para agendar nueva visita ─────────────────────────────────────────

export const visitaSchema = z.object({
  clienteId: z.string().uuid("Seleccioná un cliente válido"),
  fecha: z
    .string()
    .min(1, "La fecha de la visita es obligatoria")
    .refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  horaInicio: z
    .string()
    .regex(horaRegex, "Formato de hora de inicio inválido (ej: 15:00)"),
  horaFin: z
    .string()
    .regex(horaRegex, "Formato de hora de fin inválido (ej: 16:30)"),
  tipoVisita: tipoVisitaEnum.default("PRIMERA_MEDICION"),
  direccion: z
    .string()
    .min(3, "La dirección debe tener al menos 3 caracteres")
    .max(200, "La dirección no puede superar 200 caracteres")
    .trim(),
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

export type VisitaInput = z.infer<typeof visitaSchema>

// ─── Schema para actualizar visita ───────────────────────────────────────────

export const actualizarVisitaSchema = visitaSchema.extend({
  id: z.string().uuid("ID de visita inválido"),
  estado: estadoVisitaEnum.optional(),
})

export type ActualizarVisitaInput = z.infer<typeof actualizarVisitaSchema>

// ─── Schema para cambiar estado de visita ─────────────────────────────────────

export const cambiarEstadoVisitaSchema = z.object({
  id: z.string().uuid("ID de visita inválido"),
  estado: estadoVisitaEnum,
  notasAdicionales: z
    .string()
    .max(1000, "Las notas no pueden superar 1000 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
})

export type CambiarEstadoVisitaInput = z.infer<typeof cambiarEstadoVisitaSchema>

// ─── Schema para reprogramar visita ──────────────────────────────────────────

export const reprogramarVisitaSchema = z.object({
  id: z.string().uuid("ID de visita inválido"),
  fecha: z
    .string()
    .min(1, "La nueva fecha es obligatoria")
    .refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  horaInicio: z
    .string()
    .regex(horaRegex, "Formato de hora de inicio inválido (ej: 15:00)"),
  horaFin: z
    .string()
    .regex(horaRegex, "Formato de hora de fin inválido (ej: 16:30)"),
  motivo: z
    .string()
    .max(500, "El motivo no puede superar 500 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
})

export type ReprogramarVisitaInput = z.infer<typeof reprogramarVisitaSchema>

// ─── Schema para alta rápida de cliente desde el modal de visita ──────────────

export const clienteRapidoVisitaSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres")
    .trim(),
  telefono: z
    .string()
    .min(6, "Ingresá un teléfono válido para coordinar por WhatsApp")
    .max(30, "El teléfono no puede superar 30 caracteres")
    .trim(),
  direccion: z
    .string()
    .min(3, "La dirección de la obra es obligatoria")
    .max(200, "La dirección no puede superar 200 caracteres")
    .trim(),
  localidad: z
    .string()
    .max(100, "La localidad no puede superar 100 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Email inválido")
    .max(120)
    .trim()
    .optional()
    .or(z.literal("")),
  notas: z
    .string()
    .max(500)
    .trim()
    .optional()
    .or(z.literal("")),
})

export type ClienteRapidoVisitaInput = z.infer<typeof clienteRapidoVisitaSchema>
