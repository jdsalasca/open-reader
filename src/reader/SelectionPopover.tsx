import { useLayoutEffect, useRef, useState } from 'react'
import { COLOR_KEYS, HIGHLIGHT_COLORS, HIGHLIGHT_STYLES, STYLE_KEYS } from '../lib/reading'
import { Icon } from '../components/Icons'
import type { Rect } from './useFoliate'
import type { Annotation, HighlightColor, HighlightStyle } from '../lib/types'

interface Props {
  mode: 'new' | 'edit'
  annotation: Annotation | null
  rect: Rect
  onApply: (patch: { color?: HighlightColor; style?: HighlightStyle }) => void
  onNote: () => void
  onQuote: () => void
  onDelete?: () => void
  onClose: () => void
}

const STYLE_ICON: Record<HighlightStyle, { path: string; width: number; fill?: boolean }> = {
  highlight: { path: 'M4 9h16v6H4z', width: 0, fill: true },
  underline: { path: 'M6 5v6a6 6 0 0 0 12 0V5M4 20h16', width: 1.6 },
  squiggly: { path: 'M3 13c2-3.5 4 3.5 6 0s4 3.5 6 0 4 3.5 6 0', width: 1.6 },
  strike: { path: 'M5 12h14M7 7h10M7 17h10', width: 1.4 },
}

export default function SelectionPopover({
  mode,
  annotation,
  rect,
  onApply,
  onNote,
  onQuote,
  onDelete,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const color = annotation?.color ?? 'amber'
  const style = annotation?.style ?? 'highlight'

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const { width, height } = element.getBoundingClientRect()
    const margin = 12
    const gap = 12
    // en táctil el menú nativo de Android/iOS sale encima de la selección:
    // nuestra barra va debajo para no pelearse con él
    const coarse = window.matchMedia('(pointer: coarse)').matches
    let left = rect.left + rect.width / 2 - width / 2
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))
    let top = coarse ? rect.top + rect.height + gap : rect.top - height - gap
    if (!coarse && top < margin) top = rect.top + rect.height + gap
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - height - margin)
    }
    setPos({ left, top })
  }, [rect, mode])

  return (
    <div
      ref={ref}
      className="pop"
      role="toolbar"
      aria-label="Anotar"
      style={{
        left: pos?.left ?? rect.left,
        top: pos?.top ?? rect.top,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      <div className="pop__row pop__swatches">
        {COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`swatch${color === key ? ' is-on' : ''}`}
            style={{ background: HIGHLIGHT_COLORS[key].hex }}
            title={HIGHLIGHT_COLORS[key].label}
            aria-label={HIGHLIGHT_COLORS[key].label}
            aria-pressed={color === key}
            onClick={() => onApply({ color: key })}
          />
        ))}
      </div>

      <div className="pop__row pop__styles">
        {STYLE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`style-btn${style === key ? ' is-on' : ''}`}
            title={HIGHLIGHT_STYLES[key]}
            aria-label={HIGHLIGHT_STYLES[key]}
            aria-pressed={style === key}
            onClick={() => onApply({ style: key })}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d={STYLE_ICON[key].path}
                fill={STYLE_ICON[key].fill ? 'currentColor' : 'none'}
                stroke={STYLE_ICON[key].fill ? 'none' : 'currentColor'}
                strokeWidth={STYLE_ICON[key].width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>

      <div className="pop__row pop__actions">
        <button type="button" className="pop__action" onClick={onNote}>
          <Icon name="note" size={16} />
          {annotation?.note ? 'Editar nota' : 'Nota'}
        </button>
        <button type="button" className="pop__action" onClick={onQuote}>
          <Icon name="quote" size={16} />
          Citar
        </button>
        {mode === 'edit' && onDelete && (
          <button type="button" className="pop__action pop__action--danger" onClick={onDelete}>
            <Icon name="trash" size={16} />
            Borrar
          </button>
        )}
        <button
          type="button"
          className="pop__action pop__action--close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  )
}
