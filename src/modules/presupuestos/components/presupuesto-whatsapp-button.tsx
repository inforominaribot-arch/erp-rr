"use client"

import { MessageCircle } from "lucide-react"
import type { IPresupuestoDetalle } from "../types"

interface PresupuestoWhatsappButtonProps {
  presupuesto: IPresupuestoDetalle
  className?: string
  /** Después de abrir WhatsApp: abre la ficha A4 para guardarla en PDF y adjuntarla */
  onGuardarPdf?: () => void
}

/** Mensaje corto: el detalle va en el PDF adjunto (WhatsApp no permite adjuntar archivos desde un link). */
const MENSAJE_WHATSAPP = "Hola, te envío el presupuesto"

export function PresupuestoWhatsappButton({
  presupuesto,
  className = "",
  onGuardarPdf,
}: PresupuestoWhatsappButtonProps) {
  const telefonoLimpio = (presupuesto.cliente.telefono || "").replace(/\D/g, "")

  function handleCompartirWhatsApp() {
    const texto = encodeURIComponent(MENSAJE_WHATSAPP)
    const url = telefonoLimpio
      ? `https://wa.me/${telefonoLimpio}?text=${texto}`
      : `https://api.whatsapp.com/send?text=${texto}`

    window.open(url, "_blank")
    onGuardarPdf?.()
  }

  return (
    <button
      type="button"
      onClick={handleCompartirWhatsApp}
      className={`inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition ${className}`}
      title="Abre WhatsApp con el mensaje y la ficha para guardarla en PDF y adjuntarla"
    >
      <MessageCircle className="h-4 w-4" />
      Enviar por WhatsApp
    </button>
  )
}
