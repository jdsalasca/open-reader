import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icons'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'
import type { Annotation } from '../../core/types'
import { useMarkAnchors } from './useMarkAnchors'

/**
 * Marcas en el borde de la hoja, como en Google Docs.
 *
 * - Un **comentario** (anotación con texto) sale como burbuja numerada: 1…9 y
 *   «9+», en orden de lectura.
 * - Un **post-it** (sin texto) sale como tira de color asomando por el borde,
 *   igual que el papelito pegado en el libro de verdad.
 *
 * Las anotaciones llegan del store; cuando exista el lector colaborativo, esas
 * mismas marcas servirán para los comentarios de otras personas.
 */
export default function CommentBubbles() {
  const { t } = useI18n()
  const { annotations, location, openNote, activate } = useReader()
  const anchors = useMarkAnchors()
  const box = useRef<HTMLDivElement | null>(null)
  const [tops, setTops] = useState<Record<string, number>>({})

  const marks = annotations.filter(
    (item) => item.kind === 'highlight' && item.index === location?.index,
  )

  useLayoutEffect(() => {
    const element = box.current
    if (!element) return
    const base = element.getBoundingClientRect().top
    const height = element.clientHeight
    const next: Record<string, number> = {}
    for (const mark of marks) {
      const absolute = anchors[mark.id]
      next[mark.id] =
        absolute === undefined ? -1 : Math.min(Math.max(6, absolute - base - 10), height - 30)
    }
    setTops(next)
  }, [anchors, marks.length])

  const placed = marks
    .map((mark) => ({ mark, top: tops[mark.id] ?? -1 }))
    .filter((item) => item.top >= 0)
    .sort((a, b) => a.top - b.top)

  const comments = placed.filter((item) => item.mark.note.trim().length > 0)
  const stickies = placed.filter((item) => item.mark.sticky && !item.mark.note.trim().length)

  return (
    <div className="comments" ref={box}>
      {stickies.map(({ mark, top }) => (
        <button
          key={mark.id}
          type="button"
          className={`postit-tab postit-tab--${mark.sticky}`}
          style={{ top }}
          title={t('sticky.label')}
          aria-label={t('sticky.label')}
          onClick={() => activate(mark)}
        />
      ))}

      {comments.map(({ mark, top }, index) => (
        <button
          key={mark.id}
          type="button"
          className="comment-bubble"
          style={{ top }}
          title={mark.note || mark.text}
          aria-label={t('comments.bubble', { n: index + 1 })}
          onClick={() => openNote(draftOf(mark))}
        >
          <Icon name="note" size={11} />
          <span>{index < 9 ? index + 1 : '9+'}</span>
        </button>
      ))}
    </div>
  )
}

const draftOf = (note: Annotation) => ({
  id: note.id,
  quote: note.text,
  initial: note.note,
  sticky: note.sticky,
})
