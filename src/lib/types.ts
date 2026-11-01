export type ThemeMode = 'light' | 'dark'
export type Flow = 'paginated' | 'scrolled'
export type ReadingFont = 'book' | 'serif' | 'sans'
export type Zoom = 'fit-page' | 'fit-width'

export type HighlightColor = 'amber' | 'rust' | 'sage' | 'sky' | 'iris'
export type HighlightStyle = 'highlight' | 'underline' | 'squiggly' | 'strike'

export type AnnotationKind = 'highlight' | 'bookmark'

export interface Annotation {
  id: string
  kind: AnnotationKind
  /** EPUB CFI (also used for PDF/CBZ, where it is a fake index CFI). */
  cfi: string
  /** Spine / page index, used to decide when the mark must be drawn. */
  index: number
  /** Selected text, or the chapter label for bookmarks. */
  text: string
  note: string
  color: HighlightColor
  style: HighlightStyle
  chapter: string
  createdAt: number
}

export interface TocItem {
  label: string
  href: string
  subitems?: TocItem[]
}

export interface BookMeta {
  id: string
  title: string
  author: string
  format: string
  fixedLayout: boolean
  addedAt: number
  lastOpenedAt: number
}

export interface BookProgress {
  cfi: string
  fraction: number
  chapter: string
}

export interface BookRecord {
  meta: BookMeta
  progress: BookProgress
  annotations: Annotation[]
}

export interface LibraryEntry {
  id: string
  title: string
  author: string
  format: string
  fraction: number
  lastOpenedAt: number
}

export interface Settings {
  theme: ThemeMode
  flow: Flow
  fontSize: number
  lineHeight: number
  justify: boolean
  hyphens: boolean
  columnWidth: number
  readingFont: ReadingFont
  zoom: Zoom
}

export interface LocationInfo {
  cfi: string
  index: number
  fraction: number
  chapter: string
  page: string | null
  location: { current: number; total: number } | null
}

export interface SelectionInfo {
  cfi: string
  index: number
  text: string
  rect: { left: number; top: number; width: number; height: number }
}
