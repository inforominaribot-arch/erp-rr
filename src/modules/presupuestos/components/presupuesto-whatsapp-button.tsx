"use client"

import { MessageCircle } from "lucide-react"
import { formatearPrecio, formatearFecha } from "@/lib/utils"
import { formatearNumeroPresupuesto } from "../types"
import type { IPresupuestoDetalle } from "../types"
import { agruparCortinas, calcularTotalesPorOpcion, etiquetaOpcion } from "../lib/alternativas"

interface PresupuestoWhatsappButtonProps {
  presupuesto: IPresupuestoDetalle
  className?: string
}

export function PresupuestoWhatsappButton({
  presupuesto,
  className = "",
}: PresupuestoWhatsappButtonProps) {
  const cliente = presupuesto.cliente
  const telefonoLimpio = (cliente.telefono || "").replace(/\D/g, "")

  function generarMensajeWhatsApp(): string {
    const numPresu = formatearNumeroPresupuesto(presupuesto.numero)
    const fecha = formatearFecha(presupuesto.creadoEn)

    // Una línea por cortina; si tiene alternativas, sus opciones con precio
    const cortinas = agruparCortinas(presupuesto.items)
    const itemsTexto = cortinas
      .map(({ principal: it, opciones }) => {
        let linea = `• *${it.ambiente || "General"}*: ${it.descripcion} (${it.ancho}m × ${it.alto}m) - Cant: ${it.cantidad}`
        if (opciones.length > 1) {
          linea += `\n   ↳ ${opciones
            .map((o, idx) => `${etiquetaOpcion(o, idx)} ${formatearPrecio(o.subtotal)}`)
            .join(" / ")}`
        }
        return linea
      })
      .join("\n")
    const hayAlternativas = cortinas.some((c) => c.opciones.length > 1)
    const totalesPorOpcion = calcularTotalesPorOpcion(presupuesto.items, presupuesto.descuento)

    let mensaje = `Hola *${cliente.nombre}*! 👋\n`
    mensaje += `Te compartimos el presupuesto *${numPresu}* de *ROMINA RIBOT Cortinados*.\n\n`
    mensaje += `📅 Fecha: ${fecha}\n`
    mensaje += `⏳ Validez: ${presupuesto.validezDias} días\n\n`
    mensaje += `📝 *Detalle de Cortinas:*\n${itemsTexto}\n\n`
    if (totalesPorOpcion) {
      if (presupuesto.descuento > 0) {
        mensaje += `🏷️ *Descuento:* ${presupuesto.descuento}% (incluido)\n`
      }
      mensaje += `✨ ${totalesPorOpcion
        .map((t) => `*Total con ${t.nombre}:* ${formatearPrecio(t.total)}`)
        .join(" — ")}\n\n`
    } else {
      const aclaracion = hayAlternativas ? " (opciones principales)" : ""
      mensaje += `💰 *Subtotal${aclaracion}:* ${formatearPrecio(presupuesto.subtotal)}\n`
      if (presupuesto.descuento > 0) {
        mensaje += `🏷️ *Descuento:* ${presupuesto.descuento}%\n`
      }
      mensaje += `✨ *TOTAL${aclaracion}:* ${formatearPrecio(presupuesto.total)}\n\n`
    }
    mensaje += `💳 *Forma de pago:* 50% de seña y 50% contra entrega e instalación.\n`
    mensaje += `⏱️ *Plazo de entrega:* 25 días a partir de la aprobación.\n\n`
    mensaje += `Quedamos a tu total disposición por cualquier duda o ajuste!`

    return encodeURIComponent(mensaje)
  }

  function handleCompartirWhatsApp() {
    const textoCodificado = generarMensajeWhatsApp()
    const url = telefonoLimpio
      ? `https://wa.me/${telefonoLimpio}?text=${textoCodificado}`
      : `https://api.whatsapp.com/send?text=${textoCodificado}`

    window.open(url, "_blank")
  }

  return (
    <button
      type="button"
      onClick={handleCompartirWhatsApp}
      className={`inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition ${className}`}
      title="Compartir presupuesto por WhatsApp"
    >
      <MessageCircle className="h-4 w-4" />
      Enviar por WhatsApp
    </button>
  )
}
