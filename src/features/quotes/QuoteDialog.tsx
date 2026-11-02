import { useEffect, useRef } from 'react'
import { drawQuoteCard, downloadCanvas } from '../../core/quoteCard'
import { useI18n } from '../../i18n'
import { Icon } from '../../components/Icons'
import Dialog from '../../ui/Dialog'
import type { HighlightColor } from '../../core/types'

interface Props {
  open: boolean
  text: string
  author: string
  title: string
  color: HighlightColor
  saved: boolean
  onSave: () => void
  onClose: () => void
}

const fileNameOf = (author: string) =>
  `cita-${(author || 'open-reader')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)}.png`

export default function QuoteDialog({
  open,
  text,
  author,
  title,
  color,
  saved,
  onSave,
  onClose,
}: Props) {
  const { t } = useI18n()
  const canvas = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!open || !canvas.current) return
    void drawQuoteCard(canvas.current, { text, author, title, color })
  }, [open, text, author, title, color])

  return (
    <Dialog
      open={open}
      title={t('quote.title')}
      className="dialog--quote"
      hint={saved ? t('quote.saved') : t('quote.hint')}
      onClose={onClose}
      actions={
        <>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => canvas.current && downloadCanvas(canvas.current, fileNameOf(author))}
          >
            <Icon name="download" size={15} /> {t('quote.download')}
          </button>
          <button className="btn btn--accent" type="button" onClick={onSave}>
            <Icon name="check" size={15} /> {saved ? t('quote.savedButton') : t('quote.save')}
          </button>
        </>
      }
    >
      <div className="quote-preview">
        <canvas ref={canvas} aria-label={t('quote.preview')} />
      </div>
    </Dialog>
  )
}
