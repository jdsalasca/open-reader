import { useRef } from 'react'
import type { BookInfo } from './useFoliate'
import { COLOR_KEYS, HIGHLIGHT_COLORS, STYLE_KEYS, HIGHLIGHT_STYLES } from '../lib/reading'
import { percent, relativeTime } from '../lib/format'
import { Icon } from '../components/Icons'
import type { Annotation, LocationInfo, Settings, TocItem } from '../lib/types'

export type PanelTab = 'toc' | 'notes' | 'marks' | 'settings'

interface Props {
  tab: PanelTab
  onTab: (tab: PanelTab) => void
  info: BookInfo | null
  annotations: Annotation[]
  location: LocationInfo | null
  settings: Settings
  patchSettings: (patch: Partial<Settings>) => void
  onGoTo: (cfi: string) => void
  onDelete: (id: string) => void
  onEditNote: (annotation: Annotation) => void
  onLike: (annotation: Annotation) => void
  onExport: () => void
  onImport: (file: File) => void
  onClear: () => void
  onClose: () => void
}

function TocList({
  items,
  level,
  current,
  onGoTo,
}: {
  items: TocItem[]
  level: number
  current: string
  onGoTo: (href: string) => void
}) {
  return (
    <ul className="toc" data-level={level}>
      {items.map((item, index) => (
        <li key={`${item.href}-${index}`} className="toc__node">
          <button
            type="button"
            className={`toc__item${item.label === current ? ' is-current' : ''}`}
            onClick={() => onGoTo(item.href)}
          >
            <span className="toc__label">{item.label}</span>
          </button>
          {item.subitems && item.subitems.length > 0 && (
            <TocList items={item.subitems} level={level + 1} current={current} onGoTo={onGoTo} />
          )}
        </li>
      ))}
    </ul>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="seg" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? 'is-on' : ''}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        <b>{`${value}${suffix}`}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="field field--row">
      <span className="field__label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </label>
  )
}

