// Módulo: Proveedores & Compras
// Vista de Detalle y Ficha Completa del Proveedor

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  Star,
  Barcode,
  BadgeDollarSign,
  MessageCircle,
  Boxes,
  Printer,
  ExternalLink,
} from "lucide-react"
import type {
  IProveedor,
  IProductoProveedor,
  IOrdenCompra,
} from "../types"
import { ProveedorEstadoBadge } from "./proveedor-estado-badge"
import { OrdenCompraEstadoBadge } from "./orden-compra-estado-badge"
import { OrdenCompraWhatsAppButton } from "./orden-compra-whatsapp-button"
import { ProveedorModal } from "./proveedor-modal"
import { ProveedorCatalogoModal } from "./proveedor-catalogo-modal"
import { OrdenCompraFormModal } from "./orden-compra-form-modal"
import { OrdenCompraRecepcionModal } from "./orden-compra-recepcion-modal"
import { desvincularProductoProveedor } from "../actions"

interface ProveedorDetalleViewProps {
  proveedor: IProveedor
  productosProvistos: IProductoProveedor[]
  ordenesCompra: IOrdenCompra[]
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

export function ProveedorDetalleView({
  proveedor,
  productosProvistos,
  ordenesCompra,
  catalogoProductos,
  puedeVerCostos,
  puedeAdministrar,
  puedeEmitirOrden,
  puedeRecibir,
}: ProveedorDetalleViewProps) {
  const router = useRouter()

  // Modales
  const [modalEditarProveedor, setModalEditarProveedor] = useState(false)
  const [modalCatalogo, setModalCatalogo] = useState(false)
  const [itemCatalogoAEditar, setItemCatalogoAEditar] = useState<IProductoProveedor | null>(null)

  const [modalNuevaOrden, setModalNuevaOrden] = useState(false)
  const [modalRecepcion, setModalRecepcion] = useState(false)
  const [ordenARecibir, setOrdenARecibir] = useState<IOrdenCompra | null>(null)

  const telLimpio = (proveedor.telefono || "").replace(/\D/g, "")

  const handleDesvincular = async (id: string, nombreProducto: string) => {
    if (
      !confirm(
        `¿Estás seguro de desvincular "${nombreProducto}" del catálogo provisto por este fabricante?`
      )
    ) {
      return
    }

    try {
      await desvincularProductoProveedor(id)
      router.refresh()
    } catch (err) {
      console.error("Error al desvincular insumo:", err)
      alert("No se pudo desvincular el insumo.")
    }
  }

  return (
    <div className="space-y-6">
      {/* ── BOTÓN VOLVER ── */}
      <div>
        <Link
          href="/proveedores"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Directorio de Proveedores</span>
        </Link>
      </div>

      {/* ── TARJETA PRINCIPAL DEL PROVEEDOR ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {proveedor.nombre}
                </h1>
                <ProveedorEstadoBadge activo={proveedor.activo} />
              </div>

              {proveedor.contacto && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Contacto:{" "}
                  <strong className="text-slate-700">{proveedor.contacto}</strong>
                </p>
              )}

              {/* Datos de contacto */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                {proveedor.telefono && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <a
                      href={`tel:${proveedor.telefono}`}
                      className="font-medium hover:text-indigo-600 transition"
                    >
                      {proveedor.telefono}
                    </a>
                    {telLimpio && (
                      <a
                        href={`https://wa.me/${telLimpio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                      >
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}

                {proveedor.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <a
                      href={`mailto:${proveedor.email}`}
                      className="font-medium hover:text-indigo-600 transition"
                    >
                      {proveedor.email}
                    </a>
                  </div>
                )}

                {proveedor.direccion && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{proveedor.direccion}</span>
                  </div>
                )}
              </div>

              {proveedor.notas && (
                <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100 max-w-2xl">
                  <strong className="text-slate-700">Condiciones comerciales / Notas:</strong>{" "}
                  {proveedor.notas}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción del proveedor */}
          <div className="flex items-center gap-2">
            {puedeEmitirOrden && proveedor.activo && (
              <button
                type="button"
                onClick={() => setModalNuevaOrden(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Emitir Orden de Compra</span>
              </button>
            )}

            {puedeAdministrar && (
              <button
                type="button"
                onClick={() => setModalEditarProveedor(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Editar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 1: CATÁLOGO DE INSUMOS PROVISTOS ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Catálogo de Insumos Provistos
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {productosProvistos.length} artículos
            </span>
          </div>

          {puedeAdministrar && (
            <button
              type="button"
              onClick={() => {
                setItemCatalogoAEditar(null)
                setModalCatalogo(true)
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Vincular Insumo</span>
            </button>
          )}
        </div>

        {productosProvistos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">
              No hay insumos vinculados a este proveedor
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Asociá las telas, caños o accesorios que esta fábrica te abastece para agilizar tus compras.
            </p>
            {puedeAdministrar && (
              <button
                type="button"
                onClick={() => {
                  setItemCatalogoAEditar(null)
                  setModalCatalogo(true)
                }}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                <Plus className="h-3 w-3" />
                Vincular Primer Insumo
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5">Insumo / Producto</th>
                  <th className="px-4 py-2.5">Cód. Fábrica</th>
                  <th className="px-4 py-2.5">Stock Taller</th>
                  {puedeVerCostos && (
                    <th className="px-4 py-2.5 text-right">Último Costo Pactado</th>
                  )}
                  <th className="px-4 py-2.5 text-center">Proveedor Principal</th>
                  {puedeAdministrar && (
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {productosProvistos.map((pp) => (
                  <tr key={pp.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {pp.producto?.imagen && (
                          <img
                            src={pp.producto.imagen}
                            alt=""
                            className="h-7 w-7 rounded-lg object-cover border border-slate-200"
                          />
                        )}
                        <div>
                          <span>{pp.producto?.nombre}</span>
                          {pp.producto?.codigo && (
                            <span className="block font-mono text-[10px] text-slate-400">
                              {pp.producto.codigo}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      {pp.codigoProveedor || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900">
                        {pp.producto?.stockActual} {pp.producto?.unidadMedida}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400">
                        (Mín: {pp.producto?.stockMinimo})
                      </span>
                    </td>

                    {puedeVerCostos && (
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {pp.precioUltimo
                          ? `$${pp.precioUltimo.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </td>
                    )}

                    <td className="px-4 py-3 text-center">
                      {pp.esPrincipal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          Principal
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Alternativo</span>
                      )}
                    </td>

                    {puedeAdministrar && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setItemCatalogoAEditar(pp)
                              setModalCatalogo(true)
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Editar código o costo pactado"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDesvincular(
                                pp.id,
                                pp.producto?.nombre || "Insumo"
                              )
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Desvincular insumo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECCIÓN 2: HISTORIAL DE ÓRDENES DE COMPRA ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Historial de Órdenes de Compra
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {ordenesCompra.length} órdenes
            </span>
          </div>

          {puedeEmitirOrden && proveedor.activo && (
            <button
              type="button"
              onClick={() => setModalNuevaOrden(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Emitir Orden</span>
            </button>
          )}
        </div>

        {ordenesCompra.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <ShoppingCart className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">
              No se han emitido órdenes de compra para este proveedor
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Las órdenes formalizadas y sus recepciones aparecerán listadas aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5">Orden</th>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5">Recepción</th>
                  {puedeVerCostos && (
                    <th className="px-4 py-2.5 text-right">Total</th>
                  )}
                  <th className="px-4 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {ordenesCompra.map((oc) => {
                  const fecha = new Date(oc.creadoEn).toLocaleDateString("es-AR")
                  const puedeRecibirItem =
                    puedeAdministrar &&
                    oc.estado !== "CANCELADA" &&
                    oc.estado !== "RECIBIDA_TOTAL"

                  return (
                    <tr key={oc.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <Link
                          href={`/proveedores/ordenes/${oc.id}`}
                          className="hover:text-indigo-600 transition flex items-center gap-1"
                        >
                          <span>{oc.numeroFormateado}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-slate-500">{fecha}</td>

                      <td className="px-4 py-3">
                        <OrdenCompraEstadoBadge estado={oc.estado} />
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700">
                          {oc.totalRecibidos} de {oc.totalItems} ítems ({oc.progresoRecepcion}%)
                        </span>
                      </td>

                      {puedeVerCostos && (
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {oc.total ? `$${oc.total.toLocaleString("es-AR")}` : "—"}
                        </td>
                      )}

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <OrdenCompraWhatsAppButton ordenCompra={oc} />
                          {puedeRecibirItem && (
                            <button
                              type="button"
                              onClick={() => {
                                setOrdenARecibir(oc)
                                setModalRecepcion(true)
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                            >
                              <Boxes className="h-3.5 w-3.5" />
                              <span>Recibir</span>
                            </button>
                          )}
                          <Link
                            href={`/proveedores/ordenes/${oc.id}`}
                            className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 transition"
                            title="Ver ficha A4"
                          >
                            <Printer className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALES ── */}
      {/* 1. Editar Proveedor */}
      <ProveedorModal
        abierto={modalEditarProveedor}
        proveedorAEditar={proveedor}
        onCerrar={() => setModalEditarProveedor(false)}
      />

      {/* 2. Vincular / Editar Insumo Provisto */}
      <ProveedorCatalogoModal
        abierto={modalCatalogo}
        proveedorId={proveedor.id}
        proveedorNombre={proveedor.nombre}
        itemAEditar={itemCatalogoAEditar}
        productosDisponibles={catalogoProductos}
        puedeVerCostos={puedeVerCostos}
        onCerrar={() => {
          setModalCatalogo(false)
          setItemCatalogoAEditar(null)
        }}
      />

      {/* 3. Emitir Orden de Compra para este Proveedor */}
      <OrdenCompraFormModal
        abierto={modalNuevaOrden}
        proveedores={[proveedor]}
        proveedorPreseleccionadoId={proveedor.id}
        productosDisponibles={catalogoProductos}
        puedeVerCostos={puedeVerCostos}
        onCerrar={() => setModalNuevaOrden(false)}
      />

      {/* 4. Modal Recepción */}
      {ordenARecibir && (
        <OrdenCompraRecepcionModal
          abierto={modalRecepcion}
          ordenCompra={ordenARecibir}
          puedeVerCostos={puedeVerCostos}
          onCerrar={() => {
            setModalRecepcion(false)
            setOrdenARecibir(null)
          }}
        />
      )}
    </div>
  )
}
