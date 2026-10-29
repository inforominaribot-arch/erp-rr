// Módulo: App Medición (PWA)
// Schemas de validación Zod End-to-End

import { z } from "zod"
import { clienteSchema } from "@/modules/clientes/schemas"
import { CODIGOS_MODELO_MOSQUITERO } from "./lib/mosquiteros"

// ─── Telas: Gaza y Black Out ──────────────────────────────────────────────────

export const gazaConfigSchema = z.object({
  activa: z.boolean().default(false),
  ancho: z.number().min(0).default(0),
  alto: z.number().min(0).default(0),
  panos: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(1),
  anchosPanos: z.array(z.number().min(0)).default([]),
  nombreTela: z.string().default(""),
  telaId: z.string().max(64).nullable().optional(),
  colorTela: z.string().max(80).nullable().optional(),
})

export const boConfigSchema = z.object({
  activa: z.boolean().default(false),
  ancho: z.number().min(0).default(0),
  alto: z.number().min(0).default(0),
  tramos: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(1),
  anchosTramos: z.array(z.number().min(0)).default([]),
  nombreTela: z.string().default(""),
  telaId: z.string().max(64).nullable().optional(),
  colorTela: z.string().max(80).nullable().optional(),
  mandosRoller: z
    .array(z.enum(["Izquierda", "Derecha", "Izquierdo", "Derecho", "Sin mando"]))
    .optional(),
})

// ─── Características Técnicas por Cortina ─────────────────────────────────────

export const caracteristicasItemSchema = z.object({
  tipo: z.enum([
    "Tradicional",
    "Roller",
    "Bandas verticales",
    "Aluminio",
    "Roller Noche total",
    "Noche total",
    "Mosquera",
    "Motorizada",
  ]),

  subtipoMotorizada: z
    .enum([
      "Tradicional Mot",
      "Tradicional Mot y Tradicional",
      "Tradicional Mot y Roller",
      "Tradicional Mot y Roller Mot",
      "Roller Mot",
      "Roller Mot y Roller",
      "Roller Mot y Tradicional",
      "Bandas Verticales y Roller Mot",
    ])
    .optional(),

  tipoCapaGaza: z
    .enum(["Tradicional", "Roller", "Bandas verticales", "Tradicional Mot", "Roller Mot"])
    .optional(),
  tipoCapaBO: z
    .enum(["Tradicional", "Roller", "Bandas verticales", "Tradicional Mot", "Roller Mot"])
    .optional(),

  // Aluminio exclusivo
  aluminio: z
    .object({
      tipoLamina: z.enum(["16 mm", "25 mm", "Perforado"]),
      color: z.enum([
        "Blanco",
        "Beige",
        "Natural",
        "Aluminio",
        "Congo",
        "Negro",
      ]),
      mando: z.enum(["Izquierdo", "Derecho", "Izquierda", "Derecha", "Sin mando"]),
      tensor: z.boolean().optional(),
    })
    .optional(),

  // Tradicional: Sistema Riel o Barral con su color
  sistema: z.enum(["Riel", "Barral"]).optional(),
  tipoRiel: z.enum(["Normal", "Curvo"]).optional(),
  colorBarral: z
    .enum([
      "Negro",
      "Níquel Mate",
      "Níquel Brilloso",
      "Bronce Viejo",
      "Blanco",
    ])
    .optional(),

  // Roller, Bandas, Roller Noche total, Mosquera: Perfilería
  perfileria: z.string().optional(),

  // Campos comunes no-aluminio
  sujecion: z
    .enum(["Techo", "Pared", "Moldura", "Sócalo", "Aire", "Abertura"])
    .optional(),
  mando: z
    .enum(["Izquierda", "Derecha", "Izquierdo", "Derecho", "Sin mando"])
    .optional(),
  caida: z.enum(["Por delante", "Por detrás"]).optional(),
  posicionRoller: z.enum(["Adelante", "Atrás"]).optional(),
  caidaBO: z.enum(["Por delante", "Por detrás"]).optional(),
  posicionRollerBO: z.enum(["Adelante", "Atrás"]).optional(),
  marca: z.enum(["HD", "RS", "MG"]).optional().nullable(),

  // Formato B.O. (Tradicional de taller vs Roller proveedor)
  formatoBO: z.enum(["Tradicional", "Roller"]).optional(),
  mandoBO: z
    .enum(["Izquierda", "Derecha", "Izquierdo", "Derecho", "Sin mando"])
    .optional(),
  marcaBO: z.enum(["HD", "RS", "MG"]).optional().nullable(),
  mandosRollerBO: z
    .array(z.enum(["Izquierda", "Derecha", "Izquierdo", "Derecho", "Sin mando"]))
    .optional(),
  mandosRollerGaza: z
    .array(z.enum(["Izquierda", "Derecha", "Izquierdo", "Derecho", "Sin mando"]))
    .optional(),

  // Marcas independientes por capa
  marcaGaza: z.enum(["HD", "RS", "MG"]).optional().nullable(),

  // Motores
  motorGaza: z
    .object({
      marca: z.enum(["Somfy", "Tube"]),
      modelo: z.string(),
      control: z.boolean(),
      canales: z.union([z.literal(1), z.literal(4), z.literal(15), z.literal(16)]).optional(),
    })
    .optional(),
  motorBO: z
    .object({
      marca: z.enum(["Somfy", "Tube"]),
      modelo: z.string(),
      control: z.boolean(),
      canales: z.union([z.literal(1), z.literal(4), z.literal(15), z.literal(16)]).optional(),
    })
    .optional(),
  cantidadCargadores: z.number().optional(),

  // Modo por cortina (Normal / Solo tela / Solo riel)
  modosPanosGaza: z.array(z.enum(["Normal", "Solo tela", "Solo riel"])).optional(),
  modosTramosBO: z.array(z.enum(["Normal", "Solo tela", "Solo riel"])).optional(),

  // Roller "Sólo tela" individual (legado)
  soloTelaPanosGaza: z.array(z.boolean()).optional(),
  soloTelaTramosBO: z.array(z.boolean()).optional(),

  // Mosquitero MagicRoll
  mosquitero: z
    .object({
      modelo: z.enum(CODIGOS_MODELO_MOSQUITERO),
      cajon: z.string().max(10).nullable(),
      mando: z.enum(["Izquierda", "Derecha"]).optional(),
      sentidoApertura: z.enum(["Izquierda", "Derecha"]).optional(),
      puertas: z.enum(["Simple", "Doble"]).optional(),
    })
    .optional(),

  // Capas de tela
  gaza: gazaConfigSchema.optional(),
  bo: boConfigSchema.optional(),

  // Soportes y argollas calculadas
  tipoSoporte: z.enum(["Grampa", "Kent"]).optional(),
  varianteSoporte: z.enum(["Simple", "Doble"]).optional(),
  cantidadSoportes: z.number().optional(),
  tipoSoporteRoller: z.enum(["Común", "Extendido"]).optional(),
  cantidadArgollas: z.number().optional(),
  anchoConfeccionGaza: z.number().optional(),
})

