// Importa la lista de precios de un proveedor a la tabla lista_precios_items.
//
// Uso:
//   node scripts/importar-lista-precios.mjs scripts/data/lista-rollershade-2026-09.mjs            (solo muestra)
//   node scripts/importar-lista-precios.mjs scripts/data/lista-rollershade-2026-09.mjs --aplicar  (escribe)
//
// - Crea el proveedor si no existe (por nombre) o completa sus datos.
// - Cada ítem se identifica por proveedor + sección + descripción: si ya existe se
//   actualiza el precio (al cargar la lista de un mes nuevo no se duplica).
// - No borra ítems: los que ya no figuran en la lista se informan.
// - "vendemos" solo se toma del archivo al crear el ítem; al actualizar se conserva
//   lo que el usuario marcó a mano.

import path from "path"
import { pathToFileURL } from "url"
import { PrismaClient } from "@prisma/client"

const [archivo, flag] = process.argv.slice(2)
if (!archivo) {
  console.error("Indicá el archivo de datos de la lista.")
  process.exit(1)
}
const aplicar = flag === "--aplicar"
const { PROVEEDOR, VIGENCIA, SECCIONES, ORDEN_BASE = 0 } = await import(pathToFileURL(path.resolve(archivo)).href)

const prisma = new PrismaClient()
const fmt = (n) => "$" + Number(n).toLocaleString("es-AR")

try {
  let proveedor = await prisma.proveedor.findFirst({
    where: { nombre: { equals: PROVEEDOR.nombre, mode: "insensitive" } },
  })
  console.log(proveedor ? `Proveedor existente: ${proveedor.nombre}` : `Proveedor NUEVO: ${PROVEEDOR.nombre}`)
  console.log(`  ${PROVEEDOR.contacto} • ${PROVEEDOR.telefono} • ${PROVEEDOR.email} • marcas ${PROVEEDOR.marcas.join("/")} • ${PROVEEDOR.diasEntrega} días`)

  // Solo se comparan las categorías de este archivo (un proveedor puede tener varias listas)
  const categoriasArchivo = [...new Set(SECCIONES.map((s) => s.categoria))]
  const existentes = proveedor
    ? await prisma.listaPrecioItem.findMany({
        where: { proveedorId: proveedor.id, categoria: { in: categoriasArchivo } },
      })
    : []
  const porClave = new Map(existentes.map((e) => [`${e.seccion}|${e.descripcion}`, e]))

  let orden = ORDEN_BASE
  const operaciones = []
  for (const s of SECCIONES) {
    console.log(`\n[${s.categoria}] ${s.seccion}${s.nota ? `  (${s.nota})` : ""}`)
    for (const [descripcion, colores, unidad, precio, vendemos] of s.items) {
      orden++
      const previo = porClave.get(`${s.seccion}|${descripcion}`)
      porClave.delete(`${s.seccion}|${descripcion}`)
      const cambio = previo
        ? Number(previo.precio) !== precio
          ? `precio ${fmt(previo.precio)} → ${fmt(precio)}`
          : "sin cambios"
        : "nuevo"
      console.log(
        `  ${vendemos ? "✓" : " "} ${descripcion}${colores ? ` (${colores})` : ""} — ${unidad} ${fmt(precio)}  [${cambio}]`
      )
      operaciones.push({
        clave: { seccion: s.seccion, descripcion },
        datos: {
          categoria: s.categoria,
          colores: colores || null,
          unidad,
          precio,
          vendemos,
          orden,
          vigencia: VIGENCIA,
          nota: s.nota || null,
          activo: true,
        },
      })
    }
  }

  if (porClave.size > 0) {
    console.log(`\nÍtems cargados antes que ya no figuran en esta lista (no se borran):`)
    for (const e of porClave.values()) console.log(`  - ${e.seccion} | ${e.descripcion}`)
  }
  console.log(`\nTotal: ${operaciones.length} ítems, ${operaciones.filter((o) => o.datos.vendemos).length} marcados "vendemos".`)

  if (!aplicar) {
    console.log("\nModo revisión: no se escribió nada. Agregá --aplicar para cargar.")
  } else {
    await prisma.$transaction(
      async (tx) => {
        const datosProveedor = {
          contacto: PROVEEDOR.contacto,
          telefono: PROVEEDOR.telefono,
          email: PROVEEDOR.email,
          marcas: PROVEEDOR.marcas,
          diasEntrega: PROVEEDOR.diasEntrega,
          notas: PROVEEDOR.notas,
        }
        proveedor = proveedor
          ? await tx.proveedor.update({ where: { id: proveedor.id }, data: datosProveedor })
          : await tx.proveedor.create({ data: { nombre: PROVEEDOR.nombre, ...datosProveedor } })

        for (const op of operaciones) {
          await tx.listaPrecioItem.upsert({
            where: {
              proveedorId_seccion_descripcion: { proveedorId: proveedor.id, ...op.clave },
            },
            create: { proveedorId: proveedor.id, ...op.clave, ...op.datos },
            // "vendemos" se respeta: lo marca el usuario a mano en la ficha del proveedor
            update: (({ vendemos, ...resto }) => resto)(op.datos),
          })
        }
      },
      { timeout: 120000 }
    )
    const total = await prisma.listaPrecioItem.count({ where: { proveedorId: proveedor.id } })
    console.log(`\nCargado. ${proveedor.nombre} tiene ${total} ítems en su lista de precios.`)
  }
} finally {
  await prisma.$disconnect()
}
