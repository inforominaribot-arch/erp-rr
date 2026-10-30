// Módulo: Comandas
// Orden de pedido a proveedor por marca, armada con las cortinas de la comanda:
//  - HD: se pide en la página de Hunter Douglas (solo el link).
//  - MG: mensaje de WhatsApp con cada cortina (modelo / sistema, medidas, colores, mando).
//  - RS: filas de la planilla "ORD. DE TRABAJO 2" de Rollershade (el Excel lo arma excel-rollershade.ts).

import type { ICaracteristicasItem, LadoMando } from "@/modules/mediciones/types"
import { cortinasFisicas, type ICortinaFisica } from "@/modules/mediciones/lib/cortinas-fisicas"
import { textoMosquitero } from "@/modules/mediciones/lib/mosquiteros"
import { nombreSistemaNocheTotal } from "@/modules/mediciones/lib/noche-total"
import type { IItemComanda } from "../types"

export const URL_PEDIDOS_HD = "https://pedidosax.hunterdouglas.com.ar/pedidosax/Login.aspx"

export type MarcaOrden = "HD" | "RS" | "MG"

// ─── Rollershade ─────────────────────────────────────────────────────────────

/** Columna de sistema de la planilla (se marca con una X) */
export type SistemaFilaRS = "RS" | "MAXI" | "SUPER_MAXI" | "PANEL" | "BANDAS"

export const SISTEMAS_FILA_RS: { valor: SistemaFilaRS; label: string }[] = [
  { valor: "RS", label: "RS Roller" },
  { valor: "MAXI", label: "RS Maxi" },
  { valor: "SUPER_MAXI", label: "RS Súper Maxi" },
  { valor: "PANEL", label: "Panel" },
  { valor: "BANDAS", label: "Bandas verticales" },
]

export const OPCIONES_CADENA_RS = ["PLÁSTICA", "PLÁSTICA NEGRA", "METÁLICA"]
export const OPCIONES_ZOCALO_RS = ["DECORATIVO", "19 X 3", "GUÍA (LISO)"]
export const OPCIONES_CENEFA_RS = ["P/ SISTEMA RS", "P/ SISTEMA MAXI RS"]
export const OPCIONES_CAJON_RS = ["P/ SISTEMA RS", "P/ SISTEMA MAXI RS"]
export const OPCIONES_GUIA_RS = ["ENCASTRABLE 50 MM", "P/ SISTEMA RS 50 MM"]
export const OPCIONES_RECOGE_RS = ["DERECHA", "IZQUIERDA", "CENTRO", "AMBOS LADOS"]

/** Una fila de la planilla (una cortina física) */
export interface IFilaOrdenRS {
  /** Para mostrar en la ventana (no va al Excel) */
  referencia: string
  pedidoId: string
  cantidad: number
  sistema: SistemaFilaRS
  tela: string
  color: string
  ancho: number
  alto: number
  cadena: string
  mando: string
  caida: string
  recoge: string
  cenefa: string
  zocalo: string
  cajon: string
  guia: string
  motor: string
  observaciones: string
}

const mayus = (s: string | null | undefined) => (s ?? "").trim().toUpperCase()

function textoMando(m: LadoMando | null | undefined): string {
  if (!m || m === "Sin mando") return ""
  return m.startsWith("Izq") ? "IZQUIERDO" : m.startsWith("Der") ? "DERECHO" : mayus(m)
}

/** Nombre de la tela sin el color al final ("Black Out FV 2,50 blanco" → "BLACK OUT FV 2,50") */
function telaSinColor(nombre: string, color: string | null): string {
  const n = nombre.trim()
  if (color && n.toLowerCase().endsWith(` ${color.toLowerCase()}`)) {
    return mayus(n.slice(0, n.length - color.length - 1))
  }
  return mayus(n)
}

function mandoDeCortina(c: ICaracteristicasItem, k: ICortinaFisica): LadoMando | null {
  const lista = k.capa === "GAZA" ? c.mandosRollerGaza : c.mandosRollerBO ?? c.bo?.mandosRoller
  return lista?.[k.indice] ?? (k.capa === "BO" ? c.mandoBO : null) ?? c.mando ?? null
}

/** ¿Esta cortina física corresponde al pedido (capa) de esa marca? */
function cortinaDelPedido(k: ICortinaFisica, capaPedido: string, marca: string): boolean {
  if (k.marca !== marca) return false
  if (capaPedido === "GAZA") return k.capa === "GAZA"
  if (capaPedido === "BO") return k.capa === "BO"
  return true // GAZA_BO / UNICA
}

/** Cortinas físicas de la comanda que van en el pedido de esa marca (solo pedidos aún sin pedir, si se indica). */
export function cortinasDeMarca(
  items: IItemComanda[],
  marca: MarcaOrden,
  soloPendientes: boolean
): Array<{ item: IItemComanda; pedidoId: string; cortina: ICortinaFisica }> {
  const resultado: Array<{ item: IItemComanda; pedidoId: string; cortina: ICortinaFisica }> = []
  for (const item of items) {
    if (item.tipo !== "PEDIR_PROVEEDOR") continue
    const fisicas = cortinasFisicas(item.caracteristicas, item.ancho, item.alto)
    for (const pedido of item.pedidos) {
      if (pedido.marca !== marca) continue
      if (soloPendientes && pedido.estado !== "PENDIENTE_PEDIDO") continue
      for (const cortina of fisicas) {
        if (cortinaDelPedido(cortina, pedido.capa, marca)) {
          resultado.push({ item, pedidoId: pedido.id, cortina })
        }
      }
    }
  }
  return resultado
}

