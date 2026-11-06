// Módulo: Mediciones
// Firma de los datos de un cliente que usa la tablet: sirve para saber si cambiaron sin bajar todo el catálogo.
// No incluye el estado: la tablet no lo muestra, así que un cambio de estado no es una novedad para ella.

export interface IDatosFirmaCliente {
  nombre?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  localidad?: string | null
  notas?: string | null
}

export function firmaCliente(c: IDatosFirmaCliente): string {
  const texto = [c.nombre, c.telefono, c.email, c.direccion, c.localidad, c.notas]
    .map((v) => (v ?? "").trim())
    .join("\u0001")
  let hash = 5381
  for (let i = 0; i < texto.length; i++) {
    hash = ((hash * 33) ^ texto.charCodeAt(i)) >>> 0
  }
  return `${hash.toString(36)}-${texto.length}`
}
