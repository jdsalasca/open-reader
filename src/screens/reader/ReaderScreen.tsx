import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { Icon } from '../../components/Icons'
import { highlightFrom } from '../../core/annotation'
import { formatOf } from '../../core/book'
import { loadBook, saveBook, touchLibrary } from '../../core/storage'
import { keepScreenAwake } from '../../core/wakeLock'
import type {
  Annotation,
  BookMeta,
  BookProgress,
  BookRecord,
  LocationInfo,
  SelectionInfo,
  Settings,
} from '../../core/types'
import { ReaderProvider, type NoteDraft, type QuoteDraft, type ReaderStore, type SearchState } from '../../viewer/ReaderContext'
import { createRegistry } from '../../viewer/plugins/registry'
import { plugins } from '../../viewer/plugins'
import { SEARCH_TAB } from '../../features/search/plugin'
import { useFoliate, type BookInfo, type Rect } from '../../viewer/useFoliate'
import BookPanel from './BookPanel'
import StatusBar from './StatusBar'
import TopBar from './TopBar'

const EMPTY_PROGRESS: BookProgress = { cfi: '', fraction: 0, chapter: '' }
const EMPTY_SEARCH: SearchState = { query: '', progress: 0, running: false, results: [] }

/** Static list, so the registry is built once per module load. */
const registry = createRegistry(plugins)

interface Props {
  file: File
  bookId: string
  settings: Settings
  patchSettings: (patch: Partial<Settings>) => void
  onExit: () => void
}

export default function ReaderScreen(props: Props) {
  const { t } = useI18n()
  const [stored, setStored] = useState<BookRecord | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    void loadBook(props.bookId).then((record) => {
      if (alive) setStored(record)
    })
    return () => {
      alive = false
    }
  }, [props.bookId])

  if (stored === undefined) {
    return (
      <div className="reader reader--loading">
        <div className="stage__loading">
          <span className="spinner" aria-hidden="true" />
          <p>{t('reader.loading')}</p>
        </div>
      </div>
    )
  }

  return <ReaderBook {...props} stored={stored} />
}

interface BookProps extends Props {
  stored: BookRecord | null
}

