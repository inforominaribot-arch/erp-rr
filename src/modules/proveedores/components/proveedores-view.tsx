// Módulo: Proveedores & Compras
// Componente de Vista Principal con pestañas de Directorio y Órdenes de Compra

"use client"

import { useState } from "react"
import {
  Truck,
  ShoppingCart,
  Plus,
  Sparkles,
  Building2,
  Boxes,
} from "lucide-react"
import type {
  IProveedor,
  IOrdenCompra,
  IMetricasProveedoresYCompras,
  ISugerenciaReposicionItem,
  IReposicionPorProveedor,
} from "../types"
import { ProveedoresKPIs } from "./proveedores-kpis"
import { ProveedorTabla } from "./proveedor-tabla"
import { OrdenesCompraTabla } from "./ordenes-compra-tabla"
import { ProveedorModal } from "./proveedor-modal"
import { OrdenCompraFormModal } from "./orden-compra-form-modal"
import { OrdenCompraReposicionModal } from "./orden-compra-reposicion-modal"
import { OrdenCompraRecepcionModal } from "./orden-compra-recepcion-modal"

interface ProveedoresViewProps {
  proveedores: IProveedor[]
  ordenesCompra: IOrdenCompra[]
  metricas: IMetricasProveedoresYCompras
  sugerencias: ISugerenciaReposicionItem[]
  sugerenciasPorProveedor: IReposicionPorProveedor[]
  catalogoProductos: Array<{
    id: string
    codigo: string | null
    nombre: string
    unidadMedida: string
    stockActual: number
    stockMinimo: number
    precio: number | null
  }>
  puedeVerCostos: boolean
  puedeAdministrar: boolean
  puedeEmitirOrden: boolean
  puedeRecibir: boolean
}

