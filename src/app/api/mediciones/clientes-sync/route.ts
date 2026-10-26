import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  autenticarPeticionApi,
  handleCorsPreflight,
  jsonResponse,
} from "@/lib/api-auth"
import {
  clienteTabletSyncSchema,
  clientesTabletSyncBatchSchema,
} from "@/modules/mediciones/schemas"

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

/**
 * Recibe los clientes editados en la tablet y actualiza sus datos en el ERP.
 * Gana la tablet (igual que con las mediciones). Los clientes que no existen en el ERP
 * se informan como "noEncontrados" (la tablet deja de reintentarlos).
 */
export async function POST(req: Request) {
  try {
    const auth = await autenticarPeticionApi(req)
    if (!auth.autenticado || !auth.usuario) {
      return jsonResponse(
        { success: false, error: auth.error || "No autorizado" },
        { status: 401 }
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonResponse(
        { success: false, error: "El cuerpo de la solicitud debe ser un JSON válido" },
        { status: 400 }
      )
    }

    const lote = clientesTabletSyncBatchSchema.safeParse(body)
    if (!lote.success) {
      return jsonResponse(
        { success: false, error: lote.error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      )
    }

    const actualizados: string[] = []
    const noEncontrados: string[] = []
    const rechazados: Array<{ id: string; error: string }> = []

    for (const crudo of lote.data.clientes) {
      const id = (crudo as { id?: unknown })?.id
      const validacion = clienteTabletSyncSchema.safeParse(crudo)
      if (!validacion.success) {
        rechazados.push({
          id: typeof id === "string" ? id : "",
          error: validacion.error.issues.map((e) => e.message).join(", "),
        })
        continue
      }

      const c = validacion.data
      const existe = await prisma.cliente.findUnique({ where: { id: c.id }, select: { id: true } })
      if (!existe) {
        noEncontrados.push(c.id)
        continue
      }

      await prisma.cliente.update({
        where: { id: c.id },
        data: {
          nombre: c.nombre,
          telefono: c.telefono || null,
          email: c.email || null,
          direccion: c.direccion || null,
          localidad: c.localidad || null,
          notas: c.notas || null,
        },
      })
      actualizados.push(c.id)
    }

    if (actualizados.length > 0) {
      revalidatePath("/clientes")
      revalidatePath("/clientes/pipeline")
      revalidatePath("/mediciones")
      revalidatePath("/presupuestos")
      for (const id of actualizados) revalidatePath(`/clientes/${id}`)
    }

    return jsonResponse({ success: true, actualizados, noEncontrados, rechazados })
  } catch (error) {
    console.error("Error en endpoint POST /api/mediciones/clientes-sync:", error)
    return jsonResponse(
      { success: false, error: "Ocurrió un error al guardar los clientes editados en la tablet." },
      { status: 500 }
    )
  }
}
