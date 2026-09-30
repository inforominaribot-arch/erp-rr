import { prisma } from "@/lib/prisma"
import {
  autenticarPeticionApi,
  handleCorsPreflight,
  jsonResponse,
} from "@/lib/api-auth"

export async function OPTIONS() {
  return handleCorsPreflight()
}

export async function GET(req: Request) {
  try {
    // 1. Control de autenticación y permisos
    const auth = await autenticarPeticionApi(req)
    if (!auth.autenticado || !auth.usuario) {
      return jsonResponse(
        { success: false, error: auth.error || "No autorizado" },
        { status: 401 }
      )
    }

    // 2. Parámetros de consulta opcionales
    const url = new URL(req.url)
    const desdeParam = url.searchParams.get("desde")
    const busqueda = url.searchParams.get("busqueda")?.trim()

    const where: Record<string, unknown> = {}

    // Soporte para sincronización incremental (solo modificados desde X fecha)
    if (desdeParam) {
      const fechaDesde = new Date(desdeParam)
      if (!isNaN(fechaDesde.getTime())) {
        where.actualizadoEn = { gte: fechaDesde }
      }
    }

    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: "insensitive" } },
        { telefono: { contains: busqueda, mode: "insensitive" } },
        { direccion: { contains: busqueda, mode: "insensitive" } },
        { localidad: { contains: busqueda, mode: "insensitive" } },
      ]
    }

    // 3. Obtener clientes optimizados para la tablet
    const clientes = await prisma.cliente.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        telefono: true,
        email: true,
        direccion: true,
        localidad: true,
        notas: true,
        estado: true,
        actualizadoEn: true,
        creadoEn: true,
      },
      orderBy: { nombre: "asc" },
    })

    return jsonResponse({
      success: true,
      total: clientes.length,
      timestamp: new Date().toISOString(),
      clientes,
    })
  } catch (error) {
    console.error("Error en endpoint GET /api/mediciones/clientes-sync:", error)
    return jsonResponse(
      {
        success: false,
        error: "Ocurrió un error al obtener el catálogo de clientes para sincronizar.",
      },
      { status: 500 }
    )
  }
}
