// Módulo: Stock & Inventario
// Importación Masiva de Productos e Insumos desde CSV

"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  X,
} from "lucide-react"
import { importarProductosCSV } from "../actions"
import type { IResultadoImportacionStock } from "../types"

interface StockImportarCSVProps {
  onCerrar?: () => void
  onCompletado?: () => void
}

export function StockImportarCSV({
  onCerrar,
  onCompletado,
}: StockImportarCSVProps) {
  const router = useRouter()
  const archivoInputRef = useRef<HTMLInputElement>(null)

  const [archivo, setArchivo] = useState<File | null>(null)
  const [filasParseadas, setFilasParseadas] = useState<Array<Record<string, string>>>([])
  const [procesando, setProcesando] = useState(false)
  const [cargandoEnvio, setCargandoEnvio] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [resultado, setResultado] = useState<IResultadoImportacionStock | null>(null)

  // Descargar plantilla CSV de referencia con insumos reales de cortinas y toldos
  const descargarPlantilla = () => {
    const encabezados =
      "codigo,nombre,descripcion,unidad_medida,stock_actual,stock_minimo,precio_costo\n"
    const ejemplos =
      'TEL-GAZA,Gaza Rústica Blanco Óptico,Ancho 3.00m para cortinas tradicionales,metro,120,20,12500\n' +
      'TEL-BO,Blackout Texturado Gris Perla,Ancho 2.80m triple capa,metro,75,15,18900\n' +
      'CAN-080,Caño Galvanizado 0.80 mts,Sol de verano 10 (repuesto pileta/toldo),unidad,40,10,6500\n' +
      'CAN-100,Caño Hembra 1.00 mts,Calibre reforzado interior/exterior,unidad,30,8,7200\n' +
      'RIE-EUR,Riel Europeo Blanco 2.0m,Riel aluminio lacado con correderas,unidad,25,5,14200\n' +
      'MOT-35,Motor Tubular 35mm Radio,Para roller con control remoto,unidad,14,4,48000\n' +
      'SOP-DOB,Soporte Doble Roller Blanco,Chapa plegada pintura epoxi,unidad,60,15,3500\n'

    const blob = new Blob([encabezados + ejemplos], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "plantilla_stock_insumos_erp_rr.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parsear texto CSV tolerante a coma y punto y coma
  const parsearCSV = (texto: string) => {
    const lineas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lineas.length < 2) {
      throw new Error(
        "El archivo debe incluir al menos una fila de encabezados y un registro."
      )
    }

    const primeraLinea = lineas[0]
    const separador = primeraLinea.includes(";") ? ";" : ","

    const splitLinea = (linea: string) => {
      const valores: string[] = []
      let actual = ""
      let dentroDeComillas = false

      for (let i = 0; i < linea.length; i++) {
        const char = linea[i]
        if (char === '"' || char === "'") {
          dentroDeComillas = !dentroDeComillas
        } else if (char === separador && !dentroDeComillas) {
          valores.push(actual.trim().replace(/^["']|["']$/g, ""))
          actual = ""
        } else {
          actual += char
        }
      }
      valores.push(actual.trim().replace(/^["']|["']$/g, ""))
      return valores
    }

    const encabezadosCrudos = splitLinea(primeraLinea).map((h) =>
      h.toLowerCase().trim()
    )

    const normalizar = (col: string) => {
      if (col.includes("cod")) return "codigo"
      if (col.includes("nom") || col.includes("producto") || col.includes("insumo") || col.includes("material"))
        return "nombre"
      if (col.includes("desc") || col.includes("espec") || col.includes("detalle"))
        return "descripcion"
      if (col.includes("uni") || col.includes("medida")) return "unidad_medida"
      if (col.includes("actual") || col.includes("exist") || col.includes("cant") || col.includes("stock"))
        return "stock_actual"
      if (col.includes("min")) return "stock_minimo"
      if (col.includes("cost") || col.includes("prec") || col.includes("precio"))
        return "precio_costo"
      if (col.includes("foto") || col.includes("img") || col.includes("imagen"))
        return "imagen"
      return col
    }

    const columnas = encabezadosCrudos.map(normalizar)

    if (!columnas.includes("nombre")) {
      throw new Error(
        "No se detectó la columna obligatoria 'nombre' (o 'producto/insumo'). Verificá los encabezados."
      )
    }

    const filas: Array<Record<string, string>> = []

    for (let i = 1; i < lineas.length; i++) {
      const vals = splitLinea(lineas[i])
      const objetoFila: Record<string, string> = {}

      columnas.forEach((col, idx) => {
        if (col && vals[idx] !== undefined) {
          objetoFila[col] = vals[idx]
        }
      })

      if (objetoFila.nombre && objetoFila.nombre.trim() !== "") {
        filas.push(objetoFila)
      }
    }

    return filas
  }

  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorGlobal(null)
    setResultado(null)
    const file = e.target.files?.[0]
    if (!file) return

    setArchivo(file)
    setProcesando(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const contenido = event.target?.result as string
        const registros = parsearCSV(contenido)
        setFilasParseadas(registros)
      } catch (err: any) {
        setErrorGlobal(
          err.message || "No se pudo leer el archivo CSV correctamente."
        )
        setFilasParseadas([])
      } finally {
        setProcesando(false)
      }
    }
    reader.onerror = () => {
      setErrorGlobal("Error de lectura del archivo.")
      setProcesando(false)
    }
    reader.readAsText(file)
  }

  const handleImportar = async () => {
    if (filasParseadas.length === 0) return

    setCargandoEnvio(true)
    setErrorGlobal(null)

    try {
      const res = await importarProductosCSV(filasParseadas)
      if (!res.success) {
        setErrorGlobal(res.error)
        return
      }

      setResultado(res.data)
      router.refresh()
      if (onCompletado) onCompletado()
    } catch {
      setErrorGlobal("Ocurrió un error al procesar la importación.")
    } finally {
      setCargandoEnvio(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Importación Masiva de Insumos y Repuestos
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Cargá o actualizá el catálogo completo desde una planilla Excel exportada a CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={descargarPlantilla}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="Descargar plantilla de referencia para taller"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            Descargar plantilla
          </button>
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {errorGlobal && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p>{errorGlobal}</p>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-emerald-900">
              ¡Importación completada con éxito!
            </h3>
          </div>
          <p className="mt-1 text-xs text-emerald-800">
            Se crearon <strong>{resultado.importados}</strong> nuevos insumos y se actualizaron{" "}
            <strong>{resultado.actualizados}</strong> productos existentes.
          </p>

          {resultado.errores.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
              <p className="text-xs font-semibold text-amber-800">
                Advertencias en {resultado.errores.length} fila/s omitidas:
              </p>
              <ul className="mt-1 max-h-32 list-inside list-disc overflow-y-auto text-[11px] text-slate-600">
                {resultado.errores.map((e, i) => (
                  <li key={i}>
                    Fila {e.fila} ({e.identificador}): {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Zona de subida */}
      {!resultado && (
        <div className="mt-5 space-y-4">
          <div
            onClick={() => archivoInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/20"
          >
            <input
              ref={archivoInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {archivo ? archivo.name : "Hacé clic para seleccionar tu archivo CSV"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Columnas: codigo, nombre (obligatorio), descripcion, unidad_medida, stock_actual, stock_minimo, precio_costo
            </p>
          </div>

          {/* Vista previa */}
          {filasParseadas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">
                  Se detectaron {filasParseadas.length} insumos listos para importar.
                </span>
                <span className="text-slate-400">
                  Mostrando primeros 5 registros de muestra
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Unidad</th>
                      <th className="px-3 py-2 text-right">Stock Actual</th>
                      <th className="px-3 py-2 text-right">Stock Mínimo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filasParseadas.slice(0, 5).map((f, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono">{f.codigo || "—"}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {f.nombre}
                        </td>
                        <td className="px-3 py-2">{f.unidad_medida || "unidad"}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {f.stock_actual || "0"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {f.stock_minimo || "0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setArchivo(null)
                    setFilasParseadas([])
                  }}
                  disabled={cargandoEnvio}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cambiar archivo
                </button>
                <button
                  type="button"
                  onClick={handleImportar}
                  disabled={cargandoEnvio}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {cargandoEnvio ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Importar {filasParseadas.length} insumos
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