/** Filas de la planilla con lo que ya sabe la medición; el resto lo completa quien hace el pedido. */
export function filasOrdenRS(items: IItemComanda[], soloPendientes = true): IFilaOrdenRS[] {
  return cortinasDeMarca(items, "RS", soloPendientes).map(({ item, pedidoId, cortina: k }) => {
    const c = item.caracteristicas ?? ({} as ICaracteristicasItem)
    const esBandas = k.tipoCapa === "Bandas verticales"
    const caida = k.capa === "GAZA" ? c.caida : c.caidaBO ?? c.caida
    const observaciones =
      k.modo === "Solo tela" ? "SOLO TELA" : k.modo === "Solo riel" ? "SOLO MECANISMO" : ""
    return {
      referencia: [item.ambiente, item.descripcion, k.total > 1 ? `C${k.indice + 1}` : null]
        .filter(Boolean)
        .join(" · "),
      pedidoId,
      cantidad: item.cantidad || 1,
      sistema: esBandas ? "BANDAS" : "RS",
      tela: telaSinColor(k.nombreTela, k.colorTela),
      color: mayus(k.colorTela),
      ancho: k.ancho,
      alto: k.alto,
      cadena: k.motor || esBandas ? "" : "PLÁSTICA",
      mando: k.motor ? "" : textoMando(mandoDeCortina(c, k)),
      caida: esBandas ? "" : caida === "Por detrás" ? "DETRÁS" : "DELANTE",
      recoge: "",
      cenefa: "",
      zocalo: esBandas ? "" : "DECORATIVO",
      cajon: "",
      guia: "",
      motor: k.motor ? mayus([k.motor.marca, k.motor.modelo].filter(Boolean).join(" ")) || "X" : "",
      observaciones,
    }
  })
}

/** "PEDIDO SARTORELI - CHIAPINI 29-10-2026.xlsx" */
export function nombreArchivoPedidoRS(cliente: string, fecha: Date): string {
  const limpio = mayus(cliente).replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ")
  return `PEDIDO ${limpio} ${fechaPedidoTexto(fecha).replace(/\//g, "-")}.xlsx`
}

/** dd/mm/aaaa en hora de Argentina */
export function fechaPedidoTexto(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })
}

// ─── MagicRoll ───────────────────────────────────────────────────────────────

const fmtM = (n: number) => n.toFixed(2).replace(".", ",")

/** Texto de una cortina MagicRoll: "Mosquitero Sistema a Resorte Vertical · Cajón 40 — 1,20 x 1,50 m — Cant. 1" */
function lineaCortinaMG(item: IItemComanda, k: ICortinaFisica): string {
  const c = item.caracteristicas ?? ({} as ICaracteristicasItem)
  let detalle: string
  if (k.tipoCapa === "Mosquera") {
    detalle = `Mosquitero ${textoMosquitero(c.mosquitero)}`.trim()
  } else if (k.tipoCapa === "Roller Noche total") {
    const nt = c.nocheTotal
    const mando = textoMando(mandoDeCortina(c, k))
    detalle = [
      `Roller Noche Total ${nombreSistemaNocheTotal(nt?.sistema)}`.trim(),
      nt?.colorTela ? `Tela ${nt.colorTela}` : null,
      nt?.colorCadena ? `Cadena ${nt.colorCadena}` : null,
      mando ? `Mando ${mando.toLowerCase()}` : null,
      nt?.cajones?.[k.indice] ? `Cajón ${nt.cajones[k.indice]}` : null,
    ]
      .filter(Boolean)
      .join(" · ")
  } else {
    detalle = [k.tipoCapa, k.nombreTela].filter(Boolean).join(" · ")
  }
  return `${detalle} — ${fmtM(k.ancho)} x ${fmtM(k.alto)} m — Cant. ${item.cantidad || 1}`
}

/** Mensaje de WhatsApp con el pedido para MagicRoll */
export function mensajePedidoMG(items: IItemComanda[], cliente: string, soloPendientes = true): string {
  const lineas = cortinasDeMarca(items, "MG", soloPendientes).map(
    ({ item, cortina }, i) => `${i + 1}) ${lineaCortinaMG(item, cortina)}`
  )
  return [`Hola, te paso un pedido de Ribot.`, `Cliente: ${mayus(cliente)}`, "", ...lineas].join("\n")
}

/** Teléfono para wa.me: 0342-154-064334 → 5493424064334 (Argentina) */
export function telefonoWhatsApp(telefono: string | null | undefined): string {
  let d = (telefono ?? "").replace(/\D/g, "")
  if (!d) return ""
  if (d.startsWith("54")) return d
  d = d.replace(/^0/, "")
  // Quitar el 15 de celular después del código de área (2 a 4 dígitos)
  const m = d.match(/^(\d{2,4}?)15(\d{6,8})$/)
  if (m && (m[1] + m[2]).length === 10) d = m[1] + m[2]
  return `549${d}`
}
