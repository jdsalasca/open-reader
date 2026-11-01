// Registers <foliate-view> and the paginator / fixed-layout renderers.
import '../vendor/foliate/view.js'
import type { Annotation, LocationInfo, TocItem } from './types'

export interface FoliateLocation {
  fraction: number
  cfi: string
  index: number
  tocItem?: TocItem | null
  pageItem?: { label: string } | null
  location?: { current: number; total: number }
}

export interface FoliateRenderer extends HTMLElement {
  setStyles?: (styles: string | string[]) => void
  getContents: () => { doc: Document; index: number; overlayer?: unknown }[]
}

export interface FoliateBook {
  metadata?: Record<string, unknown>
  toc?: TocItem[]
  sections: { id: unknown }[]
  dir?: string
}

export interface FoliateView extends HTMLElement {
  open: (file: File | string) => Promise<void>
  init: (options: { lastLocation?: string; showTextStart?: boolean }) => Promise<void>
  close: () => void
  goTo: (target: string | number) => Promise<unknown>
  goToFraction: (fraction: number) => Promise<void>
  next: (distance?: number) => Promise<void>
  prev: (distance?: number) => Promise<void>
  goLeft: () => Promise<void>
  goRight: () => Promise<void>
  getCFI: (index: number, range: Range | null) => string
  addAnnotation: (annotation: Annotation & { value: string }) => Promise<unknown>
  deleteAnnotation: (annotation: { value: string }) => Promise<unknown>
  deselect: () => void
  renderer: FoliateRenderer
  book: FoliateBook
  isFixedLayout: boolean
  lastLocation?: FoliateLocation
}

export function createView(): FoliateView {
  return document.createElement('foliate-view') as FoliateView
}

export function toLocation(detail: FoliateLocation): LocationInfo {
  return {
    cfi: detail.cfi ?? '',
    index: detail.index ?? 0,
    fraction: Number.isFinite(detail.fraction) ? detail.fraction : 0,
    chapter: detail.tocItem?.label ?? '',
    page: detail.pageItem?.label ?? null,
    location: detail.location ?? null,
  }
}

const labelOf = (value: unknown): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(labelOf).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.name === 'string') return record.name
    const first = Object.values(record)[0]
    if (typeof first === 'string') return first
  }
  return ''
}

export const bookTitle = (metadata?: Record<string, unknown>): string =>
  labelOf(metadata?.title)

export const bookAuthor = (metadata?: Record<string, unknown>): string => {
  const author = metadata?.author ?? metadata?.creator
  return labelOf(author)
}

export function normalizeToc(items?: TocItem[] | null): TocItem[] {
  if (!Array.isArray(items)) return []
  return items
    .filter(Boolean)
    .map((item) => ({
      label: labelOf(item.label) || 'Sin título',
      href: String(item.href ?? ''),
      subitems: normalizeToc(item.subitems),
    }))
}
