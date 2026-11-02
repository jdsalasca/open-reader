import { describe, expect, it } from 'vitest'
import { cleanTocLabel } from '../src/core/toc'
import { bookToMarkdown } from '../src/core/exportMarkdown'
import type { Annotation, BookRecord } from '../src/core/types'

describe('cleanTocLabel', () => {
  it('drops the first sentence when the label ends in a chapter marker', () => {
    expect(cleanTocLabel('I hope Mr. Bingley will like it. CHAPTER II.')).toBe('Capítulo II')
    expect(cleanTocLabel('He rode a black horse. CHAPTER III.')).toBe('Capítulo III')
  })

  it('keeps short, real titles untouched', () => {
    expect(cleanTocLabel('La mesa de trabajo')).toBe('La mesa de trabajo')
    expect(cleanTocLabel('  El   primer   pliego ')).toBe('El primer pliego')
  })

  it('normalizes spanish markers and trims punctuation', () => {
    expect(cleanTocLabel('capítulo iv.')).toBe('Capítulo IV')
    expect(cleanTocLabel('— Capítulo 12 —')).toBe('Capítulo 12')
  })

  it('caps very long labels', () => {
    const long = 'a'.repeat(120)
    expect(cleanTocLabel(long).length).toBeLessThanOrEqual(78)
    expect(cleanTocLabel(long).endsWith('…')).toBe(true)
  })
})

const meta: BookRecord['meta'] = {
  id: 'x',
  title: 'El taller de papel',
  author: 'Taller de pruebas',
  format: 'EPUB',
  fixedLayout: false,
  addedAt: 1,
  lastOpenedAt: 2,
}

const mark = (over: Partial<Annotation>): Annotation => ({
  id: 'a',
  kind: 'highlight',
  cfi: 'epubcfi(/6/2!/4/2/4,/1:0,/1:10)',
  index: 0,
  text: 'Sobre la mesa había un cuaderno',
  note: '',
  color: 'amber',
  style: 'highlight',
  chapter: 'La mesa de trabajo',
  createdAt: 1,
  ...over,
})

describe('bookToMarkdown', () => {
  it('groups quotes by chapter and adds a citations section', () => {
    const record: BookRecord = {
      meta,
      progress: { cfi: '', fraction: 0, chapter: '' },
      annotations: [
        mark({ id: '1', text: 'primera cita', quoted: true }),
        mark({ id: '2', index: 1, chapter: 'El primer pliego', text: 'otra', note: 'mi nota' }),
      ],
    }
    const md = bookToMarkdown(record)
    expect(md).toContain('# El taller de papel')
    expect(md).toContain('## La mesa de trabajo')
    expect(md).toContain('> primera cita')
    expect(md).toContain('## El primer pliego')
    expect(md).toContain('**Nota:** mi nota')
    expect(md).toContain('## Citas')
    expect(md).toContain('_Taller de pruebas, El taller de papel_')
  })

  it('escapes markdown characters in the quoted text', () => {
    const md = bookToMarkdown({
      meta,
      progress: { cfi: '', fraction: 0, chapter: '' },
      annotations: [mark({ text: 'un *asterisco* y un _guion_' })],
    })
    expect(md).toContain('un \\*asterisco\\* y un \\_guion\\_')
  })

  it('handles a book without notes', () => {
    const md = bookToMarkdown({
      meta,
      progress: { cfi: '', fraction: 0, chapter: '' },
      annotations: [],
    })
    expect(md).toContain('Todavía no hay resaltados')
  })
})
