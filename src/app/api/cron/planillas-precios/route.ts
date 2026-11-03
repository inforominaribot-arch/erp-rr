// Tarea diaria de Vercel (vercel.json → crons): actualiza la copia de las planillas de precios de Google Sheets
// de los proveedores (ej: PRINTEMPS). Si CRON_SECRET está configurado en Vercel, se exige en el header.
// GET /api/cron/planillas-precios → { success, resultados }

import { NextResponse } from "next/server"
import { sincronizarTodasLasPlanillas } from "@/modules/proveedores/lib/sincronizar-planilla"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET
  if (secreto && req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }
  try {
    const resultados = await sincronizarTodasLasPlanillas()
    return NextResponse.json({ success: true, resultados })
  } catch (error) {
    console.error("Error en la actualización diaria de planillas de precios:", error)
    return NextResponse.json({ success: false, error: "Error al actualizar las planillas" }, { status: 500 })
  }
}
