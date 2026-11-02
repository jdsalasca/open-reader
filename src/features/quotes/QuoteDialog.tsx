import { useEffect, useRef } from 'react'
import { drawQuoteCard, downloadCanvas } from '../../core/quoteCard'
import { useI18n } from '../../i18n/index'
import { Icon } from '../../components/Icons'
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
  const dialog = useRef<HTMLDialogElement | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  useEffect(() => {
    if (!open || !canvas.current) return
    void drawQuoteCard(canvas.current, { text, author, title, color })
  }, [open, text, author, title, color])

  const fileName = `cita-${(author || 'open-reader')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)}.png`

  return (
    <dialog
      ref={dialog}
      className="dialog dialog--quote"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose()
      }}
    >
      <div className="dialog__box">
        <header className="dialog__head">
          <h2>{t('quote.title')}</h2>
          <button className="icon-btn icon-btn--ghost" type="button" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </header>

        <div className="quote-preview">
          <canvas ref={canvas} aria-label={t('quote.preview')} />
        </div>

        <footer className="dialog__foot">
          <span className="dialog__hint">
            {saved ? t('quote.saved') : t('quote.hint')}
          </span>
          <div className="dialog__actions">
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => canvas.current && downloadCanvas(canvas.current, fileName)}
            >
              <Icon name="download" size={15} /> {t('quote.download')}
            </button>
            <button className="btn btn--accent" type="button" onClick={onSave}>
              <Icon name="check" size={15} /> {saved ? t('quote.savedButton') : t('quote.save')}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  )
}
