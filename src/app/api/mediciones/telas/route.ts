// Telas de la lista de precios RS para el selector de la tablet (sentido web → tablet).
// GET /api/mediciones/telas → { success, telas: ITelaMedicion[] } (sin precios)

import {
  autenticarPeticionApi,
  handleCorsPreflight,
  jsonResponse,
} from "@/lib/api-auth"
import { obtenerTelasParaMedicion } from "@/modules/mediciones/queries"

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
    const telas = await obtenerTelasParaMedicion()
    return jsonResponse({ success: true, telas })
  } catch (error) {
    console.error("Error al descargar las telas para la tablet:", error)
    return jsonResponse(
      { success: false, error: "No se pudieron obtener las telas." },
      { status: 500 }
    )
  }
}
