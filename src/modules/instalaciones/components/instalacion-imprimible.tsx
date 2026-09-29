// Módulo: Agenda & Instalación
// Ficha Técnica de Instalación / Hoja de Colocación Imprimible en A4

import { Printer, MapPin, Phone, UserCheck } from "lucide-react"
import type { IInstalacion } from "../types"
import { formatearFechaCompleta, formatearHorario } from "../types"
import { InstalacionEstadoBadge } from "./instalacion-estado-badge"

interface Props {
  instalacion: IInstalacion
}

export function InstalacionImprimible({ instalacion }: Props) {
  const { comanda, instaladores } = instalacion
  const cliente = comanda.cliente

  const direccionCompleta = [cliente?.direccion, cliente?.localidad]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="mx-auto max-w-4xl">
      {/* Botón de Impresión (oculto al imprimir) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <InstalacionEstadoBadge
            estado={instalacion.estado}
            materialesListos={instalacion.materialesListos}
          />
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Printer className="h-4 w-4" />
          Imprimir Hoja de Colocación A4
        </button>
      </div>

      {/* Contenedor A4 */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900">
        {/* Membrete de la empresa */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              ROMINA RIBOT
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
              Cortinados & Toldos a Medida
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Ficha Técnica de Instalación & Hoja de Colocación en Obra
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block rounded-lg bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-800">
              Comanda #{comanda.numero}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700">
              {formatearFechaCompleta(instalacion.fecha)}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Horario: {formatearHorario(instalacion.horaInicio, instalacion.horaFin)}
            </p>
          </div>
        </div>

        {/* Datos de la Obra y Cliente */}
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cliente & Contacto
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{cliente.nombre}</p>
            <p className="mt-1 text-slate-600 flex items-center gap-1 font-mono">
              <Phone className="h-3 w-3 text-slate-400" />
              {cliente.telefono || "Sin teléfono registrado"}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Domicilio de Obra
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5 flex items-start gap-1">
              <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
              {direccionCompleta || "Dirección a coordinar con cliente"}
            </p>
            <div className="mt-1 flex items-center gap-1 text-slate-600">
              <UserCheck className="h-3 w-3 text-slate-400" />
              <span>Colocador(es): </span>
              <strong className="text-slate-800">
                {instaladores.length > 0
                  ? instaladores.map((i) => i.usuario.nombre).join(", ")
                  : "A designar"}
              </strong>
            </div>
          </div>
        </div>

        {/* Notas y accesos */}
        {instalacion.notas && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50/70 p-3 text-xs text-amber-900">
            <span className="font-bold">Indicaciones de Acceso & Herramientas:</span>{" "}
            {instalacion.notas}
          </div>
        )}

        {/* Tabla de Cortinas */}
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Detalle de Cortinas a Colocar ({comanda.items.length})
          </h2>

          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Ambiente</th>
                <th className="py-2 px-3">Cortina / Modelo</th>
                <th className="py-2 px-3 text-center">Cant.</th>
                <th className="py-2 px-3 text-center">Medidas (Ancho × Alto)</th>
                <th className="py-2 px-3">Observaciones de Confección</th>
                <th className="py-2 px-3 text-center print:table-cell">OK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {comanda.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {item.ambiente || "General"}
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-900">{item.descripcion}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{item.tipo}</p>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">{item.cantidad}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                    {item.ancho} × {item.alto} m
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    {item.observaciones || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="mx-auto h-4 w-4 border border-slate-400 rounded-sm"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Casillero de Conformidad del Cliente */}
        <div className="mt-10 pt-6 border-t-2 border-slate-200">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Conformidad de Recepción e Instalación del Cliente
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Por la presente, el cliente declara recibir de conformidad la colocación de las cortinas
            y accesorios detallados en esta comanda, habiendo verificado su correcto
            funcionamiento, terminación y estado general en obra.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-6 pt-10">
            <div className="border-t border-slate-400 text-center">
              <p className="text-[11px] font-bold text-slate-800">Firma del Cliente</p>
            </div>
            <div className="border-t border-slate-400 text-center">
              <p className="text-[11px] font-bold text-slate-800">Aclaración & DNI</p>
            </div>
            <div className="border-t border-slate-400 text-center">
              <p className="text-[11px] font-bold text-slate-800">Firma del Colocador</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
