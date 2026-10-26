// Vincula las cortinas de comandas YA EXISTENTES con su cortina de medición,
// para que los cambios de medida futuros se reflejen también en esas comandas.
// (Las comandas nuevas se vinculan solas al generarse.)
//
// Uso:
//   node scripts/vincular-comandas-mediciones.mjs            → solo muestra qué haría (no modifica nada)
//   node scripts/vincular-comandas-mediciones.mjs --aplicar  → aplica los vínculos
//
// Emparejamiento: dentro del mismo presupuesto, misma descripción, ambiente y medidas.

import { PrismaClient } from "@prisma/client"

const aplicar = process.argv.includes("--aplicar")
const prisma = new PrismaClient()

const mismaMedida = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005

async function main() {
  const comandas = await prisma.comanda.findMany({
    include: {
      items: true,
      presupuesto: { include: { items: true } },
    },
  })

  let vinculados = 0
  let sinPareja = 0
  const pendientes = []

  for (const comanda of comandas) {
    const usados = new Set(comanda.items.map((i) => i.itemMedicionId).filter(Boolean))
    const candidatos = comanda.presupuesto.items.filter((ip) => ip.itemMedicionId)

    for (const ic of comanda.items) {
      if (ic.itemMedicionId) continue
      const pareja = candidatos.find(
        (ip) =>
          !usados.has(ip.itemMedicionId) &&
          ip.descripcion === ic.descripcion &&
          (ip.ambiente || "General") === (ic.ambiente || "General") &&
          mismaMedida(ip.ancho, ic.ancho) &&
          mismaMedida(ip.alto, ic.alto)
      )
      if (!pareja) {
        sinPareja++
        pendientes.push(`Comanda #${comanda.numero}: "${ic.descripcion}" (${ic.ambiente || "General"})`)
        continue
      }
      usados.add(pareja.itemMedicionId)
      vinculados++
      if (aplicar) {
        await prisma.itemComanda.update({
          where: { id: ic.id },
          data: { itemMedicionId: pareja.itemMedicionId },
        })
      }
    }
  }

  console.log(aplicar ? "== VÍNCULOS APLICADOS ==" : "== MODO PRUEBA (no se modificó nada) ==")
  console.log(`Comandas revisadas: ${comandas.length}`)
  console.log(`Cortinas de comanda vinculadas${aplicar ? "" : " (a vincular)"}: ${vinculados}`)
  console.log(`Cortinas sin medición encontrada: ${sinPareja}`)
  if (pendientes.length > 0) {
    console.log("\nSin vincular (el presupuesto perdió el vínculo o la cortina cambió):")
    for (const p of pendientes) console.log("  - " + p)
  }
  if (!aplicar && vinculados > 0) {
    console.log("\nPara aplicar: node scripts/vincular-comandas-mediciones.mjs --aplicar")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
