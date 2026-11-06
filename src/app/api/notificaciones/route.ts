// Avisos de la campana del ERP (lo que llegó desde la tablet). Solo con la sesión del ERP:
// esta ruta no va en rutasPublicas porque la usa el navegador, no la tablet.
// GET: últimos avisos y cuántos faltan leer · PATCH { id } o { todas: true }: marcar como leídos.

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { autenticarPeticionApi } from "@/lib/api-auth"

const CANTIDAD_A_MOSTRAR = 30

const marcarSchema = z.union([
  z.object({ id: z.string().min(1).max(64) }),
  z.object({ todas: z.literal(true) }),
])

export async function GET(req: Request) {
  const auth = await autenticarPeticionApi(req)
  if (!auth.autenticado) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })

  try {
    const [noLeidas, avisos] = await Promise.all([
      prisma.notificacionTablet.count({ where: { leida: false } }),
      prisma.notificacionTablet.findMany({ orderBy: { creadoEn: "desc" }, take: CANTIDAD_A_MOSTRAR }),
    ])
    return NextResponse.json({ success: true, noLeidas, avisos })
  } catch (error) {
    console.error("Error al obtener las notificaciones:", error)
    return NextResponse.json({ success: false, error: "No se pudieron obtener los avisos." }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const auth = await autenticarPeticionApi(req)
  if (!auth.autenticado) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })

  const validacion = marcarSchema.safeParse(await req.json().catch(() => null))
  if (!validacion.success) return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 })

  try {
    await prisma.notificacionTablet.updateMany({
      where: "id" in validacion.data ? { id: validacion.data.id } : { leida: false },
      data: { leida: true },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al marcar las notificaciones:", error)
    return NextResponse.json({ success: false, error: "No se pudieron marcar los avisos." }, { status: 500 })
  }
}
