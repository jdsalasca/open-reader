import { useReader } from '../../viewer/ReaderContext'
import type { ViewerPlugin } from '../../viewer/plugins/types'
import SelectionBar from './SelectionBar'

/** Las opciones aparecen en cuanto hay texto seleccionado o una marca abierta. */
function HighlightOverlay() {
  const {
    selection,
    active,
    location,
    dismiss,
    highlight,
    updateAnnotation,
    deleteAnnotation,
    openNote,
    openQuote,
  } = useReader()

  if (!active && !selection) return null

  const annotation = active?.annotation ?? null
  const text = annotation?.text ?? selection?.text ?? ''
  const chapter = annotation?.chapter ?? location?.chapter ?? ''

  return (
    <SelectionBar
      mode={annotation ? 'edit' : 'new'}
      annotation={annotation}
      onApply={(patch) => {
        if (annotation) updateAnnotation(annotation.id, patch)
        else highlight(patch)
      }}
      onNote={() =>
        openNote({ id: annotation?.id, quote: text, initial: annotation?.note ?? '' })
      }
      onSticky={(sticky) =>
        openNote({
          id: annotation?.id,
          quote: text,
          initial: annotation?.note ?? '',
          sticky,
        })
      }
      onQuote={() =>
        openQuote({
          id: annotation?.id,
          text,
          color: annotation?.color ?? 'amber',
          chapter,
          cfi: annotation?.cfi ?? selection?.cfi,
          index: annotation?.index ?? selection?.index,
          saved: Boolean(annotation?.quoted),
        })
      }
      onDelete={annotation ? () => deleteAnnotation(annotation.id) : undefined}
      onClose={dismiss}
    />
  )
}

export const highlightsPlugin: ViewerPlugin = {
  id: 'highlights',
  Overlay: HighlightOverlay,
}
