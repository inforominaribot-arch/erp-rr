// Módulo: Mediciones
// Actualización de una medición existente SIN borrar y recrear sus cortinas.
// Mantiene el vínculo con presupuestos y comandas, les traslada las medidas nuevas
// y deja un aviso de "medida modificada" para administración.
// Se usa desde la edición web (actualizarMedicion) y desde la sincronización de la tablet.

import type { Prisma } from "@prisma/client"

type Tx = Prisma.TransactionClient

export interface ItemCambioInput {
  id?: string | null
  descripcion: string
  ancho: number
  alto: number
  cantidad?: number
  caracteristicas?: unknown
  observaciones?: string | null
}

export interface AmbienteCambioInput {
  id?: string | null
  nombre: string
  orden?: number
  items: ItemCambioInput[]
}

export interface CambiosMedicionInput {
  clienteId?: string
  observaciones?: string | null
  ambientes: AmbienteCambioInput[]
}

export interface ResultadoCambiosMedicion {
  itemsActualizados: number
  itemsCreados: number
  itemsEliminados: number
  avisosGenerados: number
}

/** Se lanza cuando se intenta agregar o quitar cortinas de una medición con presupuesto aceptado. */
export class MedicionBloqueadaError extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = "MedicionBloqueadaError"
  }
}

const ESTADOS_PRESUPUESTO_ACEPTADO = ["ACEPTADO_TOTAL", "ACEPTADO_PARCIAL"] as const

/** ¿Alguna cortina de la medición está en un presupuesto aceptado (total o parcial)? */
export async function medicionTienePresupuestoAceptado(
  tx: Pick<Tx, "itemPresupuesto">,
  medicionId: string
): Promise<boolean> {
  const cantidad = await tx.itemPresupuesto.count({
    where: {
      itemMedicion: { ambiente: { medicionId } },
      presupuesto: { estado: { in: [...ESTADOS_PRESUPUESTO_ACEPTADO] } },
    },
  })
  return cantidad > 0
}

const r3 = (n: unknown) => Math.round(Number(n || 0) * 1000) / 1000

/** Firma de las medidas de una cortina (ancho/alto general + medidas de Gaza y B.O.). */
function firmaMedidas(ancho: unknown, alto: unknown, caracteristicas: unknown): string {
  const c = (caracteristicas || {}) as {
    gaza?: { activa?: boolean; ancho?: number; alto?: number; anchosPanos?: number[] }
    bo?: { activa?: boolean; ancho?: number; alto?: number; anchosTramos?: number[] }
  }
  return JSON.stringify({
    ancho: r3(ancho),
    alto: r3(alto),
    gaza: c?.gaza?.activa
      ? {
          ancho: r3(c.gaza.ancho),
          alto: r3(c.gaza.alto),
          anchos: (c.gaza.anchosPanos || []).map(r3),
        }
      : null,
    bo: c?.bo?.activa
      ? {
          ancho: r3(c.bo.ancho),
          alto: r3(c.bo.alto),
          anchos: (c.bo.anchosTramos || []).map(r3),
        }
      : null,
  })
}

const normalizar = (s: string) => s.trim().toLowerCase()

type CapaMedidas = Record<string, unknown> & { activa?: boolean }
const CAMPOS_MEDIDA_GAZA = ["ancho", "alto", "panos", "anchosPanos"] as const
const CAMPOS_MEDIDA_BO = ["ancho", "alto", "tramos", "anchosTramos"] as const

/**
 * Traslada SOLO las medidas de la medición a la especificación propia de una alternativa
 * de presupuesto (o del ítem de comanda que salió de ella). Conserva todo lo que difiere
 * (sistema, barral/riel, telas, soportes...).
 */
export function fusionarMedidasCaracteristicas(
  caracOpcion: unknown,
  caracMedicion: unknown
): Record<string, unknown> {
  const opcion = { ...((caracOpcion || {}) as Record<string, unknown>) }
  const medicion = (caracMedicion || {}) as Record<string, unknown>

  const fusionarCapa = (clave: "gaza" | "bo", campos: readonly string[]) => {
    const capaOpcion = opcion[clave] as CapaMedidas | undefined
    const capaMedicion = medicion[clave] as CapaMedidas | undefined
    if (!capaOpcion?.activa || !capaMedicion?.activa) return
    const nueva: CapaMedidas = { ...capaOpcion }
    for (const campo of campos) {
      if (capaMedicion[campo] !== undefined) nueva[campo] = capaMedicion[campo]
    }
    opcion[clave] = nueva
  }
  fusionarCapa("gaza", CAMPOS_MEDIDA_GAZA)
  fusionarCapa("bo", CAMPOS_MEDIDA_BO)
  if (medicion.anchoConfeccionGaza !== undefined && opcion.anchoConfeccionGaza !== undefined) {
    opcion.anchoConfeccionGaza = medicion.anchoConfeccionGaza
  }
  return opcion
}

