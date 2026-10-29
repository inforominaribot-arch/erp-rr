// Importa tablas de precios por medida (ancho × alto) de un proveedor a la tabla precios_por_medida.
//
// Uso:
//   node scripts/importar-tablas-medida.mjs scripts/data/tablas-magicroll-mosquiteros-2026-10.mjs            (solo muestra)
//   node scripts/importar-tablas-medida.mjs scripts/data/tablas-magicroll-mosquiteros-2026-10.mjs --aplicar  (escribe)
//
// - Crea el proveedor si no existe (por nombre) o completa sus marcas.
// - Cada celda se identifica por proveedor + modelo + tabla + ancho desde + alto desde: si ya existe se
//   actualiza el precio (al cargar una lista nueva no se duplica).
// - Las celdas de esos modelos que ya no figuran se desactivan (dejan de ofrecerse).

import path from "path"
import { pathToFileURL } from "url"
import { PrismaClient } from "@prisma/client"

const [archivo, flag] = process.argv.slice(2)
if (!archivo) {
  console.error("Indicá el archivo de datos de las tablas.")
  process.exit(1)
}
const aplicar = flag === "--aplicar"
const { PROVEEDOR, VIGENCIA, TABLAS } = await import(pathToFileURL(path.resolve(archivo)).href)

const prisma = new PrismaClient()
const fmt = (n) => "$" + Number(n).toLocaleString("es-AR")

/** Cajón de una celda según la tabla (por defecto o el de las celdas / columnas marcadas) */
function cajonDe(t, f, c) {
  const e = t.cajonEspecial
  if (e) {
    const marcada = e.celdas
      ? e.celdas.some(([a, b]) => a === f && b === c)
      : e.columnas.includes(c) && (!e.filas || e.filas.includes(f))
    if (marcada) return e.cajon
  }
  return t.cajonPorDefecto ?? null
}

try {
  const proveedor = await prisma.proveedor.findFirst({
    where: { nombre: { equals: PROVEEDOR.nombre, mode: "insensitive" } },
  })
  console.log(proveedor ? `Proveedor existente: ${proveedor.nombre}` : `Proveedor NUEVO: ${PROVEEDOR.nombre}`)

  const modelos = [...new Set(TABLAS.map((t) => t.modelo))]
  const existentes = proveedor
    ? await prisma.precioMedidaItem.findMany({ where: { proveedorId: proveedor.id, modelo: { in: modelos } } })
    : []
  const porClave = new Map(existentes.map((e) => [`${e.modelo}|${e.tabla}|${e.anchoDesde}|${e.altoDesde}`, e]))

  const celdas = []
  for (const t of TABLAS) {
    const tabla = `Pág. ${t.pagina}`
    let nuevas = 0
    let cambios = 0
    t.altos.forEach(([altoDesde, altoHasta], f) => {
      if (t.precios[f].length !== t.anchos.length) {
        throw new Error(`${t.nombre} (${tabla}): la fila ${f + 1} tiene ${t.precios[f].length} precios y hay ${t.anchos.length} anchos`)
      }
      t.anchos.forEach(([anchoDesde, anchoHasta], c) => {
        const precio = t.precios[f][c]
        if (precio == null) return
        const clave = `${t.modelo}|${tabla}|${anchoDesde}|${altoDesde}`
        const previo = porClave.get(clave)
        porClave.delete(clave)
        if (!previo) nuevas++
        else if (Number(previo.precio) !== precio || !previo.activo) {
          cambios++
          console.log(`  ${t.modelo} ${anchoDesde}×${altoDesde}: ${fmt(previo.precio)} → ${fmt(precio)}`)
        }
        celdas.push({
          previo,
          modelo: t.modelo,
          tabla,
          anchoDesde,
          altoDesde,
          datos: {
            nombreModelo: t.nombre,
            cajon: cajonDe(t, f, c),
            anchoHasta,
            altoHasta,
            precio,
            vigencia: VIGENCIA,
            activo: true,
          },
        })
      })
    })
    console.log(`[${tabla}] ${t.nombre}: ${nuevas} celdas nuevas, ${cambios} con cambios`)
  }

  const aDesactivar = [...porClave.values()].filter((e) => e.activo)
  if (aDesactivar.length > 0) console.log(`\n${aDesactivar.length} celdas que ya no figuran se desactivan.`)
  console.log(`\nTotal: ${celdas.length} celdas en ${TABLAS.length} tablas.`)

  if (!aplicar) {
    console.log("\nModo revisión: no se escribió nada. Agregá --aplicar para cargar.")
  } else {
    // Sin una transacción larga (con cientos de celdas excede el tiempo de Prisma): las celdas nuevas
    // van en lotes con createMany y solo se actualizan una por una las que cambiaron. Se puede repetir sin duplicar.
    const prov = proveedor
      ? await prisma.proveedor.update({
          where: { id: proveedor.id },
          data: { marcas: [...new Set([...(proveedor.marcas || []), ...PROVEEDOR.marcas])] },
        })
      : await prisma.proveedor.create({
          data: { nombre: PROVEEDOR.nombre, marcas: PROVEEDOR.marcas, notas: PROVEEDOR.notas ?? null },
        })
    const nuevas = celdas.filter((c) => !c.previo)
    for (let k = 0; k < nuevas.length; k += 200) {
      await prisma.precioMedidaItem.createMany({
        data: nuevas.slice(k, k + 200).map((c) => ({
          proveedorId: prov.id,
          modelo: c.modelo,
          tabla: c.tabla,
          anchoDesde: c.anchoDesde,
          altoDesde: c.altoDesde,
          ...c.datos,
        })),
        skipDuplicates: true,
      })
    }
    const cambiadas = celdas.filter(
      (c) =>
        c.previo &&
        (Number(c.previo.precio) !== c.datos.precio || !c.previo.activo || c.previo.cajon !== c.datos.cajon)
    )
    for (const c of cambiadas) {
      await prisma.precioMedidaItem.update({ where: { id: c.previo.id }, data: c.datos })
    }
    if (aDesactivar.length > 0) {
      await prisma.precioMedidaItem.updateMany({
        where: { id: { in: aDesactivar.map((e) => e.id) } },
        data: { activo: false },
      })
    }
    const total = await prisma.precioMedidaItem.count({ where: { proveedorId: prov.id, activo: true } })
    console.log(`\nCargado: ${nuevas.length} celdas nuevas, ${cambiadas.length} actualizadas. ${prov.nombre} tiene ${total} celdas activas.`)
  }
} finally {
  await prisma.$disconnect()
}
