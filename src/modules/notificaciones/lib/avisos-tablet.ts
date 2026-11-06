// Módulo: Notificaciones
// Avisos para el ERP de lo que llegó desde la tablet. Si fallan no frenan la sincronización:
// la medición o el cliente ya se guardaron y eso es lo importante.

import { prisma } from "@/lib/prisma"

export type TipoAvisoTablet = "MEDICION_NUEVA" | "MEDICION_EDITADA" | "CLIENTE_NUEVO" | "CLIENTE_EDITADO"

export interface IAvisoTablet {
  tipo: TipoAvisoTablet
  mensaje: string
  medicionId?: string | null
  clienteId?: string | null
}

/** Registra el aviso. Si ya hay uno sin leer de lo mismo, lo actualiza en vez de repetirlo. */
export async function avisarDesdeTablet(aviso: IAvisoTablet): Promise<void> {
  try {
    const repetido = await prisma.notificacionTablet.findFirst({
      where: {
        tipo: aviso.tipo,
        leida: false,
        medicionId: aviso.medicionId ?? null,
        clienteId: aviso.clienteId ?? null,
      },
      select: { id: true },
    })
    if (repetido) {
      await prisma.notificacionTablet.update({
        where: { id: repetido.id },
        data: { mensaje: aviso.mensaje, creadoEn: new Date() },
      })
      return
    }
    await prisma.notificacionTablet.create({
      data: {
        tipo: aviso.tipo,
        mensaje: aviso.mensaje,
        medicionId: aviso.medicionId ?? null,
        clienteId: aviso.clienteId ?? null,
      },
    })
  } catch (error) {
    console.error("No se pudo registrar el aviso de la tablet:", error)
  }
}