/**
 * Aplica los cambios a una medición existente dentro de una transacción.
 *
 * - Las cortinas se identifican por `id`. Si NINGUNA cortina entrante trae `id`
 *   (tablets con datos anteriores a esta versión), se emparejan por ambiente y posición.
 * - Con presupuesto aceptado no se permite agregar ni quitar cortinas (solo modificarlas).
 * - Las medidas y especificaciones nuevas se trasladan a presupuestos y comandas vinculados.
 *   El precio NO se modifica y el estado "listo" de taller NO se toca.
 */
export async function aplicarCambiosMedicion(
  tx: Tx,
  medicionId: string,
  input: CambiosMedicionInput
): Promise<ResultadoCambiosMedicion> {
  const ambientesExistentes = await tx.ambiente.findMany({
    where: { medicionId },
    include: { items: { orderBy: { creadoEn: "asc" } } },
    orderBy: { orden: "asc" },
  })

  const itemsExistentes = new Map(
    ambientesExistentes.flatMap((a) => a.items.map((it) => [it.id, it] as const))
  )
  const ambientesPorId = new Map(ambientesExistentes.map((a) => [a.id, a]))

  const hayIdsEntrantes = input.ambientes.some((a) => a.items.some((it) => Boolean(it.id)))
  const emparejarPorPosicion = !hayIdsEntrantes

  // ── 1. Emparejar ambientes y cortinas ──
  const ambientesUsados = new Set<string>()
  const itemsUsados = new Set<string>()

  const plan = input.ambientes.map((amb) => {
    const ambExistente =
      (amb.id && ambientesPorId.get(amb.id) && !ambientesUsados.has(amb.id)
        ? ambientesPorId.get(amb.id)
        : undefined) ||
      ambientesExistentes.find(
        (e) => !ambientesUsados.has(e.id) && normalizar(e.nombre) === normalizar(amb.nombre)
      )
    if (ambExistente) ambientesUsados.add(ambExistente.id)

    const items = amb.items.map((item, idx) => {
      let existente =
        item.id && itemsExistentes.has(item.id) && !itemsUsados.has(item.id)
          ? itemsExistentes.get(item.id)
          : undefined
      if (!existente && emparejarPorPosicion && ambExistente) {
        const candidato = ambExistente.items[idx]
        if (candidato && !itemsUsados.has(candidato.id)) existente = candidato
      }
      if (existente) itemsUsados.add(existente.id)
      return { item, existente }
    })

    return { amb, ambExistente, items }
  })

  const nuevos = plan.flatMap((p) => p.items.filter((i) => !i.existente))
  const eliminados = [...itemsExistentes.values()].filter((it) => !itemsUsados.has(it.id))

  // ── 2. Regla: con presupuesto aceptado no se agregan ni quitan cortinas ──
  if (nuevos.length > 0 || eliminados.length > 0) {
    if (await medicionTienePresupuestoAceptado(tx, medicionId)) {
      const partes: string[] = []
      if (nuevos.length > 0) partes.push(`agregar ${nuevos.length} cortina(s)`)
      if (eliminados.length > 0) partes.push(`quitar ${eliminados.length} cortina(s)`)
      throw new MedicionBloqueadaError(
        `Esta medición tiene un presupuesto aceptado: no se puede ${partes.join(" ni ")}. ` +
          `Solo se pueden modificar las medidas y especificaciones de las cortinas existentes.`
      )
    }
  }

  // ── 3. Datos generales de la medición (también actualiza actualizadoEn) ──
  await tx.medicion.update({
    where: { id: medicionId },
    data: {
      ...(input.clienteId ? { clienteId: input.clienteId } : {}),
      observaciones: input.observaciones?.trim() || null,
      sincronizado: true,
    },
  })

  const resultado: ResultadoCambiosMedicion = {
    itemsActualizados: 0,
    itemsCreados: 0,
    itemsEliminados: 0,
    avisosGenerados: 0,
  }
  const ahora = new Date()

  // ── 4. Ambientes y cortinas ──
  for (const [ambIndex, { amb, ambExistente, items }] of plan.entries()) {
    const ambiente = ambExistente
      ? await tx.ambiente.update({
          where: { id: ambExistente.id },
          data: { nombre: amb.nombre.trim(), orden: amb.orden ?? ambIndex },
        })
      : await tx.ambiente.create({
          data: { medicionId, nombre: amb.nombre.trim(), orden: amb.orden ?? ambIndex },
        })

    for (const { item, existente } of items) {
      const datos = {
        ambienteId: ambiente.id,
        descripcion: item.descripcion.trim(),
        ancho: item.ancho,
        alto: item.alto,
        cantidad: item.cantidad || 1,
        caracteristicas: (item.caracteristicas ?? {}) as Prisma.InputJsonValue,
        observaciones: item.observaciones?.trim() || null,
      }

      if (!existente) {
        await tx.itemMedicion.create({ data: datos })
        resultado.itemsCreados++
        continue
      }

      // Comparar ANTES de actualizar
      const medidasCambiaron =
        firmaMedidas(existente.ancho, existente.alto, existente.caracteristicas) !==
        firmaMedidas(item.ancho, item.alto, item.caracteristicas)
      const anterior = { ancho: r3(existente.ancho), alto: r3(existente.alto) }

      await tx.itemMedicion.update({ where: { id: existente.id }, data: datos })
      resultado.itemsActualizados++

      // Presupuestos vinculados (incluye todas sus alternativas): se actualizan medidas,
      // el precio queda igual. En las opciones con especificación propia solo cambian las medidas.
      const itemsPresupuesto = await tx.itemPresupuesto.findMany({
        where: { itemMedicionId: existente.id },
        select: {
          id: true,
          medidaAnterior: true,
          caracteristicas: true,
          aceptado: true,
          presupuesto: { select: { comanda: { select: { id: true } } } },
        },
      })
      // Comandas cuyo ítem salió de una alternativa con especificación propia
      const comandasConOpcionPropia = new Set(
        itemsPresupuesto
          .filter((ip) => ip.aceptado && ip.caracteristicas != null && ip.presupuesto.comanda)
          .map((ip) => ip.presupuesto.comanda!.id)
      )
      for (const ip of itemsPresupuesto) {
        await tx.itemPresupuesto.update({
          where: { id: ip.id },
          data: {
            ancho: item.ancho,
            alto: item.alto,
            ...(ip.caracteristicas != null
              ? {
                  caracteristicas: fusionarMedidasCaracteristicas(
                    ip.caracteristicas,
                    item.caracteristicas
                  ) as Prisma.InputJsonValue,
                }
              : {}),
            ...(medidasCambiaron
              ? {
                  // Se conserva la medida ORIGINAL si ya había un aviso pendiente
                  medidaAnterior: (ip.medidaAnterior ?? anterior) as Prisma.InputJsonValue,
                  medidaModificadaEn: ahora,
                }
              : {}),
          },
        })
        if (medidasCambiaron) resultado.avisosGenerados++
      }

      // Comandas vinculadas: medidas y especificaciones; "completado" no se toca
      const itemsComanda = await tx.itemComanda.findMany({
        where: { itemMedicionId: existente.id },
        select: { id: true, comandaId: true, medidaAnterior: true, caracteristicas: true },
      })
      for (const ic of itemsComanda) {
        await tx.itemComanda.update({
          where: { id: ic.id },
          data: {
            ancho: item.ancho,
            alto: item.alto,
            caracteristicas: (comandasConOpcionPropia.has(ic.comandaId)
              ? fusionarMedidasCaracteristicas(ic.caracteristicas, item.caracteristicas)
              : (item.caracteristicas ?? {})) as Prisma.InputJsonValue,
            ...(medidasCambiaron
              ? {
                  medidaAnterior: (ic.medidaAnterior ?? anterior) as Prisma.InputJsonValue,
                  medidaModificadaEn: ahora,
                }
              : {}),
          },
        })
      }
    }
  }

  // ── 5. Cortinas y ambientes que ya no están ──
  if (eliminados.length > 0) {
    await tx.itemMedicion.deleteMany({ where: { id: { in: eliminados.map((e) => e.id) } } })
    resultado.itemsEliminados = eliminados.length
  }
  const ambientesSobrantes = ambientesExistentes.filter((a) => !ambientesUsados.has(a.id))
  if (ambientesSobrantes.length > 0) {
    await tx.ambiente.deleteMany({ where: { id: { in: ambientesSobrantes.map((a) => a.id) } } })
  }

  return resultado
}
