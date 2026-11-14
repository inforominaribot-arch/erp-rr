// Módulo: Arquitectos
// Validación de los datos de un arquitecto (lo usan el ERP y la sincronización de la tablet)

import { z } from "zod"

export const arquitectoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres"),
  telefono: z.string().trim().max(30, "El teléfono no puede superar 30 caracteres").optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("El email no es válido")
    .max(120, "El email no puede superar 120 caracteres")
    .optional()
    .or(z.literal("")),
  notas: z.string().trim().max(1000, "Las notas no pueden superar 1000 caracteres").optional().or(z.literal("")),
})

export type ArquitectoInput = z.infer<typeof arquitectoSchema>

/** Ids de arquitectos de un cliente (sin repetir) */
export const arquitectoIdsSchema = z.array(z.string().uuid("Arquitecto inválido")).max(50).optional()

/** Datos limpios para guardar en la base */
export function datosArquitecto(d: ArquitectoInput) {
  return {
    nombre: d.nombre.trim(),
    telefono: d.telefono?.trim() || null,
    email: d.email?.trim().toLowerCase() || null,
    notas: d.notas?.trim() || null,
  }
}
