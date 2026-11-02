import { useReader } from '../../viewer/ReaderContext'
import type { ViewerPlugin } from '../../viewer/plugins/types'
import SelectionPopover from './SelectionPopover'

/** The colour/style bar that appears over a selection or a clicked mark. */
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
    <SelectionPopover
      mode={annotation ? 'edit' : 'new'}
      annotation={annotation}
      rect={active?.rect ?? selection!.rect}
      onApply={(patch) => {
        if (annotation) updateAnnotation(annotation.id, patch)
        else highlight(patch)
      }}
      onNote={() =>
        openNote({ id: annotation?.id, quote: text, initial: annotation?.note ?? '' })
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
