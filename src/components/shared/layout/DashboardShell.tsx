"use client"

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileMenuAbierto, setMobileMenuAbierto] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar Desktop y Mobile Drawer */}
      <div className="print:hidden">
        <Sidebar
          mobileAbierto={mobileMenuAbierto}
          onCerrarMobile={() => setMobileMenuAbierto(false)}
        />
      </div>

      {/* Contenido Principal */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 print:h-auto print:overflow-visible">
        <div className="print:hidden">
          <Header onAbrirMobileMenu={() => setMobileMenuAbierto(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 print:p-0 print:overflow-visible touch-scroll">
          {children}
        </main>
      </div>
    </div>
  )
}
