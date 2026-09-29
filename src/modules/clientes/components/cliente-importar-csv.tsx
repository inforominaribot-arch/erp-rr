"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  X,
  Info,
} from "lucide-react"
import { importarClientesCSV } from "../actions"
import type { IResultadoImportacion } from "../types"

interface ClienteImportarCSVProps {
  onCerrar?: () => void
  onCompletado?: () => void
}

export function ClienteImportarCSV({
  onCerrar,
  onCompletado,
}: ClienteImportarCSVProps) {
  const router = useRouter()
  const archivoInputRef = useRef<HTMLInputElement>(null)

  const [archivo, setArchivo] = useState<File | null>(null)
  const [filasParseadas, setFilasParseadas] = useState<Array<Record<string, string>>>([])
  const [procesando, setProcesando] = useState(false)
  const [cargandoEnvio, setCargandoEnvio] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [resultado, setResultado] = useState<IResultadoImportacion | null>(null)

  // Descargar plantilla CSV de muestra
  function descargarPlantilla() {
    const encabezados = "nombre,telefono,email,direccion,localidad,notas\n"
    const ejemplos =
      'Juan Pérez,+54 9 11 5566-7788,juan@gmail.com,Av. del Libertador 1234,Vicente López,Interesado en cortinas roller blackout\n' +
      'María González,11-4433-2211,maria.gonzalez@hotmail.com,Calle 25 de Mayo 560,San Isidro,Pide presupuesto para 3 toldos de brazos invisibles\n'

    const blob = new Blob([encabezados + ejemplos], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "plantilla_clientes_erp_rr.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parsear texto CSV soportando comas y punto y coma
  function parsearCSV(texto: string) {
    const lineas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lineas.length < 2) {
      throw new Error(
        "El archivo debe incluir al menos una fila de encabezados y un registro."
      )
    }

    // Detectar delimitador (coma o punto y coma)
    const primeraLinea = lineas[0]
    const separador = primeraLinea.includes(";") ? ";" : ","

    // Función simple de split considerando comillas
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

    // Normalizar encabezados comunes
    const normalizar = (col: string) => {
      if (col.includes("nom") || col.includes("client") || col.includes("razon"))
        return "nombre"
      if (col.includes("tel") || col.includes("cel") || col.includes("movil"))
        return "telefono"
      if (col.includes("mail") || col.includes("correo")) return "email"
      if (col.includes("direc") || col.includes("calle") || col.includes("domicilio"))
        return "direccion"
      if (col.includes("loc") || col.includes("barrio") || col.includes("ciudad"))
        return "localidad"
      if (col.includes("not") || col.includes("obs") || col.includes("coment"))
        return "notas"
      return col
    }

    const columnas = encabezadosCrudos.map(normalizar)

    if (!columnas.includes("nombre")) {
      throw new Error(
        "No se detectó la columna obligatoria 'nombre' (o 'cliente'). Verificá los encabezados."
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

  function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorGlobal(null)
    setResultado(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      setErrorGlobal(
        "Formato no soportado. Por favor seleccioná un archivo delimitado por comas (.csv)."
      )
      return
    }

    setArchivo(file)
    setProcesando(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const contenido = event.target?.result as string
        const registros = parsearCSV(contenido)
        setFilasParseadas(registros)
      } catch (err: unknown) {
        setErrorGlobal(
          err instanceof Error
            ? err.message
            : "No se pudo leer el archivo CSV correctamente."
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

  async function handleImportar() {
    if (filasParseadas.length === 0) return

    setCargandoEnvio(true)
    setErrorGlobal(null)

    try {
      const res = await importarClientesCSV(filasParseadas)
      if (!res.success) {
        setErrorGlobal(res.error)
        return
      }

      setResultado(res.data)
      router.refresh()
      if (onCompletado) {
        onCompletado()
      }
    } catch {
      setErrorGlobal("Ocurrió un error al procesar la importación.")
    } finally {
      setCargandoEnvio(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header del módulo de importación */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Importar Clientes desde Archivo
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Cargá masivamente la base de clientes existente en formato CSV / Excel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={descargarPlantilla}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="Descargar plantilla de referencia"
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

      {/* Alerta de Error */}
      {errorGlobal && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p>{errorGlobal}</p>
        </div>
      )}

      {/* Resultado de Importación */}
      {resultado && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50/70 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-semibold text-green-900">
              ¡Importación completada!
            </h3>
          </div>
          <p className="mt-1 text-xs text-green-800">
            Se importaron correctamente{" "}
            <strong>{resultado.importados}</strong> clientes.
          </p>

          {resultado.errores.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
              <p className="text-xs font-semibold text-amber-800">
                Hubo {resultado.errores.length} fila/s con advertencias omitidas:
              </p>
              <ul className="mt-1 max-h-32 list-inside list-disc overflow-y-auto text-[11px] text-slate-600">
                {resultado.errores.map((e, i) => (
                  <li key={i}>
                    Fila {e.fila} ({e.nombre}): {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Zona de subida de archivo */}
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
              Columnas admitidas: nombre (obligatorio), teléfono, email, dirección, localidad, notas
            </p>
          </div>

          {/* Vista previa de los datos parseados */}
          {filasParseadas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">
                  Se detectaron {filasParseadas.length} clientes listos para importar.
                </span>
                <span className="text-slate-400">
                  Mostrando primeros 5 registros de muestra
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Teléfono</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Localidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filasParseadas.slice(0, 5).map((f, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {f.nombre}
                        </td>
                        <td className="px-3 py-2">{f.telefono || "—"}</td>
                        <td className="px-3 py-2">{f.email || "—"}</td>
                        <td className="px-3 py-2">{f.localidad || "—"}</td>
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
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {cargandoEnvio ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Importar {filasParseadas.length} clientes
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
