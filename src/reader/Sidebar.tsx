import { useEffect, useRef, useState } from 'react'
import type { BookInfo } from './useFoliate'
import { COLOR_KEYS, HIGHLIGHT_COLORS, STYLE_KEYS } from '../lib/reading'
import { percent, relativeTime, bytes } from '../lib/format'
import { useI18n } from '../i18n'
import { storageEstimate } from '../lib/storage'
import { Icon } from '../components/Icons'
import type { Annotation, LocationInfo, Settings, TocItem } from '../lib/types'

export type PanelTab = 'toc' | 'search' | 'notes' | 'marks' | 'settings'

export interface SearchGroup {
  label: string
  items: { cfi: string; excerpt: { pre: string; match: string; post: string } }[]
}

export interface SearchState {
  query: string
  progress: number
  running: boolean
  results: SearchGroup[]
}

interface Props {
  tab: PanelTab
  onTab: (tab: PanelTab) => void
  info: BookInfo | null
  annotations: Annotation[]
  location: LocationInfo | null
  settings: Settings
  search: SearchState
  patchSettings: (patch: Partial<Settings>) => void
  onGoTo: (cfi: string) => void
  onDelete: (id: string) => void
  onEditNote: (annotation: Annotation) => void
  onLike: (annotation: Annotation) => void
  onQuote: (annotation: Annotation) => void
  onSearch: (query: string) => void
  onClearSearch: () => void
  onExport: () => void
  onExportMarkdown: () => void
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
  search,
  patchSettings,
  onGoTo,
  onDelete,
  onEditNote,
  onLike,
  onQuote,
  onSearch,
  onClearSearch,
  onExport,
  onExportMarkdown,
  onImport,
  onClear,
  onClose,
}: Props) {
  const { t, locale } = useI18n()
  const backup = useRef<HTMLInputElement | null>(null)
  const query = useRef<HTMLInputElement | null>(null)
  const notes = annotations.filter((item) => item.kind === 'highlight')
  const quotes = notes.filter((item) => item.quoted)
  const bookmarks = annotations.filter((item) => item.kind === 'bookmark')

  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null)

  useEffect(() => {
    let alive = true
    void storageEstimate().then((estimate) => {
      if (alive) setUsage(estimate)
    })
    return () => {
      alive = false
    }
  }, [annotations.length])

  const usagePercent =
    usage && usage.quota > 0 ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0

  return (
    <aside className="rail" aria-label="Panel del libro">
      <div className="rail__head">
        <span className="rail__kicker">
          {info?.fixedLayout ? t('rail.fixed') : t('rail.flow')}
        </span>
        <button className="icon-btn icon-btn--ghost rail__close" type="button" onClick={onClose} title={t('rail.close')}>
          <Icon name="x" size={16} />
        </button>
      </div>

      <nav className="rail__tabs" role="tablist">
        {(
          [
            ['toc', t('tab.toc')],
            ['search', t('tab.search')],
            ['notes', t('tab.notes')],
            ['marks', t('tab.marks')],
            ['settings', t('tab.settings')],
          ] as [PanelTab, string][]
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
              <p className="empty">{t('toc.empty')}</p>
            )}
          </div>
        )}

        {tab === 'search' && (
          <div className="panel panel--search">
            <form
              className="search"
              onSubmit={(event) => {
                event.preventDefault()
                onSearch(query.current?.value ?? '')
              }}
            >
              <input
                ref={query}
                type="search"
                placeholder={t('search.placeholder')}
                defaultValue={search.query}
                autoFocus
                aria-label={t('search.placeholder')}
              />
              <button className="btn btn--ghost" type="submit" disabled={search.running}>
                {search.running ? '…' : t('search.go')}
              </button>
            </form>

            {info?.fixedLayout && (
              <p className="empty">{t('search.unavailable')}</p>
            )}

            {search.running && (
              <div className="search__progress" aria-hidden="true">
                <span style={{ width: `${Math.round(search.progress * 100)}%` }} />
              </div>
            )}

            {!search.running && search.query && !search.results.length && !info?.fixedLayout && (
              <p className="empty">{t('search.none', { q: search.query })}</p>
            )}

            {search.results.length > 0 && (
              <div className="search__meta">
                <span>
                  {t('search.matches', {
                    n: search.results.reduce((total, group) => total + group.items.length, 0),
                  })}
                </span>
                <button type="button" className="search__clear" onClick={onClearSearch}>
                  {t('search.clear')}
                </button>
              </div>
            )}

            {search.results.map((group) => (
              <section key={group.label + group.items[0]?.cfi} className="search__group">
                <h3>{group.label || t('search.noChapter')}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.cfi}>
                      <button type="button" onClick={() => onGoTo(item.cfi)}>
                        {item.excerpt.pre}
                        <mark>{item.excerpt.match}</mark>
                        {item.excerpt.post}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {tab === 'notes' && (
          <div className="panel">
            {notes.length === 0 ? (
              <p className="empty">{t('notes.empty')}</p>
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
                          {item.quoted && <b className="mark__star">★ {t('quote.title')}</b>}
                          {item.chapter || t('search.noChapter')} · {relativeTime(item.createdAt, locale)}
                        </span>
                      </span>
                    </button>
                    <div className="mark__tools">
                      <button
                        className={`icon-btn icon-btn--ghost${item.quoted ? ' is-liked' : ''}`}
                        type="button"
                        title={t('notes.quote')}
                        onClick={() => onQuote(item)}
                      >
                        <Icon name="quote" size={15} />
                      </button>
                      <button
                        className={`icon-btn icon-btn--ghost${item.liked ? ' is-liked' : ''}`}
                        type="button"
                        title={item.liked ? t('notes.unlike') : t('notes.like')}
                        aria-pressed={Boolean(item.liked)}
                        onClick={() => onLike(item)}
                      >
                        <Icon name={item.liked ? 'heart-filled' : 'heart'} size={15} />
                      </button>
                      <button
                        className="icon-btn icon-btn--ghost"
                        type="button"
                        title={t('notes.edit')}
                        onClick={() => onEditNote(item)}
                      >
                        <Icon name="pencil" size={15} />
                      </button>
                      <button
                        className="icon-btn icon-btn--ghost"
                        type="button"
                        title={t('notes.delete')}
                        onClick={() => onDelete(item.id)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {quotes.length > 0 && (
              <p className="panel__foot">{t('notes.inQuotes', { n: quotes.length })}</p>
            )}
          </div>
        )}

        {tab === 'marks' && (
          <div className="panel">
            {bookmarks.length === 0 ? (
              <p className="empty">{t('marks.empty')}</p>
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
                        <span className="mark__title">{item.text || t('tab.marks')}</span>
                        <span className="mark__meta">
                          {item.chapter || t('search.noChapter')} · {relativeTime(item.createdAt, locale)}
                        </span>
                      </span>
                    </button>
                    <div className="mark__tools">
                      <button
                        className="icon-btn icon-btn--ghost"
                        type="button"
                        title={t('notes.delete')}
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
              <h3>{t('settings.presentation')}</h3>
              <Segmented
                label={t('settings.language')}
                value={settings.language}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'es', label: 'ES' },
                  { value: 'en', label: 'EN' },
                  { value: 'zh', label: '中文' },
                ]}
                onChange={(language) => patchSettings({ language })}
              />
              <Segmented
                label={t('settings.theme')}
                value={settings.theme}
                options={[
                  { value: 'light', label: t('theme.light') },
                  { value: 'dark', label: t('theme.dark') },
                ]}
                onChange={(theme) => patchSettings({ theme })}
              />
              {!info?.fixedLayout && (
                <Segmented
                  label={t('settings.layout')}
                  value={settings.flow}
                  options={[
                    { value: 'paginated', label: t('settings.pages') },
                    { value: 'scrolled', label: t('settings.scroll') },
                  ]}
                  onChange={(flow) => patchSettings({ flow })}
                />
              )}
              {info?.fixedLayout && (
                <Segmented
                  label={t('settings.zoom')}
                  value={settings.zoom}
                  options={[
                    { value: 'fit-page', label: t('settings.fitPage') },
                    { value: 'fit-width', label: t('settings.fitWidth') },
                  ]}
                  onChange={(zoom) => patchSettings({ zoom })}
                />
              )}
            </section>

            <section className="panel__group">
              <h3>{t('settings.reading')}</h3>
              <Segmented
                label={t('settings.type')}
                value={settings.readingFont}
                options={[
                  { value: 'book', label: t('settings.typeBook') },
                  { value: 'serif', label: t('settings.typeSerif') },
                  { value: 'sans', label: t('settings.typeSans') },
                ]}
                onChange={(readingFont) => patchSettings({ readingFont })}
              />
              <Slider
                label={t('settings.size')}
                value={settings.fontSize}
                min={85}
                max={150}
                suffix=" %"
                onChange={(fontSize) => patchSettings({ fontSize })}
              />
              <Slider
                label={t('settings.lineHeight')}
                value={settings.lineHeight}
                min={1.2}
                max={2}
                step={0.05}
                suffix=""
                onChange={(lineHeight) => patchSettings({ lineHeight })}
              />
              {!info?.fixedLayout && (
                <Slider
                  label={t('settings.column')}
                  value={settings.columnWidth}
                  min={440}
                  max={900}
                  step={20}
                  suffix=" px"
                  onChange={(columnWidth) => patchSettings({ columnWidth })}
                />
              )}
              <Toggle
                label={t('settings.justify')}
                checked={settings.justify}
                onChange={(justify) => patchSettings({ justify })}
              />
              <Toggle
                label={t('settings.hyphens')}
                checked={settings.hyphens}
                onChange={(hyphens) => patchSettings({ hyphens })}
              />
            </section>

            <section className="panel__group">
              <h3>{t('settings.annotations')}</h3>
              <Toggle
                label={t('settings.margin')}
                checked={settings.marginNotes}
                onChange={(marginNotes) => patchSettings({ marginNotes })}
              />
              <p className="panel__hint">{t('settings.marginHint')}</p>
            </section>

            <section className="panel__group">
              <h3>{t('settings.legend')}</h3>
              <ul className="legend">
                {COLOR_KEYS.map((key) => (
                  <li key={key}>
                    <span style={{ background: HIGHLIGHT_COLORS[key].hex }} />
                    {t(`color.${key}` as never)}
                  </li>
                ))}
              </ul>
              <ul className="legend legend--styles">
                {STYLE_KEYS.map((key) => (
                  <li key={key}>{t(`style.${key}` as never)}</li>
                ))}
              </ul>
            </section>

            <section className="panel__group">
              <h3>{t('settings.data')}</h3>
              <div className="storage">
                <div className="storage__bar" aria-hidden="true">
                  <span style={{ width: `${usagePercent}%` }} />
                </div>
                <div className="storage__meta">
                  <span>
                    {t('settings.storageOf', {
                      used: bytes(usage?.used ?? 0),
                      quota: bytes(usage?.quota ?? 0),
                    })}
                  </span>
                  <span>{usagePercent}%</span>
                </div>
                <p className="panel__hint">{t('settings.storageHint')}</p>
              </div>
              <p className="panel__hint">{t('settings.dataHint')}</p>
              <div className="panel__actions">
                <button className="btn btn--ghost" type="button" onClick={onExport}>
                  <Icon name="download" size={15} /> .eridu
                </button>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => backup.current?.click()}
                >
                  <Icon name="upload" size={15} /> {t('settings.import')}
                </button>
              </div>
              <button className="btn btn--ghost" type="button" onClick={onExportMarkdown}>
                <Icon name="note" size={15} /> {t('settings.markdown')}
              </button>
              <button className="btn btn--danger" type="button" onClick={onClear}>
                <Icon name="trash" size={15} /> {t('settings.clear')}
              </button>
              <input
                ref={backup}
                type="file"
                accept=".eridu,.json,application/json"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onImport(file)
                  event.target.value = ''
                }}
              />
            </section>

            <p className="panel__foot">
              {t('settings.read', { p: percent(location?.fraction ?? 0) })}
              {location?.page ? ` · ${t('settings.page', { n: location.page })}` : ''}
            </p>
          </div>
        )}
      </div>

      <button
        className="rail__collapse"
        type="button"
        onClick={onClose}
        title={t('rail.collapse')}
        aria-label={t('rail.collapse')}
      >
        <Icon name="chevron-left" size={14} />
      </button>
    </aside>
  )
}

