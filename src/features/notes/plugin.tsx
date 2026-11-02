import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icons'
import { HIGHLIGHT_COLORS } from '../../core/reading'
import { relativeTime } from '../../core/format'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'
import type { Annotation } from '../../core/types'
import type { ViewerPlugin } from '../../viewer/plugins/types'
import MarginNotes from './MarginNotes'
import NoteDialog from './NoteDialog'

export const NOTES_TAB = 'notes'

const highlights = (annotations: Annotation[]) =>
  annotations.filter((item) => item.kind === 'highlight')

function NotesPanel() {
  const { t, locale } = useI18n()
  const { annotations, goTo, updateAnnotation, deleteAnnotation, openNote, openQuote } = useReader()
  const list = highlights(annotations)
  const quotes = list.filter((item) => item.quoted)

  const editNote = (item: Annotation) =>
    openNote({ id: item.id, quote: item.text, initial: item.note })
  const quoteOf = (item: Annotation) =>
    openQuote({
      id: item.id,
      text: item.text,
      color: item.color,
      chapter: item.chapter,
      cfi: item.cfi,
      index: item.index,
      saved: Boolean(item.quoted),
    })

  if (!list.length) return <p className="empty">{t('notes.empty')}</p>

  return (
    <div className="panel">
      <ul className="marks">
        {list.map((item) => (
          <li key={item.id} className="mark">
            <button type="button" className="mark__body" onClick={() => goTo(item.cfi)}>
              <span
                className="mark__swatch"
                style={{ background: HIGHLIGHT_COLORS[item.color].hex }}
              />
              <span className="mark__text">
                <q>{item.text}</q>
                {item.note && <span className="mark__note">{item.note}</span>}
                <span className="mark__meta">
                  {item.quoted && <b className="mark__star">★ {t('quote.title')}</b>}
                  {item.chapter || t('search.noChapter')} · {relativeTime(item.createdAt, locale)}
                </span>
              </span>
            </button>
            <div className="mark__tools">
              <button
                className={`icon-btn icon-btn--ghost${item.quoted ? ' is-liked' : ''}`}
                type="button"
                title={t('notes.quote')}
                onClick={() => quoteOf(item)}
              >
                <Icon name="quote" size={15} />
              </button>
              <button
                className={`icon-btn icon-btn--ghost${item.liked ? ' is-liked' : ''}`}
                type="button"
                title={item.liked ? t('notes.unlike') : t('notes.like')}
                aria-pressed={Boolean(item.liked)}
                onClick={() => updateAnnotation(item.id, { liked: !item.liked })}
              >
                <Icon name={item.liked ? 'heart-filled' : 'heart'} size={15} />
              </button>
              <button
                className="icon-btn icon-btn--ghost"
                type="button"
                title={t('notes.edit')}
                onClick={() => editNote(item)}
              >
                <Icon name="pencil" size={15} />
              </button>
              <button
                className="icon-btn icon-btn--ghost"
                type="button"
                title={t('notes.delete')}
                onClick={() => deleteAnnotation(item.id)}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {quotes.length > 0 && <p className="panel__foot">{t('notes.inQuotes', { n: quotes.length })}</p>}
    </div>
  )
}

function NotesAction() {
  const { t } = useI18n()
  const { annotations, panel, openPanel } = useReader()

  return (
    <button
      className={`icon-btn${panel.open && panel.tab === NOTES_TAB ? ' is-active' : ''}`}
      type="button"
      onClick={() => openPanel(NOTES_TAB)}
      title={t('reader.notes')}
    >
      <Icon name="highlighter" />
      {highlights(annotations).length > 0 && (
        <span className="badge">{highlights(annotations).length}</span>
      )}
    </button>
  )
}

/** The margin column: only for the section on screen, only if enabled. */
function MarginAside() {
  const { settings, location, annotations, markAnchors, goTo, updateAnnotation, deleteAnnotation } =
    useReader()
  const [collapsed, setCollapsed] = useState(false)
  const [anchors, setAnchors] = useState<Record<string, number>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setAnchors(markAnchors()), 120)
    return () => window.clearTimeout(timer)
  }, [location?.cfi, annotations, markAnchors])

  if (!settings.marginNotes) return null

  return (
    <MarginNotes
      annotations={annotations.filter((item) => item.index === location?.index)}
      anchors={anchors}
      collapsed={collapsed}
      chapter={location?.chapter ?? ''}
      onToggle={() => setCollapsed((value) => !value)}
      onOpen={(annotation) => goTo(annotation.cfi)}
      onLike={(annotation) => updateAnnotation(annotation.id, { liked: !annotation.liked })}
      onDelete={(id) => deleteAnnotation(id)}
    />
  )
}

function NoteOverlay() {
  const { note, closeNote, updateAnnotation, highlight } = useReader()

  return (
    <NoteDialog
      open={Boolean(note)}
      quote={note?.quote ?? ''}
      initial={note?.initial ?? ''}
      onClose={closeNote}
      onSave={(text) => {
        if (note?.id) updateAnnotation(note.id, { note: text })
        else highlight({ note: text })
        closeNote()
      }}
    />
  )
}

export const notesPlugin: ViewerPlugin = {
  id: 'notes',
  Action: NotesAction,
  Aside: MarginAside,
  Overlay: NoteOverlay,
  tab: {
    id: NOTES_TAB,
    label: 'tab.notes',
    count: (store) => highlights(store.annotations).length,
    Panel: NotesPanel,
  },
}
