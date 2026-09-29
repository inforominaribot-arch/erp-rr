// Módulo: Comandas & Producción
// Verificación de Permisos y Roles de Usuario

import { obtenerUsuarioActual } from "@/lib/auth"
import type { Rol } from "@/types"

export async function tienePermisoModuloComandas(
  requiereEscritura: boolean = false
): Promise<{
  permitido: boolean
  rol?: Rol
  usuarioId?: string
  error?: string
}> {
  const usuario = await obtenerUsuarioActual()

  // En entorno de desarrollo sin sesión activa, permitimos el acceso
  if (!usuario) {
    if (process.env.NODE_ENV === "development") {
      return {
        permitido: true,
        rol: "ADMIN_GENERAL",
      }
    }
    return { permitido: false, error: "No autenticado" }
  }

  if (!usuario.activo) {
    return { permitido: false, rol: usuario.rol, error: "Usuario inactivo" }
  }

  // INSTALACION no tiene acceso a Comandas (su módulo es Agenda en Chat 7)
  if (usuario.rol === "INSTALACION") {
    return {
      permitido: false,
      rol: usuario.rol,
      usuarioId: usuario.id,
      error: "Acceso denegado: el rol Instalación no tiene permisos en Comandas.",
    }
  }

  // Crear o modificar estructura de Comandas: solo Administración y Admin General
  if (requiereEscritura) {
    const rolesEscritura: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION"]
    if (!rolesEscritura.includes(usuario.rol)) {
      return {
        permitido: false,
        rol: usuario.rol,
        usuarioId: usuario.id,
        error: "Acceso denegado: solo Administración puede generar o modificar comandas.",
      }
    }
  } else {
    // Lectura de comandas: Admin General, Administración y Taller
    const rolesLectura: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION", "TALLER"]
    if (!rolesLectura.includes(usuario.rol)) {
      return {
        permitido: false,
        rol: usuario.rol,
        usuarioId: usuario.id,
        error: "Acceso denegado al módulo de comandas.",
      }
    }
  }

  return { permitido: true, rol: usuario.rol, usuarioId: usuario.id }
}

export async function tienePermisoModuloProduccion(): Promise<{
  permitido: boolean
  rol?: Rol
  usuarioId?: string
  error?: string
}> {
  const usuario = await obtenerUsuarioActual()

  if (!usuario) {
    if (process.env.NODE_ENV === "development") {
      return {
        permitido: true,
        rol: "TALLER",
      }
    }
    return { permitido: false, error: "No autenticado" }
  }

  if (!usuario.activo) {
    return { permitido: false, rol: usuario.rol, error: "Usuario inactivo" }
  }

  // Taller, Administración y Admin General tienen acceso completo a Producción
  const rolesPermitidos: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION", "TALLER"]
  if (!rolesPermitidos.includes(usuario.rol)) {
    return {
      permitido: false,
      rol: usuario.rol,
      usuarioId: usuario.id,
      error: "Acceso denegado al módulo de producción de taller.",
    }
  }

  return { permitido: true, rol: usuario.rol, usuarioId: usuario.id }
}
