// Módulo: Proveedores
// Guarda en la base una lista de precios subida (Excel o PDF):
//  - Telas (Alhambra, Bia Brem, Sirota): se actualiza cada tela por nombre, se guarda el precio anterior
//    y las que ya no figuran quedan inactivas.
//  - Accesorios Rollershade ("Rieles y cosas"): cada sección del PDF se aparea con la sección de la base
//    en el mismo orden y cada renglón con el ítem en la misma posición; solo cambia el precio.
// En los dos casos queda registrado que la lista se actualizó este mes (para el aviso del día 1).

import { prisma } from "@/lib/prisma"
import { leerFilasXlsx, leerRenglonesPdf } from "./leer-archivos"
import {
  distancia,
  esFormatoListaTelas,
  FORMATOS_LISTA_TELAS,
  palabraClave,
  parsearExcelTelas,
  parsearPdfAccesorios,
  parsearPdfTelas,
  type FilaTela,
} from "./parsear-listas"

export interface IResultadoListaSubida {
  tipo: "TELAS" | "ACCESORIOS"
  leidos: number
  nuevos: number
  cambiaronPrecio: number
  sinCambios: number
  dadosDeBaja: number
  avisos: string[]
}

const esPdf = (nombre: string, datos: Uint8Array) =>
  nombre.toLowerCase().endsWith(".pdf") || String.fromCharCode(...datos.slice(0, 5)) === "%PDF-"

/** Lee el archivo y lo guarda como la lista vigente del proveedor. */
export async function subirListaProveedor(
  proveedorId: string,
  nombreArchivo: string,
  datos: Uint8Array
): Promise<IResultadoListaSubida> {
  const proveedor = await prisma.proveedor.findUnique({ where: { id: proveedorId } })
  if (!proveedor) throw new Error("El proveedor no existe.")

  if (esFormatoListaTelas(proveedor.formatoListaTelas)) {
    const filas = esPdf(nombreArchivo, datos)
      ? parsearPdfTelas(await leerRenglonesPdf(datos))
      : parsearExcelTelas(await leerFilasXlsx(datos))
    return aplicarListaTelas(proveedorId, filas)
  }

  if (proveedor.marcas.includes("RS")) {
    if (!esPdf(nombreArchivo, datos)) throw new Error("La lista de accesorios de Rollershade se sube en PDF.")
    return aplicarAccesoriosRS(proveedorId, await leerRenglonesPdf(datos))
  }

  throw new Error("Este proveedor no tiene una lista para subir desde archivo.")
}

export async function aplicarListaTelas(proveedorId: string, filas: FilaTela[]): Promise<IResultadoListaSubida> {
  const existentes = await prisma.listaTelaItem.findMany({ where: { proveedorId } })
  const porNombre = new Map(existentes.map((e) => [e.nombre, e]))
  const res: IResultadoListaSubida = {
    tipo: "TELAS",
    leidos: filas.length,
    nuevos: 0,
    cambiaronPrecio: 0,
    sinCambios: 0,
    dadosDeBaja: 0,
    avisos: [],
  }

  const operaciones = filas.map((f, i) => {
    const previo = porNombre.get(f.nombre)
    porNombre.delete(f.nombre)
    const datos = {
      descripcion: f.descripcion,
      rubro: f.rubro,
      codigo: f.codigo,
      ancho: f.ancho,
      precio: f.precio,
      orden: i + 1,
      activo: true,
    }
    if (!previo) {
      res.nuevos++
      return prisma.listaTelaItem.create({ data: { proveedorId, nombre: f.nombre, ...datos } })
    }
    const cambio = Number(previo.precio) !== f.precio
    if (cambio) res.cambiaronPrecio++
    else res.sinCambios++
    return prisma.listaTelaItem.update({
      where: { id: previo.id },
      data: { ...datos, ...(cambio ? { precioAnterior: previo.precio } : {}) },
    })
  })
  const bajas = [...porNombre.values()].filter((e) => e.activo)
  res.dadosDeBaja = bajas.length

  await prisma.$transaction([
    ...operaciones,
    ...(bajas.length > 0
      ? [prisma.listaTelaItem.updateMany({ where: { id: { in: bajas.map((b) => b.id) } }, data: { activo: false } })]
      : []),
    prisma.proveedor.update({
      where: { id: proveedorId },
      data: { listaConfirmadaEn: new Date(), listaTelasVigencia: vigenciaHoy() },
    }),
  ])
  if (bajas.length > 0) {
    res.avisos.push(
      `${bajas.length} tela${bajas.length === 1 ? "" : "s"} de la lista anterior ya no figura${bajas.length === 1 ? "" : "n"}: quedan fuera del buscador.`
    )
  }
  return res
}

