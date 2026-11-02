import { HIGHLIGHT_COLORS } from '../../core/reading'
import { relativeTime } from '../../core/format'
import { useI18n } from '../../i18n/index'
import { Icon } from '../../components/Icons'
import type { Annotation } from '../../core/types'

interface Props {
  annotations: Annotation[]
  collapsed: boolean
  chapter: string
  onToggle: () => void
  onOpen: (annotation: Annotation) => void
  onLike: (annotation: Annotation) => void
  onDelete: (id: string) => void
}

/**
 * Notes as margin cards. The markers that point at each passage live on the
 * page itself (`CommentBubbles`), so the collapsed column is only its handle.
 */
export default function MarginNotes({
  annotations,
  collapsed,
  chapter,
  onToggle,
  onOpen,
  onLike,
  onDelete,
}: Props) {
  const { t, locale } = useI18n()

  const notes = annotations
    .filter((item) => item.kind === 'highlight')
    .sort((a, b) => a.createdAt - b.createdAt)

  if (collapsed) {
    return (
      <aside className="gutter gutter--mini" aria-label={t('margin.title')}>
        <button
          className="gutter__toggle"
          type="button"
          onClick={onToggle}
          title={t('margin.expand')}
          aria-label={t('margin.expand')}
        >
          <Icon name="note" size={14} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="gutter" aria-label={t('margin.title')}>
      <header className="gutter__head">
        <span className="gutter__kicker">{t('margin.title')}</span>
        <span className="gutter__count">{notes.length || '—'}</span>
        <button
          className="gutter__toggle"
          type="button"
          onClick={onToggle}
          title={t('margin.collapse')}
          aria-label={t('margin.collapse')}
        >
          <Icon name="chevron-right" size={14} />
        </button>
      </header>

      {notes.length === 0 ? (
        <p className="gutter__empty">
          {chapter
            ? t('margin.emptyChapter', {
                chapter: chapter.length > 42 ? `${chapter.slice(0, 42)}…` : chapter,
              })
            : t('margin.empty')}{' '}
          {t('margin.hint')}
        </p>
      ) : (
        <ul className="gutter__list">
          {notes.map((item) => (
            <li
              key={item.id}
              className={`note-card${item.sticky ? ` note-card--sticky note-card--sticky-${item.sticky}` : ''}`}
            >
              <span
                className="note-card__bar"
                style={{ background: HIGHLIGHT_COLORS[item.color].hex }}
              />
              <button
                type="button"
                className="note-card__body"
                onClick={() => onOpen(item)}
                title={t('margin.goto')}
              >
                <q className="note-card__quote">{item.text}</q>
                {item.note && <span className="note-card__note">{item.note}</span>}
              </button>
              <div className="note-card__foot">
                <button
                  type="button"
                  className={`note-card__like${item.liked ? ' is-on' : ''}`}
                  aria-pressed={Boolean(item.liked)}
                  aria-label={item.liked ? t('notes.unlike') : t('notes.like')}
                  title={item.liked ? t('notes.unlike') : t('notes.like')}
                  onClick={() => onLike(item)}
                >
                  <Icon name={item.liked ? 'heart-filled' : 'heart'} size={14} />
                </button>
                <span className="note-card__time">{relativeTime(item.createdAt, locale)}</span>
                <button
                  type="button"
                  className="icon-btn icon-btn--ghost note-card__delete"
                  title={t('notes.delete')}
                  onClick={() => onDelete(item.id)}
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
