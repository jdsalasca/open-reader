import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'
import type { TocItem } from '../../core/types'
import type { ViewerPlugin } from '../../viewer/plugins/types'

function TocList({ items, level }: { items: TocItem[]; level: number }) {
  const { location, goTo } = useReader()
  const current = location?.chapter ?? ''

  return (
    <ul className="toc" data-level={level}>
      {items.map((item, index) => (
        <li key={`${item.href}-${index}`} className="toc__node">
          <button
            type="button"
            className={`toc__item${item.label === current ? ' is-current' : ''}`}
            onClick={() => goTo(item.href)}
          >
            <span className="toc__label">{item.label}</span>
          </button>
          {item.subitems?.length ? <TocList items={item.subitems} level={level + 1} /> : null}
        </li>
      ))}
    </ul>
  )
}

function TocPanel() {
  const { t } = useI18n()
  const { book } = useReader()

  return (
    <div className="panel">
      {book?.toc.length ? (
        <TocList items={book.toc} level={0} />
      ) : (
        <p className="empty">{t('toc.empty')}</p>
      )}
    </div>
  )
}

export const tocPlugin: ViewerPlugin = {
  id: 'toc',
  tab: { id: 'toc', label: 'tab.toc', Panel: TocPanel },
}