// ─── Ítem de Medición ─────────────────────────────────────────────────────────

export const itemMedicionSchema = z.object({
  id: z.string().optional(),
  descripcion: z
    .string()
    .min(1, "La descripción / identificación de la abertura es obligatoria")
    .max(150),
  ancho: z.number().positive("El ancho debe ser mayor a 0"),
  alto: z.number().positive("El alto debe ser mayor a 0"),
  cantidad: z
    .number()
    .int()
    .min(1, "La cantidad mínima es 1")
    .default(1),
  caracteristicas: caracteristicasItemSchema,
  observaciones: z
    .string()
    .max(1000, "Las observaciones no pueden superar los 1000 caracteres")
    .optional()
    .nullable()
    .or(z.literal("")),
})

export type ItemMedicionInput = z.infer<typeof itemMedicionSchema>

// ─── Ambiente ─────────────────────────────────────────────────────────────────

export const ambienteSchema = z.object({
  id: z.string().optional(),
  nombre: z
    .string()
    .min(2, "El nombre del ambiente debe tener al menos 2 caracteres")
    .max(100),
  orden: z.number().int().default(0),
  items: z.array(itemMedicionSchema).min(1, "Cada ambiente debe tener al menos una cortina relevada"),
})

export type AmbienteInput = z.infer<typeof ambienteSchema>

// ─── Medición Completa ────────────────────────────────────────────────────────

export const medicionSchema = z.object({
  clienteId: z.string().min(1, "Debe seleccionar un cliente"),
  observaciones: z
    .string()
    .max(2000, "Las observaciones generales no pueden superar 2000 caracteres")
    .optional()
    .nullable()
    .or(z.literal("")),
  ambientes: z
    .array(ambienteSchema)
    .min(1, "Debe relevar al menos un ambiente en la medición"),
})

