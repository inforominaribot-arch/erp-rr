// Módulo: Mediciones
// Dibujo del Toldo Pérgola Barrio para el taller (la tela se confecciona acá):
//  - Vista de frente: ancho × largo, franja superior de 4 cm con un ojal en cada línea (bordes + divisiones),
//    divisiones en línea de puntos con su medida arriba y fuelle inferior de 12 cm.
//  - Vista de costado: el plegado en zigzag con la caída (cm) de la medición.

import type { IToldoConfig } from "../lib/toldos"

const FRANJA_SUPERIOR_CM = 4
const FUELLE_CM = 12

const fmt = (n: number) => n.toFixed(2).replace(".", ",")

export function ToldoPergolaDibujo({
  toldo,
  ancho,
  largo,
}: {
  toldo: Partial<IToldoConfig>
  ancho: number
  largo: number
}) {
  const divisiones = toldo.divisiones?.length ? toldo.divisiones : [ancho]
  const total = divisiones.reduce((a, b) => a + (b > 0 ? b : 0), 0) || 1

  // Vista de frente a escala (con mínimos para que siempre se lea)
  const MAX_W = 150
  const MAX_H = 170
  const escala = ancho > 0 && largo > 0 ? Math.min(MAX_W / ancho, MAX_H / largo) : 1
  const w = Math.max(90, (ancho > 0 ? ancho : 1) * escala)
  const h = Math.max(110, (largo > 0 ? largo : 1) * escala)
  const x0 = 26
  // Si las partes son angostas, las medidas de arriba van en vertical para no pisarse
  const angostas = divisiones.length > 1 && w / divisiones.length < 24
  const y0 = angostas ? 38 : 30
  const franja = 9
  const fuelle = 16

  // Posición de cada línea (bordes y divisiones)
  const lineas: number[] = [0]
  divisiones.reduce((acc, d) => {
    const x = acc + (d > 0 ? d : 0)
    lineas.push((x / total) * w)
    return x
  }, 0)

  // Vista de costado (siempre igual): plegado en zigzag con la caída
  const sx = x0 + w + 44
  const sy = y0 + 20
  const sh = 90
  const paso = 9
  const zig = Array.from({ length: 7 }, (_, i) => `${sx + 14 + i * paso},${i % 2 === 0 ? sy : sy + sh}`).join(" ")
  const finZig = sx + 14 + 6 * paso
  const ancho_svg = finZig + 70
  const alto_svg = y0 + h + 30

  return (
    <svg
      viewBox={`0 0 ${ancho_svg} ${alto_svg}`}
      className="w-full h-auto text-slate-900"
      role="img"
      aria-label="Dibujo del toldo pérgola"
    >
      {/* Medida de cada división */}
      {divisiones.map((d, i) => {
        const cx = x0 + (lineas[i] + lineas[i + 1]) / 2
        return (
          <text
            key={i}
            x={cx}
            y={angostas ? y0 - 4 : y0 - 8}
            textAnchor={angostas ? "start" : "middle"}
            dominantBaseline={angostas ? "middle" : undefined}
            transform={angostas ? `rotate(-90 ${cx} ${y0 - 4})` : undefined}
            fontSize="9"
            fontWeight="700"
            fill="currentColor"
          >
            {fmt(d)}
          </text>
        )
      })}

      {/* Paño */}
      <rect x={x0} y={y0} width={w} height={h} fill="white" stroke="currentColor" strokeWidth="1.5" />
      <line x1={x0} y1={y0 + franja} x2={x0 + w} y2={y0 + franja} stroke="currentColor" />
      <line x1={x0} y1={y0 + h - fuelle} x2={x0 + w} y2={y0 + h - fuelle} stroke="currentColor" />

      {/* Divisiones en línea de puntos */}
      {lineas.slice(1, -1).map((x, i) => (
        <line
          key={i}
          x1={x0 + x}
          y1={y0 + franja}
          x2={x0 + x}
          y2={y0 + h - fuelle}
          stroke="currentColor"
          strokeDasharray="4 3"
          strokeWidth="0.8"
        />
      ))}

      {/* Un ojal en cada línea */}
      {lineas.map((x, i) => {
        const cx = Math.min(Math.max(x0 + x, x0 + 4), x0 + w - 4)
        return <circle key={i} cx={cx} cy={y0 + franja / 2} r="3" fill="white" stroke="currentColor" />
      })}

      {/* Cotas */}
      <text x={x0 + w + 4} y={y0 + franja / 2 + 3} fontSize="8" fill="currentColor">
        {FRANJA_SUPERIOR_CM} cm
      </text>
      <text x={x0 + w + 4} y={y0 + h - fuelle / 2 + 3} fontSize="8" fill="currentColor">
        {FUELLE_CM} cm
      </text>
      <text x={x0 + w / 2} y={y0 + h + 14} textAnchor="middle" fontSize="10" fontWeight="800" fill="currentColor">
        {fmt(ancho)} m
      </text>
      <text
        x={12}
        y={y0 + h / 2}
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="currentColor"
        transform={`rotate(-90 12 ${y0 + h / 2})`}
      >
        {fmt(largo)} m
      </text>

      {/* Caída: plegado en zigzag */}
      <line x1={sx} y1={sy} x2={sx + 14} y2={sy} stroke="currentColor" strokeWidth="1.5" />
      <polyline points={zig} fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1={finZig} y1={sy} x2={finZig + 14} y2={sy} stroke="currentColor" strokeWidth="1.5" />
      <polyline
        points={`${finZig + 22},${sy} ${finZig + 28},${sy} ${finZig + 28},${sy + sh} ${finZig + 22},${sy + sh}`}
        fill="none"
        stroke="currentColor"
      />
      <text x={finZig + 32} y={sy + sh / 2 + 4} fontSize="10" fontWeight="800" fill="currentColor">
        {toldo.caidaCm ? `${toldo.caidaCm}` : "—"}
      </text>
      <text x={finZig + 32} y={sy + sh / 2 + 15} fontSize="8" fill="currentColor">
        cm
      </text>
      <text x={sx + 14 + 3 * paso} y={sy + sh + 16} textAnchor="middle" fontSize="9" fill="currentColor">
        Caída
      </text>
    </svg>
  )
}
