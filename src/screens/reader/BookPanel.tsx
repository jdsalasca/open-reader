import { Icon } from '../../components/Icons'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'
import type { PanelTab } from '../../viewer/plugins/types'

/** The side panel: tabs come from the plugin registry. */
export default function BookPanel({ tabs }: { tabs: PanelTab[] }) {
  const { t } = useI18n()
  const store = useReader()
  const { book, panel, openPanel, closePanel } = store
  const current = tabs.find((tab) => tab.id === panel.tab) ?? tabs[0]
  const Panel = current?.Panel

  return (
    <aside className="rail" aria-label={t('reader.panel')}>
      <div className="rail__head">
        <span className="rail__kicker">
          {book?.fixedLayout ? t('rail.fixed') : t('rail.flow')}
        </span>
        <button
          className="icon-btn icon-btn--ghost rail__close"
          type="button"
          onClick={closePanel}
          title={t('rail.close')}
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <nav className="rail__tabs" role="tablist">
        {tabs.map((tab) => {
          const count = tab.count?.(store) ?? 0
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={panel.tab === tab.id}
              className={panel.tab === tab.id ? 'is-on' : ''}
              onClick={() => openPanel(tab.id)}
            >
              {t(tab.label)}
              {count > 0 && <span className="rail__count">{count}</span>}
            </button>
          )
        })}
      </nav>

      <div className="rail__panel">{Panel && <Panel />}</div>

      <button
        className="rail__collapse"
        type="button"
        onClick={closePanel}
        title={t('rail.collapse')}
        aria-label={t('rail.collapse')}
      >
        <Icon name="chevron-left" size={14} />
      </button>
    </aside>
  )
}
