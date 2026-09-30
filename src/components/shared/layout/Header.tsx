"use client"

import { Bell, Search, LogOut, User, Menu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface HeaderProps {
  titulo?: string
  onAbrirMobileMenu?: () => void
}

export function Header({ titulo, onAbrirMobileMenu }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 gap-2">
      {/* Botón menú lateral para celulares/tablets + Buscador */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-md">
        {/* Botón hamburguesa móvil */}
        <button
          type="button"
          onClick={onAbrirMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:hidden shrink-0 active:scale-95 transition-transform"
          title="Abrir menú"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Buscador responsivo */}
        <div className="relative w-full max-w-[200px] sm:max-w-xs md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Acciones del usuario */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notificaciones */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-transform"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {/* Badge de notificaciones */}
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Usuario y Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 shrink-0 font-bold text-xs">
            RR
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">Admin</p>
            <p className="text-[10px] text-slate-500">General</p>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            title="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
