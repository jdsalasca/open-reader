import { useCallback, useEffect, useRef } from 'react'
import type {
  Annotation,
  LocationInfo,
  SelectionInfo,
  Settings,
  ThemeMode,
  TocItem,
} from '../core/types'
import { bookStyles } from '../core/reading'
import { drawAnnotation, searchDraw, searchDrawOptions } from '../core/mark'
import {
  bookAuthor,
  bookTitle,
  createView,
  toLocation,
  type FoliateLocation,
  type FoliateView,
} from '../core/foliate'
import { normalizeToc } from '../core/toc'

export interface BookInfo {
  title: string
  author: string
  toc: TocItem[]
  fixedLayout: boolean
}

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export interface FoliateHandlers {
  onBook: (info: BookInfo) => void
  onLocation: (location: LocationInfo) => void
  onSelection: (selection: SelectionInfo | null) => void
  onAnnotationClick: (id: string, rect: Rect) => void
  onError: (error: unknown) => void
  onReady: () => void
  onKeyDown: (event: KeyboardEvent) => void
}

export interface FoliateOptions extends FoliateHandlers {
  file: File | null
  initialCfi: string
  settings: Settings
  theme: ThemeMode
  annotations: Annotation[]
}

const frameRectOf = (doc: Document): DOMRect | null => {
  const frame = doc.defaultView?.frameElement as HTMLElement | null
  return frame ? frame.getBoundingClientRect() : null
}

/**
 * The sheet, not the viewport, decides the text column: a huge
 * `max-inline-size` keeps the paginator at one page at a time, and the gap
 * becomes the page margin (see `sheetWidth()` in ReaderScreen).
 */
function applyLayout(view: FoliateView, settings: Settings): void {
  if (view.isFixedLayout) {
    view.renderer.setAttribute('zoom', settings.zoom)
    return
  }
  view.renderer.setAttribute('flow', settings.flow)
  if (settings.flow === 'scrolled') {
    view.renderer.setAttribute('max-inline-size', `${settings.columnWidth}px`)
    view.renderer.removeAttribute('gap')
  } else {
    view.renderer.setAttribute('max-inline-size', '4000px')
    view.renderer.setAttribute('gap', '15%')
  }
}

