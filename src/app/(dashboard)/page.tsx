// Página Principal: Dashboard Operativo del ERP
// Conexión 100% en vivo a la BD con Prisma y adaptación por roles

import { Metadata } from "next"
import { Users, ClipboardList, Package, Calendar, FileText, ArrowRight, CalendarCheck } from "lucide-react"
import Link from "next/link"
import { tienePermisoModuloMetricas } from "@/modules/metricas/lib/auth"
import { obtenerDashboardOperativo } from "@/modules/metricas/queries"
import { DashboardKpiCard } from "@/modules/metricas/components/dashboard-kpi-card"
import { DashboardVisitasHoy } from "@/modules/metricas/components/dashboard-visitas-hoy"
import { DashboardInstalacionesProximas } from "@/modules/metricas/components/dashboard-instalaciones-proximas"
import { DashboardPresupuestosPendientes } from "@/modules/metricas/components/dashboard-presupuestos-pendientes"
import { DashboardStockAlerta } from "@/modules/metricas/components/dashboard-stock-alerta"
import { DashboardFeedActividad } from "@/modules/metricas/components/dashboard-feed-actividad"
import { DashboardTallerView } from "@/modules/metricas/components/dashboard-taller-view"
import { DashboardInstaladorView } from "@/modules/metricas/components/dashboard-instalador-view"

export const metadata: Metadata = {
  title: "Dashboard | ERP RR — ROMINA RIBOT",
  description: "Tablero operativo principal del ERP ROMINA RIBOT Cortinados",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const auth = await tienePermisoModuloMetricas()
  const data = await obtenerDashboardOperativo(
    auth.usuarioId,
    auth.rol,
    auth.nombreUsuario
  )

  const ahora = new Date()
  const fechaFormateada = ahora.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Vista adaptada para rol TALLER
  if (auth.rol === "TALLER") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
              {data.saludo}, {auth.nombreUsuario} 👋
            </h1>
            <p className="text-sm capitalize text-slate-500">
              {fechaFormateada} • Taller de Confección
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/produccion"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              Tablero de Producción
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <DashboardTallerView data={data} />
      </div>
    )
  }

  // Vista adaptada para rol INSTALACION
  if (auth.rol === "INSTALACION") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
              {data.saludo}, {auth.nombreUsuario} 👋
            </h1>
            <p className="text-sm capitalize text-slate-500">
              {fechaFormateada} • Equipo de Colocaciones
            </p>
          </div>
        </div>

        <DashboardInstaladorView data={data} />
      </div>
    )
  }

  // Vista completa para ADMIN_GENERAL y ADMINISTRACION
  return (
    <div className="space-y-6">
      {/* Encabezado de bienvenida con saludo personalizado */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
            {data.saludo}, {auth.nombreUsuario} 👋
          </h1>
          <p className="mt-0.5 text-sm capitalize text-slate-500">
            {fechaFormateada} • Panel general de gestión
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/metricas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            Ver Métricas Analíticas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Tarjetas de KPIs principales en vivo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Visitas de obra para hoy / semana */}
        <DashboardKpiCard
          titulo="Visitas de obra"
          valor={data.kpis.visitasSemana?.totalHoy ?? 0}
          descripcion={`${data.kpis.visitasSemana?.totalSemana ?? 0} agendadas esta semana`}
          icono={CalendarCheck}
          color="text-indigo-600"
          fondo="bg-indigo-50"
          href="/visitas"
        />

        {/* 2. Clientes nuevos este mes */}
        <DashboardKpiCard
          titulo="Clientes nuevos"
          valor={data.kpis.clientesNuevos.total}
          descripcion="Incorporados este mes"
          icono={Users}
          color="text-blue-600"
          fondo="bg-blue-50"
          comparativa={{
            porcentaje: data.kpis.clientesNuevos.variacionMesAnterior,
            esPositivo: data.kpis.clientesNuevos.aumento,
            texto: "vs mes anterior",
          }}
          href="/clientes"
        />

        {/* 3. Comandas activas */}
        <DashboardKpiCard
          titulo="Comandas activas"
          valor={data.kpis.comandasActivas.total}
          descripcion={`${data.kpis.comandasActivas.enTaller} en taller, ${data.kpis.comandasActivas.esperandoProveedor} en fábrica`}
          icono={ClipboardList}
          color="text-amber-600"
          fondo="bg-amber-50"
          href="/comandas"
        />

        {/* 4. Presupuestos pendientes de respuesta */}
        <DashboardKpiCard
          titulo="Presupuestos pendientes"
          valor={data.kpis.presupuestosPendientes.total}
          descripcion="Cotizaciones sin cerrar"
          montoSecundario={`$ ${(data.kpis.presupuestosPendientes.montoTotal / 1000).toFixed(0)}k`}
          icono={FileText}
          color="text-sky-600"
          fondo="bg-sky-50"
          href="/presupuestos"
        />

        {/* 5. Próximas instalaciones de la semana */}
        <DashboardKpiCard
          titulo="Instalaciones"
          valor={data.kpis.instalacionesSemana.total}
          descripcion={`${data.kpis.instalacionesSemana.listasParaInstalar} con materiales listos`}
          icono={Calendar}
          color="text-emerald-600"
          fondo="bg-emerald-50"
          href="/instalaciones"
        />

        {/* 6. Alerta de stock crítico */}
        <DashboardKpiCard
          titulo="Stock bajo mínimo"
          valor={data.kpis.stockCritico.total}
          descripcion={
            data.kpis.stockCritico.total > 0
              ? "Insumos requieren reposición"
              : "Catálogo en niveles óptimos"
          }
          icono={Package}
          color="text-red-600"
          fondo="bg-red-50"
          alerta={data.kpis.stockCritico.total > 0}
          href="/stock"
        />
      </div>

      {/* Paneles operativos con accesos rápidos (Grilla 2 columnas) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Visitas de medición para hoy */}
        <DashboardVisitasHoy visitas={data.visitasHoy} />

        {/* Próximas 5 instalaciones con estado de materiales */}
        <DashboardInstalacionesProximas
          instalaciones={data.proximasInstalaciones}
        />

        {/* Últimos presupuestos enviados para dar seguimiento por WhatsApp */}
        <DashboardPresupuestosPendientes
          presupuestos={data.presupuestosPendientes}
        />

        {/* Mosaico de productos con stock en alerta */}
        <DashboardStockAlerta productos={data.stockAlerta} />

        {/* Feed de actividad reciente del sistema */}
        <DashboardFeedActividad actividades={data.actividadReciente} />
      </div>
    </div>
  )
}
