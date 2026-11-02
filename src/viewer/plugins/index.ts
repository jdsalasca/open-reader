import { bookmarksPlugin } from '../../features/bookmarks/plugin'
import { highlightsPlugin } from '../../features/highlights/plugin'
import { notesPlugin } from '../../features/notes/plugin'
import { quotesPlugin } from '../../features/quotes/plugin'
import { searchPlugin } from '../../features/search/plugin'
import { settingsPlugin } from '../../features/settings/plugin'
import { tocPlugin } from '../../features/toc/plugin'
import { wakePlugin } from '../../features/wake/plugin'
import type { ViewerPlugin } from './types'

/**
 * The reader is the sum of its plugins. Order sets the panel tabs and the
 * top-bar buttons; adding a feature is one file plus one line here.
 */
export const plugins: ViewerPlugin[] = [
  tocPlugin,
  searchPlugin,
  notesPlugin,
  bookmarksPlugin,
  settingsPlugin,
  highlightsPlugin,
  quotesPlugin,
  wakePlugin,
]
