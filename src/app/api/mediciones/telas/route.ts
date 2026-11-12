// Telas de la lista de precios RS para el selector de la tablet (sentido web → tablet).
// GET /api/mediciones/telas → { success, telas: ITelaMedicion[], mosquiteros: ICeldaMosquitero[], telasTradicional: string[] } (sin precios)
// "telasTradicional": nombres de las telas de las tiendas (Alhambra, Bia Brem, Sirota) para sugerir en capas Tradicionales.
// "mosquiteros": medidas que se fabrican en cada modelo MagicRoll, mosquiteros y Noche Total (para ofrecer solo
// los modelos / sistemas posibles).

import {
  autenticarPeticionApi,
  handleCorsPreflight,
  jsonResponse,
} from "@/lib/api-auth"
import {
  obtenerCeldasMosquitero,
  obtenerNombresTelasTradicional,
  obtenerTelasParaMedicion,
} from "@/modules/mediciones/queries"

export async function OPTIONS() {
  return handleCorsPreflight()
}

export async function GET(req: Request) {
  try {
    const auth = await autenticarPeticionApi(req)
    if (!auth.autenticado || !auth.usuario) {
      return jsonResponse(
        { success: false, error: auth.error || "No autorizado" },
        { status: 401 }
      )
    }
    const [telas, mosquiteros, telasTradicional] = await Promise.all([
      obtenerTelasParaMedicion(),
      obtenerCeldasMosquitero(),
      obtenerNombresTelasTradicional(),
    ])
    return jsonResponse({ success: true, telas, mosquiteros, telasTradicional })
  } catch (error) {
    console.error("Error al descargar las telas para la tablet:", error)
    return jsonResponse(
      { success: false, error: "No se pudieron obtener las telas." },
      { status: 500 }
    )
  }
}
