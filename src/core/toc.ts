import type { TocItem } from './types'

const CHAPTER_TAIL =
  /^(.*?)[\s\-–—:.]*(cap[íi]tulo|chapter|ch\.?|parte|part|secci[óo]n|section|libro|book)\s+([0-9]+|[ivxlcdm]+)\.?$/i

const KIND: Record<string, string> = {
  capitulo: 'Capítulo',
  capítulo: 'Capítulo',
  chapter: 'Capítulo',
  ch: 'Capítulo',
  'ch.': 'Capítulo',
  parte: 'Parte',
  part: 'Parte',
  seccion: 'Sección',
  sección: 'Sección',
  section: 'Sección',
  libro: 'Libro',
  book: 'Libro',
}

/**
 * TOC labels arrive from the file: some EPUBs and most MOBIs put the first
 * sentence of the chapter inside the label ("I hope Mr. Bingley will like it.
 * CHAPTER II."). Keep the part a reader can scan.
 */
export function cleanTocLabel(raw: string): string {
  let label = String(raw ?? '').normalize('NFC').replace(/\s+/g, ' ').trim()
  label = label.replace(/^[\s·•\-–—.,]+/, '').replace(/[\s·•\-–—.,;:]+$/, '')
  if (!label) return 'Sin título'

  const tail = CHAPTER_TAIL.exec(label)
  if (tail) {
    const word = KIND[tail[2].toLowerCase()] ?? 'Capítulo'
    label = `${word} ${tail[3].toUpperCase()}`
  }

  label = label.charAt(0).toUpperCase() + label.slice(1)
  return label.length > 78 ? `${label.slice(0, 76).trimEnd()}…` : label
}

export function normalizeToc(items?: TocItem[] | null): TocItem[] {
  if (!Array.isArray(items)) return []
  return items
    .filter(Boolean)
    .map((item) => ({
      label: cleanTocLabel(String(item.label ?? '')),
      href: String(item.href ?? ''),
      subitems: normalizeToc(item.subitems),
    }))
}
