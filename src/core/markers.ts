import type { Annotation, StickyColor } from './types'

export type MarkerKind = 'bubble' | 'sticky'

export interface Marker {
  id: string
  kind: MarkerKind
  /** Y position, in viewport pixels. */
  top: number
  /** Bubble number: 1…9, then «9+». Empty for post-it tabs. */
  label: string
  /** Post-it colour, or null for a plain comment. */
  color: StickyColor | null
}

const BUBBLE_HEIGHT = 24
const TAB_HEIGHT = 20
/** Separación mínima entre dos marcas ya colocadas en pantalla. */
const STEP = 22

/**
 * Decide qué marcas se ven en el borde de la hoja y a qué altura.
 *
 * - Un **comentario** (resaltado, o post-it con nota escrita) es una burbuja
 *   numerada en orden de lectura.
 * - Un **post-it** sin nota es una pestaña de color, y no gasta número.
 * - Si dos marcas caen en el mismo renglón, se apilan: nunca una encima de otra.
 *
 * Solo entran las anotaciones que traen altura en `anchors`, y esas son
 * exactamente las que el motor tiene pintadas ahora mismo. Por eso aquí no se
 * filtra por capítulo: preguntar por `location.index` descartaba las notas de
 * la segunda sección de una página, que el motor reporta con otro índice.
 */
export function placeMarkers(
  annotations: Annotation[],
  anchors: Record<string, number>,
): Marker[] {
  const placed = annotations
    .filter(
      (item) =>
        item.kind === 'highlight' && typeof anchors[item.id] === 'number',
    )
    .map((item) => ({ item, top: anchors[item.id] }))
    .sort((a, b) => a.top - b.top || a.item.createdAt - b.item.createdAt)

  const bubbles: number[] = []
  const tabs: number[] = []
  const out: Marker[] = []
  let number = 0

  for (const { item, top } of placed) {
    const isSticky = Boolean(item.sticky) && !item.note.trim()
    if (isSticky) {
      // ni encima de una burbuja ni encima de otra pestaña
      let y = top
      const busy = (value: number) =>
        bubbles.some((used) => Math.abs(used - value) < BUBBLE_HEIGHT) ||
        tabs.some((used) => Math.abs(used - value) < TAB_HEIGHT)
      while (busy(y)) y += TAB_HEIGHT
      tabs.push(y)
      out.push({
        id: item.id,
        kind: 'sticky',
        top: y,
        label: '',
        color: item.sticky ?? null,
      })
      continue
    }
    // dos marcas en el mismo renglón se apilan: nunca una encima de otra
    let y = top
    while (bubbles.some((used) => Math.abs(used - y) < BUBBLE_HEIGHT)) y += BUBBLE_HEIGHT
    bubbles.push(y)
    number += 1
    out.push({
      id: item.id,
      kind: 'bubble',
      top: y,
      label: number < 10 ? String(number) : '9+',
      color: item.sticky ?? null,
    })
  }

  return out
}

/**
 * Pasa las alturas a coordenadas de la capa que las dibuja (la hoja), las
 * mantiene dentro de la página y evita que dos marcas queden una encima de
 * otra cuando chocan contra el borde superior.
 */
export function fitMarkers(markers: Marker[], offset: number): Marker[] {
  const out: Marker[] = []
  for (const marker of markers) {
    let top = Math.max(6, marker.top - offset - 10)
    while (out.some((other) => Math.abs(other.top - top) < STEP)) top += STEP
    out.push({ ...marker, top })
  }
  return out
}
