/**
 * Touch selection for tablets and phones.
 *
 * Android and iOS draw their own "Translate / Copy / Share" bar over any
 * native selection, and no web API can hide it. The only way out is to stop
 * the browser from making a selection at all: we turn off `user-select`,
 * listen for a long press, build the Range ourselves with
 * `caretRangeFromPoint` and paint it in our own layer.
 */

export interface TouchSelectionHandlers {
  onSelect: (range: Range) => void
  onClear: () => void
}

const LONG_PRESS = 380
const STYLE_ID = 'open-reader-touch-selection'

function paintLayer(doc: Document): HTMLDivElement {
  let layer = doc.getElementById('tsel-layer') as HTMLDivElement | null
  if (!layer) {
    layer = doc.createElement('div')
    layer.id = 'tsel-layer'
    doc.body.append(layer)
  }
  return layer
}

function ensureStyles(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #tsel-layer {
      position: absolute;
      inset: 0;
      z-index: 40;
      pointer-events: none;
    }
    #tsel-layer span {
      position: absolute;
      border-radius: 1px;
      background: rgba(168, 73, 42, 0.3);
    }
  `
  doc.head.append(style)
}

function paint(doc: Document, range: Range) {
  const layer = paintLayer(doc)
  layer.replaceChildren()
  if (range.collapsed) return
  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width < 1 || rect.height < 1) continue
    const box = doc.createElement('span')
    box.style.left = `${rect.left}px`
    box.style.top = `${rect.top}px`
    box.style.width = `${rect.width}px`
    box.style.height = `${rect.height}px`
    layer.append(box)
  }
}

const wordAt = (doc: Document, x: number, y: number): Range | null => {
  const caret = doc.caretRangeFromPoint(x, y)
  if (!caret) return null
  const range = caret.cloneRange()
  // Range.expand is Chromium-only, which is exactly the target here
  const expandable = range as Range & { expand?: (unit: string) => void }
  expandable.expand?.('word')
  return range.collapsed ? null : range
}

export function enableTouchSelection(
  doc: Document,
  handlers: TouchSelectionHandlers,
): () => void {
  ensureStyles(doc)
  const body = doc.body
  const previous = body.style.userSelect
  body.style.userSelect = 'none'
  ;(body.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect = 'none'

  let timer = 0
  let range: Range | null = null
  let dragging = false
  let start = { x: 0, y: 0 }

  const clear = () => {
    range = null
    dragging = false
    paintLayer(doc).replaceChildren()
    handlers.onClear()
  }

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return
    start = { x: touch.clientX, y: touch.clientY }
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      range = wordAt(doc, start.x, start.y)
      if (!range) return
      dragging = true
      paint(doc, range)
      doc.defaultView?.getSelection()?.removeAllRanges()
    }, LONG_PRESS)
  }

  const onTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return
    const moved = Math.abs(touch.clientX - start.x) + Math.abs(touch.clientY - start.y)
    if (!dragging) {
      if (moved > 10) window.clearTimeout(timer)
      return
    }
    event.preventDefault()
    const caret = doc.caretRangeFromPoint(touch.clientX, touch.clientY)
    if (!caret || !range) return
    try {
      if (
        caret.compareBoundaryPoints(Range.START_TO_START, range) < 0
      ) {
        range.setStart(caret.startContainer, caret.startOffset)
      } else {
        range.setEnd(caret.startContainer, caret.startOffset)
      }
      paint(doc, range)
    } catch {
      /* dragging outside the text */
    }
  }

  const onTouchEnd = () => {
    window.clearTimeout(timer)
    if (dragging && range && !range.collapsed) {
      handlers.onSelect(range)
    } else if (!dragging) {
      clear()
    }
    dragging = false
  }

  doc.addEventListener('touchstart', onTouchStart, { passive: true })
  doc.addEventListener('touchmove', onTouchMove, { passive: false })
  doc.addEventListener('touchend', onTouchEnd, { passive: true })
  doc.addEventListener('touchcancel', clear, { passive: true })

  return () => {
    window.clearTimeout(timer)
    doc.removeEventListener('touchstart', onTouchStart)
    doc.removeEventListener('touchmove', onTouchMove)
    doc.removeEventListener('touchend', onTouchEnd)
    doc.removeEventListener('touchcancel', clear)
    paintLayer(doc).remove()
    body.style.userSelect = previous
    ;(body.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect = ''
  }
}
