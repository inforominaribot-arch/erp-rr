// Telas de la lista de precios RS para el selector de la tablet (sentido web → tablet).
// GET /api/mediciones/telas → { success, telas: ITelaMedicion[], mosquiteros: ICeldaMosquitero[] } (sin precios)
// "mosquiteros": medidas que se fabrican en cada modelo MagicRoll, mosquiteros y Noche Total (para ofrecer solo
// los modelos / sistemas posibles).

import {
  autenticarPeticionApi,
  handleCorsPreflight,
  jsonResponse,
} from "@/lib/api-auth"
import { obtenerCeldasMosquitero, obtenerTelasParaMedicion } from "@/modules/mediciones/queries"

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
    const [telas, mosquiteros] = await Promise.all([obtenerTelasParaMedicion(), obtenerCeldasMosquitero()])
    return jsonResponse({ success: true, telas, mosquiteros })
  } catch (error) {
    console.error("Error al descargar las telas para la tablet:", error)
    return jsonResponse(
      { success: false, error: "No se pudieron obtener las telas." },
      { status: 500 }
    )
  }
}
