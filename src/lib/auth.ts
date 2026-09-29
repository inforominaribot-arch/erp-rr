import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

export async function obtenerUsuarioActual() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const usuarioDb = await prisma.usuario.findUnique({
      where: { supabaseId: user.id },
    })

    return usuarioDb
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return null
  }
}

export async function tienePermisoModuloClientes(): Promise<{
  permitido: boolean
  rol?: Rol
  error?: string
}> {
  const usuario = await obtenerUsuarioActual()

  // Si no hay usuario logueado en la sesión
  if (!usuario) {
    // Si estamos en desarrollo y no se ha creado sesión aún, permitimos acceso para desarrollo
    if (process.env.NODE_ENV === "development") {
      return { permitido: true, rol: "ADMIN_GENERAL" }
    }
    return { permitido: false, error: "No autenticado" }
  }

  if (!usuario.activo) {
    return { permitido: false, rol: usuario.rol, error: "Usuario inactivo" }
  }

  const rolesPermitidos: Rol[] = ["ADMIN_GENERAL", "ADMINISTRACION"]

  if (!rolesPermitidos.includes(usuario.rol)) {
    return {
      permitido: false,
      rol: usuario.rol,
      error: "Acceso denegado: este módulo es exclusivo para Administración",
    }
  }

  return { permitido: true, rol: usuario.rol }
}

export async function tienePermisoModuloMediciones(
  requiereEscritura: boolean = false
): Promise<{
  permitido: boolean
  rol?: Rol
  usuarioId?: string
  error?: string
}> {
  const usuario = await obtenerUsuarioActual()

  // Si no hay usuario logueado en la sesión
  if (!usuario) {
    if (process.env.NODE_ENV === "development") {
      // Buscar el primer usuario disponible en la base de datos para no romper relaciones
      const primerUsuario = await prisma.usuario.findFirst({
        where: { activo: true },
      })
      return {
        permitido: true,
        rol: primerUsuario?.rol || "ADMIN_GENERAL",
        usuarioId: primerUsuario?.id,
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
        error: "Acceso denegado: solo Administración puede crear o modificar mediciones",
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
        error: "Acceso denegado al módulo de mediciones",
      }
    }
  }

  return { permitido: true, rol: usuario.rol, usuarioId: usuario.id }
}