export default function Sidebar({
  tab,
  onTab,
  info,
  annotations,
  location,
  settings,
  patchSettings,
  onGoTo,
  onDelete,
  onEditNote,
  onLike,
  onExport,
  onImport,
  onClear,
  onClose,
}: Props) {
  const backup = useRef<HTMLInputElement | null>(null)
  const notes = annotations.filter((item) => item.kind === 'highlight')
  const bookmarks = annotations.filter((item) => item.kind === 'bookmark')

  return (
    <aside className="rail" aria-label="Panel del libro">
      <div className="rail__head">
        <span className="rail__kicker">
          {info?.fixedLayout ? 'Página fija' : 'Flujo de texto'}
        </span>
        <button className="icon-btn icon-btn--ghost rail__close" type="button" onClick={onClose}>
          <Icon name="x" size={16} />
        </button>
      </div>

      <nav className="rail__tabs" role="tablist">
        {(
          [
            ['toc', 'Índice'],
            ['notes', 'Notas'],
            ['marks', 'Marcas'],
            ['settings', 'Ajustes'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'is-on' : ''}
            onClick={() => onTab(key)}
          >
            {label}
            {key === 'notes' && notes.length > 0 && <span className="rail__count">{notes.length}</span>}
            {key === 'marks' && bookmarks.length > 0 && (
              <span className="rail__count">{bookmarks.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="rail__panel">
        {tab === 'toc' && (
          <div className="panel">
            {info?.toc.length ? (
              <TocList
                items={info.toc}
                level={0}
                current={location?.chapter ?? ''}
                onGoTo={onGoTo}
              />
            ) : (
              <p className="empty">Este libro no trae índice. Usa la barra de progreso.</p>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="panel">
            {notes.length === 0 ? (
              <p className="empty">
                Selecciona un fragmento en el libro para resaltarlo. Aquí aparecerán tus
                anotaciones.
              </p>
            ) : (
              <ul className="marks">
                {notes.map((item) => (
                  <li key={item.id} className="mark">
                    <button
                      type="button"
                      className="mark__body"
                      onClick={() => onGoTo(item.cfi)}
                    >
                      <span
                        className="mark__swatch"
                        style={{ background: HIGHLIGHT_COLORS[item.color].hex }}
                      />
                      <span className="mark__text">
                        <q>{item.text}</q>
                        {item.note && <span className="mark__note">{item.note}</span>}
                        <span className="mark__meta">
                          {item.chapter || 'Sin capítulo'} · {relativeTime(item.createdAt)}
                        </span>
                      </span>
                    </button>
                    <div className="mark__tools">
                      <button
                        className={`icon-btn icon-btn--ghost${item.liked ? ' is-liked' : ''}`}
                        type="button"
                        title={item.liked ? 'Quitar me gusta' : 'Me gusta'}
                        aria-pressed={Boolean(item.liked)}
                        onClick={() => onLike(item)}
                      >
                        <Icon name={item.liked ? 'heart-filled' : 'heart'} size={15} />
                      </button>
                      <button
                        className="icon-btn icon-btn--ghost"
                        type="button"
                        title="Editar nota"
                        onClick={() => onEditNote(item)}
                      >
                        <Icon name="pencil" size={15} />
                      </button>
                      <button
                        className="icon-btn icon-btn--ghost"
                        type="button"
                        title="Eliminar"
                        onClick={() => onDelete(item.id)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'marks' && (
          <div className="panel">
            {bookmarks.length === 0 ? (
              <p className="empty">
                Marca la página actual con el botón de marcador o la tecla <kbd>b</kbd>.
              </p>
            ) : (
              <ul className="marks">
                {bookmarks.map((item) => (
                  <li key={item.id} className="mark mark--bookmark">
                    <button
                      type="button"
                      className="mark__body"
                      onClick={() => onGoTo(item.cfi)}
                    >
                      <Icon name="bookmark-filled" size={16} />
                      <span className="mark__text">
                        <span className="mark__title">{item.text || 'Marcador'}</span>
                        <span className="mark__meta">
                          {item.chapter || 'Sin capítulo'} · {relativeTime(item.createdAt)}
                        </span>
                      </span>
                    </button>
                    <div className="mark__tools">
                      <button
                        className="icon-btn icon-btn--ghost"
                        type="button"
                        title="Eliminar"
                        onClick={() => onDelete(item.id)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="panel">
            <section className="panel__group">
              <h3>Presentación</h3>
              <Segmented
                label="Tema"
                value={settings.theme}
                options={[
                  { value: 'light', label: 'Papel' },
                  { value: 'dark', label: 'Grafito' },
                ]}
                onChange={(theme) => patchSettings({ theme })}
              />
              {!info?.fixedLayout && (
                <Segmented
                  label="Disposición"
                  value={settings.flow}
                  options={[
                    { value: 'paginated', label: 'Páginas' },
                    { value: 'scrolled', label: 'Scroll' },
                  ]}
                  onChange={(flow) => patchSettings({ flow })}
                />
              )}
              {info?.fixedLayout && (
                <Segmented
                  label="Zoom"
                  value={settings.zoom}
                  options={[
                    { value: 'fit-page', label: 'Página' },
                    { value: 'fit-width', label: 'Ancho' },
                  ]}
                  onChange={(zoom) => patchSettings({ zoom })}
                />
              )}
            </section>

            <section className="panel__group">
              <h3>Lectura</h3>
              <Segmented
                label="Tipografía"
                value={settings.readingFont}
                options={[
                  { value: 'book', label: 'Del libro' },
                  { value: 'serif', label: 'Serif' },
                  { value: 'sans', label: 'Sans' },
                ]}
                onChange={(readingFont) => patchSettings({ readingFont })}
              />
              <Slider
                label="Tamaño"
                value={settings.fontSize}
                min={85}
                max={150}
                suffix=" %"
                onChange={(fontSize) => patchSettings({ fontSize })}
              />
              <Slider
                label="Interlineado"
                value={settings.lineHeight}
                min={1.2}
                max={2}
                step={0.05}
                suffix=""
                onChange={(lineHeight) => patchSettings({ lineHeight })}
              />
              {!info?.fixedLayout && (
                <Slider
                  label="Ancho de columna"
                  value={settings.columnWidth}
                  min={440}
                  max={900}
                  step={20}
                  suffix=" px"
                  onChange={(columnWidth) => patchSettings({ columnWidth })}
                />
              )}
              <Toggle
                label="Justificar texto"
                checked={settings.justify}
                onChange={(justify) => patchSettings({ justify })}
              />
              <Toggle
                label="Partir palabras"
                checked={settings.hyphens}
                onChange={(hyphens) => patchSettings({ hyphens })}
              />
            </section>

            <section className="panel__group">
              <h3>Anotaciones</h3>
              <Toggle
                label="Notas al margen"
                checked={settings.marginNotes}
                onChange={(marginNotes) => patchSettings({ marginNotes })}
              />
              <p className="panel__hint">
                Muestra tus notas al lado de la página. Apágalo para una lectura
                sin interrupciones; las notas siguen guardadas en la pestaña
                «Notas».
              </p>
            </section>

            <section className="panel__group">
              <h3>Leyenda de colores</h3>
              <ul className="legend">
                {COLOR_KEYS.map((key) => (
                  <li key={key}>
                    <span style={{ background: HIGHLIGHT_COLORS[key].hex }} />
                    {HIGHLIGHT_COLORS[key].label}
                  </li>
                ))}
              </ul>
              <ul className="legend legend--styles">
                {STYLE_KEYS.map((key) => (
                  <li key={key}>{HIGHLIGHT_STYLES[key]}</li>
                ))}
              </ul>
            </section>

            <section className="panel__group">
              <h3>Datos</h3>
              <p className="panel__hint">
                Las notas viven en este navegador. Exporta un respaldo antes de limpiar
                datos del sitio.
              </p>
              <div className="panel__actions">
                <button className="btn btn--ghost" type="button" onClick={onExport}>
                  <Icon name="download" size={15} /> Exportar
                </button>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => backup.current?.click()}
                >
                  <Icon name="upload" size={15} /> Importar
                </button>
              </div>
              <button className="btn btn--danger" type="button" onClick={onClear}>
                <Icon name="trash" size={15} /> Borrar notas del libro
              </button>
              <input
                ref={backup}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onImport(file)
                  event.target.value = ''
                }}
              />
            </section>

            <p className="panel__foot">
              {percent(location?.fraction ?? 0)} leído
              {location?.page ? ` · página ${location.page}` : ''}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
