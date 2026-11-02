export type ThemeMode = 'paper' | 'industrial'
export type Flow = 'paginated' | 'scrolled'
export type ReadingFont = 'descanso' | 'editorial' | 'legible' | 'book'
export type Zoom = 'fit-page' | 'fit-width'
export type Locale = 'es' | 'en' | 'zh'
export type LanguageSetting = Locale | 'auto'

export type HighlightColor = 'amber' | 'rust' | 'sage' | 'sky' | 'iris'
export type HighlightStyle = 'highlight' | 'underline' | 'squiggly' | 'strike'

export type AnnotationKind = 'highlight' | 'bookmark'

/** Post-it colours for notes stuck in the margin. */
export type StickyColor = 'yellow' | 'purple'

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
  /** "Me gusta" on the margin card. */
  liked?: boolean
  /** Saved to the quotes collection (the shareable card). */
  quoted?: boolean
  /** Draws the margin card as a post-it of this colour. */
  sticky?: StickyColor
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
  /** Notes shown in the right margin, next to the page. */
  marginNotes: boolean
  /** 'auto' follows the device language. */
  language: LanguageSetting
  /** Settings schema version, used to migrate old names. */
  version: number
  /** Left rail visible; kept across sessions. */
  railOpen: boolean
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
