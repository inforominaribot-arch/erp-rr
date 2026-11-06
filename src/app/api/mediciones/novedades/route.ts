// Consulta liviana que hace la tablet cada minuto para saber si hay cambios en el ERP (solo lectura).
// GET /api/mediciones/novedades?desde=<ISO de la última descarga>
// Devuelve cuántas mediciones cambiaron y la firma de cada cliente: la tablet la compara con su copia.

import { prisma } from "@/lib/prisma"
import {
  autenticarPeticionApi,
  handleCorsPreflight,
  jsonResponse,
} from "@/lib/api-auth"
import { firmaCliente } from "@/modules/mediciones/lib/firma-cliente"

/** Igual que la descarga de mediciones: la tablet solo baja los últimos 6 meses */
const MESES_A_DESCARGAR = 6

export async function OPTIONS() {
  return handleCorsPreflight()
}

export async function GET(req: Request) {
  try {
    const auth = await autenticarPeticionApi(req)
    if (!auth.autenticado || !auth.usuario) {
      return jsonResponse({ success: false, error: auth.error || "No autorizado" }, { status: 401 })
    }

    const limite = new Date()
    limite.setMonth(limite.getMonth() - MESES_A_DESCARGAR)
    const desdeParam = new URL(req.url).searchParams.get("desde")
    const desde = desdeParam ? new Date(desdeParam) : null

    const [mediciones, clientes] = await Promise.all([
      prisma.medicion.count({
        where: {
          creadoEn: { gte: limite },
          ...(desde && !isNaN(desde.getTime()) ? { actualizadoEn: { gt: desde } } : {}),
        },
      }),
      prisma.cliente.findMany({
        select: { id: true, nombre: true, telefono: true, email: true, direccion: true, localidad: true, notas: true },
      }),
    ])

    return jsonResponse({
      success: true,
      mediciones,
      clientes: clientes.map((c) => ({ id: c.id, firma: firmaCliente(c) })),
    })
  } catch (error) {
    console.error("Error en endpoint GET /api/mediciones/novedades:", error)
    return jsonResponse({ success: false, error: "No se pudieron consultar las novedades." }, { status: 500 })
  }
}
