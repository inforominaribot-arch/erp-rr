"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">ERP RR</p>
          <p className="text-xs text-slate-500">Sistema de gestión</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navegacion.map((seccion) => (
          <div key={seccion.titulo} className="mb-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {seccion.titulo}
            </p>
            <ul className="space-y-1">
              {seccion.items.map((item) => {
                const Icono = item.icono
                const activo = pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        activo
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icono
                        className={cn(
                          "h-4 w-4",
                          activo ? "text-indigo-600" : "text-slate-400"
                        )}
                      />
                      {item.nombre}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="border-t border-slate-200 p-3">
        <p className="px-3 text-xs text-slate-400">v1.0.0</p>
      </div>
    </aside>
  )
}
