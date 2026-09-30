import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"
import { obtenerUsuarioActual } from "@/lib/auth"

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-sync-api-key",
}

export function handleCorsPreflight() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value)
  }

  return NextResponse.json(data, {
    ...init,
    headers,
  })
}

export async function autenticarPeticionApi(req: Request): Promise<{
  autenticado: boolean
  usuario?: {
    id: string
    nombre: string
    email: string
    rol: string
  }
  error?: string
}> {
  try {
    // 1. Verificar Authorization: Bearer <token>
    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim()
      if (token && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
          const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          )
          const { data: { user }, error: userError } = await supabase.auth.getUser(token)
          if (!userError && user) {
            const usuarioDb = await prisma.usuario.findUnique({
              where: { supabaseId: user.id },
            })
            if (usuarioDb && usuarioDb.activo) {
              return { autenticado: true, usuario: usuarioDb }
            }
          }
        } catch (tokenErr) {
          console.warn("Fallo al validar token Supabase en API:", tokenErr)
        }
      }
    }

    // 2. Verificar x-sync-api-key
    const syncApiKey = req.headers.get("x-sync-api-key")
    const expectedKey = process.env.SYNC_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (syncApiKey && expectedKey && syncApiKey === expectedKey) {
      const usuarioAdmin = await prisma.usuario.findFirst({
        where: { activo: true, rol: { in: ["ADMIN_GENERAL", "ADMINISTRACION"] } },
      })
      if (usuarioAdmin) {
        return { autenticado: true, usuario: usuarioAdmin }
      }
    }

    // 3. Verificar sesión por cookies (navegador / webview estándar)
    const usuarioSesion = await obtenerUsuarioActual()
    if (usuarioSesion && usuarioSesion.activo) {
      return { autenticado: true, usuario: usuarioSesion }
    }

    // 4. Modo desarrollo / pruebas locales sin login
    if (process.env.NODE_ENV === "development") {
      const primerUsuario = await prisma.usuario.findFirst({
        where: { activo: true },
      })
      if (primerUsuario) {
        return { autenticado: true, usuario: primerUsuario }
      }
    }

    return {
      autenticado: false,
      error: "No autorizado para sincronizar con el ERP",
    }
  } catch (error) {
    console.error("Error durante autenticación de API:", error)
    return {
      autenticado: false,
      error: "Error interno al verificar credenciales",
    }
  }
}
