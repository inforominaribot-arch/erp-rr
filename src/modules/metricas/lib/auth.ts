// Módulo: Dashboard & Métricas
// Control de Permisos y Roles de Usuario

import { obtenerUsuarioActual } from "@/lib/auth"
import type { Rol } from "@/types"

export interface IPermisoMetricas {
  permitido: boolean
  rol: Rol
  usuarioId?: string
  nombreUsuario: string
  esRolFinanciero: boolean
  error?: string
}

export async function tienePermisoModuloMetricas(): Promise<IPermisoMetricas> {
  const usuario = await obtenerUsuarioActual()

  // En entorno de desarrollo sin sesión activa, simulamos ADMIN_GENERAL
  if (!usuario) {
    if (process.env.NODE_ENV === "development") {
      return {
        permitido: true,
        rol: "ADMIN_GENERAL",
        usuarioId: undefined,
        nombreUsuario: "Administrador Dev",
        esRolFinanciero: true,
      }
    }
    return {
      permitido: false,
      rol: "ADMINISTRACION",
      nombreUsuario: "Invitado",
      esRolFinanciero: false,
      error: "No autenticado",
    }
  }

  if (!usuario.activo) {
    return {
      permitido: false,
      rol: usuario.rol,
      nombreUsuario: usuario.nombre,
      esRolFinanciero: false,
      error: "Usuario inactivo",
    }
  }

  // Todos los roles tienen acceso a ver el dashboard, pero con visibilidad segregada
  const esFinanciero =
    usuario.rol === "ADMIN_GENERAL" || usuario.rol === "ADMINISTRACION"

  return {
    permitido: true,
    rol: usuario.rol,
    usuarioId: usuario.id,
    nombreUsuario: usuario.nombre,
    esRolFinanciero: esFinanciero,
  }
}
