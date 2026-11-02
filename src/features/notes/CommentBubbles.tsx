import { useLayoutEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { fitMarkers, placeMarkers } from '../../core/markers'
import { useReader } from '../../viewer/ReaderContext'
import type { Annotation } from '../../core/types'
import { useMarkAnchors } from './useMarkAnchors'

/**
 * Marcas en el borde de la hoja, como en Google Docs.
 *
 * - **Comentario** (cualquier resaltado): burbuja cerrada con su número, 1…9 y
 *   «9+», en orden de lectura. El texto no se ve hasta tocarla.
 * - **Post-it** (sin nota escrita): triangulito de color en el canto; no gasta
 *   número y no pinta nada sobre el renglón.
 *
 * Las alturas vienen del motor (`markAnchors`), que las toma de los rectángulos
 * que ya calculó al pintar la marca.
 */
export default function CommentBubbles() {
  const { t } = useI18n()
  const { annotations, location, openNote, activate } = useReader()
  const anchors = useMarkAnchors()
  const box = useRef<HTMLDivElement | null>(null)
  const [offset, setOffset] = useState(0)

  const markers = fitMarkers(
    placeMarkers(annotations, location?.index ?? -1, anchors),
    offset,
  )
  const byId = new Map(annotations.map((item) => [item.id, item]))

  // las alturas son del viewport; la capa vive dentro de la hoja
  useLayoutEffect(() => {
    const element = box.current
    if (!element) return
    setOffset(element.getBoundingClientRect().top)
  }, [markers.length, location?.cfi])

  return (
    <div className="comments" ref={box}>
      {markers.map((marker) => {
        const note = byId.get(marker.id)
        if (!note) return null
        const top = marker.top

        if (marker.kind === 'sticky') {
          return (
            <button
              key={marker.id}
              type="button"
              className={`postit-tab postit-tab--${marker.color ?? 'yellow'}`}
              style={{ top }}
              title={t('sticky.label')}
              aria-label={t('sticky.label')}
              onClick={() => activate(note)}
            />
          )
        }

        return (
          <button
            key={marker.id}
            type="button"
            className={`comment-bubble${marker.color ? ` comment-bubble--${marker.color}` : ''}`}
            style={{ top }}
            title={note.note || note.text}
            aria-label={t('comments.bubble', { n: marker.label })}
            onClick={() => openNote(draftOf(note))}
          >
            {marker.label}
          </button>
        )
      })}
    </div>
  )
}

const draftOf = (note: Annotation) => ({
  id: note.id,
  quote: note.text,
  initial: note.note,
  sticky: note.sticky,
})
