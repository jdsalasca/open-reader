import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  EMPTY_PROGRESS,
  exportBackup,
  importBackup,
  listLibrary,
  loadBook,
  loadSettings,
  removeFromLibrary,
  saveBook,
  saveSettings,
  touchLibrary,
} from '../src/lib/storage'
import type { BookRecord } from '../src/lib/types'

const meta: BookRecord['meta'] = {
  id: 'abc123',
  title: 'El libro',
  author: 'Alguien',
  format: 'EPUB',
  fixedLayout: false,
  addedAt: 1,
  lastOpenedAt: 2,
}

describe('settings', () => {
  beforeEach(() => localStorage.clear())

  it('falls back to defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips a partial update on top of the defaults', () => {
    saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark', fontSize: 120 })
    expect(loadSettings()).toMatchObject({ theme: 'dark', fontSize: 120, flow: 'paginated' })
  })

  it('survives corrupt json', () => {
    localStorage.setItem('openreader.v1.settings', '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('books', () => {
  beforeEach(() => localStorage.clear())

  it('stores notes and progress per book', () => {
    const record: BookRecord = {
      meta,
      progress: { cfi: 'epubcfi(/6/4)', fraction: 0.4, chapter: 'Dos' },
      annotations: [
        {
          id: 'a1',
          kind: 'highlight',
          cfi: 'epubcfi(/6/4!/2,/1:0,/1:8)',
          index: 2,
          text: 'hola',
          note: '',
          color: 'amber',
          style: 'highlight',
          chapter: 'Dos',
          createdAt: 3,
        },
      ],
    }
    expect(saveBook(record)).toBe(true)
    expect(loadBook('abc123')).toMatchObject({
      progress: { fraction: 0.4 },
      annotations: [{ text: 'hola' }],
    })
    expect(loadBook('otro')).toBeNull()
  })

  it('fills missing progress instead of returning undefined', () => {
    localStorage.setItem(
      'openreader.v1.book.x',
      JSON.stringify({ meta: { ...meta, id: 'x' } }),
    )
    expect(loadBook('x')?.progress).toEqual(EMPTY_PROGRESS)
    expect(loadBook('x')?.annotations).toEqual([])
  })

  it('keeps the most recent book first and drops duplicates', () => {
    touchLibrary({ id: 'a', title: 'A', author: '', format: 'EPUB', fraction: 0, lastOpenedAt: 1 })
    touchLibrary({ id: 'b', title: 'B', author: '', format: 'PDF', fraction: 0, lastOpenedAt: 2 })
    touchLibrary({ id: 'a', title: 'A', author: '', format: 'EPUB', fraction: 0.5, lastOpenedAt: 3 })
    expect(listLibrary().map((entry) => entry.id)).toEqual(['a', 'b'])
    removeFromLibrary('a')
    expect(listLibrary().map((entry) => entry.id)).toEqual(['b'])
  })
})

describe('backup', () => {
  beforeEach(() => localStorage.clear())

  it('exports and re-imports a book', () => {
    const record: BookRecord = { meta, progress: EMPTY_PROGRESS, annotations: [] }
    const json = exportBackup([record])
    expect(importBackup(json)).toBe(1)
    expect(loadBook('abc123')?.meta.title).toBe('El libro')
  })

  it('rejects json that is not a backup', () => {
    expect(importBackup('{"hello":1}')).toBe(0)
  })
})
