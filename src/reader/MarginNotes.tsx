import { HIGHLIGHT_COLORS } from '../lib/reading'
import { relativeTime } from '../lib/format'
import { Icon } from '../components/Icons'
import type { Annotation } from '../lib/types'

interface Props {
  annotations: Annotation[]
  chapter: string
  onOpen: (annotation: Annotation) => void
  onLike: (annotation: Annotation) => void
  onDelete: (id: string) => void
}

/**
 * Notes as margin comments: one card per mark of the section being read,
 * next to the page instead of inside it.
 */
export default function MarginNotes({ annotations, chapter, onOpen, onLike, onDelete }: Props) {
  const notes = annotations
    .filter((item) => item.kind === 'highlight')
    .sort((a, b) => a.createdAt - b.createdAt)

  return (
    <aside className="gutter" aria-label="Notas al margen">
      <header className="gutter__head">
        <span className="gutter__kicker">Al margen</span>
        <span className="gutter__count">{notes.length || '—'}</span>
      </header>

      {notes.length === 0 ? (
        <p className="gutter__empty">
          {chapter
            ? `Sin notas en «${chapter.length > 42 ? `${chapter.slice(0, 42)}…` : chapter}».`
            : 'Sin notas en esta página.'}{' '}
          Selecciona un fragmento y elige un color.
        </p>
      ) : (
        <ul className="gutter__list">
          {notes.map((item) => (
            <li
              key={item.id}
              className={`note-card${item.note ? ' note-card--full' : ''}`}
            >
              <span
                className="note-card__bar"
                style={{ background: HIGHLIGHT_COLORS[item.color].hex }}
              />
              <button
                type="button"
                className="note-card__body"
                onClick={() => onOpen(item)}
                title="Ir al pasaje"
              >
                <q className="note-card__quote">{item.text}</q>
                {item.note && <span className="note-card__note">{item.note}</span>}
              </button>
              <div className="note-card__foot">
                <button
                  type="button"
                  className={`note-card__like${item.liked ? ' is-on' : ''}`}
                  aria-pressed={Boolean(item.liked)}
                  aria-label={item.liked ? 'Quitar me gusta' : 'Me gusta'}
                  title={item.liked ? 'Quitar me gusta' : 'Me gusta'}
                  onClick={() => onLike(item)}
                >
                  <Icon name={item.liked ? 'heart-filled' : 'heart'} size={14} />
                </button>
                <span className="note-card__time">{relativeTime(item.createdAt)}</span>
                <button
                  type="button"
                  className="icon-btn icon-btn--ghost note-card__delete"
                  title="Eliminar"
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
