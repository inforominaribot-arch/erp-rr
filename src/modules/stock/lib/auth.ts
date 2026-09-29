// Módulo: Stock & Inventario
// Permisos y Roles de Usuario

import { obtenerUsuarioActual } from "@/lib/auth"
import type { Rol } from "@/types"

export type AccionStock = "lectura" | "ingreso_remito" | "administracion"

export async function tienePermisoModuloStock(
  accion: AccionStock = "lectura"
): Promise<{
  permitido: boolean
  rol?: Rol
  usuarioId?: string
  puedeVerCostos: boolean
  puedeAdministrar: boolean
  puedeRegistrarRemito: boolean
  error?: string
}> {
  const usuario = await obtenerUsuarioActual()

  // En entorno de desarrollo sin sesión activa, asignamos permisos según contexto
  if (!usuario) {
    if (process.env.NODE_ENV === "development") {
      return {
        permitido: true,
        rol: "ADMIN_GENERAL",
        puedeVerCostos: true,
        puedeAdministrar: true,
        puedeRegistrarRemito: true,
      }
    }
    return {
      permitido: false,
      puedeVerCostos: false,
      puedeAdministrar: false,
      puedeRegistrarRemito: false,
      error: "No autenticado",
    }
  }

  if (!usuario.activo) {
    return {
      permitido: false,
      rol: usuario.rol,
      puedeVerCostos: false,
      puedeAdministrar: false,
      puedeRegistrarRemito: false,
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
      puedeRegistrarRemito: false,
      error: "Acceso denegado: el rol Instalación no tiene permisos en el módulo de Stock.",
    }
  }

  const esAdmin = usuario.rol === "ADMIN_GENERAL" || usuario.rol === "ADMINISTRACION"
  const esTaller = usuario.rol === "TALLER"

  const puedeVerCostos = esAdmin
  const puedeAdministrar = esAdmin
  const puedeRegistrarRemito = esAdmin || esTaller

  if (accion === "administracion" && !puedeAdministrar) {
    return {
      permitido: false,
      rol: usuario.rol,
      usuarioId: usuario.id,
      puedeVerCostos,
      puedeAdministrar,
      puedeRegistrarRemito,
      error: "Acceso denegado: solo Administración puede crear/editar productos o realizar ajustes generales.",
    }
  }

  if (accion === "ingreso_remito" && !puedeRegistrarRemito) {
    return {
      permitido: false,
      rol: usuario.rol,
      usuarioId: usuario.id,
      puedeVerCostos,
      puedeAdministrar,
      puedeRegistrarRemito,
      error: "Acceso denegado para registrar remitos.",
    }
  }

  return {
    permitido: true,
    rol: usuario.rol,
    usuarioId: usuario.id,
    puedeVerCostos,
    puedeAdministrar,
    puedeRegistrarRemito,
  }
}
