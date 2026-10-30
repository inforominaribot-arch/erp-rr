// Arma la plantilla vacía de la orden de trabajo de Rollershade a partir de un pedido real (.xlsx).
// Borra los datos de ese pedido (filas 7-12, fecha, N° de orden y cliente) y deja todo lo demás intacto:
// formatos, dibujos (llaves, óvalos) y la hoja "ORD. DE TRABAJO 1".
// Uso: node scripts/armar-plantilla-rollershade.mjs "PEDIDO X 29-10-2026.xlsx"
// Salida: public/plantillas/orden-trabajo-rollershade.xlsx

import { readFile, writeFile, mkdir } from "node:fs/promises"
import JSZip from "jszip"

const origen = process.argv[2]
if (!origen) {
  console.error("Falta el archivo de origen (.xlsx)")
  process.exit(1)
}

const zip = await JSZip.loadAsync(await readFile(origen))
const ruta = "xl/worksheets/sheet2.xml"
let xml = await zip.file(ruta).async("string")

// Vacía una celda conservando su estilo
const vaciar = (ref, estilo) => {
  const re = new RegExp(`<c r="${ref}"([^>]*?)(/>|>.*?</c>)`, "s")
  xml = xml.replace(re, (_m, attrs) => {
    const s = estilo ?? attrs.match(/s="(\d+)"/)?.[1]
    return `<c r="${ref}"${s ? ` s="${s}"` : ""}/>`
  })
}

const COLUMNAS = "ABCDEFGHIJKLMNOPQRST".split("")
for (let fila = 7; fila <= 12; fila++) {
  for (const col of COLUMNAS) {
    // Fila de datos vacía: N° con su estilo (60) y el resto como celda vacía con bordes (62)
    vaciar(`${col}${fila}`, col === "A" ? "60" : "62")
  }
}
vaciar("M2")
vaciar("S2")
vaciar("K13")
xml = xml.replace(/<mergeCells count="\d+">.*?<\/mergeCells>/s, "")
zip.file(ruta, xml)

// Textos compartidos que ya no usa ninguna celda (los del pedido de ejemplo, ej: el cliente) → vacíos
const usados = new Set()
for (const nombre of Object.keys(zip.files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))) {
  const hoja = await zip.file(nombre).async("string")
  for (const m of hoja.matchAll(/<c [^>]*t="s"[^>]*><v>(\d+)<\/v><\/c>/g)) usados.add(Number(m[1]))
}
let indice = -1
const sst = (await zip.file("xl/sharedStrings.xml").async("string")).replace(/<si>.*?<\/si>/gs, (si) => {
  indice++
  return usados.has(indice) ? si : "<si><t></t></si>"
})
zip.file("xl/sharedStrings.xml", sst)

await mkdir("public/plantillas", { recursive: true })
const salida = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
await writeFile("public/plantillas/orden-trabajo-rollershade.xlsx", salida)
console.log("Plantilla guardada en public/plantillas/orden-trabajo-rollershade.xlsx")
