import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  autenticarPeticionApi,
  handleCorsPreflight,
  jsonResponse,
} from "@/lib/api-auth"
import {
  syncMedicionesBatchSchema,
  medicionOfflineSyncSchema,
  type MedicionOfflineSyncInput,
} from "@/modules/mediciones/schemas"

export async function OPTIONS() {
  return handleCorsPreflight()
}

export async function POST(req: Request) {
  try {
    // 1. Control de autenticación y permisos
    const auth = await autenticarPeticionApi(req)
    if (!auth.autenticado || !auth.usuario) {
      return jsonResponse(
        { success: false, error: auth.error || "No autorizado" },
        { status: 401 }
      )
    }

    // 2. Parseo del cuerpo JSON
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonResponse(
        { success: false, error: "El cuerpo de la solicitud debe ser un JSON válido" },
        { status: 400 }
      )
    }

    // 3. Validación Zod (soporta array de mediciones, objeto con propiedad mediciones o medición individual)
    let medicionesParaSincronizar: MedicionOfflineSyncInput[] = []

    const validacionLote = syncMedicionesBatchSchema.safeParse(body)
    if (validacionLote.success) {
      if (Array.isArray(validacionLote.data)) {
        medicionesParaSincronizar = validacionLote.data
      } else {
        medicionesParaSincronizar = validacionLote.data.mediciones
      }
    } else {
      const validacionIndividual = medicionOfflineSyncSchema.safeParse(body)
      if (validacionIndividual.success) {
        medicionesParaSincronizar = [validacionIndividual.data]
      } else {
        const errores = validacionLote.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" | ")
        return jsonResponse(
          {
            success: false,
            error: `Error de validación en los datos de la medición: ${errores}`,
          },
          { status: 400 }
        )
      }
    }

    if (medicionesParaSincronizar.length === 0) {
      return jsonResponse(
        { success: false, error: "No se proporcionaron mediciones para sincronizar." },
        { status: 400 }
      )
    }

    const resultadosSincronizacion: Array<{
      idLocal: string
      idServidor: string
      clienteId: string
      yaExistia?: boolean
    }> = []

    // 4. Procesamiento transaccional de cada medición
    for (const med of medicionesParaSincronizar) {
      // Si ya tiene idServidor, verificar si existe en base de datos para no duplicar
      if (med.idServidor) {
        const existente = await prisma.medicion.findUnique({
          where: { id: med.idServidor },
        })
        if (existente) {
          resultadosSincronizacion.push({
            idLocal: med.idLocal,
            idServidor: existente.id,
            clienteId: existente.clienteId,
            yaExistia: true,
          })
          continue
        }
      }

      const resultado = await prisma.$transaction(async (tx) => {
        let clienteFinalId = med.clienteId

        // Verificar si el cliente existe en la BD
        const clienteExiste = await tx.cliente.findUnique({
          where: { id: clienteFinalId },
        })

        if (!clienteExiste) {
          // Si el cliente no existe con ese ID (ej. creado offline con id temporal), buscar por nombre
          const clientePorNombre = await tx.cliente.findFirst({
            where: {
              nombre: {
                equals: med.clienteNombre,
                mode: "insensitive",
              },
            },
          })

          if (clientePorNombre) {
            clienteFinalId = clientePorNombre.id
          } else {
            // Alta express del cliente si fue creado 100% offline
            const nuevoCliente = await tx.cliente.create({
              data: {
                nombre: med.clienteNombre || "Cliente Relevamiento",
                telefono: med.clienteTelefono || null,
                direccion: med.clienteDireccion || null,
                localidad: med.clienteLocalidad || null,
                estado: "MEDICION_TOMADA",
              },
            })
            clienteFinalId = nuevoCliente.id
          }
        }

        // Crear la medición completa con sus ambientes y cortinas
        const medicionCreada = await tx.medicion.create({
          data: {
            clienteId: clienteFinalId,
            usuarioId: auth.usuario!.id,
            observaciones: med.observaciones?.trim() || null,
            sincronizado: true,
            creadoEn: med.guardadoEn ? new Date(med.guardadoEn) : new Date(),
            ambientes: {
              create: med.ambientes.map((amb, ambIndex) => ({
                nombre: amb.nombre.trim(),
                orden: amb.orden ?? ambIndex,
                items: {
                  create: amb.items.map((item) => ({
                    descripcion: item.descripcion.trim(),
                    ancho: item.ancho,
                    alto: item.alto,
                    cantidad: item.cantidad || 1,
                    caracteristicas: (item.caracteristicas ?? {}) as any,
                    observaciones: item.observaciones?.trim() || null,
                  })),
                },
              })),
            },
          },
        })

        // Actualizar el estado del cliente a MEDICION_TOMADA
        await tx.cliente.update({
          where: { id: clienteFinalId },
          data: { estado: "MEDICION_TOMADA" },
        })

        return {
          idLocal: med.idLocal,
          idServidor: medicionCreada.id,
          clienteId: clienteFinalId,
        }
      })

      resultadosSincronizacion.push(resultado)
    }

    // 5. Invalidación de caché para el ERP Web
    revalidatePath("/mediciones")
    revalidatePath("/clientes")

    return jsonResponse({
      success: true,
      mensaje: `Se sincronizaron exitosamente ${resultadosSincronizacion.length} mediciones.`,
      total: resultadosSincronizacion.length,
      sincronizadas: resultadosSincronizacion,
    })
  } catch (error) {
    console.error("Error en endpoint POST /api/mediciones/sync:", error)
    return jsonResponse(
      {
        success: false,
        error: "Ocurrió un error inesperado al procesar la sincronización.",
      },
      { status: 500 }
    )
  }
}