function ReaderBook({ file, bookId, settings, patchSettings, onExit, stored }: BookProps) {
  const { t } = useI18n()
  const openedAt = useRef(Date.now())

  const [info, setInfo] = useState<BookInfo | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>(stored?.annotations ?? [])
  const [progress, setProgress] = useState<BookProgress>(stored?.progress ?? EMPTY_PROGRESS)
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [active, setActive] = useState<{ annotation: Annotation; rect: Rect } | null>(null)
  const [search, setSearch] = useState<SearchState>(EMPTY_SEARCH)
  const [panel, setPanel] = useState({
    open: settings.railOpen && window.innerWidth > 980,
    tab: registry.tabs[0]?.id ?? 'toc',
  })
  const [note, setNote] = useState<NoteDraft | null>(null)
  const [quote, setQuote] = useState<QuoteDraft | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const handlerRef = useRef<(event: KeyboardEvent) => void>(() => undefined)
  const sheetRef = useRef<HTMLDivElement | null>(null)

  const meta: BookMeta | null = info
    ? {
        id: bookId,
        title: info.title,
        author: info.author,
        format: formatOf(file.name),
        fixedLayout: info.fixedLayout,
        addedAt: stored?.meta.addedAt ?? openedAt.current,
        lastOpenedAt: openedAt.current,
      }
    : null

  const snapshot = useRef({ meta, annotations, progress })
  snapshot.current = { meta, annotations, progress }

  const persist = useCallback(() => {
    const current = snapshot.current
    if (!current.meta) return
    void saveBook({
      meta: current.meta,
      progress: current.progress,
      annotations: current.annotations,
    })
    touchLibrary({
      id: current.meta.id,
      title: current.meta.title,
      author: current.meta.author,
      format: current.meta.format,
      fraction: current.progress.fraction,
      lastOpenedAt: Date.now(),
    })
  }, [])

  useEffect(() => {
    if (info) persist()
  }, [annotations, info, persist])

  useEffect(() => {
    const timer = setTimeout(persist, 600)
    return () => clearTimeout(timer)
  }, [progress, persist])

  const flash = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2200)
  }, [])

  const foliate = useFoliate({
    file,
    initialCfi: stored?.progress.cfi ?? '',
    settings,
    theme: settings.theme,
    annotations,
    onBook: setInfo,
    onLocation: (next) => {
      setLocation(next)
      setProgress({ cfi: next.cfi, fraction: next.fraction, chapter: next.chapter })
    },
    onSelection: (next) => {
      setSelection(next)
      if (next) setActive(null)
    },
    onAnnotationClick: (id, rect) => {
      const annotation = annotations.find((item) => item.id === id)
      if (annotation) setActive({ annotation, rect })
    },
    onError: (cause) => {
      console.error(cause)
      setError(t('reader.error.body'))
    },
    onReady: () => setReady(true),
    onKeyDown: (event) => handlerRef.current(event),
  })

  useEffect(() => {
    if (!info) return
    document.title = `${info.title} · Open Reader`
    return () => {
      document.title = 'Open Reader'
    }
  }, [info])

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // El ojito de la barra: mantiene la pantalla encendida mientras se lee.
  useEffect(() => keepScreenAwake(settings.keepAwake), [settings.keepAwake])

  const openPanel = (tab?: string) => {
    setPanel((current) => ({ open: true, tab: tab ?? current.tab }))
    patchSettings({ railOpen: true })
  }

  const closePanel = () => {
    setPanel((current) => ({ ...current, open: false }))
    patchSettings({ railOpen: false })
  }

  const dismiss = () => {
    setSelection(null)
    setActive(null)
    foliate.deselect()
  }

  const store: ReaderStore = {
    book: info,
    meta,
    ready,
    settings,
    patchSettings,
    t,
    flash,

    location,
    progress,
    selection,
    active,
    annotations,

    addAnnotation(annotation) {
      setAnnotations((list) => [...list, annotation])
      foliate.addAnnotation(annotation)
    },
    updateAnnotation(id, patch) {
      setAnnotations((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    },
    deleteAnnotation(id) {
      const target = annotations.find((item) => item.id === id)
      if (target) foliate.removeAnnotation(target)
      setAnnotations((list) => list.filter((item) => item.id !== id))
      setActive(null)
      flash(t(target?.kind === 'bookmark' ? 'reader.toast.unbookmarked' : 'reader.toast.deleted'))
    },
    setAnnotations,
    highlight(patch = {}) {
      if (!selection) return null
      const annotation = highlightFrom(selection, location?.chapter ?? '', patch)
      setAnnotations((list) => [...list, annotation])
      foliate.addAnnotation(annotation)
      dismiss()
      return annotation
    },
    dismiss,

    goTo(target) {
      void foliate.goTo(target)
      setActive(null)
      if (window.innerWidth <= 980) closePanel()
    },
    goToFraction: (fraction) => void foliate.goToFraction(fraction),
    next: foliate.next,
    prev: foliate.prev,
    deselect: foliate.deselect,
    fullscreen,
    async toggleFullscreen() {
      try {
        if (document.fullscreenElement) await document.exitFullscreen()
        else await document.documentElement.requestFullscreen()
      } catch {
        flash(t('reader.toast.fullscreenFail'))
      }
    },
    markAnchors: foliate.markAnchors,
    search,
    runSearch(raw) {
      const query = raw.trim()
      if (query.length < 2) {
        foliate.clearSearch()
        setSearch({ ...EMPTY_SEARCH, query })
        return
      }
      setSearch({ query, progress: 0, running: true, results: [] })
      void foliate
        .search(
          query,
          (value) => setSearch((current) => (current.query === query ? { ...current, progress: value } : current)),
          (label, items) =>
            setSearch((current) =>
              current.query === query
                ? { ...current, results: [...current.results, { label, items }] }
                : current,
            ),
        )
        .then(() =>
          setSearch((current) => (current.query === query ? { ...current, running: false } : current)),
        )
    },
    clearSearch() {
      foliate.clearSearch()
      setSearch(EMPTY_SEARCH)
    },

    panel,
    openPanel,
    closePanel,
    togglePanel: () => (panel.open ? closePanel() : openPanel()),

    note,
    openNote: setNote,
    closeNote: () => setNote(null),
    quote,
    openQuote: setQuote,
    closeQuote: () => setQuote(null),

    resetProgress: () => setProgress(EMPTY_PROGRESS),
  }

  /**
   * Los márgenes vacíos del escenario también pasan página: izquierda atrás,
   * derecha adelante. Se compara con la caja real de la hoja, así que el texto
   * y el margen de notas nunca pierden un clic.
   */
  const turnFromStage = (event: React.MouseEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (selection || active) {
      dismiss()
      return
    }
    const sheet = sheetRef.current?.getBoundingClientRect()
    if (!sheet) return
    if (event.clientX < sheet.left) foliate.prev()
    else if (event.clientX > sheet.right) foliate.next()
  }

  const handleKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return
    const key = event.key

    if ((event.ctrlKey || event.metaKey) && (key === 'f' || key === 'F')) {
      event.preventDefault()
      openPanel(SEARCH_TAB)
      return
    }
    if (registry.key(store, event)) return

    const goNext = () => {
      event.preventDefault()
      foliate.next()
    }
    const goPrev = () => {
      event.preventDefault()
      foliate.prev()
    }

    switch (key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        goNext()
        break
      case 'ArrowLeft':
      case 'PageUp':
        goPrev()
        break
      case 'Home':
        event.preventDefault()
        void foliate.goTo(0)
        break
      case 'End':
        event.preventDefault()
        void foliate.goToFraction(1)
        break
      case 'f':
        event.preventDefault()
        void store.toggleFullscreen()
        break
      case 't':
        event.preventDefault()
        patchSettings({ theme: settings.theme === 'industrial' ? 'paper' : 'industrial' })
        break
      case 'Escape':
        dismiss()
        break
      default:
        break
    }
  }

  handlerRef.current = handleKey

  useEffect(() => {
    const handler = (event: KeyboardEvent) => handlerRef.current(event)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <ReaderProvider value={store}>
      <div className={`reader${panel.open ? ' is-rail-open' : ''}`}>
        <TopBar file={file} onExit={onExit} actions={registry.actions} />

        <div className="reader__body">
          {panel.open && <BookPanel tabs={registry.tabs} />}

          <main className="stage" onClick={turnFromStage}>
            <div
              className="stage__sheet"
              ref={sheetRef}
              style={
                info && !info.fixedLayout
                  ? { maxWidth: Math.round(settings.columnWidth * 1.214) }
                  : undefined
              }
            >
              <div className="stage__view" ref={foliate.containerRef} />
              {registry.pages.map((Page, index) => (
                <Page key={index} />
              ))}
              {!ready && !error && (
                <div className="stage__loading">
                  <span className="spinner" aria-hidden="true" />
                  <p>{t('reader.loading')}</p>
                </div>
              )}
              {error && (
                <div className="stage__error">
                  <h2>{t('reader.error.title')}</h2>
                  <p>{error}</p>
                  <button className="btn btn--accent" type="button" onClick={onExit}>
                    {t('reader.error.back')}
                  </button>
                </div>
              )}
            </div>

            {registry.asides.map((Aside, index) => (
              <Aside key={index} />
            ))}
          </main>

          {panel.open && (
            <button
              className="rail-backdrop"
              type="button"
              aria-label={t('rail.close')}
              onClick={closePanel}
            />
          )}

          {!panel.open && (
            <button
              className="rail__handle"
              type="button"
              onClick={() => openPanel()}
              title={t('rail.expand')}
              aria-label={t('rail.expand')}
            >
              <Icon name="chevron-right" size={14} />
            </button>
          )}
        </div>

        <StatusBar />

        {registry.overlays.map((Overlay, index) => (
          <Overlay key={index} />
        ))}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </ReaderProvider>
  )
}
