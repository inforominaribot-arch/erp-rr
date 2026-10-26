// Descarga de mediciones del ERP hacia la tablet (sentido web → tablet).
// GET /api/mediciones/descargar?desde=<ISO>
// - Sin "desde": todas las mediciones de los últimos 6 meses.
// - Con "desde": solo las modificadas después de esa fecha (dentro de los últimos 6 meses).
// Devuelve también "servidorAhora" para que la tablet lo guarde como marca de la próxima descarga.

import { prisma } from "@/lib/prisma"
import {
  autenticarPeticionApi,
  handleCorsPreflight,
  jsonResponse,
} from "@/lib/api-auth"
import { medicionTienePresupuestoAceptado } from "@/modules/mediciones/lib/aplicar-cambios-medicion"

const MESES_A_DESCARGAR = 6

export async function OPTIONS() {
  return handleCorsPreflight()
}

export async function GET(req: Request) {
  try {
    const auth = await autenticarPeticionApi(req)
    if (!auth.autenticado || !auth.usuario) {
      return jsonResponse(
        { success: false, error: auth.error || "No autorizado" },
        { status: 401 }
      )
    }

    const servidorAhora = new Date()
    const limite = new Date(servidorAhora)
    limite.setMonth(limite.getMonth() - MESES_A_DESCARGAR)

    const desdeParam = new URL(req.url).searchParams.get("desde")
    const desde = desdeParam ? new Date(desdeParam) : null

    const mediciones = await prisma.medicion.findMany({
      where: {
        creadoEn: { gte: limite },
        ...(desde && !isNaN(desde.getTime()) ? { actualizadoEn: { gt: desde } } : {}),
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, telefono: true, direccion: true, localidad: true },
        },
        ambientes: {
          orderBy: { orden: "asc" },
          include: { items: { orderBy: { creadoEn: "asc" } } },
        },
      },
      orderBy: { actualizadoEn: "desc" },
    })

    const resultado = await Promise.all(
      mediciones.map(async (m) => ({
        idServidor: m.id,
        clienteId: m.clienteId,
        clienteNombre: m.cliente.nombre,
        clienteTelefono: m.cliente.telefono,
        clienteDireccion: m.cliente.direccion,
        clienteLocalidad: m.cliente.localidad,
        observaciones: m.observaciones,
        creadoEn: m.creadoEn.toISOString(),
        actualizadoEn: m.actualizadoEn.toISOString(),
        bloqueada: await medicionTienePresupuestoAceptado(prisma, m.id),
        ambientes: m.ambientes.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          orden: a.orden,
          items: a.items.map((it) => ({
            id: it.id,
            descripcion: it.descripcion,
            ancho: Number(it.ancho),
            alto: Number(it.alto),
            cantidad: it.cantidad,
            caracteristicas: it.caracteristicas ?? {},
            observaciones: it.observaciones,
          })),
        })),
      }))
    )

    return jsonResponse({
      success: true,
      servidorAhora: servidorAhora.toISOString(),
      total: resultado.length,
      mediciones: resultado,
    })
  } catch (error) {
    console.error("Error en endpoint GET /api/mediciones/descargar:", error)
    return jsonResponse(
      { success: false, error: "Ocurrió un error al descargar las mediciones." },
      { status: 500 }
    )
  }
}
