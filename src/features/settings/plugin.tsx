import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icons'
import AppUpdate from '../../components/AppUpdate'
import { bytes, downloadText, percent, slug } from '../../core/format'
import { bookToMarkdown } from '../../core/exportMarkdown'
import { COLOR_KEYS, HIGHLIGHT_COLORS, STYLE_KEYS } from '../../core/reading'
import { exportBackup, importBackup, loadBook, storageEstimate } from '../../core/storage'
import { useI18n } from '../../i18n'
import { Segmented, Slider, Toggle } from '../../ui/controls'
import { useReader } from '../../viewer/ReaderContext'
import type { ViewerPlugin } from '../../viewer/plugins/types'

export const SETTINGS_TAB = 'settings'

function SettingsPanel() {
  const { t } = useI18n()
  const {
    settings,
    patchSettings,
    book,
    meta,
    location,
    progress,
    annotations,
    setAnnotations,
    resetProgress,
    flash,
  } = useReader()
  const backup = useRef<HTMLInputElement | null>(null)
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

  const used = usage && usage.quota > 0 ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0
  const fixed = Boolean(book?.fixedLayout)

  const exportNotes = () => {
    if (!meta) return
    downloadText(`notas-${slug(meta.title)}.eridu`, exportBackup([{ meta, progress, annotations }]))
    flash(t('reader.toast.exported'))
  }

  const exportMarkdown = () => {
    if (!meta) return
    downloadText(`notas-${slug(meta.title)}.md`, bookToMarkdown({ meta, progress, annotations }))
    flash(t('reader.toast.md'))
  }

  const importNotes = async (file: File) => {
    try {
      await importBackup(await file.text())
      const reloaded = meta ? await loadBook(meta.id) : null
      if (reloaded) setAnnotations(reloaded.annotations)
      flash(t('reader.toast.imported'))
    } catch {
      flash(t('reader.toast.importFail'))
    }
  }

  const clearNotes = () => {
    if (!window.confirm(t('reader.confirm.clear'))) return
    setAnnotations([])
    resetProgress()
    flash(t('reader.toast.cleared'))
  }

  return (
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
            { value: 'paper', label: t('theme.light') },
            { value: 'industrial', label: t('theme.dark') },
          ]}
          onChange={(theme) => patchSettings({ theme })}
        />
        {fixed ? (
          <Segmented
            label={t('settings.zoom')}
            value={settings.zoom}
            options={[
              { value: 'fit-page', label: t('settings.fitPage') },
              { value: 'fit-width', label: t('settings.fitWidth') },
            ]}
            onChange={(zoom) => patchSettings({ zoom })}
          />
        ) : (
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
      </section>

      <section className="panel__group">
        <h3>{t('settings.reading')}</h3>
        <Segmented
          label={t('settings.type')}
          value={settings.readingFont}
          options={[
            { value: 'descanso', label: t('settings.typeDescanso') },
            { value: 'editorial', label: t('settings.typeEditorial') },
            { value: 'legible', label: t('settings.typeLegible') },
            { value: 'book', label: t('settings.typeBook') },
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
        {!fixed && (
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
        <Toggle
          label={t('settings.keepAwake')}
          checked={settings.keepAwake}
          onChange={(keepAwake) => patchSettings({ keepAwake })}
          hint={t('settings.keepAwakeHint')}
        />
      </section>

      <section className="panel__group">
        <h3>{t('settings.annotations')}</h3>
        <Toggle
          label={t('settings.margin')}
          checked={settings.marginNotes}
          onChange={(marginNotes) => patchSettings({ marginNotes })}
          hint={t('settings.marginHint')}
        />
      </section>

      <section className="panel__group">
        <h3>{t('settings.legend')}</h3>
        <ul className="legend">
          {COLOR_KEYS.map((key) => (
            <li key={key}>
              <span style={{ background: HIGHLIGHT_COLORS[key].hex }} />
              {t(`color.${key}`)}
            </li>
          ))}
        </ul>
        <ul className="legend legend--styles">
          {STYLE_KEYS.map((key) => (
            <li key={key}>{t(`style.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section className="panel__group">
        <h3>{t('settings.data')}</h3>
        <div className="storage">
          <div className="storage__bar" aria-hidden="true">
            <span style={{ width: `${used}%` }} />
          </div>
          <div className="storage__meta">
            <span>
              {t('settings.storageOf', {
                used: bytes(usage?.used ?? 0),
                quota: bytes(usage?.quota ?? 0),
              })}
            </span>
            <span>{used}%</span>
          </div>
          <p className="panel__hint">{t('settings.storageHint')}</p>
        </div>
        <p className="panel__hint">{t('settings.dataHint')}</p>
        <div className="panel__actions">
          <button className="btn btn--ghost" type="button" onClick={exportNotes}>
            <Icon name="download" size={15} /> .eridu
          </button>
          <button className="btn btn--ghost" type="button" onClick={() => backup.current?.click()}>
            <Icon name="upload" size={15} /> {t('settings.import')}
          </button>
        </div>
        <button className="btn btn--ghost" type="button" onClick={exportMarkdown}>
          <Icon name="note" size={15} /> {t('settings.markdown')}
        </button>
        <button className="btn btn--danger" type="button" onClick={clearNotes}>
          <Icon name="trash" size={15} /> {t('settings.clear')}
        </button>
        <input
          ref={backup}
          type="file"
          accept=".eridu,.json,application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void importNotes(file)
            event.target.value = ''
          }}
        />
      </section>

      <section className="panel__group">
        <h3>{t('settings.app')}</h3>
        <AppUpdate />
      </section>

      <p className="panel__foot">
        {t('settings.read', { p: percent(location?.fraction ?? 0) })}
        {location?.page ? ` · ${t('settings.page', { n: location.page })}` : ''}
      </p>
    </div>
  )
}

export const settingsPlugin: ViewerPlugin = {
  id: 'settings',
  tab: { id: SETTINGS_TAB, label: 'tab.settings', Panel: SettingsPanel },
}
