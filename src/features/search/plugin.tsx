import { useRef } from 'react'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'
import type { ViewerPlugin } from '../../viewer/plugins/types'

export const SEARCH_TAB = 'search'

function SearchPanel() {
  const { t } = useI18n()
  const { book, search, runSearch, clearSearch, goTo } = useReader()
  const input = useRef<HTMLInputElement | null>(null)
  const fixed = Boolean(book?.fixedLayout)
  const matches = search.results.reduce((total, group) => total + group.items.length, 0)

  return (
    <div className="panel panel--search">
      <form
        className="search"
        onSubmit={(event) => {
          event.preventDefault()
          runSearch(input.current?.value ?? '')
        }}
      >
        <input
          ref={input}
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

      {fixed && <p className="empty">{t('search.unavailable')}</p>}

      {search.running && (
        <div className="search__progress" aria-hidden="true">
          <span style={{ width: `${Math.round(search.progress * 100)}%` }} />
        </div>
      )}

      {!search.running && search.query && !matches && !fixed && (
        <p className="empty">{t('search.none', { q: search.query })}</p>
      )}

      {matches > 0 && (
        <div className="search__meta">
          <span>{t('search.matches', { n: matches })}</span>
          <button type="button" className="search__clear" onClick={clearSearch}>
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
                <button type="button" onClick={() => goTo(item.cfi)}>
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
  )
}

export const searchPlugin: ViewerPlugin = {
  id: 'search',
  tab: { id: SEARCH_TAB, label: 'tab.search', Panel: SearchPanel },
}
