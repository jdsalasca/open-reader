// @ts-expect-error -- foliate-js is vendored plain JavaScript
import { Overlayer } from '../vendor/foliate/overlayer.js'
import type { Annotation, HighlightStyle } from './types'
import { HIGHLIGHT_COLORS } from './reading'

type DrawOptions = { color: string; width: number; noteColor?: string }
type DrawFn = (rects: DOMRect[], options: DrawOptions) => SVGGElement

const SVG = 'http://www.w3.org/2000/svg'

const BASE: Record<HighlightStyle, DrawFn> = {
  highlight: Overlayer.highlight,
  underline: Overlayer.underline,
  squiggly: Overlayer.squiggly,
  strike: Overlayer.strikethrough,
}

/** A small pin on the last rect, so a highlight with a note is recognisable. */
function pin(g: SVGGElement, rects: DOMRect[], options: DrawOptions): SVGGElement {
  const last = rects[rects.length - 1]
  if (!last) return g
  const circle = document.createElementNS(SVG, 'circle')
  circle.setAttribute('cx', String(last.right))
  circle.setAttribute('cy', String(last.top + 2))
  circle.setAttribute('r', '3.6')
  circle.setAttribute('fill', options.noteColor ?? options.color)
  circle.setAttribute('stroke', options.color)
  circle.setAttribute('stroke-width', '1.2')
  g.append(circle)
  return g
}

/**
 * Wraps foliate's `draw` callback: picks the geometry for the annotation style
 * and, when the annotation carries a note, pins a dot at the end of the mark.
 */
export function drawAnnotation(
  draw: (fn: DrawFn, options: DrawOptions) => void,
  annotation: Annotation,
): void {
  const color = HIGHLIGHT_COLORS[annotation.color]?.hex ?? HIGHLIGHT_COLORS.amber.hex
  const noteColor = HIGHLIGHT_COLORS[annotation.color]?.deep ?? HIGHLIGHT_COLORS.amber.deep
  const base = BASE[annotation.style] ?? BASE.highlight
  const fn: DrawFn = annotation.note
    ? (rects, options) => pin(base(rects, options), rects, options)
    : base
  draw(fn, { color, width: 2.2, noteColor })
}
