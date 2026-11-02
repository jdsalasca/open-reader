import type { ComponentType } from 'react'
import { Icon } from '../../components/Icons'
import { formatOf, titleFromName } from '../../core/book'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'

interface Props {
  file: File
  onExit: () => void
  actions: ComponentType[]
}

export default function TopBar({ file, onExit, actions }: Props) {
  const { t } = useI18n()
  const { book, location, settings, patchSettings, panel, togglePanel, fullscreen, toggleFullscreen } =
    useReader()

  const toggleTheme = () =>
    patchSettings({ theme: settings.theme === 'industrial' ? 'paper' : 'industrial' })

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="icon-btn" type="button" onClick={onExit} title={t('reader.back')}>
          <Icon name="arrow-left" />
        </button>
        <div className="topbar__id">
          <span className="topbar__title">{book?.title ?? titleFromName(file.name)}</span>
          <span className="topbar__meta">
            {book?.author || t('shelf.unknownAuthor')}
            {book ? ` · ${formatOf(file.name)}` : ''}
          </span>
        </div>
      </div>

      <div className="topbar__chapter">
        <span className="topbar__chapter-label">{location?.chapter || t('reader.cover')}</span>
      </div>

      <div className="topbar__actions">
        {actions.map((Action, index) => (
          <Action key={index} />
        ))}
        <button className="icon-btn" type="button" onClick={toggleTheme} title={t('reader.theme')}>
          <Icon name={settings.theme === 'industrial' ? 'sun' : 'moon'} />
        </button>
        <button
          className="icon-btn"
          type="button"
          onClick={() => void toggleFullscreen()}
          title={t('reader.fullscreen')}
        >
          <Icon name={fullscreen ? 'shrink' : 'expand'} />
        </button>
        <button
          className={`icon-btn${panel.open ? ' is-active' : ''}`}
          type="button"
          onClick={togglePanel}
          title={t('reader.panel')}
        >
          <Icon name="list" />
        </button>
      </div>
    </header>
  )
}
