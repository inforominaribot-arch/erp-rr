// Carga inicial de las listas de telas para cortinas tradicionales (Alhambra, Bia Brem, Sirota).
// Después de esta carga, las listas se actualizan desde la web (aviso del día 1 de cada mes).
//
// Uso (desde erp-rr, Node 22.6+ por los .ts):
//   node scripts/importar-listas-telas.mjs "<Alhambra.xlsx>" "<Bia Brem.xlsx>" "<Sirota.pdf>"            (solo muestra)
//   node scripts/importar-listas-telas.mjs "<Alhambra.xlsx>" "<Bia Brem.xlsx>" "<Sirota.pdf>" --aplicar  (escribe)
//
// - Crea los proveedores si no existen (por nombre) con su formato de lista y el aviso mensual.
// - Activa también el aviso mensual de Rollershade (lista de accesorios).

import fs from "fs"
import { PrismaClient } from "@prisma/client"
import { leerFilasXlsx, leerRenglonesPdf } from "../src/modules/proveedores/lib/listas-telas/leer-archivos.ts"
import {
  FORMATOS_LISTA_TELAS,
  parsearExcelTelas,
  parsearPdfTelas,
} from "../src/modules/proveedores/lib/listas-telas/parsear-listas.ts"

const args = process.argv.slice(2)
const aplicar = args.includes("--aplicar")
const [alhambra, biaBrem, sirota] = args.filter((a) => a !== "--aplicar")
if (!alhambra || !biaBrem || !sirota) {
  console.error("Indicá los tres archivos: Alhambra, Bia Brem y Sirota.")
  process.exit(1)
}

const LISTAS = [
  { formato: "ALHAMBRA", archivo: alhambra },
  { formato: "BIA_BREM", archivo: biaBrem },
  { formato: "SIROTA", archivo: sirota },
]

const prisma = new PrismaClient()
const fmt = (n) => "$" + Number(n).toLocaleString("es-AR")

try {
  for (const { formato, archivo } of LISTAS) {
    const nombre = FORMATOS_LISTA_TELAS[formato].nombre
    const datos = new Uint8Array(fs.readFileSync(archivo))
    const filas = archivo.toLowerCase().endsWith(".pdf")
      ? parsearPdfTelas(await leerRenglonesPdf(datos))
      : parsearExcelTelas(await leerFilasXlsx(datos))
    console.log(`\n${nombre}: ${filas.length} telas (recargo ${FORMATOS_LISTA_TELAS[formato].textoRecargo})`)
    for (const f of filas.slice(0, 5)) console.log(`  ${f.nombre} — ${f.ancho ?? "?"} m — ${fmt(f.precio)}`)
    console.log("  ...")

    if (!aplicar) continue
    let proveedor = await prisma.proveedor.findFirst({ where: { nombre: { equals: nombre, mode: "insensitive" } } })
    if (!proveedor) {
      proveedor = await prisma.proveedor.create({
        data: { nombre, formatoListaTelas: formato, avisoListaMensual: true, notas: "Telas para cortinas tradicionales" },
      })
      console.log(`  Proveedor creado: ${nombre}`)
    } else {
      await prisma.proveedor.update({
        where: { id: proveedor.id },
        data: { formatoListaTelas: formato, avisoListaMensual: true },
      })
    }
    const existentes = await prisma.listaTelaItem.findMany({ where: { proveedorId: proveedor.id } })
    const porNombre = new Map(existentes.map((e) => [e.nombre, e]))
    await prisma.$transaction(
      filas.map((f, i) => {
        const previo = porNombre.get(f.nombre)
        const datos = {
          descripcion: f.descripcion,
          rubro: f.rubro,
          codigo: f.codigo,
          ancho: f.ancho,
          precio: f.precio,
          orden: i + 1,
          activo: true,
        }
        return previo
          ? prisma.listaTelaItem.update({ where: { id: previo.id }, data: datos })
          : prisma.listaTelaItem.create({ data: { proveedorId: proveedor.id, nombre: f.nombre, ...datos } })
      })
    )
    await prisma.proveedor.update({
      where: { id: proveedor.id },
      data: { listaConfirmadaEn: new Date(), listaTelasVigencia: new Date().toLocaleDateString("es-AR") },
    })
    console.log(`  Guardadas ${filas.length} telas.`)
  }

  if (aplicar) {
    const rs = await prisma.proveedor.updateMany({ where: { marcas: { has: "RS" } }, data: { avisoListaMensual: true } })
    console.log(`\nAviso mensual activado en Rollershade (${rs.count}).`)
  } else {
    console.log("\nSolo se mostró. Para guardar: agregá --aplicar")
  }
} finally {
  await prisma.$disconnect()
}
