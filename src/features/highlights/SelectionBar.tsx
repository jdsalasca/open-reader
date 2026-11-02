import { COLOR_KEYS, HIGHLIGHT_COLORS, STYLE_KEYS } from '../../core/reading'
import { Icon } from '../../components/Icons'
import { useI18n } from '../../i18n'
import type { Annotation, HighlightColor, HighlightStyle } from '../../core/types'

interface Props {
  mode: 'new' | 'edit'
  annotation: Annotation | null
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

/**
 * Barra de anotar: fija bajo la barra superior, no flotando sobre el texto.
 *
 * En móvil el menú nativo (Traducir/Copiar) sale pegado a la selección y no se
 * puede cerrar desde la página; cualquier panel flotante ahí pelea con él. Fija
 * arriba nunca choca y está siempre en el mismo sitio.
 */
export default function SelectionBar({
  mode,
  annotation,
  onApply,
  onNote,
  onQuote,
  onDelete,
  onClose,
}: Props) {
  const { t } = useI18n()
  const color = annotation?.color ?? 'amber'
  const style = annotation?.style ?? 'highlight'

  return (
    <div className="selbar" role="toolbar" aria-label={t('reader.notes')}>
      <div className="selbar__group">
        {COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`swatch${color === key ? ' is-on' : ''}`}
            style={{ background: HIGHLIGHT_COLORS[key].hex }}
            title={t(`color.${key}`)}
            aria-label={t(`color.${key}`)}
            aria-pressed={color === key}
            onClick={() => onApply({ color: key })}
          />
        ))}
      </div>

      <span className="selbar__rule" aria-hidden="true" />

      <div className="selbar__group">
        {STYLE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`style-btn${style === key ? ' is-on' : ''}`}
            title={t(`style.${key}`)}
            aria-label={t(`style.${key}`)}
            aria-pressed={style === key}
            onClick={() => onApply({ style: key })}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
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

      <span className="selbar__rule" aria-hidden="true" />

      <div className="selbar__group">
        <button type="button" className="selbar__action" onClick={onNote}>
          <Icon name="note" size={15} />
          {annotation?.note ? t('pop.editNote') : t('pop.note')}
        </button>
        <button type="button" className="selbar__action" onClick={onQuote}>
          <Icon name="quote" size={15} />
          {t('pop.quote')}
        </button>
        {mode === 'edit' && onDelete && (
          <button
            type="button"
            className="selbar__action selbar__action--danger"
            onClick={onDelete}
          >
            <Icon name="trash" size={15} />
            {t('pop.delete')}
          </button>
        )}
      </div>

      <button
        type="button"
        className="selbar__close"
        onClick={onClose}
        aria-label={t('pop.close')}
        title={t('pop.close')}
      >
        <Icon name="x" size={15} />
      </button>
    </div>
  )
}
