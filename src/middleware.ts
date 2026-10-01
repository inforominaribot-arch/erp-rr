import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  // Rutas públicas (no requieren auth)
  // Los endpoints de sync móvil tienen su propia autenticación por API key
  const rutasPublicas = ["/login", "/api/mediciones/sync", "/api/mediciones/clientes-sync"]
  const esRutaPublica = rutasPublicas.some(ruta =>
    request.nextUrl.pathname.startsWith(ruta)
  )

  // Si no hay usuario y no es ruta pública:
  if (!user && !esRutaPublica) {
    if (process.env.NODE_ENV === "development") {
      return supabaseResponse
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si hay usuario y está en ruta pública → redirigir al dashboard
  if (user && esRutaPublica) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

export default middleware

