// Módulo: Stock & Inventario
// Vista Principal con Conmutador de Vista Catálogo Visual / Tabla

"use client"

import { useState } from "react"
import {
  Package,
  Layers,
  Plus,
  FileText,
  ArrowUpDown,
  FileSpreadsheet,
  Search,
  Filter,
  LayoutGrid,
  List,
  AlertTriangle,
  History,
} from "lucide-react"
import type { IProducto, IMovimientoStock, IMetricasStock } from "../types"
import { StockKPIs } from "./stock-kpis"
import { StockCatalogoGrid } from "./stock-catalogo-grid"
import { StockTabla } from "./stock-tabla"
import { ProductoModal } from "./producto-modal"
import { RemitoIngresoModal } from "./remito-ingreso-modal"
import { MovimientoManualModal } from "./movimiento-manual-modal"
import { MovimientosHistorialTabla } from "./movimientos-historial-tabla"
import { StockImportarCSV } from "./stock-importar-csv"

interface StockViewProps {
  productosIniciales: IProducto[]
  movimientosIniciales: IMovimientoStock[]
  metricas: IMetricasStock
  proveedores: Array<{ id: string; nombre: string }>
  puedeAdministrar: boolean
  puedeVerCostos: boolean
  puedeRegistrarRemito: boolean
}

type TabPrincipal = "catalogo" | "movimientos" | "importar"
type VistaCatalogoModo = "grid" | "tabla"

