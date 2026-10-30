"use client"

// Órdenes de pedido a proveedor de la comanda, por marca:
//  - HD: link a la página de pedidos de Hunter Douglas.
//  - MG: WhatsApp a MagicRoll con las cortinas del pedido.
//  - RS: Excel de la orden de trabajo de Rollershade + mail con destinatario y asunto (el archivo se adjunta a mano).
// Al generar la orden de MG o RS, esas cortinas pasan a "Pedido".

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, FileSpreadsheet, Loader2, MessageCircle, Package, RotateCcw, X } from "lucide-react"
import type { IComandaDetalle, IOrdenPedido, IProveedorPedido } from "../types"
import { registrarOrdenPedido } from "../actions"
import {
  URL_PEDIDOS_HD,
  SISTEMAS_FILA_RS,
  OPCIONES_CADENA_RS,
  OPCIONES_CAJON_RS,
  OPCIONES_CENEFA_RS,
  OPCIONES_GUIA_RS,
  OPCIONES_RECOGE_RS,
  OPCIONES_ZOCALO_RS,
  cortinasDeMarca,
  fechaPedidoTexto,
  filasOrdenRS,
  mensajePedidoMG,
  nombreArchivoPedidoRS,
  telefonoWhatsApp,
  type IFilaOrdenRS,
  type MarcaOrden,
  type SistemaFilaRS,
} from "../lib/orden-pedido"
import { generarExcelRollershade } from "../lib/excel-rollershade"

