import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from '../components/Icons'

interface Props {
  open: boolean
  title: string
  hint?: ReactNode
  actions: ReactNode
  className?: string
  onClose: () => void
  children: ReactNode
}

/**
 * The <dialog> shell shared by the note and quote editors: native modal,
 * backdrop click and Escape all close it.
 */
export default function Dialog({
  open,
  title,
  hint,
  actions,
  className,
  onClose,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`dialog${className ? ` ${className}` : ''}`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div className="dialog__box">
        <header className="dialog__head">
          <h2>{title}</h2>
          <button
            className="icon-btn icon-btn--ghost"
            type="button"
            onClick={onClose}
            aria-label={title}
          >
            <Icon name="x" size={16} />
          </button>
        </header>

        {children}

        <footer className="dialog__foot">
          <span className="dialog__hint">{hint}</span>
          <div className="dialog__actions">{actions}</div>
        </footer>
      </div>
    </dialog>
  )
}
