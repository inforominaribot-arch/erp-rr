// Módulo: Agenda & Instalación
// Control de Permisos y Roles de Usuario

import { obtenerUsuarioActual } from "@/lib/auth"
import type { Rol } from "@/types"

export async function tienePermisoModuloInstalaciones(
  accion: "ver" | "agendar" | "taller" | "completar" | "bloquear" = "ver"
): Promise<{
  permitido: boolean
  rol?: Rol
  usuarioId?: string
  nombreUsuario?: string
  error?: string
}> {
  const usuario = await obtenerUsuarioActual()

  // En entorno de desarrollo sin sesión activa, simulamos ADMIN_GENERAL
  if (!usuario) {
    if (process.env.NODE_ENV === "development") {
      return {
        permitido: true,
        rol: "ADMIN_GENERAL",
        usuarioId: undefined,
        nombreUsuario: "Administrador Dev",
      }
    }
    return { permitido: false, error: "No autenticado" }
  }

  if (!usuario.activo) {
    return { permitido: false, rol: usuario.rol, error: "Usuario inactivo" }
  }

  // Permisos según acción
  switch (accion) {
    case "agendar": {
      // Solo Administración y Admin General pueden programar o reprogramar instalaciones
      const rolesPermitidos: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION"]
      if (!rolesPermitidos.includes(usuario.rol)) {
        return {
          permitido: false,
          rol: usuario.rol,
          usuarioId: usuario.id,
          nombreUsuario: usuario.nombre,
          error: "Acceso denegado: solo Administración puede programar instalaciones.",
        }
      }
      break
    }
    case "taller": {
      // Taller, Administración y Admin General pueden gestionar la preparación
      const rolesPermitidos: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION", "TALLER"]
      if (!rolesPermitidos.includes(usuario.rol)) {
        return {
          permitido: false,
          rol: usuario.rol,
          usuarioId: usuario.id,
          nombreUsuario: usuario.nombre,
          error: "Acceso denegado a la vista de taller de instalaciones.",
        }
      }
      break
    }
    case "completar": {
      // Instaladores, Administración y Admin General pueden completar instalaciones
      const rolesPermitidos: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION", "INSTALACION"]
      if (!rolesPermitidos.includes(usuario.rol)) {
        return {
          permitido: false,
          rol: usuario.rol,
          usuarioId: usuario.id,
          nombreUsuario: usuario.nombre,
          error: "Acceso denegado: no tiene permisos para dar por completada la instalación.",
        }
      }
      break
    }
    case "bloquear": {
      // Todos los roles activos del equipo pueden cargar bloqueos de agenda
      const rolesPermitidos: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION", "TALLER", "INSTALACION"]
      if (!rolesPermitidos.includes(usuario.rol)) {
        return {
          permitido: false,
          rol: usuario.rol,
          usuarioId: usuario.id,
          nombreUsuario: usuario.nombre,
          error: "Acceso denegado para registrar bloqueos de agenda.",
        }
      }
      break
    }
    case "ver":
    default: {
      // Todos los roles del ERP tienen acceso a visualizar la agenda/instalaciones
      const rolesLectura: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION", "TALLER", "INSTALACION"]
      if (!rolesLectura.includes(usuario.rol)) {
        return {
          permitido: false,
          rol: usuario.rol,
          usuarioId: usuario.id,
          nombreUsuario: usuario.nombre,
          error: "Acceso denegado al módulo de instalaciones.",
        }
      }
      break
    }
  }

  return {
    permitido: true,
    rol: usuario.rol,
    usuarioId: usuario.id,
    nombreUsuario: usuario.nombre,
  }
}