const NOMBRE_MARCA: Record<MarcaOrden, string> = {
  HD: "Hunter Douglas",
  RS: "Rollershade",
  MG: "MagicRoll",
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function abrirMailRS(email: string | null | undefined, cliente: string, fecha: Date) {
  const asunto = nombreArchivoPedidoRS(cliente, fecha).replace(/\.xlsx$/, "")
  const cuerpo = "Hola, les envío el pedido adjunto.\n\nSaludos,\nRibot"
  window.location.href = `mailto:${email ?? ""}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}

function urlWhatsApp(telefono: string | null | undefined, mensaje: string) {
  const tel = telefonoWhatsApp(telefono)
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
}

interface OrdenesPedidoPanelProps {
  comanda: IComandaDetalle
  proveedores: IProveedorPedido[]
}

export function OrdenesPedidoPanel({ comanda, proveedores }: OrdenesPedidoPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [filasRS, setFilasRS] = useState<IFilaOrdenRS[] | null>(null)
  const [generando, setGenerando] = useState<MarcaOrden | null>(null)

  const cliente = comanda.presupuesto.cliente.nombre
  const proveedor = (marca: string) => proveedores.find((p) => p.marcas.includes(marca))
  const ordenes = comanda.ordenesPedido ?? []

  // Marcas con cortinas a pedir y cuántas faltan pedir
  const marcas = useMemo(() => {
    return (["RS", "MG", "HD"] as MarcaOrden[])
      .map((marca) => ({
        marca,
        total: cortinasDeMarca(comanda.items, marca, false).length,
        pendientes: cortinasDeMarca(comanda.items, marca, true).length,
      }))
      .filter((m) => m.total > 0)
  }, [comanda.items])

  if (marcas.length === 0) return null

  function abrirOrdenRS(pendientes: number) {
    setError(null)
    setFilasRS(filasOrdenRS(comanda.items, pendientes > 0))
  }

  function generarRS(filas: IFilaOrdenRS[]) {
    setError(null)
    setGenerando("RS")
    startTransition(async () => {
      const res = await registrarOrdenPedido({ marca: "RS", comandaId: comanda.id, filas })
      if (!res.success) {
        setGenerando(null)
        setError(res.error || "No se pudo generar la orden.")
        return
      }
      try {
        const fecha = new Date(res.data.fecha)
        const blob = await generarExcelRollershade({ filas, numeroOrden: res.data.numeroDia, fecha, cliente })
        descargar(blob, nombreArchivoPedidoRS(cliente, fecha))
        abrirMailRS(proveedor("RS")?.email, cliente, fecha)
        setFilasRS(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo armar el Excel.")
      }
      setGenerando(null)
      router.refresh()
    })
  }

  function generarMG(pendientes: number) {
    setError(null)
    const cortinas = cortinasDeMarca(comanda.items, "MG", pendientes > 0)
    const mensaje = mensajePedidoMG(comanda.items, cliente, pendientes > 0)
    // Abrir WhatsApp en el mismo clic (si no, el navegador bloquea la ventana)
    window.open(urlWhatsApp(proveedor("MG")?.telefono, mensaje), "_blank", "noopener")
    setGenerando("MG")
    startTransition(async () => {
      const res = await registrarOrdenPedido({
        marca: "MG",
        comandaId: comanda.id,
        pedidoIds: [...new Set(cortinas.map((k) => k.pedidoId))],
        mensaje,
      })
      setGenerando(null)
      if (!res.success) setError(res.error || "No se pudo registrar la orden.")
      router.refresh()
    })
  }

  function repetirOrden(o: IOrdenPedido) {
    setError(null)
    const fecha = new Date(o.creadoEn)
    if (o.marca === "RS") {
      const filas = (o.detalle as { filas?: IFilaOrdenRS[] })?.filas ?? []
      generarExcelRollershade({ filas, numeroOrden: o.numeroDia, fecha, cliente })
        .then((blob) => descargar(blob, nombreArchivoPedidoRS(cliente, fecha)))
        .catch((e) => setError(e instanceof Error ? e.message : "No se pudo armar el Excel."))
    } else if (o.marca === "MG") {
      const mensaje = (o.detalle as { mensaje?: string })?.mensaje ?? ""
      window.open(urlWhatsApp(proveedor("MG")?.telefono, mensaje), "_blank", "noopener")
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 print:hidden">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-orange-600" />
        <h2 className="text-sm font-bold text-slate-900">Órdenes de pedido a proveedor</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {marcas.map(({ marca, total, pendientes }) => {
          const prov = proveedor(marca)
          return (
            <div key={marca} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">
                  {marca} · {NOMBRE_MARCA[marca]}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    pendientes > 0 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {pendientes > 0 ? `${pendientes} por pedir` : "Pedido"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {total} {total === 1 ? "cortina" : "cortinas"}
              </p>

              {marca === "HD" && (
                <a
                  href={URL_PEDIDOS_HD}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Generar orden de pedido
                </a>
              )}

              {marca === "MG" && (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => generarMG(pendientes)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {generando === "MG" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
                    {pendientes > 0 ? "Generar orden de pedido" : "Generar de nuevo"}
                  </button>
                  {!prov?.telefono && (
                    <p className="text-[10px] text-amber-700">
                      MagicRoll no tiene teléfono en Proveedores: WhatsApp te va a pedir elegir el contacto.
                    </p>
                  )}
                </>
              )}

              {marca === "RS" && (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => abrirOrdenRS(pendientes)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    {pendientes > 0 ? "Generar orden de pedido" : "Generar de nuevo"}
                  </button>
                  {!prov?.email && (
                    <p className="text-[10px] text-amber-700">Rollershade no tiene mail en Proveedores.</p>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {ordenes.length > 0 && (
        <div className="space-y-1 border-t border-slate-100 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Órdenes generadas</p>
          {ordenes.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-xs text-slate-700">
              <span>
                <strong>{o.marca}</strong> · Orden N° {o.numeroDia} del {fechaPedidoTexto(new Date(o.creadoEn))}
              </span>
              <button
                type="button"
                onClick={() => repetirOrden(o)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                {o.marca === "RS" ? "Descargar de nuevo" : "Reenviar WhatsApp"}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      {filasRS && (
        <OrdenRollershadeModal
          filasIniciales={filasRS}
          generando={generando === "RS"}
          onCerrar={() => setFilasRS(null)}
          onGenerar={generarRS}
        />
      )}
    </div>
  )
}

// ─── Ventana para completar la planilla de Rollershade ───────────────────────

const claseCampo =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"

function Campo({
  label,
  valor,
  opciones,
  onCambiar,
}: {
  label: string
  valor: string
  opciones?: string[]
  onCambiar: (v: string) => void
}) {
  const lista = opciones ? `opciones-${label.replace(/\W/g, "")}` : undefined
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
      <input
        value={valor}
        list={lista}
        onChange={(e) => onCambiar(e.target.value.toUpperCase())}
        className={claseCampo}
      />
      {opciones && (
        <datalist id={lista}>
          {opciones.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </label>
  )
}

function OrdenRollershadeModal({
  filasIniciales,
  generando,
  onCerrar,
  onGenerar,
}: {
  filasIniciales: IFilaOrdenRS[]
  generando: boolean
  onCerrar: () => void
  onGenerar: (filas: IFilaOrdenRS[]) => void
}) {
  const [filas, setFilas] = useState(filasIniciales)
  const cambiar = (i: number, campo: keyof IFilaOrdenRS, valor: string | number) =>
    setFilas((prev) => prev.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Orden de trabajo Rollershade</h3>
            <p className="text-[11px] text-slate-500">
              Revisá y completá cada cortina. Al generar se baja el Excel y se abre el mail (el archivo se adjunta a mano).
            </p>
          </div>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {filas.map((f, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="text-xs font-black text-slate-900">
                {i + 1}. {f.referencia}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Sistema</span>
                  <select
                    value={f.sistema}
                    onChange={(e) => cambiar(i, "sistema", e.target.value as SistemaFilaRS)}
                    className={claseCampo}
                  >
                    {SISTEMAS_FILA_RS.map((s) => (
                      <option key={s.valor} value={s.valor}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Cant.</span>
                  <input
                    type="number"
                    min={1}
                    value={f.cantidad}
                    onChange={(e) => cambiar(i, "cantidad", Math.max(1, Number(e.target.value) || 1))}
                    className={claseCampo}
                  />
                </label>
                <Campo label="Tela" valor={f.tela} onCambiar={(v) => cambiar(i, "tela", v)} />
                <Campo label="Color" valor={f.color} onCambiar={(v) => cambiar(i, "color", v)} />
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Ancho (m)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={f.ancho}
                    onChange={(e) => cambiar(i, "ancho", Number(e.target.value) || 0)}
                    className={claseCampo}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Alto (m)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={f.alto}
                    onChange={(e) => cambiar(i, "alto", Number(e.target.value) || 0)}
                    className={claseCampo}
                  />
                </label>
                <Campo label="Cadena" valor={f.cadena} opciones={OPCIONES_CADENA_RS} onCambiar={(v) => cambiar(i, "cadena", v)} />
                <Campo label="Mando" valor={f.mando} opciones={["DERECHO", "IZQUIERDO"]} onCambiar={(v) => cambiar(i, "mando", v)} />
                <Campo label="Caída" valor={f.caida} opciones={["DELANTE", "DETRÁS"]} onCambiar={(v) => cambiar(i, "caida", v)} />
                <Campo label="Recoge hacia" valor={f.recoge} opciones={OPCIONES_RECOGE_RS} onCambiar={(v) => cambiar(i, "recoge", v)} />
                <Campo label="Cenefa" valor={f.cenefa} opciones={OPCIONES_CENEFA_RS} onCambiar={(v) => cambiar(i, "cenefa", v)} />
                <Campo label="Zócalo" valor={f.zocalo} opciones={OPCIONES_ZOCALO_RS} onCambiar={(v) => cambiar(i, "zocalo", v)} />
                <Campo label="Cajón" valor={f.cajon} opciones={OPCIONES_CAJON_RS} onCambiar={(v) => cambiar(i, "cajon", v)} />
                <Campo label="Guía lateral" valor={f.guia} opciones={OPCIONES_GUIA_RS} onCambiar={(v) => cambiar(i, "guia", v)} />
                <Campo label="Motor" valor={f.motor} onCambiar={(v) => cambiar(i, "motor", v)} />
                <div className="col-span-2 sm:col-span-4 lg:col-span-6">
                  <Campo
                    label="Observaciones (va en rosa, ocupando Cajón, Guía y Motor)"
                    valor={f.observaciones}
                    opciones={["SOPORTE Y PERFILERÍA NEGRA"]}
                    onCambiar={(v) => cambiar(i, "observaciones", v)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={generando || filas.some((f) => !(f.ancho > 0) || !(f.alto > 0))}
            onClick={() => onGenerar(filas)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {generando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            Generar Excel y abrir mail
          </button>
        </div>
      </div>
    </div>
  )
}
