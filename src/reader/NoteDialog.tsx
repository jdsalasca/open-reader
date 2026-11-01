import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icons'

interface Props {
  open: boolean
  quote: string
  initial: string
  onSave: (text: string) => void
  onClose: () => void
}

export default function NoteDialog({ open, quote, initial, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement | null>(null)
  const [text, setText] = useState(initial)

  useEffect(() => {
    if (open) setText(initial)
  }, [open, initial])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <form
        className="dialog__box"
        onSubmit={(event) => {
          event.preventDefault()
          onSave(text.trim())
        }}
      >
        <header className="dialog__head">
          <h2>Nota al margen</h2>
          <button className="icon-btn icon-btn--ghost" type="button" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </header>

        {quote && <blockquote className="dialog__quote">{quote}</blockquote>}

        <label className="dialog__field">
          <span>Tu nota</span>
          <textarea
            value={text}
            autoFocus
            rows={5}
            placeholder="Qué piensas de este pasaje…"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                onSave(text.trim())
              }
            }}
          />
        </label>

        <footer className="dialog__foot">
          <span className="dialog__hint">Ctrl + Enter para guardar</span>
          <div className="dialog__actions">
            <button className="btn btn--ghost" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn--accent" type="submit">
              Guardar
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
