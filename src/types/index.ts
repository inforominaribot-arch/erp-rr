// Tipos globales del ERP RR
// Estos tipos son compartidos entre todos los módulos

export type Rol = "ADMIN_GENERAL" | "ADMINISTRACION" | "TALLER" | "INSTALACION"

export type EstadoCliente =
  | "MEDICION_TOMADA"
  | "PRESUPUESTO_ENVIADO"
  | "PRESUPUESTO_ACEPTADO"
  | "EN_PRODUCCION"
  | "INSTALADO"

export type EstadoPresupuesto =
  | "BORRADOR"
  | "ENVIADO"
  | "ACEPTADO_TOTAL"
  | "ACEPTADO_PARCIAL"
  | "RECHAZADO"

export type EstadoComanda =
  | "PENDIENTE"
  | "EN_PRODUCCION"
  | "ESPERANDO_PROVEEDOR"
  | "LISTO_PARA_INSTALAR"
  | "INSTALADO"

export type TipoItemComanda = "FABRICAR" | "PEDIR_PROVEEDOR"

export type EstadoInstalacion = "PROGRAMADA" | "COMPLETADA" | "CANCELADA"

export type TipoMovimientoStock = "INGRESO" | "EGRESO" | "AJUSTE"

export type EstadoOrdenCompra =
  | "PENDIENTE"
  | "ENVIADA"
  | "RECIBIDA_PARCIAL"
  | "RECIBIDA_TOTAL"
  | "CANCELADA"

// Respuesta estándar de Server Actions
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Labels para mostrar en UI
export const ROL_LABELS: Record<Rol, string> = {
  ADMIN_GENERAL: "Admin General",
  ADMINISTRACION: "Administración",
  TALLER: "Taller",
  INSTALACION: "Instalación",
}

export const ESTADO_CLIENTE_LABELS: Record<EstadoCliente, string> = {
  MEDICION_TOMADA: "Medición tomada",
  PRESUPUESTO_ENVIADO: "Presupuesto enviado",
  PRESUPUESTO_ACEPTADO: "Presupuesto aceptado",
  EN_PRODUCCION: "En producción",
  INSTALADO: "Instalado",
}

export const ESTADO_PRESUPUESTO_LABELS: Record<EstadoPresupuesto, string> = {
  BORRADOR: "Borrador",
  ENVIADO: "Enviado",
  ACEPTADO_TOTAL: "Aceptado total",
  ACEPTADO_PARCIAL: "Aceptado parcial",
  RECHAZADO: "Rechazado",
}

export const ESTADO_COMANDA_LABELS: Record<EstadoComanda, string> = {
  PENDIENTE: "Pendiente",
  EN_PRODUCCION: "En producción",
  ESPERANDO_PROVEEDOR: "Esperando proveedor",
  LISTO_PARA_INSTALAR: "Listo para instalar",
  INSTALADO: "Instalado",
}

export const ESTADO_INSTALACION_LABELS: Record<EstadoInstalacion, string> = {
  PROGRAMADA: "Programada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
}

export const ESTADO_ORDEN_COMPRA_LABELS: Record<EstadoOrdenCompra, string> = {
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  RECIBIDA_PARCIAL: "Recibida parcial",
  RECIBIDA_TOTAL: "Recibida total",
  CANCELADA: "Cancelada",
}
