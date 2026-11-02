// @ts-expect-error -- foliate-js is vendored plain JavaScript
import { Overlayer } from '../vendor/foliate/overlayer.js'
import type { Annotation, HighlightStyle } from './types'
import { HIGHLIGHT_COLORS, STICKY_COLORS } from './reading'

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
 * A post-it is a strip of paper over the line, not a wash: a short band with
 * rounded ends and a bit of air above and below.
 */
function postit(rects: DOMRect[], options: DrawOptions): SVGGElement {
  const g = document.createElementNS(SVG, 'g')
  g.setAttribute('fill', options.color)
  g.style.opacity = '0.72'
  for (const { left, top, height, width } of rects) {
    const pad = Math.max(1, height * 0.14)
    const el = document.createElementNS(SVG, 'rect')
    el.setAttribute('x', String(left - 1.5))
    el.setAttribute('y', String(top + pad))
    el.setAttribute('width', String(width + 3))
    el.setAttribute('height', String(Math.max(2, height - pad * 2)))
    el.setAttribute('rx', '2')
    g.append(el)
  }
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
  const stickyColor = annotation.sticky ? STICKY_COLORS[annotation.sticky] : null

  let fn: DrawFn = base
  if (stickyColor) fn = (rects, options) => postit(rects, options)
  if (annotation.note) {
    const under = fn
    fn = (rects, options) => pin(under(rects, options), rects, options)
  }

  draw(fn, { color: stickyColor ?? color, width: 2.2, noteColor })
}

/** How search hits are marked in the page: a quiet accent box. */
export const searchDraw = Overlayer.outline
export const searchDrawOptions = { color: '#a8492a', width: 2, radius: 2 }
