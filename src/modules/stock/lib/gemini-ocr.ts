// Módulo: Stock & Inventario
// Extracción Inteligente de Remitos con Gemini Vision

import type { IResultadoEscaneoRemito } from "../types"

interface ProductoReferencia {
  id: string
  codigo: string | null
  nombre: string
  unidadMedida: string
}

export async function extraerDatosRemitoConIA(
  imagenBase64: string,
  catalogoProductos: ProductoReferencia[]
): Promise<IResultadoEscaneoRemito> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      "No se encontró GEMINI_API_KEY configurada. Podés obtener una clave gratuita en aistudio.google.com y agregarla en el archivo .env.local. Mientras tanto, podés cargar el remito manualmente."
    )
  }

  // Limpiar encabezado base64 si viene con data:image/...;base64,
  let mimeType = "image/jpeg"
  let dataLimpia = imagenBase64

  if (imagenBase64.includes(";base64,")) {
    const partes = imagenBase64.split(";base64,")
    mimeType = partes[0].replace("data:", "")
    dataLimpia = partes[1]
  }

  const prompt = `
Sos un asistente experto en digitalización de remitos de materiales para un taller de cortinas y toldos (telas, caños galvanizados, rieles, zócalos, motores, accesorios).
Analizá minuciosamente la imagen de este remito comercial.

1. Extraé los datos generales:
   - "numeroRemito": Número o código del remito (ej. "0001-00045892").
   - "proveedor": Razón social o nombre del proveedor que emite el remito.
   - "fecha": Fecha del remito en formato YYYY-MM-DD (si solo está DD/MM/AAAA, convertila).
   - "observaciones": Notas relevantes o condición de entrega escritas en el remito.

2. Extraé la lista de productos e insumos recibidos:
   Por cada ítem:
   - "descripcionRemito": Descripción textual leída en el papel.
   - "cantidad": Cantidad numérica leída (número positivo, float o entero).
   - "unidad": metro, metro2, unidad o kg.
   - "costoUnitario": precio unitario si figura en el remito (número o null).
   - "productoId": Si este ítem coincide con alguno de los siguientes productos de nuestro catálogo oficial, asigná exactamente su ID; de lo contrario null:
   ${JSON.stringify(catalogoProductos.slice(0, 150))}

Respondé EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura, sin texto adicional ni bloques markdown:
{
  "numeroRemito": "...",
  "proveedor": "...",
  "fecha": "YYYY-MM-DD",
  "observaciones": "...",
  "items": [
    {
      "descripcionRemito": "...",
      "cantidad": 10,
      "unidad": "unidad",
      "costoUnitario": null,
      "productoId": "id-o-null",
      "productoNombreSugerido": "nombre-del-catalogo-o-null"
    }
  ]
}
`

  // Modelos de visión disponibles con fallback secuencial
  const modelos = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
  ]
  let ultimoError: unknown = null

  for (const modelo of modelos) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: dataLimpia,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              response_mime_type: "application/json",
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        ultimoError = new Error(`Error en API Gemini (${modelo}): ${response.status} - ${errorText}`)
        continue
      }

      const resJson = await response.json()
      const textoGenerado = resJson.candidates?.[0]?.content?.parts?.[0]?.text
      if (!textoGenerado) {
        throw new Error("No se pudo obtener respuesta del modelo de visión.")
      }

      let cleanJson = textoGenerado.trim()
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
      }

      const parsed: IResultadoEscaneoRemito = JSON.parse(cleanJson)
      return {
        numeroRemito: parsed.numeroRemito || "",
        proveedor: parsed.proveedor || "",
        fecha: parsed.fecha || new Date().toISOString().split("T")[0],
        observaciones: parsed.observaciones || "",
        items: Array.isArray(parsed.items) ? parsed.items : [],
      }
    } catch (err) {
      ultimoError = err
    }
  }

  throw ultimoError instanceof Error
    ? ultimoError
    : new Error("Error inesperado al procesar la imagen del remito.")
}
