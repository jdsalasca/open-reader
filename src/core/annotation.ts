import { uid } from './format'
import type {
  Annotation,
  HighlightColor,
  HighlightStyle,
  SelectionInfo,
  StickyColor,
} from './types'

export interface HighlightPatch {
  color?: HighlightColor
  style?: HighlightStyle
  note?: string
  quoted?: boolean
  sticky?: StickyColor
}

/** Post-its keep the highlight subtle; the colour lives in the margin card. */
const STICKY_HIGHLIGHT: Record<StickyColor, HighlightColor> = {
  yellow: 'amber',
  purple: 'iris',
}

/** Turns a selection into a highlight. Kept out of React so it can be tested. */
export function highlightFrom(
  selection: Pick<SelectionInfo, 'cfi' | 'index' | 'text'>,
  chapter: string,
  patch: HighlightPatch = {},
): Annotation {
  const color = patch.sticky ? STICKY_HIGHLIGHT[patch.sticky] : (patch.color ?? 'amber')
  return {
    id: uid(),
    kind: 'highlight',
    cfi: selection.cfi,
    index: selection.index,
    text: selection.text,
    note: patch.note ?? '',
    color,
    style: patch.style ?? 'highlight',
    chapter,
    createdAt: Date.now(),
    quoted: patch.quoted,
    sticky: patch.sticky,
  }
}

/** A bookmark is just an annotation without text, anchored to the page. */
export function bookmarkFrom(location: { cfi: string; index: number; chapter: string }, label: string): Annotation {
  return {
    id: uid(),
    kind: 'bookmark',
    cfi: location.cfi,
    index: location.index,
    text: label,
    note: '',
    color: 'rust',
    style: 'highlight',
    chapter: location.chapter,
    createdAt: Date.now(),
  }
}
