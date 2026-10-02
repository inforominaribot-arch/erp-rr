// Módulo: Dashboard & Métricas
// Definición de tipos TypeScript

import type { Rol } from "@/types"

// ─── Tipos de Período ─────────────────────────────────────────────────────────

export type PeriodoMetricas =
  | "30d"
  | "mes"
  | "mes_anterior"
  | "trimestre"
  | "anio"
  | "historico"

export interface IOpcionPeriodo {
  id: PeriodoMetricas
  label: string
  descripcion: string
}

export const OPCIONES_PERIODO: IOpcionPeriodo[] = [
  { id: "30d", label: "Últimos 30 días", descripcion: "Últimos 30 días corridos" },
  { id: "mes", label: "Este Mes", descripcion: "Mes calendario actual" },
  { id: "mes_anterior", label: "Mes Anterior", descripcion: "Mes calendario anterior" },
  { id: "trimestre", label: "Último Trimestre", descripcion: "Últimos 90 días" },
  { id: "anio", label: "Año Actual", descripcion: "Año en curso" },
  { id: "historico", label: "Histórico Total", descripcion: "Todos los registros" },
]

// ─── KPIs del Dashboard Principal (Home /) ────────────────────────────────────

export interface IKpiItem {
  titulo: string
  valor: string | number
  descripcion: string
  comparativa?: {
    porcentaje: number
    esPositivo: boolean
    texto: string
  }
  montoSecundario?: string
  icono: string // Nombre del icono para resolución visual
  color: string
  fondo: string
  alerta?: boolean
  href?: string
}

export interface IInstalacionProximaDashboard {
  id: string
  comandaId: string
  comandaNumero: number
  clienteNombre: string
  clienteTelefono: string | null
  direccion: string | null
  localidad: string | null
  fecha: Date
  horaInicio: string | null
  horaFin: string | null
  materialesListos: boolean
  totalItems: number
  instaladores: string[]
}

export interface IPresupuestoPendienteDashboard {
  id: string
  numero: number
  clienteNombre: string
  clienteTelefono: string | null
  total: number
  fechaEnvio: Date
  diasDesdeEnvio: number
  cantItems: number
}

export interface IStockAlertaDashboard {
  id: string
  codigo: string | null
  nombre: string
  stockActual: number
  stockMinimo: number
  unidadMedida: string
  imagen: string | null
  estadoCritico: "CRITICO" | "AGOTADO" | "BAJO"
}

export type TipoActividadReciente =
  | "CLIENTE_NUEVO"
  | "PRESUPUESTO_ENVIADO"
  | "PRESUPUESTO_ACEPTADO"
  | "COMANDA_CREADA"
  | "COMANDA_COMPLETADA"
  | "INSTALACION_AGENDADA"
  | "INSTALACION_COMPLETADA"
  | "STOCK_REMITO"

export interface IActividadRecienteDashboard {
  id: string
  tipo: TipoActividadReciente
  titulo: string
  descripcion: string
  fecha: Date
  tiempoRelativo: string
  usuario?: string
  monto?: number
  href?: string
  estado?: string
}

export interface IDashboardOperativoData {
  usuario: {
    nombre: string
    rol: Rol
  }
  saludo: string
  kpis: {
    clientesNuevos: {
      total: number
      variacionMesAnterior: number
      aumento: boolean
    }
    comandasActivas: {
      total: number
      enTaller: number
      esperandoProveedor: number
      pendientes: number
    }
    presupuestosPendientes: {
      total: number
      montoTotal: number
    }
    instalacionesSemana: {
      total: number
      listasParaInstalar: number
    }
    stockCritico: {
      total: number
    }
    visitasSemana?: {
      totalHoy: number
      totalSemana: number
    }
  }
  proximasInstalaciones: IInstalacionProximaDashboard[]
  presupuestosPendientes: IPresupuestoPendienteDashboard[]
  stockAlerta: IStockAlertaDashboard[]
  actividadReciente: IActividadRecienteDashboard[]
  visitasHoy?: Array<{
    id: string
    clienteId: string
    clienteNombre: string
    clienteTelefono: string | null
    horaInicio: string
    horaFin: string
    direccion: string
    localidad: string | null
    tipoVisita: string
    estado: string
    notas: string | null
  }>
  // Datos específicos si el rol es Taller o Instalación
  tallerData?: {
    comandasHoy: Array<{
      id: string
      numero: number
      cliente: string
      fechaEntrega: Date | null
      items: Array<{
        id: string
        descripcion: string
        ancho: number
        alto: number
        completado: boolean
        tipo: "FABRICAR" | "PEDIR_PROVEEDOR"
      }>
      porcentajeAvance: number
    }>
    materialesManana: Array<{
      instalacionId: string
      comandaNumero: number
      cliente: string
      horaInicio: string | null
      materialesListos: boolean
    }>
  }
  instalacionData?: {
    itinerarioHoy: Array<{
      id: string
      comandaNumero: number
      cliente: string
      telefono: string | null
      direccion: string | null
      horaInicio: string | null
      horaFin: string | null
      materialesListos: boolean
      estado: string
    }>
    itinerarioSemana: Array<{
      id: string
      fecha: Date
      comandaNumero: number
      cliente: string
      horaInicio: string | null
      materialesListos: boolean
      estado: string
    }>
  }
}

// ─── KPIs y Series de Datos para Recharts (/metricas) ─────────────────────────

export interface IMetricasKpis {
  facturacionTotal: number
  ticketPromedio: number
  presupuestosAceptados: number
  presupuestosTotales: number
  tasaConversion: number
  cortinasFabricadasTaller: number
  cortinasPedidasProveedor: number
  ratioTallerProveedor: number // % fabricado en taller
  instalacionesCompletadas: number
  instalacionesTotales: number
  tasaCumplimientoInstalaciones: number
  clientesNuevosPeriodo: number
}

export interface ISerieVentaTemporal {
  periodo: string // Ej: "Ene 2026", "Sem 12", etc.
  monto: number
  montoFormateado: string
  cantidadPresupuestos: number
}

export interface ISerieDistribucionConfeccion {
  nombre: string
  cantidad: number
  porcentaje: number
  color: string
}

export interface ISerieTopProducto {
  nombre: string
  cantidad: number
  unidadMedida: string
  tipo: "TELA" | "MECANISMO" | "ACCESORIO" | "OTRO"
}

export interface ISerieCaptacionClientes {
  mes: string
  clientes: number
}

export interface ISerieInstalacionesRendimiento {
  periodo: string
  programadas: number
  completadas: number
  canceladas: number
}

export interface IMetricasAvanzadasData {
  periodoSeleccionado: PeriodoMetricas
  fechaDesde: Date
  fechaHasta: Date
  kpis: IMetricasKpis
  evolucionVentas: ISerieVentaTemporal[]
  distribucionConfeccion: ISerieDistribucionConfeccion[]
  topProductos: ISerieTopProducto[]
  captacionClientes: ISerieCaptacionClientes[]
  rendimientoInstalaciones: ISerieInstalacionesRendimiento[]
  esRolFinanciero: boolean
}
