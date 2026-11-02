/**
 * Touch selection for tablets and phones.
 *
 * Android and iOS draw their own "Translate / Copy / Share" bar over any
 * native selection, and no web API can hide it. The only way out is to stop
 * the browser from making a selection at all: `user-select: none` everywhere
 * inside the book, no long-press callout, no context menu; we listen for the
 * long press ourselves, build the Range with `caretRangeFromPoint` and paint it
 * in our own layer.
 */

export interface TouchSelectionHandlers {
  onSelect: (range: Range) => void
  onClear: () => void
}

const LONG_PRESS = 380
/** Fingers are not mice: allow this much drift before the press is a swipe. */
const SLOP = 10
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
    html, body, body * {
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
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

const WORD = /[\p{L}\p{N}_'’-]/u

/** Nearest text node under a point, descending through element boundaries. */
function textAt(doc: Document, x: number, y: number): { node: Text; offset: number } | null {
  const caret = doc.caretRangeFromPoint(x, y)
  if (!caret) return null
  let node: Node | null = caret.startContainer
  let offset = caret.startOffset
  if (node.nodeType !== Node.TEXT_NODE) {
    const child = node.childNodes[Math.min(offset, node.childNodes.length - 1)]
    node = child ?? null
    offset = 0
    while (node && node.nodeType !== Node.TEXT_NODE) {
      node = node.firstChild
    }
  }
  return node && node.nodeType === Node.TEXT_NODE ? { node: node as Text, offset } : null
}

/**
 * The word under the finger, built by hand. `Range.expand('word')` throws when
 * the caret sits on an element node, and it is Chromium-only.
 */
function wordAt(doc: Document, x: number, y: number): Range | null {
  const hit = textAt(doc, x, y)
  if (!hit) return null
  const { node, offset } = hit
  const content = node.data
  let start = Math.min(offset, content.length)
  let end = start
  while (start > 0 && WORD.test(content[start - 1])) start--
  while (end < content.length && WORD.test(content[end])) end++
  if (start === end) return null
  const range = doc.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  return range
}

export function enableTouchSelection(
  doc: Document,
  handlers: TouchSelectionHandlers,
): () => void {
  ensureStyles(doc)

  let timer = 0
  let range: Range | null = null
  let dragging = false
  let start = { x: 0, y: 0 }

  const clear = () => {
    window.clearTimeout(timer)
    range = null
    dragging = false
    paintLayer(doc).replaceChildren()
    handlers.onClear()
  }

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return
    // a new tap always drops the previous selection and its painted layer
    if (range) clear()
    start = { x: touch.clientX, y: touch.clientY }
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      try {
        range = wordAt(doc, start.x, start.y)
      } catch {
        range = null
      }
      if (!range) return
      dragging = true
      paint(doc, range)
    }, LONG_PRESS)
  }

  const onTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return
    const moved = Math.abs(touch.clientX - start.x) + Math.abs(touch.clientY - start.y)
    if (!dragging) {
      if (moved > SLOP) window.clearTimeout(timer)
      return
    }
    event.preventDefault()
    const caret = doc.caretRangeFromPoint(touch.clientX, touch.clientY)
    if (!caret || !range) return
    try {
      if (caret.compareBoundaryPoints(Range.START_TO_START, range) < 0) {
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
    if (dragging && range && !range.collapsed) handlers.onSelect(range)
    dragging = false
  }

  const blockMenu = (event: Event) => event.preventDefault()

  doc.addEventListener('touchstart', onTouchStart, { passive: true })
  doc.addEventListener('touchmove', onTouchMove, { passive: false })
  doc.addEventListener('touchend', onTouchEnd, { passive: true })
  doc.addEventListener('touchcancel', clear, { passive: true })
  doc.addEventListener('contextmenu', blockMenu)

  return () => {
    window.clearTimeout(timer)
    doc.removeEventListener('touchstart', onTouchStart)
    doc.removeEventListener('touchmove', onTouchMove)
    doc.removeEventListener('touchend', onTouchEnd)
    doc.removeEventListener('touchcancel', clear)
    doc.removeEventListener('contextmenu', blockMenu)
    paintLayer(doc).remove()
    doc.getElementById(STYLE_ID)?.remove()
  }
}
