import { describe, expect, it } from 'vitest'
import { fileId, formatOf, titleFromName } from '../src/core/book'
import { bookStyles } from '../src/core/reading'
import { DEFAULT_SETTINGS } from '../src/core/storage'

describe('formatOf', () => {
  it('maps extensions to reader labels', () => {
    expect(formatOf('Dune.epub')).toBe('EPUB')
    expect(formatOf('libro.AZW3')).toBe('AZW3')
    expect(formatOf('paper.pdf')).toBe('PDF')
    expect(formatOf('raro.xyz')).toBe('LIBRO')
  })
})

describe('titleFromName', () => {
  it('turns a filename into a readable title', () => {
    expect(titleFromName('cien_anos_de_soledad.epub')).toBe('cien anos de soledad')
    expect(titleFromName('  .epub')).toBe('Sin título')
  })
})

describe('fileId', () => {
  it('is stable for the same bytes', async () => {
    const a = new File([new Uint8Array([1, 2, 3, 4])], 'x.epub')
    const b = new File([new Uint8Array([1, 2, 3, 4])], 'x.epub')
    expect(await fileId(a)).toBe(await fileId(b))
  })

  it('changes when the content changes', async () => {
    const a = new File([new Uint8Array([1, 2, 3, 4])], 'x.epub')
    const b = new File([new Uint8Array([1, 2, 3, 9])], 'x.epub')
    expect(await fileId(a)).not.toBe(await fileId(b))
  })
})

describe('bookStyles', () => {
  it('paints the reading surface with the active theme', () => {
    const light = bookStyles(DEFAULT_SETTINGS, 'paper')
    const dark = bookStyles(DEFAULT_SETTINGS, 'industrial')
    expect(light).toContain('#fbf6ea')
    expect(dark).toContain('#d9d3b4')
    expect(light).toContain('--overlayer-highlight-blend-mode: multiply')
    expect(dark).toContain('--overlayer-highlight-blend-mode: multiply')
  })

  it('honours type settings', () => {
    const css = bookStyles({ ...DEFAULT_SETTINGS, fontSize: 130, justify: false }, 'paper')
    expect(css).toContain('font-size: 130%')
    expect(css).toContain('text-align: start')
  })
})
