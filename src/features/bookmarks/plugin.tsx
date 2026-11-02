import { Icon } from '../../components/Icons'
import { bookmarkFrom } from '../../core/annotation'
import { relativeTime } from '../../core/format'
import { useI18n } from '../../i18n'
import { useReader, type ReaderStore } from '../../viewer/ReaderContext'
import type { ViewerPlugin } from '../../viewer/plugins/types'

export const MARKS_TAB = 'marks'

const bookmarksOf = (store: ReaderStore) =>
  store.annotations.filter((item) => item.kind === 'bookmark')

const bookmarkAt = (store: ReaderStore) =>
  bookmarksOf(store).find((item) => item.cfi === store.location?.cfi)

function toggleBookmark(store: ReaderStore) {
  const { location, addAnnotation, deleteAnnotation, flash, t } = store
  if (!location?.cfi) return

  const existing = bookmarkAt(store)
  if (existing) {
    deleteAnnotation(existing.id)
    return
  }
  const label = location.chapter || t('reader.page', { n: location.page ?? location.index + 1 })
  addAnnotation(bookmarkFrom(location, label))
  flash(t('reader.toast.bookmarked'))
}

function MarksPanel() {
  const { t, locale } = useI18n()
  const { annotations, goTo, deleteAnnotation } = useReader()
  const list = annotations.filter((item) => item.kind === 'bookmark')

  if (!list.length) return <p className="empty">{t('marks.empty')}</p>

  return (
    <div className="panel">
      <ul className="marks">
        {list.map((item) => (
          <li key={item.id} className="mark mark--bookmark">
            <button type="button" className="mark__body" onClick={() => goTo(item.cfi)}>
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
                onClick={() => deleteAnnotation(item.id)}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BookmarkAction() {
  const { t } = useI18n()
  const store = useReader()

  return (
    <button
      className={`icon-btn${bookmarkAt(store) ? ' is-active' : ''}`}
      type="button"
      onClick={() => toggleBookmark(store)}
      title={t('reader.bookmark')}
    >
      <Icon name={bookmarkAt(store) ? 'bookmark-filled' : 'bookmark'} />
    </button>
  )
}

export const bookmarksPlugin: ViewerPlugin = {
  id: 'bookmarks',
  Action: BookmarkAction,
  tab: {
    id: MARKS_TAB,
    label: 'tab.marks',
    count: (store) => bookmarksOf(store).length,
    Panel: MarksPanel,
  },
  onKey(store, event) {
    if (event.key !== 'b') return false
    event.preventDefault()
    toggleBookmark(store)
    return true
  },
}
