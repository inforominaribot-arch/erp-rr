// Módulo: Comandas
// Telas de las cortinas tradicionales de la comanda para pedir a las tiendas (Alhambra, Bia Brem, Sirota).
// Sale de lo cargado en la calculadora del presupuesto: tela, metros y dónde está más barata
// (al cliente se le cobra la más cara, pero se pide la más barata).

import { prisma } from "@/lib/prisma"
import { leerCalculoPrecio } from "@/modules/presupuestos/lib/lista-precios-rs"
import { capasConTela, metrosDeTela } from "@/modules/presupuestos/lib/tradicional"

export interface IOpcionCompraTela {
  proveedor: string
  precio: number
  ancho: number | null
}

export interface ITelaAPedir {
  tela: string
  /** Capa: Gasa / Blackout / Tela (paño invertido) */
  capas: string[]
  metros: number
  /** Cortinas donde va (ambiente – descripción) */
  cortinas: string[]
  /** Con la que se presupuestó */
  presupuestada: IOpcionCompraTela | null
  /** La más barata entre las tiendas (null si la presupuestada ya es la única / más barata) */
  masBarata: IOpcionCompraTela | null
  otras: IOpcionCompraTela[]
  precioManual: boolean
}

export async function obtenerTelasAPedirComanda(comandaId: string): Promise<ITelaAPedir[]> {
  const comanda = await prisma.comanda.findUnique({
    where: { id: comandaId },
    select: { presupuesto: { select: { estado: true, items: true } } },
  })
  if (!comanda) return []
  const items = comanda.presupuesto.items
  // Lo aceptado; si no hay nada marcado (presupuestos viejos), las opciones principales
  const elegidos = items.some((it) => it.aceptado) ? items.filter((it) => it.aceptado) : items.filter((it) => it.esOpcionPrincipal)

  const porTela = new Map<string, ITelaAPedir>()
  for (const it of elegidos) {
    const calc = leerCalculoPrecio(it.calculoPrecio)
    if (calc?.metodo !== "TRADICIONAL" || !calc.tradicional) continue
    const cfg = calc.tradicional
    const ancho = Number(it.ancho)
    const alto = Number(it.alto)
    const cantidad = Math.max(1, it.cantidad || 1)
    for (const { capa, tela } of capasConTela(cfg)) {
      if (!tela.nombre) continue
      const clave = `${tela.clave ?? tela.nombre}|${tela.proveedor ?? ""}`
      const actual =
        porTela.get(clave) ??
        ({
          tela: tela.nombre,
          capas: [],
          metros: 0,
          cortinas: [],
          presupuestada: tela.proveedor ? { proveedor: tela.proveedor, precio: tela.precio, ancho: tela.ancho ?? null } : null,
          masBarata: null,
          otras: [],
          precioManual: tela.manual,
        } satisfies ITelaAPedir)
      actual.metros = Math.round((actual.metros + metrosDeTela(cfg, tela, ancho, alto) * cantidad) * 100) / 100
      if (!actual.capas.includes(capa)) actual.capas.push(capa)
      const donde = `${it.ambiente ? `${it.ambiente} – ` : ""}${it.descripcion}`
      if (!actual.cortinas.includes(donde)) actual.cortinas.push(donde)
      const baratas = [...tela.masBaratas].sort((a, b) => a.precio - b.precio)
      if (baratas.length > 0) {
        actual.masBarata = { proveedor: baratas[0].proveedor, precio: baratas[0].precio, ancho: baratas[0].ancho }
        actual.otras = baratas.slice(1).map((o) => ({ proveedor: o.proveedor, precio: o.precio, ancho: o.ancho }))
      }
      porTela.set(clave, actual)
    }
  }
  return [...porTela.values()].sort((a, b) => a.tela.localeCompare(b.tela, "es"))
}
