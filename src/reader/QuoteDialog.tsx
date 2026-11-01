import { useEffect, useRef } from 'react'
import { drawQuoteCard, downloadCanvas } from '../lib/quoteCard'
import { Icon } from '../components/Icons'
import type { HighlightColor } from '../lib/types'

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
          <h2>Cita</h2>
          <button className="icon-btn icon-btn--ghost" type="button" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </header>

        <div className="quote-preview">
          <canvas ref={canvas} aria-label="Vista previa de la cita" />
        </div>

        <footer className="dialog__foot">
          <span className="dialog__hint">
            {saved ? 'Ya está en tus citas' : 'Se guarda con el libro'}
          </span>
          <div className="dialog__actions">
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => canvas.current && downloadCanvas(canvas.current, fileName)}
            >
              <Icon name="download" size={15} /> PNG
            </button>
            <button className="btn btn--accent" type="button" onClick={onSave}>
              <Icon name="check" size={15} /> {saved ? 'Guardada' : 'Guardar en citas'}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  )
}
