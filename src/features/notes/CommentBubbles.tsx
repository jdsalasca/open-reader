import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icons'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'
import type { Annotation } from '../../core/types'
import { useMarkAnchors } from './useMarkAnchors'

/**
 * Burbujas de comentario pegadas al pasaje, como en Google Docs.
 *
 * Se dibujan dentro de la hoja (slot `Page`), en su margen derecho, a la altura
 * del resaltado. El número es la posición del comentario en el capítulo: 1…9 y
 * «9+» a partir del décimo. Al tocar una se abre su nota.
 *
 * Las anotaciones llegan del store; cuando exista el lector colaborativo, esas
 * mismas burbujas servirán para los comentarios de otras personas sin tocar
 * esta capa.
 */
export default function CommentBubbles() {
  const { t } = useI18n()
  const { annotations, location, openNote } = useReader()
  const anchors = useMarkAnchors()
  const box = useRef<HTMLDivElement | null>(null)
  const [tops, setTops] = useState<Record<string, number>>({})

  const comments = annotations.filter(
    (item) =>
      item.kind === 'highlight' &&
      item.note.trim().length > 0 &&
      item.index === location?.index,
  )

  useLayoutEffect(() => {
    const element = box.current
    if (!element) return
    const base = element.getBoundingClientRect().top
    const height = element.clientHeight
    const next: Record<string, number> = {}
    for (const note of comments) {
      const absolute = anchors[note.id]
      next[note.id] =
        absolute === undefined ? -1 : Math.min(Math.max(6, absolute - base - 10), height - 30)
    }
    setTops(next)
  }, [anchors, comments.length])

  const ordered = comments
    .map((note) => ({ note, top: tops[note.id] ?? -1 }))
    .filter((item) => item.top >= 0)
    .sort((a, b) => a.top - b.top)

  return (
    <div className="comments" ref={box}>
      {ordered.map(({ note, top }, index) => (
        <button
          key={note.id}
          type="button"
          className="comment-bubble"
          style={{ top }}
          title={note.note || note.text}
          aria-label={t('comments.bubble', { n: index + 1 })}
          onClick={() => openNote(draftOf(note))}
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
