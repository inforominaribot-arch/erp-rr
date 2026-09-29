// Módulo: Proveedores & Compras
// Helper de Autenticación, Roles y Permisos

import { obtenerUsuarioActual } from "@/lib/auth"
import type { Rol } from "@/types"

export type AccionProveedores =
  | "lectura"
  | "administracion"
  | "emision_orden"
  | "recepcion"

export async function tienePermisoModuloProveedores(
  accion: AccionProveedores = "lectura"
): Promise<{
  permitido: boolean
  rol?: Rol
  usuarioId?: string
  puedeVerCostos: boolean
  puedeAdministrar: boolean
  puedeEmitirOrden: boolean
  puedeRecibir: boolean
  error?: string
}> {
  const usuario = await obtenerUsuarioActual()

  // En entorno de desarrollo sin sesión activa, asignamos permisos de administrador
  if (!usuario) {
    if (process.env.NODE_ENV === "development") {
      return {
        permitido: true,
        rol: "ADMIN_GENERAL",
        puedeVerCostos: true,
        puedeAdministrar: true,
        puedeEmitirOrden: true,
        puedeRecibir: true,
      }
    }
    return {
      permitido: false,
      puedeVerCostos: false,
      puedeAdministrar: false,
      puedeEmitirOrden: false,
      puedeRecibir: false,
      error: "No autenticado",
    }
  }

  if (!usuario.activo) {
    return {
      permitido: false,
      rol: usuario.rol,
      puedeVerCostos: false,
      puedeAdministrar: false,
      puedeEmitirOrden: false,
      puedeRecibir: false,
      error: "Usuario inactivo",
    }
  }

  // INSTALACION bloqueado
  if (usuario.rol === "INSTALACION") {
    return {
      permitido: false,
      rol: usuario.rol,
      usuarioId: usuario.id,
      puedeVerCostos: false,
      puedeAdministrar: false,
      puedeEmitirOrden: false,
      puedeRecibir: false,
      error: "Acceso denegado: el rol Instalación no tiene permisos en el módulo de Proveedores y Compras.",
    }
  }

  const esAdmin =
    usuario.rol === "ADMIN_GENERAL" || usuario.rol === "ADMINISTRACION"
  const esTaller = usuario.rol === "TALLER"

  const puedeVerCostos = esAdmin
  const puedeAdministrar = esAdmin
  const puedeEmitirOrden = esAdmin
  const puedeRecibir = esAdmin

  // Taller solo puede leer órdenes para saber qué está pedido
  if (accion !== "lectura" && esTaller) {
    return {
      permitido: false,
      rol: usuario.rol,
      usuarioId: usuario.id,
      puedeVerCostos,
      puedeAdministrar,
      puedeEmitirOrden,
      puedeRecibir,
      error: "Acceso restringido: el personal de Taller solo tiene permisos de consulta de órdenes de compra.",
    }
  }

  return {
    permitido: true,
    rol: usuario.rol,
    usuarioId: usuario.id,
    puedeVerCostos,
    puedeAdministrar,
    puedeEmitirOrden,
    puedeRecibir,
  }
}
