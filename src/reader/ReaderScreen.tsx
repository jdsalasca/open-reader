import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar, { type PanelTab, type SearchState } from './Sidebar'
import SelectionPopover from './SelectionPopover'
import NoteDialog from './NoteDialog'
import QuoteDialog from './QuoteDialog'
import MarginNotes from './MarginNotes'
import { useFoliate, type BookInfo, type Rect } from './useFoliate'
import {
  exportBackup,
  importBackup,
  loadBook,
  saveBook,
  touchLibrary,
} from '../lib/storage'
import { bookToMarkdown } from '../lib/exportMarkdown'
import { formatOf, titleFromName } from '../lib/book'
import { downloadText, percent, uid } from '../lib/format'
import { Icon } from '../components/Icons'
import type {
  Annotation,
  BookMeta,
  BookProgress,
  HighlightColor,
  HighlightStyle,
  LocationInfo,
  SelectionInfo,
  Settings,
} from '../lib/types'

const EMPTY_PROGRESS: BookProgress = { cfi: '', fraction: 0, chapter: '' }

interface Props {
  file: File
  bookId: string
  settings: Settings
  patchSettings: (patch: Partial<Settings>) => void
  onExit: () => void
}

interface PopoverState {
  mode: 'new' | 'edit'
  id?: string
  rect: Rect
}

interface NoteTarget {
  id?: string
  quote: string
  initial: string
}

interface QuoteTarget {
  id?: string
  text: string
  color: HighlightColor
  saved: boolean
  cfi?: string
  index?: number
  chapter?: string
}

