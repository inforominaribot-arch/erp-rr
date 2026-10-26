import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatearFecha(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatearPrecio(precio: number | string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(precio))
}

/**
 * Medida en metros con 2 decimales, o 3 si la medida tiene milímetros.
 * Ej: 2.5 → "2.50", 1.775 → "1.775"
 */
export function fmtMedida(valor: number | string | null | undefined): string {
  const n = Number(valor) || 0
  const con3 = n.toFixed(3)
  return con3.endsWith("0") ? n.toFixed(2) : con3
}

export function formatearMedida(valor: number | string): string {
  return `${fmtMedida(valor)} m`
}
