// Módulo: Agenda & Instalación
// Schemas de validación Zod end-to-end

import { z } from "zod"

const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const agendarInstalacionSchema = z.object({
  comandaId: z.string().uuid({ message: "La comanda seleccionada no es válida" }),
  fecha: z.string().min(1, { message: "Debe ingresar una fecha de instalación" }),
  horaInicio: z
    .string()
    .regex(horaRegex, { message: "Hora de inicio inválida (formato HH:MM)" })
    .optional()
    .or(z.literal("")),
  horaFin: z
    .string()
    .regex(horaRegex, { message: "Hora de fin inválida (formato HH:MM)" })
    .optional()
    .or(z.literal("")),
  instaladorIds: z
    .array(z.string().uuid({ message: "ID de instalador inválido" }))
    .min(1, { message: "Debe asignar al menos un instalador" }),
  notas: z.string().max(1000, { message: "Las notas no pueden superar 1000 caracteres" }).optional().nullable(),
})

export const reprogramarInstalacionSchema = z.object({
  id: z.string().uuid({ message: "ID de instalación inválido" }),
  fecha: z.string().min(1, { message: "Debe ingresar una fecha de instalación" }),
  horaInicio: z
    .string()
    .regex(horaRegex, { message: "Hora de inicio inválida (formato HH:MM)" })
    .optional()
    .or(z.literal("")),
  horaFin: z
    .string()
    .regex(horaRegex, { message: "Hora de fin inválida (formato HH:MM)" })
    .optional()
    .or(z.literal("")),
  instaladorIds: z
    .array(z.string().uuid({ message: "ID de instalador inválido" }))
    .min(1, { message: "Debe asignar al menos un instalador" }),
  notas: z.string().max(1000, { message: "Las notas no pueden superar 1000 caracteres" }).optional().nullable(),
})

export const bloqueoAgendaSchema = z.object({
  usuarioId: z.string().uuid().optional().nullable().or(z.literal("")),
  fecha: z.string().min(1, { message: "Debe indicar la fecha del bloqueo" }),
  horaInicio: z.string().regex(horaRegex, { message: "Hora de inicio inválida (formato HH:MM)" }),
  horaFin: z.string().regex(horaRegex, { message: "Hora de fin inválida (formato HH:MM)" }),
  motivo: z.string().min(3, { message: "El motivo debe tener al menos 3 caracteres (ej. 'Turno médico')" }),
}).refine(
  (data) => {
    if (data.horaInicio && data.horaFin) {
      return data.horaInicio < data.horaFin
    }
    return true
  },
  {
    message: "La hora de inicio debe ser anterior a la hora de fin",
    path: ["horaFin"],
  }
)

export const completarInstalacionSchema = z.object({
  id: z.string().uuid({ message: "ID de instalación inválido" }),
  observacionesFinales: z.string().max(1000).optional().nullable(),
})

export const cancelarInstalacionSchema = z.object({
  id: z.string().uuid({ message: "ID de instalación inválido" }),
  motivo: z.string().max(500).optional().nullable(),
})

export const toggleMaterialesListosSchema = z.object({
  id: z.string().uuid({ message: "ID de instalación inválido" }),
  materialesListos: z.boolean(),
})

export type AgendarInstalacionInput = z.infer<typeof agendarInstalacionSchema>
export type ReprogramarInstalacionInput = z.infer<typeof reprogramarInstalacionSchema>
export type BloqueoAgendaInput = z.infer<typeof bloqueoAgendaSchema>
export type CompletarInstalacionInput = z.infer<typeof completarInstalacionSchema>
export type CancelarInstalacionInput = z.infer<typeof cancelarInstalacionSchema>
