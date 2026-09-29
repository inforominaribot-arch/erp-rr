"use client"

import { useState } from "react"
import Link from "next/link"
import { CortinaDibujoDidactico } from "./cortina-dibujo-didactico"
import { MedicionSyncBadge } from "./medicion-sync-badge"
import { formatearFecha } from "@/lib/utils"
import type { IMedicion, IItemMedicion } from "../types"
import {
  calcularArgollasGaza,
  calcularCantidadSoportes,
  determinarVarianteSoporte,
  calcularAnchoConfeccionGaza,
} from "../types"
import {
  Printer,
  FileText,
  Edit2,
  Phone,
  MapPin,
  Calendar,
  User,
  ArrowLeft,
  Wrench,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2,
} from "lucide-react"

interface MedicionDetalleProps {
  medicion: IMedicion
  rolUsuario?: string
  puedeEditar?: boolean
}

export function MedicionDetalle({
  medicion,
  rolUsuario = "ADMIN_GENERAL",
  puedeEditar = true,
}: MedicionDetalleProps) {
  const esTallerOColocacion = rolUsuario === "TALLER" || rolUsuario === "INSTALACION"
  // Por defecto, si el rol es Taller o Instalación, arranca en la Ficha de Taller/Colocación
  const [vistaActiva, setVistaActiva] = useState<"INTERACTIVA" | "FICHA_A4">(
    esTallerOColocacion ? "FICHA_A4" : "INTERACTIVA"
  )

  const cantCortinas = medicion.ambientes.reduce(
    (acc, a) => acc + (a.items?.length || 0),
    0
  )

  function handleImprimir() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* ── BARRA SUPERIOR DE ACCIONES (No se imprime) ── */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <Link
          href="/mediciones"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>

        {/* Selector de Vista en Pantalla */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setVistaActiva("INTERACTIVA")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              vistaActiva === "INTERACTIVA"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Vista Interactiva Digital
          </button>
          <button
            type="button"
            onClick={() => setVistaActiva("FICHA_A4")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              vistaActiva === "FICHA_A4"
                ? "bg-white text-amber-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench className="h-3.5 w-3.5 text-amber-600" />
            Vista Previa Ficha A4 (Taller & Colocación)
          </button>
        </div>

        {/* Botones Principales */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleImprimir}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <Printer className="h-4 w-4" />
            Imprimir Ficha de Taller / Colocación
          </button>

          {!esTallerOColocacion && (
            <Link
              href={`/presupuestos/nuevo?medicionId=${medicion.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <FileText className="h-4 w-4" />
              Presupuestar
            </Link>
          )}

          {puedeEditar && (
            <Link
              href={`/mediciones/${medicion.id}/editar`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VISTA 1: FICHA TÉCNICA DE TALLER & COLOCACIÓN (OPTIMIZADA PARA A4)
          Visible en pantalla cuando se selecciona la pestaña y SIEMPRE al imprimir (@media print)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`${
          vistaActiva === "FICHA_A4" ? "block" : "hidden"
        } print:block bg-white space-y-3.5`}
      >
        {/* Encabezado Compacto de Hoja A4 */}
        <div className="border border-slate-800 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-slate-950">
                ERP RR — FICHA TÉCNICA DE TALLER Y COLOCACIÓN
              </h1>
              <p className="text-[10px] text-slate-600">
                Comanda de confección, corte de telas y orden de montaje en obra
              </p>
            </div>
            <div className="text-right">
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {cantCortinas} cortina{cantCortinas !== 1 ? "s" : ""}
              </span>
              <p className="text-[9px] text-slate-500 mt-0.5">
                {medicion.ambientes.length} ambiente{medicion.ambientes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Fila densa de datos de obra */}
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-800">
            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Cliente:</span>
              <strong className="text-slate-950 text-xs">{medicion.cliente?.nombre || "—"}</strong>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Teléfono:</span>
              <span>{medicion.cliente?.telefono || "—"}</span>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Obra / Domicilio:</span>
              <span>
                {[medicion.cliente?.direccion, medicion.cliente?.localidad]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 block">Fecha / Relevador:</span>
              <span>
                {formatearFecha(medicion.creadoEn)} {medicion.usuario?.nombre ? `• ${medicion.usuario.nombre}` : ""}
              </span>
            </div>
          </div>

          {medicion.observaciones && (
            <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-700">
              <strong>Nota general de obra:</strong> {medicion.observaciones}
            </div>
          )}
        </div>

        {/* Desglose de Ambientes y Cortinas Ultra-Compacto */}
        <div className="space-y-4">
          {medicion.ambientes.map((ambiente, aIdx) => (
            <div key={ambiente.id} className="space-y-2">
              {/* Título de Ambiente */}
              <div className="flex items-center justify-between bg-slate-100 border border-slate-800 px-3 py-1 rounded-md">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  📍 AMBIENTE {aIdx + 1}: {ambiente.nombre}
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  ({ambiente.items.length} abertura{ambiente.items.length !== 1 ? "s" : ""})
                </span>
              </div>

              {/* Cortinas del Ambiente */}
              <div className="space-y-2">
                {ambiente.items.map((item, iIdx) => {
                  const carac = item.caracteristicas
                  const tipo = carac?.tipo || "Tradicional"
                  const tieneGaza = Boolean(carac?.gaza?.activa)
                  const tieneBO = Boolean(carac?.bo?.activa)
                  const anchoGaza = carac?.gaza?.ancho || item.ancho
                  const altoGaza = carac?.gaza?.alto || item.alto
                  const panosGaza = carac?.gaza?.panos || 1
                  const anchosPanos = carac?.gaza?.anchosPanos || []
                  const anchoConfeccionGaza = tieneGaza ? calcularAnchoConfeccionGaza(anchoGaza) : 0

                  const anchoBO = carac?.bo?.ancho || item.ancho
                  const altoBO = carac?.bo?.alto || item.alto
                  const tramosBO = carac?.bo?.tramos || 1
                  const anchosTramos = carac?.bo?.anchosTramos || []

                  const anchoEfectivo = tieneGaza ? anchoGaza : tieneBO ? anchoBO : item.ancho
                  const argollas = tieneGaza && tipo === "Tradicional" ? calcularArgollasGaza(anchoGaza) : 0
                  const cantidadSoportes = calcularCantidadSoportes(anchoEfectivo)
                  const varianteSoporte = determinarVarianteSoporte(tieneGaza, tieneBO)
                  const caida = carac?.caida || "Por delante"
                  const boAdelante = caida === "Por delante"

                  return (
                    <div
                      key={item.id}
                      className="break-inside-avoid border border-slate-800 rounded-lg p-2.5 bg-white shadow-2xs"
                    >
                      <div className="grid grid-cols-12 gap-3 items-center">
                        {/* ── COLUMNA IZQUIERDA: DIBUJO ESQUEMÁTICO PROPORCIONAL (~38%) ── */}
                        <div className="col-span-12 sm:col-span-5 border-b sm:border-b-0 sm:border-r border-slate-300 pb-2 sm:pb-0 sm:pr-2 flex flex-col items-center justify-center">
                          <CortinaDibujoDidactico
                            ancho={item.ancho}
                            alto={item.alto}
                            caracteristicas={carac}
                            modoCompacto={true}
                          />
                        </div>

                        {/* ── COLUMNA DERECHA: ESPECIFICACIONES DE CORTE Y MONTAJE (~62%) ── */}
                        <div className="col-span-12 sm:col-span-7 space-y-1.5 text-xs text-slate-800">
                          {/* Encabezado de Cortina */}
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="font-extrabold text-slate-950 text-xs">
                              {iIdx + 1}. {item.descripcion || `Abertura ${iIdx + 1}`}
                            </span>
                            <span className="rounded bg-slate-100 border border-slate-300 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
                              {tipo === "Roller Noche total" || tipo === "Noche total"
                                ? "Roller Noche Total"
                                : tipo}
                            </span>
                          </div>

                          {/* Especificaciones Técnicas Básicas */}
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                            <div>
                              <span className="text-slate-500 font-medium">Sistema/Perfil: </span>
                              <strong>
                                {tipo === "Tradicional"
                                  ? `${carac?.sistema || "Riel"}${
                                      carac?.sistema === "Barral"
                                        ? ` (${carac?.colorBarral || "Negro"})`
                                        : ""
                                    }`
                                  : carac?.perfileria || "Blanco"}
                              </strong>
                            </div>

                            {/* Marca */}
                            <div>
                              <span className="text-slate-500 font-medium">Marca: </span>
                              <strong className="text-indigo-900 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">
                                {tipo === "Tradicional"
                                  ? carac?.formatoBO === "Roller"
                                    ? `B.O. Roller (${carac?.marcaBO || carac?.marca || "HD"})`
                                    : "Taller Propio"
                                  : carac?.marca || "—"}
                              </strong>
                            </div>

                            <div>
                              <span className="text-slate-500 font-medium">Sujeción: </span>
                              <strong>
                                {carac?.sujecion === "Sócalo"
                                  ? "Moldura"
                                  : carac?.sujecion || "—"}
                              </strong>
                            </div>

                            <div>
                              <span className="text-slate-500 font-medium">Mando: </span>
                              <strong>
                                {tipo === "Aluminio"
                                  ? carac?.aluminio?.mando || "Derecho"
                                  : tipo === "Tradicional"
                                  ? carac?.formatoBO === "Roller"
                                    ? carac?.mandosRollerBO && carac.mandosRollerBO.length > 1
                                      ? carac.mandosRollerBO
                                          .map(
                                            (m, idx) =>
                                              `C${idx + 1}: ${
                                                m === "Izquierda" ? "Izq" : "Der"
                                              }`
                                          )
                                          .join(" • ")
                                      : `B.O. ${carac?.mandoBO || carac?.mando || "Derecha"}`
                                    : "—"
                                  : carac?.mando || "Derecha"}
                              </strong>
                            </div>

                            {tipo !== "Aluminio" && tieneBO && (
                              <div className="col-span-2">
                                <span className="text-slate-500 font-medium">Caída B.O.: </span>
                                <strong>{caida}</strong>
                                {tieneGaza && (
                                  <span className="text-slate-600 ml-1">
                                    ({boAdelante ? "B.O. adelante, Gaza atrás" : "Gaza adelante, B.O. atrás"})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Medidas de Confección de Telas */}
                          <div className="rounded bg-slate-50 border border-slate-200 p-1.5 space-y-1 text-[11px]">
                            {tipo === "Aluminio" ? (
                              <div className="flex items-center justify-between">
                                <span>
                                  Lámina: <strong>{carac?.aluminio?.tipoLamina || "25 mm"}</strong> • Color:{" "}
                                  <strong>{carac?.aluminio?.color || "Aluminio"}</strong>
                                </span>
                                <span>
                                  Medida: <strong>{item.ancho}m × {item.alto}m</strong>
                                </span>
                              </div>
                            ) : (
                              <>
                                {/* Gaza */}
                                {tieneGaza && (
                                  <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200/80 pb-0.5">
                                    <span>
                                      <strong>GAZA (Tradicional):</strong> {anchoGaza.toFixed(2)}m (Alto: {altoGaza.toFixed(2)}m)
                                      {carac?.gaza?.nombreTela ? ` • ${carac.gaza.nombreTela}` : ""}
                                    </span>
                                    {/* CORTE TALLER +10 CM DESTACADO */}
                                    <span className="rounded bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-black text-amber-950">
                                      Corte (+10cm): {anchoConfeccionGaza.toFixed(2)} m
                                    </span>
                                    <div className="w-full text-[10px] text-slate-600">
                                      Paños ({panosGaza}):{" "}
                                      {anchosPanos.length > 0
                                        ? anchosPanos.map((p, pIdx) => `P${pIdx + 1}: ${p.toFixed(2)}m`).join(" + ")
                                        : `${(anchoGaza / panosGaza).toFixed(2)}m c/u`}
                                    </div>
                                  </div>
                                )}

                                {/* B.O. */}
                                {tieneBO && (
                                  <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5">
                                    <span>
                                      <strong>
                                        B.O.
                                        {tipo === "Tradicional"
                                          ? carac?.formatoBO === "Roller"
                                            ? ` (Roller ${carac?.marcaBO || carac?.marca || "HD"})`
                                            : " (Tradicional)"
                                          : ""}
                                        :
                                      </strong>{" "}
                                      {anchoBO.toFixed(2)}m (Alto: {altoBO.toFixed(2)}m)
                                      {carac?.bo?.nombreTela ? ` • ${carac.bo.nombreTela}` : ""}
                                    </span>
                                    {tipo === "Tradicional" && carac?.formatoBO === "Roller" && (
                                      <span className="rounded bg-indigo-100 border border-indigo-300 px-1.5 py-0.5 text-[10px] font-bold text-indigo-900">
                                        Marca: {carac?.marcaBO || carac?.marca || "HD"}
                                      </span>
                                    )}
                                    <div className="w-full text-[10px] text-slate-600">
                                      {tipo === "Tradicional" && carac?.formatoBO === "Roller" ? (
                                        <span>
                                          Cortinas B.O. Roller ({tramosBO}):{" "}
                                          {anchosTramos.length > 0
                                            ? anchosTramos
                                                .map((t, tIdx) => {
                                                  const m =
                                                    carac?.mandosRollerBO?.[tIdx] ||
                                                    carac?.bo?.mandosRoller?.[tIdx] ||
                                                    (tramosBO === 1 ? carac?.mandoBO || "Derecha" : "—")
                                                  return `Cortina ${tIdx + 1}: ${t.toFixed(2)}m (Mando ${m})`
                                                })
                                                .join(" • ")
                                            : `${(anchoBO / tramosBO).toFixed(2)}m c/u`}
                                        </span>
                                      ) : (
                                        <span>
                                          Tramos ({tramosBO}):{" "}
                                          {anchosTramos.length > 0
                                            ? anchosTramos.map((t, tIdx) => `T${tIdx + 1}: ${t.toFixed(2)}m`).join(" + ")
                                            : `${(anchoBO / tramosBO).toFixed(2)}m c/u`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Herrajes y Componentes de Montaje */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium pt-0.5">
                            {tieneGaza && tipo === "Tradicional" && (
                              <span>
                                Argollas: <strong>{argollas} unid.</strong> (Solo Gaza)
                              </span>
                            )}
                            {tipo === "Tradicional" && carac?.tipoSoporte && (
                              <span>
                                Soportes:{" "}
                                <strong>
                                  {cantidadSoportes} {carac.tipoSoporte} {varianteSoporte}
                                </strong>
                              </span>
                            )}
                          </div>

                          {/* Observaciones de obra / colocación */}
                          {item.observaciones && (
                            <div className="text-[10px] text-amber-900 bg-amber-50/70 border border-amber-200 rounded px-1.5 py-0.5">
                              <strong>Obs colocación/obra:</strong> {item.observaciones}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VISTA 2: VISTA INTERACTIVA DIGITAL COMPLETA (Solo en pantalla)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`${
          vistaActiva === "INTERACTIVA" ? "block" : "hidden"
        } print:hidden space-y-6`}
      >
        {/* Cabecera Digital */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                  Planilla de Relevamiento Técnico
                </span>
                <MedicionSyncBadge sincronizado={medicion.sincronizado} />
              </div>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {medicion.cliente?.nombre || "Cliente sin nombre"}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                {medicion.cliente?.telefono && (
                  <a
                    href={`https://wa.me/${medicion.cliente.telefono.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-semibold text-slate-800 hover:text-indigo-600"
                  >
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {medicion.cliente.telefono}
                  </a>
                )}

                {(medicion.cliente?.direccion || medicion.cliente?.localidad) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {[medicion.cliente.direccion, medicion.cliente.localidad]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Fecha: {formatearFecha(medicion.creadoEn)}
                </span>

                {medicion.usuario && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Vendedora: {medicion.usuario.nombre}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Resumen de Obra
              </span>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {cantCortinas} cortinas
              </p>
              <p className="text-xs text-slate-500">
                en {medicion.ambientes.length} ambientes
              </p>
            </div>
          </div>

          {medicion.observaciones && (
            <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 text-xs text-amber-900">
              <strong>Observaciones de la visita:</strong> {medicion.observaciones}
            </div>
          )}
        </div>

        {/* Ambientes con tarjetas interactivas grandes */}
        <div className="space-y-8">
          {medicion.ambientes.map((ambiente, aIdx) => (
            <div
              key={ambiente.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    {aIdx + 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {ambiente.nombre}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {ambiente.items.length} abertura{ambiente.items.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {ambiente.items.map((item, iIdx) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {item.descripcion || `Abertura ${iIdx + 1}`}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Ancho: <strong>{item.ancho} m</strong> • Alto:{" "}
                          <strong>{item.alto} m</strong>
                          {item.caracteristicas?.marca && (
                            <span> • Marca: <strong>{item.caracteristicas.marca}</strong></span>
                          )}
                        </p>
                      </div>

                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {item.caracteristicas?.tipo || "Cortina"}
                      </span>
                    </div>

                    <CortinaDibujoDidactico
                      ancho={item.ancho}
                      alto={item.alto}
                      caracteristicas={item.caracteristicas}
                      esVistaTaller={true}
                    />

                    {item.observaciones && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                        <strong>Observación técnica:</strong> {item.observaciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
