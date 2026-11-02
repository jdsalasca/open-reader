import { highlightFrom } from '../../core/annotation'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'
import type { ViewerPlugin } from '../../viewer/plugins/types'
import QuoteDialog from './QuoteDialog'

function QuoteOverlay() {
  const { t } = useI18n()
  const { book, quote, closeQuote, openQuote, updateAnnotation, addAnnotation, dismiss, flash } =
    useReader()

  const save = () => {
    if (!quote) return
    if (quote.id) {
      updateAnnotation(quote.id, { quoted: true })
    } else if (quote.cfi) {
      const annotation = highlightFrom(
        { cfi: quote.cfi, index: quote.index ?? 0, text: quote.text },
        quote.chapter,
        { color: quote.color, quoted: true },
      )
      addAnnotation(annotation)
      dismiss()
      openQuote({ ...quote, saved: true, id: annotation.id })
    }
    flash(t('reader.toast.quoted'))
  }

  return (
    <QuoteDialog
      open={Boolean(quote)}
      text={quote?.text ?? ''}
      author={book?.author ?? ''}
      title={book?.title ?? ''}
      color={quote?.color ?? 'amber'}
      saved={Boolean(quote?.saved)}
      onSave={save}
      onClose={closeQuote}
    />
  )
}

export const quotesPlugin: ViewerPlugin = {
  id: 'quotes',
  Overlay: QuoteOverlay,
}
