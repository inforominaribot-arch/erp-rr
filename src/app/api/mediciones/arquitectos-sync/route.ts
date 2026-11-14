// Arquitectos entre la tablet y el ERP (la tablet los puede crear, editar y borrar sin internet).
// GET: lista completa · POST { cambios: [{ accion, id, ...datos }] }: aplica los cambios de la tablet.
// Los creados en la tablet traen un id temporal ("arq_offline_..."): se devuelve el id real para reemplazarlo.
// Va en rutasPublicas del middleware (la tablet entra con la clave de sincronización).

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { autenticarPeticionApi, handleCorsPreflight, jsonResponse } from "@/lib/api-auth"
import { arquitectoSchema, datosArquitecto } from "@/modules/arquitectos/schemas"
import { avisarDesdeTablet } from "@/modules/notificaciones/lib/avisos-tablet"

const cambioSchema = z.object({
  accion: z.enum(["crear", "editar", "borrar"]),
  id: z.string().min(1).max(64),
})
const loteSchema = z.object({ cambios: z.array(z.unknown()).max(200, "Demasiados cambios en un solo envío") })

export async function OPTIONS() {
  return handleCorsPreflight()
}

export async function GET(req: Request) {
  try {
    const auth = await autenticarPeticionApi(req)
    if (!auth.autenticado || !auth.usuario) {
      return jsonResponse({ success: false, error: auth.error || "No autorizado" }, { status: 401 })
    }
    const arquitectos = await prisma.arquitecto.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, telefono: true, email: true, notas: true },
    })
    return jsonResponse({ success: true, arquitectos })
  } catch (error) {
    console.error("Error en endpoint GET /api/mediciones/arquitectos-sync:", error)
    return jsonResponse({ success: false, error: "No se pudieron obtener los arquitectos." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await autenticarPeticionApi(req)
    if (!auth.autenticado || !auth.usuario) {
      return jsonResponse({ success: false, error: auth.error || "No autorizado" }, { status: 401 })
    }
    const lote = loteSchema.safeParse(await req.json().catch(() => null))
    if (!lote.success) return jsonResponse({ success: false, error: "Datos inválidos" }, { status: 400 })

    const creados: Array<{ idLocal: string; id: string }> = []
    const listos: string[] = []
    const rechazados: Array<{ id: string; error: string }> = []

    for (const crudo of lote.data.cambios) {
      const cambio = cambioSchema.safeParse(crudo)
      if (!cambio.success) {
        rechazados.push({ id: String((crudo as { id?: unknown })?.id ?? ""), error: "Cambio inválido" })
        continue
      }
      const { accion, id } = cambio.data
      const esReal = z.string().uuid().safeParse(id).success

      if (accion === "borrar") {
        if (esReal) {
          const borrado = await prisma.arquitecto.deleteMany({ where: { id } })
          if (borrado.count > 0) {
            const nombre = String((crudo as { nombre?: unknown }).nombre ?? "").trim()
            await avisarDesdeTablet({
              tipo: "ARQUITECTO_BORRADO",
              mensaje: `Se borró el arquitecto ${nombre || ""}`.trim(),
              arquitectoId: id,
            })
          }
        }
        listos.push(id)
        continue
      }

      const datos = arquitectoSchema.safeParse(crudo)
      if (!datos.success) {
        rechazados.push({ id, error: datos.error.issues.map((e) => e.message).join(", ") })
        continue
      }

      if (accion === "crear" || !esReal) {
        const nuevo = await prisma.arquitecto.create({ data: datosArquitecto(datos.data), select: { id: true } })
        creados.push({ idLocal: id, id: nuevo.id })
        await avisarDesdeTablet({ tipo: "ARQUITECTO_NUEVO", mensaje: `Arquitecto nuevo: ${datos.data.nombre}`, arquitectoId: nuevo.id })
        continue
      }

      const existe = await prisma.arquitecto.findUnique({ where: { id }, select: { id: true } })
      if (!existe) {
        // Lo borraron en el ERP: la tablet deja de reintentarlo
        listos.push(id)
        continue
      }
      await prisma.arquitecto.update({ where: { id }, data: datosArquitecto(datos.data) })
      listos.push(id)
      await avisarDesdeTablet({ tipo: "ARQUITECTO_EDITADO", mensaje: `Se editó el arquitecto ${datos.data.nombre}`, arquitectoId: id })
    }

    if (creados.length > 0 || listos.length > 0) {
      revalidatePath("/arquitectos")
      revalidatePath("/clientes")
    }
    return jsonResponse({ success: true, creados, listos, rechazados })
  } catch (error) {
    console.error("Error en endpoint POST /api/mediciones/arquitectos-sync:", error)
    return jsonResponse({ success: false, error: "No se pudieron guardar los arquitectos." }, { status: 500 })
  }
}
