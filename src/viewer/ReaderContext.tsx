import { createContext, useContext } from 'react'
import type { MessageKey } from '../i18n/es'
import type {
  Annotation,
  BookMeta,
  BookProgress,
  HighlightColor,
  HighlightStyle,
  LocationInfo,
  SelectionInfo,
  Settings,
} from '../core/types'
import type { BookInfo, Rect } from './useFoliate'

export interface SearchHit {
  cfi: string
  excerpt: { pre: string; match: string; post: string }
}

export interface SearchGroup {
  label: string
  items: SearchHit[]
}

export interface SearchState {
  query: string
  progress: number
  running: boolean
  results: SearchGroup[]
}

/** A note being written or edited. */
export interface NoteDraft {
  /** Present when editing an existing highlight. */
  id?: string
  quote: string
  initial: string
}

/** A quote card being previewed. */
export interface QuoteDraft {
  /** Present when the highlight already exists. */
  id?: string
  text: string
  color: HighlightColor
  chapter: string
  cfi?: string
  index?: number
  saved: boolean
}

export interface MarkPatch {
  color?: HighlightColor
  style?: HighlightStyle
}

/**
 * Everything a feature may need from the reading session. The screen builds it
 * and every plugin reads it with `useReader()`.
 */
export interface ReaderStore {
  book: BookInfo | null
  meta: BookMeta | null
  ready: boolean
  settings: Settings
  patchSettings(patch: Partial<Settings>): void
  /** Translation, for plugins that run outside a component (shortcuts). */
  t(key: MessageKey, vars?: Record<string, string | number>): string
  flash(message: string): void

  location: LocationInfo | null
  progress: BookProgress
  selection: SelectionInfo | null
  /** The mark the reader clicked on the page, with its on-screen rect. */
  active: { annotation: Annotation; rect: Rect } | null
  annotations: Annotation[]

  addAnnotation(annotation: Annotation): void
  updateAnnotation(id: string, patch: Partial<Annotation>): void
  deleteAnnotation(id: string): void
  setAnnotations(next: Annotation[]): void
  /** Commits the current selection as a highlight and clears the selection. */
  highlight(patch?: { color?: HighlightColor; style?: HighlightStyle; note?: string; quoted?: boolean }): Annotation | null
  /** Drops the selection and the clicked mark. */
  dismiss(): void

  goTo(target: string | number): void
  goToFraction(fraction: number): void
  next(): void
  prev(): void
  deselect(): void
  fullscreen: boolean
  toggleFullscreen(): void
  /** Y position of every mark in the visible section, for the margin. */
  markAnchors(): Record<string, number>
  search: SearchState
  runSearch(query: string): void
  clearSearch(): void

  panel: { open: boolean; tab: string }
  openPanel(tab?: string): void
  closePanel(): void
  togglePanel(): void

  note: NoteDraft | null
  openNote(draft: NoteDraft): void
  closeNote(): void
  quote: QuoteDraft | null
  openQuote(draft: QuoteDraft): void
  closeQuote(): void

  resetProgress(): void
}

const ReaderContext = createContext<ReaderStore | null>(null)

export const ReaderProvider = ReaderContext.Provider

export function useReader(): ReaderStore {
  const store = useContext(ReaderContext)
  if (!store) throw new Error('useReader must be used inside <ReaderProvider>')
  return store
}