export async function aplicarAccesoriosRS(proveedorId: string, renglones: string[]): Promise<IResultadoListaSubida> {
  const secciones = parsearPdfAccesorios(renglones)
  const items = await prisma.listaPrecioItem.findMany({
    where: { proveedorId, categoria: "RIELES_BARRALES" },
    orderBy: [{ orden: "asc" }, { creadoEn: "asc" }],
  })
  // Secciones de la base en el orden en que aparecen
  const enBase: { seccion: string; items: typeof items }[] = []
  for (const it of items) {
    const s = enBase.find((x) => x.seccion === it.seccion)
    if (s) s.items.push(it)
    else enBase.push({ seccion: it.seccion, items: [it] })
  }

  const res: IResultadoListaSubida = {
    tipo: "ACCESORIOS",
    leidos: secciones.reduce((a, s) => a + s.items.length, 0),
    nuevos: 0,
    cambiaronPrecio: 0,
    sinCambios: 0,
    dadosDeBaja: 0,
    avisos: [],
  }
  if (secciones.length !== enBase.length) {
    res.avisos.push(
      `El PDF tiene ${secciones.length} secciones y la lista cargada ${enBase.length}: se actualizaron solo las que coinciden en cantidad de renglones.`
    )
  }

  const cambios: { id: string; precio: number }[] = []
  for (let k = 0; k < Math.min(secciones.length, enBase.length); k++) {
    const pdf = secciones[k]
    const base = enBase[k]
    if (pdf.items.length !== base.items.length) {
      res.avisos.push(
        `"${base.seccion}": el PDF trae ${pdf.items.length} renglones y la lista ${base.items.length}. No se actualizó: revisala a mano.`
      )
      continue
    }
    pdf.items.forEach((r, i) => {
      const it = base.items[i]
      const a = palabraClave(r.descripcion)
      const b = palabraClave(it.descripcion)
      if (a !== b && distancia(a, b) > 2) {
        res.avisos.push(`"${base.seccion}": "${r.descripcion}" no parece ser "${it.descripcion}". No se actualizó.`)
        return
      }
      if (Number(it.precio) === r.precio) res.sinCambios++
      else {
        res.cambiaronPrecio++
        cambios.push({ id: it.id, precio: r.precio })
      }
    })
  }

  await prisma.$transaction([
    ...cambios.map((c) => prisma.listaPrecioItem.update({ where: { id: c.id }, data: { precio: c.precio } })),
    prisma.proveedor.update({ where: { id: proveedorId }, data: { listaConfirmadaEn: new Date() } }),
  ])
  return res
}

/** "No cambiaron los precios": se deja la lista como está y se da por actualizada este mes. */
export async function confirmarListaSinCambios(proveedorId: string): Promise<void> {
  await prisma.proveedor.update({ where: { id: proveedorId }, data: { listaConfirmadaEn: new Date() } })
}

function vigenciaHoy(): string {
  return new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
}

/** Primer instante del mes actual (hora de Argentina). */
export function inicioMesActual(ahora = new Date()): Date {
  const ar = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
  // 00:00 del día 1 en Argentina = 03:00 UTC
  return new Date(Date.UTC(ar.getFullYear(), ar.getMonth(), 1, 3, 0, 0))
}

export interface IListaPendiente {
  proveedorId: string
  nombre: string
  lista: string
  archivo: string
  confirmadaEn: string | null
}

/** Listas que hay que actualizar este mes (desde el día 1 hasta que se suben o se confirman sin cambios). */
export async function obtenerListasPendientes(): Promise<IListaPendiente[]> {
  const desde = inicioMesActual()
  const proveedores = await prisma.proveedor.findMany({
    where: {
      activo: true,
      avisoListaMensual: true,
      OR: [{ listaConfirmadaEn: null }, { listaConfirmadaEn: { lt: desde } }],
    },
    orderBy: { nombre: "asc" },
  })
  return proveedores.map((p) => {
    const formato = esFormatoListaTelas(p.formatoListaTelas) ? FORMATOS_LISTA_TELAS[p.formatoListaTelas] : null
    return {
      proveedorId: p.id,
      nombre: p.nombre,
      lista: formato ? "Lista de telas (tradicionales)" : "Lista de accesorios (barrales, argollas, soportes)",
      archivo: formato ? formato.archivo : "PDF",
      confirmadaEn: p.listaConfirmadaEn ? p.listaConfirmadaEn.toISOString() : null,
    }
  })
}

export interface ITelaListaProveedor {
  id: string
  nombre: string
  descripcion: string | null
  rubro: string | null
  ancho: number | null
  precio: number
  precioConRecargo: number
  precioAnterior: number | null
}

export interface IListaArchivoProveedor {
  titulo: string
  archivo: string
  recargo: string | null
  vigencia: string | null
  confirmadaEn: string | null
  /** Falta actualizarla este mes */
  pendiente: boolean
  telas: ITelaListaProveedor[]
}

/** Lista por archivo del proveedor (telas o accesorios RS), o null si no tiene. */
export async function obtenerListaArchivoProveedor(proveedorId: string): Promise<IListaArchivoProveedor | null> {
  const p = await prisma.proveedor.findUnique({ where: { id: proveedorId } })
  if (!p) return null
  const formato = esFormatoListaTelas(p.formatoListaTelas) ? FORMATOS_LISTA_TELAS[p.formatoListaTelas] : null
  if (!formato && !p.marcas.includes("RS")) return null
  const pendiente = p.avisoListaMensual && (!p.listaConfirmadaEn || p.listaConfirmadaEn < inicioMesActual())
  const telas = formato
    ? await prisma.listaTelaItem.findMany({ where: { proveedorId, activo: true }, orderBy: { orden: "asc" } })
    : []
  return {
    titulo: formato ? "Lista de telas (cortinas tradicionales)" : "Lista de accesorios desde PDF (barrales, argollas, soportes…)",
    archivo: formato ? formato.archivo : "PDF",
    recargo: formato ? formato.textoRecargo : null,
    vigencia: p.listaTelasVigencia,
    confirmadaEn: p.listaConfirmadaEn ? p.listaConfirmadaEn.toISOString() : null,
    pendiente,
    telas: telas.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion,
      rubro: t.rubro,
      ancho: t.ancho !== null ? Number(t.ancho) : null,
      precio: Number(t.precio),
      precioConRecargo: Math.round(Number(t.precio) * (formato?.recargo ?? 1)),
      precioAnterior: t.precioAnterior !== null ? Number(t.precioAnterior) : null,
    })),
  }
}