export type MedicionInput = z.infer<typeof medicionSchema>

// ─── Alta Express de Cliente desde la App ─────────────────────────────────────

export const clienteExpressSchema = z.object({
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
    .email("Email inválido")
    .max(120)
    .trim()
    .optional()
    .or(z.literal("")),
  direccion: z
    .string()
    .max(200)
    .trim()
    .optional()
    .or(z.literal("")),
  localidad: z
    .string()
    .max(100)
    .trim()
    .optional()
    .or(z.literal("")),
  notas: z
    .string()
    .max(1000)
    .trim()
    .optional()
    .or(z.literal("")),
})

export type ClienteExpressInput = z.infer<typeof clienteExpressSchema>

// ─── Filtros para Listado de Mediciones ───────────────────────────────────────

export const filtrosMedicionSchema = z.object({
  busqueda: z.string().trim().optional(),
  sincronizado: z
    .enum(["TODOS", "SINCRONIZADO", "PENDIENTE"])
    .optional()
    .default("TODOS"),
  clienteId: z.string().optional(),
  pagina: z.number().int().min(1).optional().default(1),
  porPagina: z.number().int().min(1).max(100).optional().default(20),
})

export type FiltrosMedicionInput = z.infer<typeof filtrosMedicionSchema>

// ─── Sincronización Offline (Capacitor / Android / PWA) ───────────────────────

export const itemMedicionOfflineSyncSchema = z.object({
  id: z.string().optional().nullable(), // ID del servidor (si la cortina ya existe en el ERP)
  idLocal: z.string().optional(),
  descripcion: z
    .string()
    .min(1, "La descripción / identificación de la abertura es obligatoria")
    .max(150),
  ancho: z.number().positive("El ancho debe ser mayor a 0"),
  alto: z.number().positive("El alto debe ser mayor a 0"),
  cantidad: z.number().int().min(1, "La cantidad mínima es 1").default(1),
  caracteristicas: z.any().optional(),
  observaciones: z.string().max(1000).optional().nullable(),
})

export const ambienteOfflineSyncSchema = z.object({
  id: z.string().optional().nullable(), // ID del servidor (si el ambiente ya existe en el ERP)
  idLocal: z.string().optional(),
  nombre: z
    .string()
    .min(1, "El nombre del ambiente es obligatorio")
    .max(100),
  orden: z.number().int().default(0),
  items: z
    .array(itemMedicionOfflineSyncSchema)
    .min(1, "Cada ambiente debe tener al menos una cortina relevada"),
})

export const medicionOfflineSyncSchema = z.object({
  idLocal: z.string().min(1, "idLocal es obligatorio"),
  idServidor: z.string().optional().nullable(),
  clienteId: z.string().min(1, "Debe especificar el id del cliente"),
  clienteNombre: z.string().default("Cliente Relevamiento"),
  clienteTelefono: z.string().optional().nullable(),
  clienteDireccion: z.string().optional().nullable(),
  clienteLocalidad: z.string().optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
  sincronizado: z.boolean().default(false),
  guardadoEn: z.string().optional(),
  ambientes: z
    .array(ambienteOfflineSyncSchema)
    .min(1, "Debe relevar al menos un ambiente en la medición"),
})

export const syncMedicionesBatchSchema = z.union([
  z.array(medicionOfflineSyncSchema),
  z.object({
    mediciones: z.array(medicionOfflineSyncSchema),
  }),
])

export type MedicionOfflineSyncInput = z.infer<typeof medicionOfflineSyncSchema>
export type SyncMedicionesBatchInput = z.infer<typeof syncMedicionesBatchSchema>

// ─── Clientes editados en la tablet (POST /api/mediciones/clientes-sync) ─────

export const clienteTabletSyncSchema = clienteSchema
  .pick({ nombre: true, telefono: true, email: true, direccion: true, localidad: true, notas: true })
  .extend({ id: z.string().uuid("Identificador de cliente inválido") })

export const clientesTabletSyncBatchSchema = z.object({
  clientes: z.array(z.unknown()).max(500, "Demasiados clientes en un solo envío"),
})

export type ClienteTabletSyncInput = z.infer<typeof clienteTabletSyncSchema>