export default function ReaderScreen({
  file,
  bookId,
  settings,
  patchSettings,
  onExit,
}: Props) {
  const stored = useRef(loadBook(bookId))
  const openedAt = useRef(Date.now())

  const [info, setInfo] = useState<BookInfo | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>(
    stored.current?.annotations ?? [],
  )
  const [progress, setProgress] = useState<BookProgress>(
    stored.current?.progress ?? EMPTY_PROGRESS,
  )
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [note, setNote] = useState<NoteTarget | null>(null)
  const [quote, setQuote] = useState<QuoteTarget | null>(null)
  const [search, setSearch] = useState<SearchState>({
    query: '',
    progress: 0,
    running: false,
    results: [],
  })
  const [tab, setTab] = useState<PanelTab>('toc')
  const [rail, setRail] = useState(() => window.innerWidth > 980)
  const [toast, setToast] = useState<string | null>(null)
  const [isFull, setIsFull] = useState(false)
  const [scrub, setScrub] = useState<number | null>(null)
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => undefined)

  const meta: BookMeta | null = info
    ? {
        id: bookId,
        title: info.title,
        author: info.author,
        format: formatOf(file.name),
        fixedLayout: info.fixedLayout,
        addedAt: stored.current?.meta.addedAt ?? openedAt.current,
        lastOpenedAt: openedAt.current,
      }
    : null

  const snapshot = useRef({ meta, annotations, progress })
  snapshot.current = { meta, annotations, progress }

  const persist = useCallback(() => {
    const current = snapshot.current
    if (!current.meta) return
    saveBook({
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

  const foliate = useFoliate({
    file,
    initialCfi: stored.current?.progress.cfi ?? '',
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
      if (next) setPopover({ mode: 'new', rect: next.rect })
      else setPopover((current) => (current?.mode === 'new' ? null : current))
    },
    onAnnotationClick: (id, rect) => setPopover({ mode: 'edit', id, rect }),
    onError: (cause) => {
      console.error(cause)
      setError(
        'No se pudo abrir el libro. Puede estar protegido con DRM, dañado o en un formato que el motor no entiende.',
      )
    },
    onReady: () => setReady(true),
    onKeyDown: (event) => keyHandler.current(event),
  })

  const flash = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2200)
  }, [])

  const createMark = useCallback(
    (extra: {
      color?: HighlightColor
      style?: HighlightStyle
      note?: string
      quoted?: boolean
    }) => {
      if (!selection) return
      const annotation: Annotation = {
        id: uid(),
        kind: 'highlight',
        cfi: selection.cfi,
        index: selection.index,
        text: selection.text,
        note: extra.note ?? '',
        color: extra.color ?? 'amber',
        style: extra.style ?? 'highlight',
        chapter: location?.chapter ?? '',
        createdAt: Date.now(),
        quoted: extra.quoted,
      }
      setAnnotations((list) => [...list, annotation])
      foliate.addAnnotation(annotation)
      foliate.deselect()
      setSelection(null)
      setPopover(null)
    },
    [selection, location?.chapter, foliate],
  )

  const updateMark = useCallback((id: string, patch: Partial<Annotation>) => {
    setAnnotations((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }, [])

  const deleteMark = useCallback(
    (id: string) => {
      const target = annotations.find((item) => item.id === id)
      if (target) foliate.removeAnnotation(target)
      setAnnotations((list) => list.filter((item) => item.id !== id))
      setPopover(null)
      flash(target?.kind === 'bookmark' ? 'Marcador eliminado' : 'Anotación eliminada')
    },
    [annotations, foliate, flash],
  )

  const addBookmark = useCallback(() => {
    if (!location?.cfi) return
    const existing = annotations.find(
      (item) => item.kind === 'bookmark' && item.cfi === location.cfi,
    )
    if (existing) {
      deleteMark(existing.id)
      return
    }
    setAnnotations((list) => [
      ...list,
      {
        id: uid(),
        kind: 'bookmark',
        cfi: location.cfi,
        index: location.index,
        text:
          location.chapter ||
          (location.page ? `Página ${location.page}` : `Página ${location.index + 1}`),
        note: '',
        color: 'rust',
        style: 'highlight',
        chapter: location.chapter,
        createdAt: Date.now(),
      },
    ])
    flash('Página marcada')
  }, [location, annotations, deleteMark, flash])

  const applyMark = useCallback(
    (patch: { color?: HighlightColor; style?: HighlightStyle }) => {
      if (popover?.mode === 'edit' && popover.id) {
        updateMark(popover.id, patch)
        return
      }
      createMark(patch)
    },
    [popover, updateMark, createMark],
  )

  const runSearch = useCallback(
    async (raw: string) => {
      const query = raw.trim()
      if (query.length < 2) {
        foliate.clearSearch()
        setSearch({ query, progress: 0, running: false, results: [] })
        return
      }
      setSearch({ query, progress: 0, running: true, results: [] })
      await foliate.search(
        query,
        (progress) =>
          setSearch((current) => (current.query === query ? { ...current, progress } : current)),
        (label, items) =>
          setSearch((current) =>
            current.query === query
              ? { ...current, results: [...current.results, { label, items }] }
              : current,
          ),
      )
      setSearch((current) =>
        current.query === query ? { ...current, running: false } : current,
      )
    },
    [foliate],
  )

  const clearSearch = useCallback(() => {
    foliate.clearSearch()
    setSearch({ query: '', progress: 0, running: false, results: [] })
  }, [foliate])

  const openQuote = useCallback(
    (source: Annotation | null) => {
      if (source) {
        setQuote({
          id: source.id,
          text: source.text,
          color: source.color,
          saved: Boolean(source.quoted),
          cfi: source.cfi,
          index: source.index,
          chapter: source.chapter,
        })
        return
      }
      if (selection) {
        setQuote({
          text: selection.text,
          color: 'amber',
          saved: false,
          cfi: selection.cfi,
          index: selection.index,
          chapter: location?.chapter ?? '',
        })
      }
    },
    [selection, location?.chapter],
  )

  const saveQuote = useCallback(() => {
    if (!quote) return
    if (quote.id) {
      updateMark(quote.id, { quoted: true })
    } else if (quote.cfi) {
      const annotation: Annotation = {
        id: uid(),
        kind: 'highlight',
        cfi: quote.cfi,
        index: quote.index ?? 0,
        text: quote.text,
        note: '',
        color: quote.color,
        style: 'highlight',
        chapter: quote.chapter ?? '',
        createdAt: Date.now(),
        quoted: true,
      }
      setAnnotations((list) => [...list, annotation])
      foliate.addAnnotation(annotation)
      foliate.deselect()
      setSelection(null)
      setPopover(null)
      setQuote((current) =>
        current ? { ...current, saved: true, id: annotation.id } : current,
      )
    }
    flash('Guardada en citas')
  }, [quote, updateMark, foliate, flash])

  const exportMarkdown = useCallback(() => {
    if (!meta) return
    const slug =
      meta.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'libro'
    downloadText(`notas-${slug}.md`, bookToMarkdown({ meta, progress, annotations }))
    flash('Markdown exportado')
  }, [meta, progress, annotations, flash])

  const toggleFull = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      flash('El navegador no permitió pantalla completa')
    }
  }, [flash])

  const toggleTheme = useCallback(() => {
    patchSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
  }, [patchSettings, settings.theme])

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return
      const key = event.key
      if ((event.ctrlKey || event.metaKey) && (key === 'f' || key === 'F')) {
        event.preventDefault()
        setTab('search')
        setRail(true)
        return
      }
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
        case 'b':
          event.preventDefault()
          addBookmark()
          break
        case 'f':
          event.preventDefault()
          void toggleFull()
          break
        case 't':
          event.preventDefault()
          toggleTheme()
          break
        case 'Escape':
          setPopover(null)
          setSelection(null)
          break
        default:
          break
      }
    },
    [foliate, addBookmark, toggleFull, toggleTheme],
  )

  useEffect(() => {
    const handler = (event: KeyboardEvent) => handleKey(event)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleKey])

  keyHandler.current = handleKey

  useEffect(() => {
    const handler = () => setIsFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    if (!info) return
    document.title = `${info.title} · Open Reader`
    return () => {
      document.title = 'Open Reader'
    }
  }, [info])

  const current = popover?.id
    ? annotations.find((item) => item.id === popover.id) ?? null
    : null
  const bookmarked = Boolean(
    location?.cfi && annotations.some((item) => item.kind === 'bookmark' && item.cfi === location.cfi),
  )
  const marks = annotations.filter((item) => item.kind === 'highlight').length

  const openNote = () => {
    if (current) {
      setNote({ id: current.id, quote: current.text, initial: current.note })
    } else if (selection) {
      setNote({ quote: selection.text, initial: '' })
    }
  }

  const saveNote = (text: string) => {
    if (note?.id) updateMark(note.id, { note: text })
    else if (note) createMark({ note: text })
    setNote(null)
    setPopover(null)
  }

  const exportThis = () => {
    if (!meta) return
    downloadText(
      `notas-${meta.title.replace(/[^\w\-]+/g, '-').slice(0, 40) || 'libro'}.eridu`,
      exportBackup([{ meta, progress, annotations }]),
    )
    flash('Notas exportadas')
  }

  const importHere = async (picked: File) => {
    try {
      importBackup(await picked.text())
      const reloaded = loadBook(bookId)
      if (reloaded) setAnnotations(reloaded.annotations)
      flash('Notas importadas')
    } catch {
      flash('No se pudo importar ese archivo')
    }
  }

  const clearMarks = () => {
    if (!window.confirm('¿Borrar todas las notas y marcadores de este libro?')) return
    setAnnotations([])
    setProgress(EMPTY_PROGRESS)
    setPopover(null)
    flash('Notas borradas')
  }

  return (
    <div className={`reader${rail ? ' is-rail-open' : ''}`}>
      <header className="topbar">
        <div className="topbar__left">
          <button className="icon-btn" type="button" onClick={onExit} title="Volver a la estantería">
            <Icon name="arrow-left" />
          </button>
          <div className="topbar__id">
            <span className="topbar__title">{info?.title ?? titleFromName(file.name)}</span>
            <span className="topbar__meta">
              {info?.author || 'Autor desconocido'}
              {info ? ` · ${formatOf(file.name)}` : ''}
            </span>
          </div>
        </div>

        <div className="topbar__chapter">
          <span className="topbar__chapter-label">{location?.chapter || 'Portada'}</span>
        </div>

        <div className="topbar__actions">
          <button
            className={`icon-btn${bookmarked ? ' is-active' : ''}`}
            type="button"
            onClick={addBookmark}
            title="Marcar esta página (b)"
          >
            <Icon name={bookmarked ? 'bookmark-filled' : 'bookmark'} />
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={() => {
              setTab('notes')
              setRail(true)
            }}
            title="Notas y resaltados"
          >
            <Icon name="highlighter" />
            {marks > 0 && <span className="badge">{marks}</span>}
          </button>
          <button className="icon-btn" type="button" onClick={toggleTheme} title="Tema (t)">
            <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={() => void toggleFull()}
            title="Pantalla completa (f)"
          >
            <Icon name={isFull ? 'shrink' : 'expand'} />
          </button>
          <button
            className={`icon-btn${rail ? ' is-active' : ''}`}
            type="button"
            onClick={() => setRail((value) => !value)}
            title="Panel lateral"
          >
            <Icon name="list" />
          </button>
        </div>
      </header>

      <div className="reader__body">
        <Sidebar
          tab={tab}
          onTab={setTab}
          info={info}
          annotations={annotations}
          location={location}
          settings={settings}
          patchSettings={patchSettings}
          onGoTo={(cfi) => {
            void foliate.goTo(cfi)
            setPopover(null)
            if (window.innerWidth <= 980) setRail(false)
          }}
          onDelete={deleteMark}
          onEditNote={(annotation) =>
            setNote({ id: annotation.id, quote: annotation.text, initial: annotation.note })
          }
          onLike={(annotation) => updateMark(annotation.id, { liked: !annotation.liked })}
          onQuote={(annotation) => openQuote(annotation)}
          search={search}
          onSearch={runSearch}
          onClearSearch={clearSearch}
          onExport={exportThis}
          onExportMarkdown={exportMarkdown}
          onImport={importHere}
          onClear={clearMarks}
          onClose={() => setRail(false)}
        />

        <main className="stage">
          <div
            className="stage__sheet"
            style={
              info && !info.fixedLayout
                ? { maxWidth: Math.round(settings.columnWidth * 1.214) }
                : undefined
            }
          >
            <div className="stage__view" ref={foliate.containerRef} />
            {!ready && !error && (
              <div className="stage__loading">
                <span className="spinner" aria-hidden="true" />
                <p>Preparando el libro…</p>
              </div>
            )}
            {error && (
              <div className="stage__error">
                <h2>No se pudo abrir</h2>
                <p>{error}</p>
                <button className="btn btn--accent" type="button" onClick={onExit}>
                  Volver
                </button>
              </div>
            )}
          </div>

          {settings.marginNotes && (
            <MarginNotes
              annotations={annotations.filter((item) => item.index === location?.index)}
              chapter={location?.chapter ?? ''}
              onOpen={(annotation) => {
                void foliate.goTo(annotation.cfi)
                setPopover(null)
              }}
              onLike={(annotation) => updateMark(annotation.id, { liked: !annotation.liked })}
              onDelete={deleteMark}
            />
          )}
        </main>

        {rail && (
          <button
            className="rail-backdrop"
            type="button"
            aria-label="Cerrar panel"
            onClick={() => setRail(false)}
          />
        )}
      </div>

      <footer className="statusbar">
        <button
          className="icon-btn icon-btn--ghost"
          type="button"
          onClick={foliate.prev}
          title="Página anterior"
        >
          <Icon name="chevron-left" />
        </button>
        <input
          className="progress"
          type="range"
          min={0}
          max={1000}
          value={scrub ?? Math.round((location?.fraction ?? 0) * 1000)}
          onChange={(event) => setScrub(Number(event.target.value))}
          onPointerUp={() => {
            if (scrub === null) return
            void foliate.goToFraction(scrub / 1000)
            setScrub(null)
          }}
          onKeyUp={() => {
            if (scrub === null) return
            void foliate.goToFraction(scrub / 1000)
            setScrub(null)
          }}
          aria-label="Progreso de lectura"
        />
        <button
          className="icon-btn icon-btn--ghost"
          type="button"
          onClick={foliate.next}
          title="Página siguiente"
        >
          <Icon name="chevron-right" />
        </button>
        <span className="statusbar__readout">
          <strong>{percent(location?.fraction ?? 0)}</strong>
          <span className="statusbar__sep">/</span>
          <span>{location?.page ? `pág. ${location.page}` : location?.chapter || 'sin ubicar'}</span>
        </span>
      </footer>

      {popover && (current || selection) && (
        <SelectionPopover
          mode={popover.mode}
          annotation={current}
          rect={popover.rect}
          onApply={applyMark}
          onNote={openNote}
          onQuote={() => openQuote(null)}
          onDelete={current ? () => deleteMark(current.id) : undefined}
          onClose={() => {
            setPopover(null)
            setSelection(null)
            foliate.deselect()
          }}
        />
      )}

      <NoteDialog
        open={Boolean(note)}
        quote={note?.quote ?? ''}
        initial={note?.initial ?? ''}
        onSave={saveNote}
        onClose={() => setNote(null)}
      />

      <QuoteDialog
        open={Boolean(quote)}
        text={quote?.text ?? ''}
        author={info?.author ?? ''}
        title={info?.title ?? titleFromName(file.name)}
        color={quote?.color ?? 'amber'}
        saved={Boolean(quote?.saved)}
        onSave={saveQuote}
        onClose={() => setQuote(null)}
      />

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
