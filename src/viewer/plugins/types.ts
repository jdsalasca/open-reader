import type { ComponentType } from 'react'
import type { MessageKey } from '../../i18n/es'
import type { ReaderStore } from '../ReaderContext'

/** A tab contributed to the side panel. */
export interface PanelTab {
  id: string
  label: MessageKey
  /** Number shown next to the label, e.g. how many notes the book has. */
  count?: (store: ReaderStore) => number
  Panel: ComponentType
}

/**
 * A feature plugged into the viewer.
 *
 * Plugins are components, not classes: they read the reader store with
 * `useReader()` and only declare *where* they appear. Adding a feature is one
 * file plus one line in `plugins/index.ts`.
 */
export interface ViewerPlugin {
  id: string
  /** Button in the top bar, left of the chrome buttons. */
  Action?: ComponentType
  /** Extra tab in the side panel. */
  tab?: PanelTab
  /** Rendered next to the page, inside the stage (the margin). */
  Aside?: ComponentType
  /** Rendered over the page itself, inside the sheet (comment bubbles). */
  Page?: ComponentType
  /** Rendered over the reader: popovers and dialogs. */
  Overlay?: ComponentType
  /** Keyboard shortcut. Return true when the key was handled. */
  onKey?: (store: ReaderStore, event: KeyboardEvent) => boolean
}
