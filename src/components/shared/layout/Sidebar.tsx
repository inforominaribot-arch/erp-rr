"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { obtenerConteoPendientesPresupuestoAction } from "@/modules/presupuestos/actions"
import {
  LayoutDashboard,
  Users,
  Ruler,
  FileText,
  ClipboardList,
  Factory,
  Package,
  Truck,
  Calendar,
  BarChart3,
  ChevronDown,
  Building2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navegacion = [
  {
    titulo: "Principal",
    items: [
      { nombre: "Dashboard", href: "/", icono: LayoutDashboard },
    ],
  },
  {
    titulo: "Comercial",
    items: [
      { nombre: "Clientes", href: "/clientes", icono: Users },
      { nombre: "Mediciones", href: "/mediciones", icono: Ruler },
      { nombre: "Presupuestos", href: "/presupuestos", icono: FileText },
    ],
  },
  {
    titulo: "Operaciones",
    items: [
      { nombre: "Comandas", href: "/comandas", icono: ClipboardList },
      { nombre: "Producción", href: "/produccion", icono: Factory },
      { nombre: "Instalaciones", href: "/instalaciones", icono: Calendar },
    ],
  },
  {
    titulo: "Inventario",
    items: [
      { nombre: "Stock", href: "/stock", icono: Package },
      { nombre: "Proveedores", href: "/proveedores", icono: Truck },
    ],
  },
  {
    titulo: "Reportes",
    items: [
      { nombre: "Métricas", href: "/metricas", icono: BarChart3 },
    ],
  },
]

interface SidebarProps {
  mobileAbierto?: boolean
  onCerrarMobile?: () => void
}

export function Sidebar({ mobileAbierto, onCerrarMobile }: SidebarProps) {
  const pathname = usePathname()
  const [conteoPendientesPresupuesto, setConteoPendientesPresupuesto] = useState(0)

  // Cerrar el drawer móvil automáticamente al cambiar de ruta
  useEffect(() => {
    if (onCerrarMobile) {
      onCerrarMobile()
    }
  }, [pathname])

  // Consultar conteo de mediciones pendientes de presupuestar
  useEffect(() => {
    let cancelado = false
    obtenerConteoPendientesPresupuestoAction()
      .then((conteo) => {
        if (!cancelado && typeof conteo === "number") {
          setConteoPendientesPresupuesto(conteo)
        }
      })
      .catch((err) => {
        console.error("Error al obtener badge de presupuestos pendientes:", err)
      })

    return () => {
      cancelado = true
    }
  }, [pathname])

  const renderNav = () => (
    <nav className="flex-1 overflow-y-auto px-3 py-4 touch-scroll">
      {navegacion.map((seccion) => (
        <div key={seccion.titulo} className="mb-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {seccion.titulo}
          </p>
          <ul className="space-y-1">
            {seccion.items.map((item) => {
              const Icono = item.icono
              const activo =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
              const esPresupuestos = item.href === "/presupuestos"

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (onCerrarMobile) onCerrarMobile()
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      activo
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 truncate">
                      <Icono
                        className={cn(
                          "h-4 w-4 shrink-0",
                          activo ? "text-indigo-600" : "text-slate-400"
                        )}
                      />
                      <span className="truncate">{item.nombre}</span>
                    </div>

                    {esPresupuestos && conteoPendientesPresupuesto > 0 && (
                      <span
                        title={`${conteoPendientesPresupuesto} mediciones pendientes de cotizar`}
                        className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-black text-white shadow-2xs shrink-0"
                      >
                        {conteoPendientesPresupuesto}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* ── SIDEBAR DESKTOP (Fijo en pantallas lg o superiores) ── */}
      <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-slate-200 bg-white shrink-0">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">ERP RR</p>
            <p className="text-[11px] text-slate-500">Romina Ribot</p>
          </div>
        </div>

        {/* Navegación */}
        {renderNav()}

        {/* Footer */}
        <div className="border-t border-slate-200 p-3">
          <p className="px-3 text-xs text-slate-400">v1.0.0 • Mobile-Ready</p>
        </div>
      </aside>

      {/* ── SIDEBAR MOBILE / TABLET (Drawer deslizable con backdrop) ── */}
      {mobileAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop con desenfoque suave */}
          <div
            onClick={onCerrarMobile}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            aria-hidden="true"
          />

          {/* Panel deslizante lateral */}
          <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out animate-in slide-in-from-left">
            {/* Cabecera del Drawer con botón Cerrar */}
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">ERP RR</p>
                  <p className="text-[11px] text-slate-500">Romina Ribot</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCerrarMobile}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navegación */}
            {renderNav()}

            {/* Footer */}
            <div className="border-t border-slate-200 p-4">
              <p className="text-xs text-slate-400">ERP RR — Confección &amp; Colocación</p>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
