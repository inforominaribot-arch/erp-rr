// Endpoint iCal para sincronización con Google Calendar
// URL: /api/visitas/calendario.ics

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const visitas = await prisma.visita.findMany({
      where: {
        estado: { not: "CANCELADA" },
      },
      include: {
        cliente: true,
      },
      orderBy: { fecha: "asc" },
      take: 200,
    })

    const pad = (n: number) => String(n).padStart(2, "0")

    const formatICSDate = (date: Date, timeStr: string) => {
      const yyyy = date.getFullYear()
      const mm = pad(date.getMonth() + 1)
      const dd = pad(date.getDate())
      const [h, m] = (timeStr || "10:00").split(":").map((x) => pad(Number(x) || 0))
      return `${yyyy}${mm}${dd}T${h}${m}00`
    }

    const now = new Date()
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ROMINA RIBOT Cortinados//ERP RR//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Visitas de Obra — ROMINA RIBOT",
      "X-WR-TIMEZONE:America/Argentina/Buenos_Aires",
    ]

    for (const v of visitas) {
      const start = formatICSDate(new Date(v.fecha), v.horaInicio)
      const end = formatICSDate(new Date(v.fecha), v.horaFin || v.horaInicio)
      const summary = `Medición: ${v.cliente.nombre}${v.localidad ? ` (${v.localidad})` : ""}`
      const location = v.localidad ? `${v.direccion}, ${v.localidad}` : v.direccion
      const description = [
        `Cliente: ${v.cliente.nombre}`,
        v.cliente.telefono ? `Teléfono: ${v.cliente.telefono}` : null,
        `Tipo: ${v.tipoVisita}`,
        `Estado: ${v.estado}`,
        v.notas ? `Notas: ${v.notas}` : null,
      ]
        .filter(Boolean)
        .join("\\n")

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${v.id}@rominaribot.com`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${summary.replace(/,/g, "\\,")}`,
        `LOCATION:${location.replace(/,/g, "\\,")}`,
        `DESCRIPTION:${description}`,
        `STATUS:${v.estado === "CONFIRMADA" ? "CONFIRMED" : "TENTATIVE"}`,
        "END:VEVENT"
      )
    }

    icsContent.push("END:VCALENDAR")

    return new NextResponse(icsContent.join("\r\n"), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="visitas-romina-ribot.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error al generar feed iCal:", error)
    return new NextResponse("Error al generar calendario", { status: 500 })
  }
}
