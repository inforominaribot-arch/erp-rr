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
  /** Arquitectos del cliente (el orden no importa) */
  arquitectoIds?: string[] | null
}

export function firmaCliente(c: IDatosFirmaCliente): string {
  const arquitectos = [...(c.arquitectoIds ?? [])].sort().join(",")
  return firmaTexto([c.nombre, c.telefono, c.email, c.direccion, c.localidad, c.notas, arquitectos])
}

/** Firma de los datos de un arquitecto */
export function firmaArquitecto(a: Pick<IDatosFirmaCliente, "nombre" | "telefono" | "email" | "notas">): string {
  return firmaTexto([a.nombre, a.telefono, a.email, a.notas])
}

function firmaTexto(valores: Array<string | null | undefined>): string {
  const texto = valores.map((v) => (v ?? "").trim()).join("\u0001")
  let hash = 5381
  for (let i = 0; i < texto.length; i++) {
    hash = ((hash * 33) ^ texto.charCodeAt(i)) >>> 0
  }
  return `${hash.toString(36)}-${texto.length}`
}