export function useFoliate(options: FoliateOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<FoliateView | null>(null)
  const handlers = useRef(options)
  const annotationsRef = useRef(options.annotations)
  const settingsRef = useRef(options.settings)
  /** cfi → section index currently painted, so stale marks can be erased. */
  const painted = useRef(new Map<number, Set<string>>())
  /**
   * Where the engine actually drew each mark, in page coordinates. Sale de los
   * rectángulos que foliate ya calcula al pintar: no hay que resolver CFIs ni
   * adivinar cuándo está listo el DOM.
   */
  const drawn = useRef(new Map<string, { index: number; top: number }>())
  const redrawRef = useRef<() => void>(() => undefined)
  const retryTimer = useRef<number | undefined>(undefined)
  const retries = useRef(0)
  const searchToken = useRef(0)

  handlers.current = options
  annotationsRef.current = options.annotations
  settingsRef.current = options.settings

  /** A page can still be painting its text layer: try again in a moment. */
  const scheduleRetry = useCallback(() => {
    if (retryTimer.current || retries.current > 8) return
    retries.current += 1
    retryTimer.current = window.setTimeout(() => {
      retryTimer.current = undefined
      redrawRef.current()
    }, 220)
  }, [])

  const redraw = useCallback(
    (onlyIndex?: number) => {
      const view = viewRef.current
      if (!view?.renderer?.getContents) return
      let contents: { doc: Document; index: number }[] = []
      try {
        contents = view.renderer.getContents()
      } catch {
        return
      }
      for (const content of contents) {
        if (typeof content.index !== 'number') continue
        if (onlyIndex !== undefined && content.index !== onlyIndex) continue
        // al repintar, las posiciones de esta sección se vuelven a calcular
        for (const [id, value] of drawn.current) {
          if (value.index === content.index) drawn.current.delete(id)
        }
        const desired = new Map(
          annotationsRef.current
            .filter((item) => item.kind === 'highlight' && item.index === content.index)
            .map((item) => [item.cfi, item] as const),
        )
        const previous = painted.current.get(content.index) ?? new Set<string>()
        for (const cfi of previous) {
          if (!desired.has(cfi)) {
            void view.deleteAnnotation({ value: cfi }).catch(() => undefined)
          }
        }
        for (const mark of desired.values()) {
          void view
            .addAnnotation({ ...mark, value: mark.cfi })
            .then(() => {
              retries.current = 0
            })
            .catch(scheduleRetry)
        }
        painted.current.set(content.index, new Set(desired.keys()))
      }
    },
    [scheduleRetry],
  )

  redrawRef.current = redraw

  useEffect(
    () => () => {
      if (retryTimer.current) window.clearTimeout(retryTimer.current)
    },
    [],
  )

  // --- open / close the book -------------------------------------------------
  useEffect(() => {
    const container = containerRef.current
    const file = options.file
    if (!container || !file) return

    let disposed = false
    const view = createView()
    view.style.display = 'block'
    view.style.width = '100%'
    view.style.height = '100%'
    container.replaceChildren(view)
    viewRef.current = view
    painted.current.clear()

    const emitSelection = (doc: Document, index: number, range: Range | null) => {
      const text = range ? range.toString().replace(/\s+/g, ' ').trim() : ''
      if (!range || !text) {
        handlers.current.onSelection(null)
        return
      }
      // Triple-click selects an element, not text; move the ends into the
      // deepest text nodes so the CFI describes a real range.
      const normalized = range.cloneRange()
      const deepStart = (node: Node): Text | null =>
        node.nodeType === Node.TEXT_NODE
          ? (node as Text)
          : node.firstChild
            ? deepStart(node.firstChild)
            : null
      const deepEnd = (node: Node): Text | null =>
        node.nodeType === Node.TEXT_NODE
          ? (node as Text)
          : node.lastChild
            ? deepEnd(node.lastChild)
            : null
      if (normalized.startContainer.nodeType !== Node.TEXT_NODE) {
        const start = deepStart(normalized.startContainer)
        if (start) normalized.setStart(start, 0)
      }
      if (normalized.endContainer.nodeType !== Node.TEXT_NODE) {
        const end = deepEnd(normalized.endContainer)
        if (end) normalized.setEnd(end, end.textContent?.length ?? 0)
      }
      const rects = Array.from(normalized.getClientRects()).filter(
        (r) => r.width > 1 && r.height > 1,
      )
      const first = rects[0]
      const last = rects[rects.length - 1]
      const frame = frameRectOf(doc)
      let cfi = ''
      try {
        cfi = view.getCFI(index, normalized)
      } catch {
        return
      }
      handlers.current.onSelection({
        cfi,
        index,
        text: text.slice(0, 500),
        rect: {
          left: (frame?.left ?? 0) + (first?.left ?? 0),
          top: (frame?.top ?? 0) + (first?.top ?? 0),
          width: (last?.right ?? 0) - (first?.left ?? 0),
          height: (last?.bottom ?? 0) - (first?.top ?? 0),
        },
      })
    }

    const readSelection = (doc: Document, index: number) => {
      const selection = doc.getSelection()
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        handlers.current.onSelection(null)
        return
      }
      emitSelection(doc, index, selection.getRangeAt(0))
    }

    const onLoad = (event: Event) => {
      const { doc, index } = (event as CustomEvent).detail as { doc: Document; index: number }
      doc.addEventListener('pointerdown', () => handlers.current.onSelection(null))
      doc.addEventListener('pointerup', () => setTimeout(() => readSelection(doc, index), 10))
      doc.addEventListener('keyup', () => setTimeout(() => readSelection(doc, index), 10))
      // La selección es la del navegador (con sus asas, que funcionan muy bien).
      // `selectionchange` se dispara mientras se arrastran, así que las opciones
      // aparecen durante el sombreado y no solo al soltar.
      let settle = 0
      doc.addEventListener('selectionchange', () => {
        window.clearTimeout(settle)
        settle = window.setTimeout(() => readSelection(doc, index), 120)
      })
      doc.addEventListener('keydown', (event) => handlers.current.onKeyDown(event as KeyboardEvent))
      requestAnimationFrame(() => redraw(index))
    }

    const onRelocate = (event: Event) => {
      handlers.current.onLocation(toLocation((event as CustomEvent).detail as FoliateLocation))
    }

    const onDraw = (event: Event) => {
      const { draw, annotation } = (event as CustomEvent).detail as {
        draw: (fn: unknown, options: unknown) => void
        annotation: Annotation
      }
      // `draw` nos entrega los rectángulos de la marca: de ahí sale su altura
      const capture =
        (next: (rects: DOMRect[], options: unknown) => SVGGElement) =>
        (rects: DOMRect[], options: unknown) => {
          const first = rects[0]
          if (first) drawn.current.set(annotation.id, { index: annotation.index, top: first.top })
          return next(rects, options)
        }
      drawAnnotation(
        (fn, options) => draw(capture((rects, opts) => fn(rects, opts as never)), options),
        annotation,
      )
    }

    const onShowAnnotation = (event: Event) => {
      const { value, range } = (event as CustomEvent).detail as { value: string; range: Range }
      const annotation = annotationsRef.current.find((item) => item.cfi === value)
      if (!annotation) return
      const rect = range.getBoundingClientRect()
      const frame = frameRectOf(range.startContainer.ownerDocument ?? document)
      handlers.current.onAnnotationClick(annotation.id, {
        left: (frame?.left ?? 0) + rect.left,
        top: (frame?.top ?? 0) + rect.bottom,
        width: rect.width,
        height: rect.height,
      })
    }

    view.addEventListener('load', onLoad)
    view.addEventListener('relocate', onRelocate)
    view.addEventListener('draw-annotation', onDraw)
    view.addEventListener('show-annotation', onShowAnnotation)

    void (async () => {
      try {
        await view.open(file)
        if (disposed) return

        const fixedLayout = Boolean(view.isFixedLayout)
        const settings = settingsRef.current
        handlers.current.onBook({
          title: bookTitle(view.book.metadata) || 'Sin título',
          author: bookAuthor(view.book.metadata),
          toc: normalizeToc(view.book.toc),
          fixedLayout,
        })

        if (!fixedLayout) {
          view.renderer.setAttribute('animated', '')
        }
        applyLayout(view, settings)
        view.renderer.setStyles?.(bookStyles(settings, options.theme, fixedLayout))

        try {
          await view.init({
            lastLocation: options.initialCfi || undefined,
            showTextStart: true,
          })
        } catch {
          await view.goTo(0).catch(() => undefined)
        }
        if (disposed) return
        // the first section can finish loading before the renderer exposes its
        // contents, so paint once more now that the page is definitely there
        requestAnimationFrame(() => redraw())
        handlers.current.onReady()
      } catch (error) {
        if (!disposed) handlers.current.onError(error)
      }
    })()

    return () => {
      disposed = true
      view.removeEventListener('load', onLoad)
      view.removeEventListener('relocate', onRelocate)
      view.removeEventListener('draw-annotation', onDraw)
      view.removeEventListener('show-annotation', onShowAnnotation)
      try {
        view.close()
      } catch {
        /* already gone */
      }
      view.remove()
      if (viewRef.current === view) viewRef.current = null
    }
    // Re-opens only when the file changes; settings and marks are pushed into
    // the live view by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.file])

  // --- settings --------------------------------------------------------------
  useEffect(() => {
    const view = viewRef.current
    if (!view?.renderer) return
    applyLayout(view, options.settings)
    view.renderer.setStyles?.(bookStyles(options.settings, options.theme, view.isFixedLayout))
  }, [options.settings, options.theme])

  // --- annotations -----------------------------------------------------------
  useEffect(() => {
    redraw()
  }, [options.annotations, redraw])

  const goTo = useCallback(async (target: string | number) => {
    await viewRef.current?.goTo(target).catch(() => undefined)
  }, [])

  const goToFraction = useCallback(async (fraction: number) => {
    await viewRef.current?.goToFraction(fraction).catch(() => undefined)
  }, [])

  const next = useCallback(() => {
    void viewRef.current?.next().catch(() => undefined)
  }, [])

  const prev = useCallback(() => {
    void viewRef.current?.prev().catch(() => undefined)
  }, [])

  const goLeft = useCallback(() => {
    void viewRef.current?.goLeft().catch(() => undefined)
  }, [])

  const goRight = useCallback(() => {
    void viewRef.current?.goRight().catch(() => undefined)
  }, [])

  const deselect = useCallback(() => viewRef.current?.deselect(), [])

  const addAnnotation = useCallback((annotation: Annotation) => {
    void viewRef.current
      ?.addAnnotation({ ...annotation, value: annotation.cfi })
      .catch(() => undefined)
  }, [])

  const removeAnnotation = useCallback((annotation: Annotation) => {
    void viewRef.current
      ?.deleteAnnotation({ value: annotation.cfi })
      .catch(() => undefined)
  }, [])

  /**
   * Whole-book search. foliate walks the sections and yields progress plus the
   * matches of each one, so the panel can fill up while it works.
   */
  const search = useCallback(
    async (
      query: string,
      onProgress: (value: number) => void,
      onResults: (
        label: string,
        items: { cfi: string; excerpt: { pre: string; match: string; post: string } }[],
      ) => void,
    ) => {
      const view = viewRef.current
      if (!view?.search) return
      searchToken.current += 1
      const token = searchToken.current
      view.clearSearch()
      try {
        for await (const chunk of view.search({
          query,
          draw: searchDraw,
          drawOptions: searchDrawOptions,
        })) {
          if (searchToken.current !== token) return
          if (chunk === 'done') break
          if ('progress' in chunk) onProgress(chunk.progress)
          if ('subitems' in chunk && chunk.subitems.length) {
            onResults(chunk.label ?? '', chunk.subitems)
          }
        }
      } catch (error) {
        console.warn('[search]', error)
      }
    },
    [],
  )

  const clearSearch = useCallback(() => {
    searchToken.current += 1
    viewRef.current?.clearSearch()
  }, [])

  /** Y position (viewport px) of every mark the engine has painted. */
  const markAnchors = useCallback((): Record<string, number> => {
    const view = viewRef.current
    if (!view?.renderer?.getContents) return {}
    let frameTop = 0
    try {
      const contents = view.renderer.getContents()
      frameTop = frameRectOf(contents[0]?.doc ?? document)?.top ?? 0
    } catch {
      return {}
    }
    const out: Record<string, number> = {}
    for (const [id, value] of drawn.current) out[id] = frameTop + value.top
    return out
  }, [])

  return {
    containerRef,
    goTo,
    goToFraction,
    next,
    prev,
    goLeft,
    goRight,
    deselect,
    addAnnotation,
    removeAnnotation,
    redraw,
    search,
    clearSearch,
    markAnchors,
  }
}

