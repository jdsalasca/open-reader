import { uid } from './format'
import type {
  Annotation,
  HighlightColor,
  HighlightStyle,
  SelectionInfo,
} from './types'

export interface HighlightPatch {
  color?: HighlightColor
  style?: HighlightStyle
  note?: string
  quoted?: boolean
}

/** Turns a selection into a highlight. Kept out of React so it can be tested. */
export function highlightFrom(
  selection: Pick<SelectionInfo, 'cfi' | 'index' | 'text'>,
  chapter: string,
  patch: HighlightPatch = {},
): Annotation {
  return {
    id: uid(),
    kind: 'highlight',
    cfi: selection.cfi,
    index: selection.index,
    text: selection.text,
    note: patch.note ?? '',
    color: patch.color ?? 'amber',
    style: patch.style ?? 'highlight',
    chapter,
    createdAt: Date.now(),
    quoted: patch.quoted,
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
