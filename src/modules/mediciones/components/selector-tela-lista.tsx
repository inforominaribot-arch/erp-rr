"use client"

// Selector de tela de la lista de precios (telas tildadas "vendemos") + color según la tela elegida.
// Se usa en las capas Roller, Roller Mot y Bandas RS del formulario de cortina; en el resto de las capas
// (o si no hay lista cargada, ej: tablet sin sincronizar) queda el texto libre de siempre.
// Las telas llegan por contexto: en la web desde el servidor y en la tablet desde la copia local.

import { createContext, useContext, type ReactNode } from "react"
import type { ITelaMedicion } from "../types"
import type { ICeldaMosquitero } from "../lib/mosquiteros"

const TelasListaContext = createContext<ITelaMedicion[]>([])
// Medidas de los mosquiteros MagicRoll (sin precios) para ofrecer solo los modelos que se fabrican
const CeldasMosquiteroContext = createContext<ICeldaMosquitero[]>([])

export function TelasListaProvider({
  telas,
  celdasMosquitero = [],
  children,
}: {
  telas: ITelaMedicion[]
  celdasMosquitero?: ICeldaMosquitero[]
  children: ReactNode
}) {
  return (
    <TelasListaContext.Provider value={telas}>
      <CeldasMosquiteroContext.Provider value={celdasMosquitero}>{children}</CeldasMosquiteroContext.Provider>
    </TelasListaContext.Provider>
  )
}

export function useTelasLista(): ITelaMedicion[] {
  return useContext(TelasListaContext)
}

export function useCeldasMosquitero(): ICeldaMosquitero[] {
  return useContext(CeldasMosquiteroContext)
}

export interface ValorTela {
  nombreTela: string
  telaId: string | null
  colorTela: string | null
}

/** Nombre que se guarda en la medición (lo que ve el taller): "Black Out FV 2,50 blanco". */
export function nombreTelaElegida(tela: Pick<ITelaMedicion, "descripcion">, color: string | null): string {
  return color ? `${tela.descripcion} ${color}` : tela.descripcion
}

interface SelectorTelaListaProps {
  /** true si la capa es RS (Roller, Roller Mot o Bandas) */
  usarLista: boolean
  /** Bandas verticales usa las telas "(BV)" */
  esBandas: boolean
  valor: ValorTela
  onCambiar: (valor: ValorTela) => void
  placeholder?: string
  className?: string
}

export function SelectorTelaLista({
  usarLista,
  esBandas,
  valor,
  onCambiar,
  placeholder,
  className,
}: SelectorTelaListaProps) {
  const todas = useTelasLista()
  const telas = todas.filter((t) => (esBandas ? t.categoria === "BANDAS_VERTICALES" : t.categoria === "TELA"))

  if (!usarLista || telas.length === 0) {
    return (
      <input
        type="text"
        value={valor.nombreTela}
        onChange={(e) => onCambiar({ nombreTela: e.target.value, telaId: null, colorTela: null })}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  const tela = telas.find((t) => t.id === valor.telaId) ?? null
  const claseSelect = className?.replace("p-2.5", "p-2") ?? ""

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          value={tela?.id ?? ""}
          onChange={(e) => {
            const nueva = telas.find((t) => t.id === e.target.value) ?? null
            const color = nueva && nueva.colores.length === 1 ? nueva.colores[0] : null
            onCambiar(
              nueva
                ? { nombreTela: nombreTelaElegida(nueva, color), telaId: nueva.id, colorTela: color }
                : { nombreTela: "", telaId: null, colorTela: null }
            )
          }}
          className={claseSelect}
        >
          <option value="">-- Elegir tela --</option>
          {telas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.descripcion}
            </option>
          ))}
        </select>
        <select
          value={valor.colorTela ?? ""}
          disabled={!tela || tela.colores.length === 0}
          onChange={(e) => {
            if (!tela) return
            const color = e.target.value || null
            onCambiar({ nombreTela: nombreTelaElegida(tela, color), telaId: tela.id, colorTela: color })
          }}
          className={claseSelect}
        >
          <option value="">{tela && tela.colores.length === 0 ? "Sin colores" : "-- Color --"}</option>
          {(tela?.colores ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {!tela && valor.nombreTela.trim() && (
        <p className="text-[11px] text-amber-700">
          Cargada antes como &quot;{valor.nombreTela}&quot;: elegila de la lista.
        </p>
      )}
    </div>
  )
}
