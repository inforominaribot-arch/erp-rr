// Módulo: Proveedores & Compras
// Botón de Envío Directo por WhatsApp con Mensaje Prearmado

"use client"

import { MessageCircle } from "lucide-react"
import type { IOrdenCompra } from "../types"

interface OrdenCompraWhatsAppButtonProps {
  ordenCompra: IOrdenCompra
  className?: string
}

export function OrdenCompraWhatsAppButton({
  ordenCompra,
  className = "",
}: OrdenCompraWhatsAppButtonProps) {
  const telefono = ordenCompra.proveedor.telefono

  const handleEnviarWhatsApp = () => {
    // Limpiar teléfono
    let nroLimpio = (telefono || "").replace(/\D/g, "")

    // Si empieza con 15 o similar en Argentina, formatear a +549
    if (nroLimpio.startsWith("0")) {
      nroLimpio = nroLimpio.substring(1)
    }
    if (nroLimpio.startsWith("15")) {
      nroLimpio = "11" + nroLimpio.substring(2)
    }
    if (!nroLimpio.startsWith("54") && nroLimpio.length >= 8) {
      nroLimpio = "549" + nroLimpio
    }

    // Armar texto del mensaje
    const lineasItems = ordenCompra.items.map((it, idx) => {
      const cod = it.producto?.codigo ? ` [${it.producto.codigo}]` : ""
      const um = it.producto?.unidadMedida || "u."
      return `• ${it.cantidadPedida} ${um} - ${it.producto?.nombre || "Insumo"}${cod}`
    })

    const textoMensaje = `*ROMINA RIBOT Cortinados & Decoración*
Hola ${ordenCompra.proveedor.contacto || ordenCompra.proveedor.nombre}, te enviamos la *Orden de Compra ${ordenCompra.numeroFormateado}*:

📋 *Detalle del pedido:*
${lineasItems.join("\n")}
${ordenCompra.notas ? `\n📝 *Observaciones:* ${ordenCompra.notas}\n` : ""}
Por favor, ¿podrías confirmarnos recepción del pedido y fecha estimada de entrega/despacho al taller?

¡Muchas gracias!`

    const url = `https://wa.me/${nroLimpio}?text=${encodeURIComponent(textoMensaje)}`
    window.open(url, "_blank")
  }

  return (
    <button
      type="button"
      onClick={handleEnviarWhatsApp}
      disabled={!telefono}
      title={
        telefono
          ? "Enviar detalle de orden por WhatsApp al proveedor"
          : "El proveedor no tiene teléfono cargado"
      }
      className={`inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-100 hover:border-emerald-400 transition disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      <MessageCircle className="h-4 w-4 text-emerald-600 fill-emerald-100" />
      <span>Enviar WhatsApp</span>
    </button>
  )
}
