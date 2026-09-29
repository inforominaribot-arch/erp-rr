"use client"

import { MessageCircle } from "lucide-react"
import { formatearPrecio, formatearFecha } from "@/lib/utils"
import { formatearNumeroPresupuesto } from "../types"
import type { IPresupuestoDetalle } from "../types"

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

    // Agrupar items por ambiente
    const itemsTexto = presupuesto.items
      .map(
        (it) =>
          `• *${it.ambiente || "General"}*: ${it.descripcion} (${it.ancho}m × ${it.alto}m) - Cant: ${it.cantidad}`
      )
      .join("\n")

    let mensaje = `Hola *${cliente.nombre}*! 👋\n`
    mensaje += `Te compartimos el presupuesto *${numPresu}* de *ROMINA RIBOT Cortinados*.\n\n`
    mensaje += `📅 Fecha: ${fecha}\n`
    mensaje += `⏳ Validez: ${presupuesto.validezDias} días\n\n`
    mensaje += `📝 *Detalle de Cortinas:*\n${itemsTexto}\n\n`
    mensaje += `💰 *Subtotal:* ${formatearPrecio(presupuesto.subtotal)}\n`
    if (presupuesto.descuento > 0) {
      mensaje += `🏷️ *Descuento:* ${presupuesto.descuento}%\n`
    }
    mensaje += `✨ *TOTAL:* ${formatearPrecio(presupuesto.total)}\n\n`
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
