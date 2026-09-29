"use client"

import { Bell, Search, LogOut, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface HeaderProps {
  titulo?: string
}

export function Header({ titulo }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Buscador */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700">
          <Bell className="h-4 w-4" />
          {/* Badge de notificaciones */}
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Usuario */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
            <User className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900">Administrador</p>
            <p className="text-xs text-slate-500">Admin General</p>
          </div>
          <button
            onClick={cerrarSesion}
            title="Cerrar sesión"
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
