"use client"

// Módulo: Mediciones
// Pasos del Toldo PRINTEMPS en el formulario de la cortina (tablet y web): subtipo → color de perfilería →
// caño → medidas → barra frente / tipo → mecanismo → cubre toldo → tela (con buscador de colores) → pollerita.

import { useState } from "react"
import { Search } from "lucide-react"
import {
  BARRAS_FRENTE_TOLDO,
  BRAZOS_TP2,
  CANALES_TOLDO,
  CANOS_TOLDO,
  COLORES_PERFILERIA_TOLDO,
  MAQUINAS_TOLDO,
  MAX_DIVISIONES_PERGOLA,
  MECANISMOS_TOLDO,
  MEDIDAS_MANIJA_TOLDO,
  SUBTIPOS_TOLDO,
  TIPOS_PROYECCION,
  accesoriosAutomaticosToldo,
  buscarColoresTela,
  coloresDeTela,
  etiquetaMedidaManija,
  limpiarToldo,
  modelosDeMotorToldo,
  motoresDisponibles,
  nombreTelaToldo,
  normalizarMotorToldo,
  repartirAncho,
  sumaDivisiones,
  telasPermitidas,
  tiposDeTela,
  type IToldoConfig,
} from "../lib/toldos"

interface ToldoPasosProps {
  toldo: Partial<IToldoConfig>
  onChange: (t: Partial<IToldoConfig>) => void
  ancho: number | ""
  alto: number | ""
  onAncho: (v: number | "") => void
  onAlto: (v: number | "") => void
}

const claseOpcion = (activa: boolean) =>
  `rounded-lg border px-3.5 py-2 text-xs font-bold transition ${
    activa
      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`

const claseInput =
  "block w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"

function Paso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{titulo}</label>
      {children}
    </div>
  )
}

function Opciones<T extends string | number>({
  opciones,
  valor,
  onElegir,
  etiqueta,
}: {
  opciones: readonly T[]
  valor: T | undefined
  onElegir: (v: T) => void
  etiqueta?: (v: T) => string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button key={String(o)} type="button" onClick={() => onElegir(o)} className={claseOpcion(valor === o)}>
          {etiqueta ? etiqueta(o) : String(o)}
        </button>
      ))}
    </div>
  )
}

function SiNo({ valor, onElegir }: { valor: boolean | undefined; onElegir: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onElegir(true)} className={claseOpcion(valor === true)}>
        Sí
      </button>
      <button type="button" onClick={() => onElegir(false)} className={claseOpcion(valor === false)}>
        No
      </button>
    </div>
  )
}

/** Cantidad entera (vacío = 0, salvo que se indique un mínimo) */
function Cantidad({
  valor,
  onCambiar,
  minimo = 0,
}: {
  valor: number | undefined
  onCambiar: (v: number | undefined) => void
  minimo?: number
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={minimo}
      step={1}
      value={valor ?? ""}
      onChange={(e) => onCambiar(e.target.value === "" ? undefined : Math.max(minimo, parseInt(e.target.value, 10) || 0))}
      placeholder={minimo > 0 ? String(minimo) : "0"}
      className={`${claseInput} max-w-[110px]`}
    />
  )
}

function Medida({ valor, onCambiar }: { valor: number | "" | undefined; onCambiar: (v: number | "") => void }) {
  return (
    <input
      type="number"
      step="0.001"
      min="0.01"
      inputMode="decimal"
      value={valor ?? ""}
      onChange={(e) => onCambiar(e.target.value === "" ? "" : parseFloat(e.target.value) || "")}
      placeholder="0.00"
      className={claseInput}
    />
  )
}