export function ProveedoresView({
  proveedores,
  ordenesCompra,
  metricas,
  sugerencias,
  sugerenciasPorProveedor,
  catalogoProductos,
  puedeVerCostos,
  puedeAdministrar,
  puedeEmitirOrden,
  puedeRecibir,
}: ProveedoresViewProps) {
  const [tabActiva, setTabActiva] = useState<"DIRECTORIO" | "ORDENES">("DIRECTORIO")

  // Modales
  const [modalProveedorAbierto, setModalProveedorAbierto] = useState(false)
  const [proveedorAEditar, setProveedorAEditar] = useState<IProveedor | null>(null)

  const [modalNuevaOrdenAbierto, setModalNuevaOrdenAbierto] = useState(false)
  const [proveedorOrdenPreseleccionado, setProveedorOrdenPreseleccionado] = useState<
    string | undefined
  >(undefined)

  const [modalReposicionAbierto, setModalReposicionAbierto] = useState(false)

  const [modalRecepcionAbierto, setModalRecepcionAbierto] = useState(false)
  const [ordenARecibir, setOrdenARecibir] = useState<IOrdenCompra | null>(null)

  // Abrir modal de alta de proveedor
  const handleNuevoProveedor = () => {
    setProveedorAEditar(null)
    setModalProveedorAbierto(true)
  }

  // Abrir modal de edición de proveedor
  const handleEditarProveedor = (p: IProveedor) => {
    setProveedorAEditar(p)
    setModalProveedorAbierto(true)
  }

  // Abrir modal de orden para un proveedor en particular
  const handleCrearOrdenProveedor = (pId: string) => {
    setProveedorOrdenPreseleccionado(pId)
    setModalNuevaOrdenAbierto(true)
  }

  // Abrir recepción de mercadería
  const handleAbrirRecepcion = (oc: IOrdenCompra) => {
    setOrdenARecibir(oc)
    setModalRecepcionAbierto(true)
  }

  return (
    <div className="space-y-6">
      {/* ── CABECERA PRINCIPAL ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Proveedores & Compras
            </h1>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              Módulo de Compras
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de directorio de fábricas, catálogo de insumos y órdenes de reposición
          </p>
        </div>

        {/* Botones de acción principales */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Reposición Sugerida */}
          {puedeEmitirOrden && (
            <button
              type="button"
              onClick={() => setModalReposicionAbierto(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-100 hover:border-rose-300 transition"
              title="Detectar insumos bajo stock mínimo y pedidos de comandas"
            >
              <Sparkles className="h-4 w-4 text-rose-600" />
              <span>Reposición Sugerida</span>
              {metricas.insumosCriticosParaReponer > 0 && (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] text-white">
                  {metricas.insumosCriticosParaReponer}
                </span>
              )}
            </button>
          )}

          {/* Botón Nueva Orden */}
          {puedeEmitirOrden && (
            <button
              type="button"
              onClick={() => {
                setProveedorOrdenPreseleccionado(undefined)
                setModalNuevaOrdenAbierto(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <ShoppingCart className="h-4 w-4 text-indigo-600" />
              <span>Nueva Orden</span>
            </button>
          )}

          {/* Botón Nuevo Proveedor */}
          {puedeAdministrar && (
            <button
              type="button"
              onClick={handleNuevoProveedor}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Proveedor</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs SUPERIORES ── */}
      <ProveedoresKPIs
        metricas={metricas}
        puedeVerCostos={puedeVerCostos}
        onAbrirReposicionSugerida={
          puedeEmitirOrden ? () => setModalReposicionAbierto(true) : undefined
        }
      />

      {/* ── CONMUTADOR DE PESTAÑAS ── */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setTabActiva("DIRECTORIO")}
            className={`flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition ${
              tabActiva === "DIRECTORIO"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Directorio de Proveedores</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
              {proveedores.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva("ORDENES")}
            className={`flex items-center gap-2 border-b-2 py-3 text-xs font-bold transition ${
              tabActiva === "ORDENES"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Órdenes de Compra</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
              {ordenesCompra.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── CONTENIDO DE LA PESTAÑA ACTIVA ── */}
      {tabActiva === "DIRECTORIO" ? (
        <ProveedorTabla
          proveedores={proveedores}
          puedeAdministrar={puedeAdministrar}
          onEditarProveedor={handleEditarProveedor}
          onCrearOrdenProveedor={handleCrearOrdenProveedor}
        />
      ) : (
        <OrdenesCompraTabla
          ordenes={ordenesCompra}
          puedeVerCostos={puedeVerCostos}
          puedeAdministrar={puedeAdministrar}
          onAbrirRecepcion={handleAbrirRecepcion}
          onNuevaOrden={() => {
            setProveedorOrdenPreseleccionado(undefined)
            setModalNuevaOrdenAbierto(true)
          }}
        />
      )}

      {/* ── MODALES DEL MÓDULO ── */}
      {/* 1. Modal Alta / Edición Proveedor */}
      <ProveedorModal
        abierto={modalProveedorAbierto}
        proveedorAEditar={proveedorAEditar}
        onCerrar={() => {
          setModalProveedorAbierto(false)
          setProveedorAEditar(null)
        }}
      />

      {/* 2. Modal Emisión de Orden de Compra */}
      <OrdenCompraFormModal
        abierto={modalNuevaOrdenAbierto}
        proveedores={proveedores}
        proveedorPreseleccionadoId={proveedorOrdenPreseleccionado}
        productosDisponibles={catalogoProductos}
        puedeVerCostos={puedeVerCostos}
        onCerrar={() => setModalNuevaOrdenAbierto(false)}
      />

      {/* 3. Modal Reposición Sugerida */}
      <OrdenCompraReposicionModal
        abierto={modalReposicionAbierto}
        sugerencias={sugerencias}
        porProveedor={sugerenciasPorProveedor}
        proveedores={proveedores}
        puedeVerCostos={puedeVerCostos}
        onCerrar={() => setModalReposicionAbierto(false)}
      />

      {/* 4. Modal Recepción de Mercadería */}
      {ordenARecibir && (
        <OrdenCompraRecepcionModal
          abierto={modalRecepcionAbierto}
          ordenCompra={ordenARecibir}
          puedeVerCostos={puedeVerCostos}
          onCerrar={() => {
            setModalRecepcionAbierto(false)
            setOrdenARecibir(null)
          }}
        />
      )}
    </div>
  )
}
