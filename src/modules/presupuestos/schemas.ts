// Módulo: Presupuestos
// Esquemas de validación Zod

import { z } from "zod"
import { MAX_OPCIONES_POR_CORTINA, TIPOS_FILA } from "./types"
import { calculoPrecioSchema } from "./lib/lista-precios-rs"

// ─── Esquema de Ítem de Presupuesto ──────────────────────────────────────────

export const itemPresupuestoSchema = z.object({
  id: z.string().optional(),
  itemMedicionId: z.string().nullable().optional(),
  descripcion: z
    .string()
    .min(1, "La descripción del producto es obligatoria")
    .max(250, "La descripción no puede superar 250 caracteres"),
  ambiente: z.string().nullable().optional().default("General"),
  ancho: z.number().min(0, "El ancho no puede ser negativo"),
  alto: z.number().min(0, "El alto no puede ser negativo"),
  cantidad: z
    .number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad mínima es 1")
    .default(1),
  precioUnitario: z.number().min(0, "El precio unitario no puede ser negativo"),
  subtotal: z.number().min(0, "El subtotal no puede ser negativo"),
  aceptado: z.boolean().default(false),
  // Alternativas de una misma cortina
  caracteristicas: z.record(z.string(), z.unknown()).nullable().optional(),
  grupoAlternativa: z.string().max(64).nullable().optional(),
  nombreOpcion: z
    .string()
    .trim()
    .max(40, "El nombre de la opción no puede superar 40 caracteres")
    .nullable()
    .optional(),
  esOpcionPrincipal: z.boolean().default(true),
  // Cortina física de la abertura y cálculo con la lista de precios
  capa: z.enum(["GAZA", "BO"]).nullable().optional(),
  indiceCortina: z.number().int().min(0).max(20).nullable().optional(),
  tipoFila: z.enum(TIPOS_FILA).nullable().optional(),
  calculoPrecio: calculoPrecioSchema.nullable().optional(),
})

export type ItemPresupuestoInput = z.infer<typeof itemPresupuestoSchema>

// ─── Esquema de Creación / Edición de Presupuesto ────────────────────────────

export const presupuestoFormSchema = z.object({
  clienteId: z
    .string()
    .min(1, "Debe seleccionar un cliente para el presupuesto"),
  validezDias: z
    .number()
    .int("Debe ser un número entero de días")
    .min(1, "El plazo mínimo de validez es 1 día")
    .max(365, "El plazo máximo de validez es 365 días")
    .default(14),
  descuento: z
    .number()
    .min(0, "El descuento no puede ser inferior a 0%")
    .max(100, "El descuento no puede superar el 100%")
    .default(0),
  notas: z.string().nullable().optional(),
  items: z
    .array(itemPresupuestoSchema)
    .min(1, "Debe incluir al menos una cortina o ítem en el presupuesto"),
}).superRefine((data, ctx) => {
  const grupos = new Map<string, ItemPresupuestoInput[]>()
  for (const it of data.items) {
    if (!it.grupoAlternativa) {
      if (it.esOpcionPrincipal === false) {
        ctx.addIssue({ code: "custom", message: "Hay una alternativa sin cortina principal." })
      }
      continue
    }
    const lista = grupos.get(it.grupoAlternativa) ?? []
    lista.push(it)
    grupos.set(it.grupoAlternativa, lista)
  }
  for (const filas of grupos.values()) {
    const desc = filas[0]?.descripcion || "cortina"
    // Una opción = las filas (cortinas de la capa) con el mismo nombre; la principal es una sola
    const opciones = new Map<string, ItemPresupuestoInput[]>()
    for (const f of filas) {
      const clave = f.esOpcionPrincipal !== false ? "__principal" : (f.nombreOpcion || "").trim().toLowerCase()
      opciones.set(clave, [...(opciones.get(clave) ?? []), f])
    }
    if (opciones.size > MAX_OPCIONES_POR_CORTINA) {
      ctx.addIssue({
        code: "custom",
        message: `"${desc}" tiene más de ${MAX_OPCIONES_POR_CORTINA} opciones.`,
      })
    }
    if (!opciones.has("__principal")) {
      ctx.addIssue({ code: "custom", message: `"${desc}" debe tener una opción principal.` })
    }
    if (opciones.size > 1 && filas.some((o) => !o.nombreOpcion?.trim())) {
      ctx.addIssue({
        code: "custom",
        message: `Poné un nombre a cada opción de "${desc}" (ej: Riel / Barral).`,
      })
    }
    const nombrePrincipal = (opciones.get("__principal")?.[0]?.nombreOpcion || "").trim().toLowerCase()
    if (opciones.size > 1 && nombrePrincipal && opciones.has(nombrePrincipal)) {
      ctx.addIssue({ code: "custom", message: `Las opciones de "${desc}" tienen nombres repetidos.` })
    }
  }
})

export type PresupuestoFormInput = z.infer<typeof presupuestoFormSchema>

// ─── Esquema para Cambio de Estado y Aprobación Parcial ──────────────────────

export const cambiarEstadoPresupuestoSchema = z.object({
  id: z.string().min(1, "Identificador de presupuesto inválido"),
  estado: z.enum([
    "BORRADOR",
    "ENVIADO",
    "ACEPTADO_TOTAL",
    "ACEPTADO_PARCIAL",
    "RECHAZADO",
  ]),
  itemsAceptadosIds: z.array(z.string()).optional(),
})

export type CambiarEstadoPresupuestoInput = z.infer<
  typeof cambiarEstadoPresupuestoSchema
>

// ─── Esquema de Filtros de Búsqueda ──────────────────────────────────────────

export const filtrosPresupuestoSchema = z.object({
  busqueda: z.string().optional(),
  estado: z
    .enum([
      "TODOS",
      "BORRADOR",
      "ENVIADO",
      "ACEPTADO_TOTAL",
      "ACEPTADO_PARCIAL",
      "RECHAZADO",
    ])
    .optional()
    .default("TODOS"),
  clienteId: z.string().optional(),
  pagina: z.number().int().min(1).optional().default(1),
  porPagina: z.number().int().min(1).max(200).optional().default(50),
})

export type FiltrosPresupuestoInput = z.infer<typeof filtrosPresupuestoSchema>
