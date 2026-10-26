// Reconecta las cortinas de un presupuesto (y de su comanda) con las cortinas de una
// medición, cuando el vínculo se perdió por ediciones anteriores de la medición.
// Empareja por ambiente + ancho + alto (el nombre puede diferir).
//
// Uso:
//   node scripts/reconectar-presupuesto-medicion.mjs <nroPresupuesto> <idMedicion>            → modo prueba
//   node scripts/reconectar-presupuesto-medicion.mjs <nroPresupuesto> <idMedicion> --aplicar  → aplica
//
// Ejemplo (presupuesto #8, FABRICIO CHIAPINI):
//   node scripts/reconectar-presupuesto-medicion.mjs 8 15d773ed-d247-4dc2-9a92-4888b1863c42

import { PrismaClient } from "@prisma/client"

const [nroArg, medicionId] = process.argv.slice(2)
const aplicar = process.argv.includes("--aplicar")
const numero = Number(nroArg)

if (!numero || !medicionId) {
  console.log("Uso: node scripts/reconectar-presupuesto-medicion.mjs <nroPresupuesto> <idMedicion> [--aplicar]")
  process.exit(1)
}

const prisma = new PrismaClient()
const mismaMedida = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005
const norm = (s) => (s || "General").trim().toLowerCase()

async function main() {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { numero },
    include: { cliente: true, items: true, comanda: { include: { items: true } } },
  })
  if (!presupuesto) throw new Error(`No existe el presupuesto #${numero}`)

  const medicion = await prisma.medicion.findUnique({
    where: { id: medicionId },
    include: { ambientes: { include: { items: true } } },
  })
  if (!medicion) throw new Error(`No existe la medición ${medicionId}`)
  if (medicion.clienteId !== presupuesto.clienteId) {
    throw new Error("La medición y el presupuesto son de clientes distintos. No se hace nada.")
  }

  const cortinasMedicion = medicion.ambientes.flatMap((a) =>
    a.items.map((it) => ({ ...it, ambienteNombre: a.nombre }))
  )

  const buscar = (ambiente, ancho, alto, usados) => {
    const candidatas = cortinasMedicion.filter(
      (c) =>
        !usados.has(c.id) &&
        norm(c.ambienteNombre) === norm(ambiente) &&
        mismaMedida(c.ancho, ancho) &&
        mismaMedida(c.alto, alto)
    )
    return candidatas.length === 1 ? candidatas[0] : null // solo si es inequívoco
  }

  console.log(aplicar ? "== APLICANDO ==" : "== MODO PRUEBA (no se modifica nada) ==")
  console.log(`Presupuesto #${presupuesto.numero} — ${presupuesto.cliente.nombre}\n`)

  const cambios = []
  const usadosP = new Set(presupuesto.items.map((i) => i.itemMedicionId).filter(Boolean))
  for (const ip of presupuesto.items) {
    if (ip.itemMedicionId) continue
    const c = buscar(ip.ambiente, ip.ancho, ip.alto, usadosP)
    if (!c) {
      console.log(`  ✗ Presupuesto: "${ip.descripcion}" ${Number(ip.ancho)}×${Number(ip.alto)} — sin pareja única`)
      continue
    }
    usadosP.add(c.id)
    console.log(`  ✓ Presupuesto: "${ip.descripcion}" ${Number(ip.ancho)}×${Number(ip.alto)} → medición "${c.descripcion}" (${c.ambienteNombre})`)
    cambios.push(prisma.itemPresupuesto.update({ where: { id: ip.id }, data: { itemMedicionId: c.id } }))
  }

  if (presupuesto.comanda) {
    const usadosC = new Set(presupuesto.comanda.items.map((i) => i.itemMedicionId).filter(Boolean))
    for (const ic of presupuesto.comanda.items) {
      if (ic.itemMedicionId) continue
      const c = buscar(ic.ambiente, ic.ancho, ic.alto, usadosC)
      if (!c) {
        console.log(`  ✗ Comanda #${presupuesto.comanda.numero}: "${ic.descripcion}" — sin pareja única`)
        continue
      }
      usadosC.add(c.id)
      console.log(`  ✓ Comanda #${presupuesto.comanda.numero}: "${ic.descripcion}" ${Number(ic.ancho)}×${Number(ic.alto)} → medición "${c.descripcion}"`)
      cambios.push(prisma.itemComanda.update({ where: { id: ic.id }, data: { itemMedicionId: c.id } }))
    }
  }

  if (cambios.length === 0) {
    console.log("\nNo hay nada para reconectar.")
    return
  }
  if (aplicar) {
    await prisma.$transaction(cambios)
    console.log(`\nListo: ${cambios.length} vínculo(s) reconectado(s).`)
  } else {
    console.log(`\n${cambios.length} vínculo(s) a reconectar. Para aplicar, agregá --aplicar al final.`)
  }
}

main()
  .catch((e) => {
    console.error("Error:", e.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
