import { Sidebar } from "@/components/shared/layout/Sidebar"
import { Header } from "@/components/shared/layout/Header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden print:h-auto print:overflow-visible">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  )
}
