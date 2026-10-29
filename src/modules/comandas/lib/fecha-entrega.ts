// Módulo: Comandas
// Fecha de entrega de la comanda: 25 días corridos desde que se aceptó el presupuesto
// (si el presupuesto no tiene fecha de aceptación, desde hoy).

export const DIAS_ENTREGA = 25

export function fechaEntregaDesdeAceptacion(fechaAceptacion: Date | string | null | undefined): Date {
  const base = fechaAceptacion ? new Date(fechaAceptacion) : new Date()
  const entrega = new Date(base)
  entrega.setDate(entrega.getDate() + DIAS_ENTREGA)
  return entrega
}

/** La misma fecha en formato "AAAA-MM-DD" (fecha local) para un input type="date" */
export function fechaEntregaParaInput(fechaAceptacion: Date | string | null | undefined): string {
  const d = fechaEntregaDesdeAceptacion(fechaAceptacion)
  const dd = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`
}
