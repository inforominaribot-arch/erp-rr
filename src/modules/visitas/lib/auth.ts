// Módulo: Agendar Visitas
// Control de Permisos y Roles de Usuario

import { obtenerUsuarioActual } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

export async function tienePermisoModuloVisitas(): Promise<{
  permitido: boolean
  rol?: Rol
  usuarioId?: string
  nombreUsuario?: string
  error?: string
}> {
  const usuario = await obtenerUsuarioActual()

  // En entorno de desarrollo sin sesión activa
  if (!usuario) {
    if (process.env.NODE_ENV === "development") {
      const primerAdmin = await prisma.usuario.findFirst({
        where: {
          activo: true,
          rol: { in: ["ADMIN_GENERAL", "ADMINISTRACION"] },
        },
      })

      return {
        permitido: true,
        rol: primerAdmin?.rol || "ADMIN_GENERAL",
        usuarioId: primerAdmin?.id,
        nombreUsuario: primerAdmin?.nombre || "Romina Ribot",
      }
    }
    return { permitido: false, error: "No autenticado" }
  }

  if (!usuario.activo) {
    return { permitido: false, rol: usuario.rol, error: "Usuario inactivo" }
  }

  // TALLER e INSTALACION tienen acceso bloqueado
  const rolesPermitidos: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION"]
  if (!rolesPermitidos.includes(usuario.rol)) {
    return {
      permitido: false,
      rol: usuario.rol,
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombre,
      error: "Acceso denegado: el módulo de Visitas es exclusivo para la dueña y administración.",
    }
  }

  return {
    permitido: true,
    rol: usuario.rol,
    usuarioId: usuario.id,
    nombreUsuario: usuario.nombre,
  }
}
