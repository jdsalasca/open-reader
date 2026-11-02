import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import Dialog from '../../ui/Dialog'

interface Props {
  open: boolean
  quote: string
  initial: string
  onSave: (text: string) => void
  /** Presente solo cuando el comentario ya existe. */
  onDelete?: () => void
  onClose: () => void
}

const FORM = 'note-form'

export default function NoteDialog({ open, quote, initial, onSave, onDelete, onClose }: Props) {
  const { t } = useI18n()
  const [text, setText] = useState(initial)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (open) setText(initial)
  }, [open, initial])

  useEffect(() => {
    if (!open) setConfirming(false)
  }, [open])

  const save = () => onSave(text.trim())

  return (
    <Dialog
      open={open}
      title={t('note.title')}
      hint={confirming ? t('note.deleteHint') : t('note.hint')}
      onClose={onClose}
      actions={
        confirming ? (
          <>
            <button className="btn btn--ghost" type="button" onClick={() => setConfirming(false)}>
              {t('note.cancel')}
            </button>
            <button
              className="btn btn--danger"
              type="button"
              onClick={() => {
                setConfirming(false)
                onDelete?.()
              }}
            >
              {t('note.deleteYes')}
            </button>
          </>
        ) : (
          <>
            {onDelete && (
              <button
                className="btn btn--danger"
                type="button"
                onClick={() => setConfirming(true)}
              >
                {t('note.delete')}
              </button>
            )}
            <button className="btn btn--ghost" type="button" onClick={onClose}>
              {t('note.cancel')}
            </button>
            <button className="btn btn--accent" type="submit" form={FORM}>
              {t('note.save')}
            </button>
          </>
        )
      }
    >
      <form
        id={FORM}
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        {quote && <blockquote className="dialog__quote">{quote}</blockquote>}

        <label className="dialog__field">
          <span>{t('note.label')}</span>
          <textarea
            value={text}
            autoFocus
            rows={5}
            placeholder={t('note.placeholder')}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                save()
              }
            }}
          />
        </label>
      </form>
    </Dialog>
  )
}
