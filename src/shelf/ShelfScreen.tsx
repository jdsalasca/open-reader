import { useCallback, useEffect, useRef, useState } from 'react'
import { ACCEPTED } from '../lib/book'
import { relativeTime, percent } from '../lib/format'
import { LOCALES, LOCALE_LABEL, useI18n } from '../i18n'
import type { MessageKey } from '../i18n/es'
import type { LibraryEntry, Settings } from '../lib/types'
import { Icon } from '../components/Icons'

interface Props {
  library: LibraryEntry[]
  settings: Settings
  patchSettings: (patch: Partial<Settings>) => void
  busy: boolean
  error: string | null
  onDismissError: () => void
  onOpen: (file: File) => void
  onExportAll: () => void
  onImport: (file: File) => void
  onForget: (id: string) => void
}

const FORMATS = ['EPUB', 'MOBI', 'AZW3', 'FB2', 'CBZ', 'PDF']

export default function ShelfScreen({
  library,
  settings,
  patchSettings,
  busy,
  error,
  onDismissError,
  onOpen,
  onExportAll,
  onImport,
  onForget,
}: Props) {
  const { t, locale } = useI18n()
  const input = useRef<HTMLInputElement | null>(null)
  const backup = useRef<HTMLInputElement | null>(null)
  const gear = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const choose = useCallback(() => input.current?.click(), [])

  useEffect(() => {
    if (!settingsOpen) return
    const onDown = (event: MouseEvent) => {
      if (!gear.current?.contains(event.target as Node)) setSettingsOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      event.preventDefault()
      setDragging(true)
    }
    const onDragLeave = (event: DragEvent) => {
      if (event.relatedTarget) return
      setDragging(false)
    }
    const onDrop = (event: DragEvent) => {
      event.preventDefault()
      setDragging(false)
      const file = event.dataTransfer?.files?.[0]
      if (file) onOpen(file)
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [onOpen])

  return (
    <div className={`shelf${dragging ? ' is-dragging' : ''}`}>
      <header className="shelf__bar">
        <div className="wordmark">
          <span className="wordmark__mark" aria-hidden="true" />
          <span className="wordmark__text">
            OPEN<span>READER</span>
          </span>
        </div>
        <div className="shelf__bar-right" ref={gear}>
          <span className="stamp">open-library.eridu.top</span>
          <button
            className="icon-btn"
            type="button"
            title={settings.theme === 'dark' ? t('theme.light') : t('theme.dark')}
            onClick={() =>
              patchSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
          >
            <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button
            className={`icon-btn${settingsOpen ? ' is-active' : ''}`}
            type="button"
            title={t('shelf.settings')}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((value) => !value)}
          >
            <Icon name="gear" />
          </button>

          {settingsOpen && (
            <div className="gear" role="dialog" aria-label={t('shelf.settings')}>
              <div className="gear__group">
                <span className="gear__label">{t('shelf.language')}</span>
                <div className="gear__langs">
                  <button
                    type="button"
                    className={settings.language === 'auto' ? 'is-on' : ''}
                    onClick={() => patchSettings({ language: 'auto' })}
                  >
                    <span>{t('shelf.languageAuto')}</span>
                    <em>{LOCALE_LABEL[locale]}</em>
                  </button>
                  {LOCALES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      className={settings.language === code ? 'is-on' : ''}
                      onClick={() => patchSettings({ language: code })}
                    >
                      {LOCALE_LABEL[code]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gear__group">
                <span className="gear__label">{t('shelf.theme')}</span>
                <div className="seg">
                  <button
                    type="button"
                    className={settings.theme === 'light' ? 'is-on' : ''}
                    onClick={() => patchSettings({ theme: 'light' })}
                  >
                    {t('theme.light')}
                  </button>
                  <button
                    type="button"
                    className={settings.theme === 'dark' ? 'is-on' : ''}
                    onClick={() => patchSettings({ theme: 'dark' })}
                  >
                    {t('theme.dark')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="shelf__main">
        <section className="hero">
          <p className="kicker">{t('shelf.kicker')}</p>
          <h1 className="hero__title">
            {t('shelf.title1')}
            <br />
            <em>{t('shelf.title2')}</em>
          </h1>
          <p className="hero__lead">{t('shelf.lead')}</p>
        </section>

        <section
          className="drop"
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer?.files?.[0]
            if (file) onOpen(file)
          }}
        >
          <div className="drop__inner">
            <Icon name="upload" size={26} />
            <p className="drop__title">{t('shelf.drop.title')}</p>
            <p className="drop__hint">{t('shelf.drop.hint')}</p>
            <button className="btn btn--accent" type="button" onClick={choose} disabled={busy}>
              {busy ? t('shelf.drop.reading') : t('shelf.drop.button')}
            </button>
            <ul className="chips" aria-label={t('shelf.formats')}>
              {FORMATS.map((format) => (
                <li key={format} className="chip">
                  {format}
                </li>
              ))}
            </ul>
          </div>
          <input
            ref={input}
            type="file"
            accept={ACCEPTED}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onOpen(file)
              event.target.value = ''
            }}
          />
        </section>

        {error && (
          <div className="notice" role="alert">
            <span>{error}</span>
            <button className="icon-btn" type="button" onClick={onDismissError} title={t('pop.close')}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        <section className="shelf__recent">
          <div className="section-head">
            <h2>{t('shelf.library')}</h2>
            <span className="section-head__rule" />
            <span className="section-head__count">
              {library.length === 0
                ? t('shelf.empty')
                : library.length === 1
                  ? t('shelf.countOne')
                  : t('shelf.countMany', { n: library.length })}
            </span>
          </div>

          {library.length === 0 ? (
            <ol className="steps">
              {(['1', '2', '3'] as const).map((step) => (
                <li key={step}>
                  <span className="steps__num">0{step}</span>
                  <div>
                    <h3>{t(`shelf.steps.${step}.title` as MessageKey)}</h3>
                    <p>{t(`shelf.steps.${step}.text` as MessageKey)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="cards">
              {library.map((entry) => (
                <li key={entry.id} className="card">
                  <div className="card__top">
                    <span className="card__format">{entry.format}</span>
                    <button
                      className="icon-btn icon-btn--ghost"
                      type="button"
                      title={t('shelf.forget')}
                      onClick={() => onForget(entry.id)}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <h3 className="card__title">{entry.title}</h3>
                  <p className="card__author">{entry.author || t('shelf.unknownAuthor')}</p>
                  <div className="card__meter" aria-hidden="true">
                    <span style={{ width: `${Math.round(entry.fraction * 100)}%` }} />
                  </div>
                  <div className="card__foot">
                    <span>{percent(entry.fraction)}</span>
                    <span>{relativeTime(entry.lastOpenedAt, locale)}</span>
                  </div>
                  <button className="card__action" type="button" onClick={choose}>
                    {t('shelf.reopen')}
                    <Icon name="chevron-right" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="shelf__foot">
          <p>{t('shelf.foot')}</p>
          <div className="shelf__foot-actions">
            <button className="btn btn--ghost" type="button" onClick={onExportAll}>
              <Icon name="download" size={15} /> {t('shelf.export')}
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => backup.current?.click()}
            >
              <Icon name="upload" size={15} /> {t('shelf.import')}
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
          </div>
        </footer>
      </main>

      {dragging && (
        <div className="drop-veil" aria-hidden="true">
          <span>{t('shelf.veil')}</span>
        </div>
      )}
    </div>
  )
}