export function ToldoPasos({ toldo, onChange, ancho, alto, onAncho, onAlto }: ToldoPasosProps) {
  const [busqueda, setBusqueda] = useState("")
  const [buscando, setBuscando] = useState(false)
  const t = toldo
  const vertical = t.subtipo === "VERTICAL"
  const pergola = t.subtipo === "PERGOLA_BARRIO"
  const divisiones = t.divisiones ?? []
  const anchoNum = typeof ancho === "number" ? ancho : 0
  const cambiar = (cambios: Partial<IToldoConfig>) => onChange(limpiarToldo({ ...t, ...cambios }))

  const colores = coloresDeTela(t.tela, t.tipoTela)
  const coloresFiltrados = buscarColoresTela(colores, busqueda).slice(0, 40)
  const accesorios = accesoriosAutomaticosToldo(t)

  /** Tela con buscador de colores (la usan los tres subtipos) */
  const pasoTela = (titulo: string) => (
    <Paso titulo={titulo}>
      <Opciones
        opciones={telasPermitidas(t.subtipo)}
        valor={t.tela}
        etiqueta={nombreTelaToldo}
        onElegir={(tela) => {
          setBusqueda("")
          cambiar({ tela })
        }}
      />
      {t.tela && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white/70 p-3">
          {tiposDeTela(t.tela).length > 1 && (
          <div className="space-y-1">
            <span className="block text-[11px] font-bold text-slate-600">Tipo</span>
            <Opciones
              opciones={tiposDeTela(t.tela)}
              valor={t.tipoTela}
              onElegir={(tipoTela) => {
                setBusqueda("")
                cambiar({ tipoTela })
              }}
            />
          </div>
          )}
          {t.tipoTela && (
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">Color</span>
              {t.colorTela && !buscando ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                  <span className="text-xs font-bold text-indigo-950">
                    {t.colorTela}
                    {t.lineaTela && t.lineaTela !== t.tipoTela && (
                      <span className="ml-1.5 font-semibold text-indigo-600">· {t.lineaTela}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda("")
                      setBuscando(true)
                    }}
                    className="text-[11px] font-bold text-indigo-700 underline"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      onFocus={() => setBuscando(true)}
                      placeholder={`Escribí el color (${colores.length} disponibles)`}
                      className={`${claseInput} pl-8`}
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                    {coloresFiltrados.length === 0 ? (
                      <p className="p-2.5 text-[11px] text-slate-500">No hay colores que coincidan.</p>
                    ) : (
                      coloresFiltrados.map((c) => (
                        <button
                          key={`${c.linea}-${c.nombre}`}
                          type="button"
                          onClick={() => {
                            setBuscando(false)
                            setBusqueda("")
                            cambiar({ colorTela: c.nombre, lineaTela: c.linea })
                          }}
                          className={`flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-indigo-50 ${
                            t.colorTela === c.nombre && t.lineaTela === c.linea ? "bg-indigo-50 font-bold" : ""
                          }`}
                        >
                          <span className="font-semibold text-slate-900">{c.nombre}</span>
                          {c.linea !== t.tipoTela && <span className="text-[10px] text-slate-500">{c.linea}</span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Paso>
  )

  return (
    <div className="space-y-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 animate-in fade-in duration-150">
      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">Toldo PRINTEMPS</h4>

      <Paso titulo="Subtipo">
        <Opciones
          opciones={SUBTIPOS_TOLDO.map((s) => s.subtipo)}
          valor={t.subtipo}
          onElegir={(subtipo) => cambiar({ subtipo })}
          etiqueta={(s) => SUBTIPOS_TOLDO.find((x) => x.subtipo === s)?.nombre ?? s}
        />
      </Paso>

      {pergola && (
        <>
          <Paso titulo="1 • Ancho, largo y alto (m)">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-600">Ancho</span>
                <Medida
                  valor={ancho}
                  onCambiar={(v) => {
                    onAncho(v)
                    // El ancho nuevo se vuelve a repartir en la misma cantidad de partes
                    cambiar({ divisiones: repartirAncho(typeof v === "number" ? v : 0, divisiones.length || 1) })
                  }}
                />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-600">Largo</span>
                <Medida valor={alto} onCambiar={onAlto} />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-600">Alto (del piso al toldo)</span>
                <Medida
                  valor={t.altoPiso ?? ""}
                  onCambiar={(v) => cambiar({ altoPiso: typeof v === "number" ? v : undefined })}
                />
              </div>
            </div>
          </Paso>

          <Paso titulo="2 • División del ancho">
            <span className="block text-[11px] font-bold text-slate-600">¿En cuántas partes se divide?</span>
            <Opciones
              opciones={Array.from({ length: MAX_DIVISIONES_PERGOLA }, (_, i) => i + 1)}
              valor={divisiones.length || undefined}
              onElegir={(n) => cambiar({ divisiones: repartirAncho(anchoNum, n) })}
            />
            {divisiones.length > 0 && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white/70 p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {divisiones.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <span className="block text-[10px] font-bold text-slate-600">Parte {i + 1} (m)</span>
                      <Medida
                        valor={d || ""}
                        onCambiar={(v) =>
                          cambiar({ divisiones: divisiones.map((x, j) => (j === i ? (typeof v === "number" ? v : 0) : x)) })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-semibold ${
                      anchoNum > 0 && Math.abs(sumaDivisiones(divisiones) - anchoNum) > 0.02 ? "text-amber-700" : "text-slate-500"
                    }`}
                  >
                    Suman {sumaDivisiones(divisiones).toFixed(2).replace(".", ",")} m
                    {anchoNum > 0 && ` de ${anchoNum.toFixed(2).replace(".", ",")} m`}
                  </span>
                  <button
                    type="button"
                    onClick={() => cambiar({ divisiones: repartirAncho(anchoNum, divisiones.length) })}
                    className="text-[11px] font-bold text-indigo-700 underline"
                  >
                    Repartir igual
                  </button>
                </div>
              </div>
            )}
          </Paso>

          <Paso titulo="3 • Caída (cm)">
            <Cantidad valor={t.caidaCm} onCambiar={(caidaCm) => cambiar({ caidaCm })} />
          </Paso>

          <Paso titulo="4 • Cubre toldo">
            <SiNo valor={t.cubreToldo} onElegir={(cubreToldo) => cambiar({ cubreToldo })} />
            {t.cubreToldo && (
              <div className="space-y-1 rounded-xl border border-slate-200 bg-white/70 p-3">
                <span className="block text-[11px] font-bold text-slate-600">Color</span>
                <Opciones
                  opciones={COLORES_PERFILERIA_TOLDO}
                  valor={t.colorCubreToldo}
                  onElegir={(colorCubreToldo) => cambiar({ colorCubreToldo })}
                />
                <span className="block pt-2 text-[11px] font-bold text-slate-600">
                  Ménsula soportes escuadra 20x25 (cantidad)
                </span>
                <Cantidad valor={t.mensulasCubreToldo} onCambiar={(mensulasCubreToldo) => cambiar({ mensulasCubreToldo })} />
              </div>
            )}
          </Paso>

          {pasoTela("5 • Tela")}
        </>
      )}

      {t.subtipo && !pergola && (
        <>
          <Paso titulo="1 • Color de perfilería e insumos">
            <Opciones opciones={COLORES_PERFILERIA_TOLDO} valor={t.colorPerfileria} onElegir={(colorPerfileria) => cambiar({ colorPerfileria })} />
          </Paso>

          <Paso titulo="2 • Caño galvanizado">
            <Opciones opciones={CANOS_TOLDO} valor={t.cano} onElegir={(cano) => cambiar({ cano })} />
          </Paso>

          <Paso titulo={vertical ? "3 • Ancho y alto (m)" : "3 • Ancho y proyección (m)"}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-600">Ancho</span>
                <Medida valor={ancho} onCambiar={onAncho} />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-600">{vertical ? "Alto" : "Proyección"}</span>
                <Medida valor={alto} onCambiar={onAlto} />
              </div>
            </div>
          </Paso>

          {vertical ? (
            <Paso titulo="4 • Barra frente">
              <Opciones opciones={BARRAS_FRENTE_TOLDO} valor={t.barraFrente} onElegir={(barraFrente) => cambiar({ barraFrente })} />
              {t.barraFrente === "TP1" && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => cambiar({ tensor: true })} className={claseOpcion(t.tensor === true)}>
                      Con tensor
                    </button>
                    <button type="button" onClick={() => cambiar({ tensor: false })} className={claseOpcion(t.tensor === false)}>
                      Sin tensor
                    </button>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold text-slate-600">Brazo Caduta importado</span>
                    <SiNo valor={t.brazoCaputa} onElegir={(brazoCaputa) => cambiar({ brazoCaputa })} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold text-slate-600">Sujeción al piso (cantidad)</span>
                    <Cantidad valor={t.sujecionPiso || undefined} onCambiar={(v) => cambiar({ sujecionPiso: v ?? 0 })} />
                  </div>
                </div>
              )}
              {t.barraFrente === "TP2" && (
                <div className="space-y-1 rounded-xl border border-slate-200 bg-white/70 p-3">
                  <span className="block text-[11px] font-bold text-slate-600">Brazos (m)</span>
                  <Opciones opciones={BRAZOS_TP2} valor={t.brazos} onElegir={(brazos) => cambiar({ brazos })} />
                </div>
              )}
              {accesorios.length > 0 && (
                <p className="text-[11px] font-semibold text-indigo-700">Lleva {accesorios.join(", ")}.</p>
              )}
            </Paso>
          ) : (
            <Paso titulo="4 • Tipo">
              <Opciones opciones={TIPOS_PROYECCION} valor={t.tipoProyeccion} onElegir={(tipoProyeccion) => cambiar({ tipoProyeccion })} />
            </Paso>
          )}

          <Paso titulo="5 • Mecanismo">
            <Opciones opciones={MECANISMOS_TOLDO} valor={t.mecanismo} onElegir={(mecanismo) => cambiar({ mecanismo })} />
            {t.mecanismo && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                {vertical && t.mecanismo === "Manual" && (
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold text-slate-600">Máquina</span>
                    <Opciones opciones={MAQUINAS_TOLDO} valor={t.maquina} onElegir={(maquina) => cambiar({ maquina })} />
                  </div>
                )}
                {vertical && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="block text-[11px] font-bold text-slate-600">Soporte plano (pares)</span>
                      <Cantidad valor={t.soportePlano || undefined} onCambiar={(v) => cambiar({ soportePlano: v ?? 0 })} />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[11px] font-bold text-slate-600">Escuadra (pares)</span>
                      <Cantidad valor={t.escuadra || undefined} onCambiar={(v) => cambiar({ escuadra: v ?? 0 })} />
                    </div>
                  </div>
                )}
                {t.mecanismo === "Manual" && (
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold text-slate-600">Manijas (cantidad)</span>
                    <Cantidad valor={t.manijas} minimo={1} onCambiar={(manijas) => cambiar({ manijas: manijas ?? 1 })} />
                    <span className="block pt-2 text-[11px] font-bold text-slate-600">Medida de la manija (m)</span>
                    <Opciones
                      opciones={MEDIDAS_MANIJA_TOLDO}
                      valor={t.medidaManija}
                      etiqueta={etiquetaMedidaManija}
                      onElegir={(medidaManija) => cambiar({ medidaManija })}
                    />
                  </div>
                )}
                {t.mecanismo === "Motorizado" && (
                  <>
                    <div className="space-y-1">
                      <span className="block text-[11px] font-bold text-slate-600">Tipo de motor</span>
                      <Opciones
                        opciones={motoresDisponibles(t)}
                        valor={normalizarMotorToldo(t.motor)}
                        onElegir={(motor) => cambiar({ motor })}
                      />
                    </div>
                    {modelosDeMotorToldo(t.motor).length > 1 && (
                      <div className="space-y-1">
                        <span className="block text-[11px] font-bold text-slate-600">Modelo del motor</span>
                        <Opciones
                          opciones={modelosDeMotorToldo(t.motor)}
                          valor={t.modeloMotor}
                          onElegir={(modeloMotor) => cambiar({ modeloMotor })}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="block text-[11px] font-bold text-slate-600">Control</span>
                      <SiNo valor={t.control} onElegir={(control) => cambiar({ control })} />
                    </div>
                    {t.control && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <span className="block text-[11px] font-bold text-slate-600">Cantidad de controles</span>
                          <Cantidad
                            valor={t.cantidadControles}
                            minimo={1}
                            onCambiar={(cantidadControles) => cambiar({ cantidadControles: cantidadControles ?? 1 })}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[11px] font-bold text-slate-600">Canales</span>
                          <Opciones opciones={CANALES_TOLDO} valor={t.canales} onElegir={(canales) => cambiar({ canales })} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="block text-[11px] font-bold text-slate-600">Domótica</span>
                      <SiNo valor={t.domotica ?? false} onElegir={(domotica) => cambiar({ domotica })} />
                    </div>
                  </>
                )}
              </div>
            )}
          </Paso>

          <Paso titulo="6 • Cubre toldo">
            <SiNo valor={t.cubreToldo} onElegir={(cubreToldo) => cambiar({ cubreToldo })} />
            {t.cubreToldo && (
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                <div className="space-y-1">
                  <span className="block text-[11px] font-bold text-slate-600">Ancho (m)</span>
                  <Medida
                    valor={t.anchoCubreToldo}
                    onCambiar={(v) => cambiar({ anchoCubreToldo: v === "" ? undefined : v })}
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[11px] font-bold text-slate-600">Perchas (cantidad)</span>
                  <Cantidad valor={t.perchas} onCambiar={(perchas) => cambiar({ perchas })} />
                </div>
              </div>
            )}
          </Paso>

          {pasoTela("7 • Tela")}

          <Paso titulo="8 • Pollerita">
            <SiNo valor={t.pollerita} onElegir={(pollerita) => cambiar({ pollerita })} />
          </Paso>
        </>
      )}
    </div>
  )
}