export function StockView({
  productosIniciales,
  movimientosIniciales,
  metricas,
  proveedores,
  puedeAdministrar,
  puedeVerCostos,
  puedeRegistrarRemito,
}: StockViewProps) {
  // Pestaña principal
  const [tabActiva, setTabActiva] = useState<TabPrincipal>("catalogo")

  // Conmutador de vista de catálogo: Grid (como la foto del manual) vs Tabla compacta
  const [vistaModo, setVistaModo] = useState<VistaCatalogoModo>("grid")

  // Filtros de catálogo
  const [busqueda, setBusqueda] = useState("")
  const [filtroUnidad, setFiltroUnidad] = useState("TODAS")
  const [soloCriticos, setSoloCriticos] = useState(false)

  // Estado de modales
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false)
  const [productoAEditar, setProductoAEditar] = useState<IProducto | null>(null)

  const [modalRemitoAbierto, setModalRemitoAbierto] = useState(false)

  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false)
  const [productoAAjustar, setProductoAAjustar] = useState<IProducto | null>(null)

  // Filtrado de productos en memoria para interactividad instantánea
  const productosFiltrados = productosIniciales.filter((prod) => {
    if (soloCriticos) {
      if (prod.estadoStock !== "CRITICO" && prod.estadoStock !== "AGOTADO") {
        return false
      }
    }

    if (filtroUnidad !== "TODAS" && prod.unidadMedida !== filtroUnidad) {
      return false
    }

    if (busqueda.trim() !== "") {
      const q = busqueda.toLowerCase().trim()
      const enNombre = prod.nombre.toLowerCase().includes(q)
      const enCodigo = prod.codigo?.toLowerCase().includes(q) || false
      const enDesc = prod.descripcion?.toLowerCase().includes(q) || false
      return enNombre || enCodigo || enDesc
    }

    return true
  })

  const abrirCrearProducto = () => {
    setProductoAEditar(null)
    setModalProductoAbierto(true)
  }

  const abrirEditarProducto = (prod: IProducto) => {
    setProductoAEditar(prod)
    setModalProductoAbierto(true)
  }

  const abrirAjustarProducto = (prod?: IProducto) => {
    setProductoAAjustar(prod || null)
    setModalAjusteAbierto(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Stock & Inventario de Taller
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Control de insumos, telas, caños, rieles, recepción de remitos y alertas de compra
          </p>
        </div>

        {/* Acciones Principales */}
        <div className="flex flex-wrap items-center gap-2">
          {puedeRegistrarRemito && (
            <button
              type="button"
              onClick={() => setModalRemitoAbierto(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
            >
              <FileText className="h-4 w-4" />
              Recepción de Remito
            </button>
          )}

          {puedeAdministrar && (
            <>
              <button
                type="button"
                onClick={() => abrirAjustarProducto()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                Ajuste Rápido
              </button>

              <button
                type="button"
                onClick={abrirCrearProducto}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5 text-indigo-600" />
                Nuevo Insumo
              </button>

              <button
                type="button"
                onClick={() => setTabActiva("importar")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Importar CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPIs de Estado General */}
      <StockKPIs
        metricas={metricas}
        soloCriticosActivo={soloCriticos}
        onToggleCriticos={() => setSoloCriticos((prev) => !prev)}
      />

      {/* Pestañas de Navegación del Módulo */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTabActiva("catalogo")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            tabActiva === "catalogo"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="h-4 w-4" />
          Catálogo e Insumos ({productosIniciales.length})
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("movimientos")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            tabActiva === "movimientos"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" />
          Historial y Auditoría ({movimientosIniciales.length})
        </button>

        {puedeAdministrar && (
          <button
            type="button"
            onClick={() => setTabActiva("importar")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              tabActiva === "importar"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Migración / Importar Excel
          </button>
        )}
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA */}
      {tabActiva === "catalogo" && (
        <div className="space-y-4">
          {/* Barra de Filtros y Conmutador de Vista */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar caño, tela, riel, motor, código..."
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filtros de Unidad y Alerta */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filtroUnidad}
                onChange={(e) => setFiltroUnidad(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="TODAS">Todas las unidades</option>
                <option value="metro">Metros (m)</option>
                <option value="unidad">Unidades (u)</option>
                <option value="metro2">Metros cuadrados (m²)</option>
                <option value="kg">Kilogramos (kg)</option>
              </select>

              <button
                type="button"
                onClick={() => setSoloCriticos((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  soloCriticos
                    ? "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <AlertTriangle className={`h-3.5 w-3.5 ${soloCriticos ? "text-red-600" : "text-amber-500"}`} />
                {soloCriticos ? "Solo Críticos Activo" : "Solo Críticos"}
              </button>

              {/* Selector Conmutador: Catálogo Visual 🖼️ vs Tabla 📋 */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setVistaModo("grid")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    vistaModo === "grid"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Vista Catálogo Visual con fotos (tipo manual de repuestos)"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Catálogo Visual
                </button>
                <button
                  type="button"
                  onClick={() => setVistaModo("tabla")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    vistaModo === "tabla"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Vista Tabla compacta administrativa"
                >
                  <List className="h-3.5 w-3.5" />
                  Tabla
                </button>
              </div>
            </div>
          </div>

          {/* Renderizado de la Vista Seleccionada */}
          {vistaModo === "grid" ? (
            <StockCatalogoGrid
              productos={productosFiltrados}
              puedeAdministrar={puedeAdministrar}
              puedeVerCostos={puedeVerCostos}
              onEditarProducto={abrirEditarProducto}
              onAjustarStock={abrirAjustarProducto}
            />
          ) : (
            <StockTabla
              productos={productosFiltrados}
              puedeAdministrar={puedeAdministrar}
              puedeVerCostos={puedeVerCostos}
              onEditarProducto={abrirEditarProducto}
              onAjustarStock={abrirAjustarProducto}
            />
          )}
        </div>
      )}

      {tabActiva === "movimientos" && (
        <MovimientosHistorialTabla movimientos={movimientosIniciales} />
      )}

      {tabActiva === "importar" && (
        <StockImportarCSV
          onCerrar={() => setTabActiva("catalogo")}
          onCompletado={() => setTabActiva("catalogo")}
        />
      )}

      {/* MODALES */}
      {modalProductoAbierto && (
        <ProductoModal
          producto={productoAEditar}
          abierto={modalProductoAbierto}
          puedeVerCostos={puedeVerCostos}
          onCerrar={() => {
            setModalProductoAbierto(false)
            setProductoAEditar(null)
          }}
        />
      )}

      {modalRemitoAbierto && (
        <RemitoIngresoModal
          abierto={modalRemitoAbierto}
          productos={productosIniciales}
          proveedores={proveedores}
          puedeVerCostos={puedeVerCostos}
          onCerrar={() => setModalRemitoAbierto(false)}
        />
      )}

      {modalAjusteAbierto && (
        <MovimientoManualModal
          productoInicial={productoAAjustar}
          productos={productosIniciales}
          abierto={modalAjusteAbierto}
          onCerrar={() => {
            setModalAjusteAbierto(false)
            setProductoAAjustar(null)
          }}
        />
      )}
    </div>
  )
}
