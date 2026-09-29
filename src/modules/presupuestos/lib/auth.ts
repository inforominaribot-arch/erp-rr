// Módulo: Presupuestos
// Verificación de Permisos y Roles de Usuario

import { obtenerUsuarioActual } from "@/lib/auth"
import type { Rol } from "@/types"

export async function tienePermisoModuloPresupuestos(
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

  // TALLER e INSTALACION tienen acceso de solo lectura
  if (requiereEscritura) {
    const rolesEscritura: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION"]
    if (!rolesEscritura.includes(usuario.rol)) {
      return {
        permitido: false,
        rol: usuario.rol,
        usuarioId: usuario.id,
        error:
          "Acceso denegado: solo Administración puede crear, editar o aprobar presupuestos",
      }
    }
  } else {
    const rolesLectura: Rol[] = [
      "ADMIN_GENERAL",
      "ADMINISTRACION",
      "TALLER",
      "INSTALACION",
    ]
    if (!rolesLectura.includes(usuario.rol)) {
      return {
        permitido: false,
        rol: usuario.rol,
        usuarioId: usuario.id,
        error: "Acceso denegado al módulo de presupuestos",
      }
    }
  }

  return { permitido: true, rol: usuario.rol, usuarioId: usuario.id }
}
