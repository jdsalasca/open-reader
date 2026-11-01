import 'fake-indexeddb/auto'
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
import { resetIdb } from '../src/lib/idb'
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
    saveSettings({ ...DEFAULT_SETTINGS, theme: 'industrial', fontSize: 120 })
    expect(loadSettings()).toMatchObject({ theme: 'industrial', fontSize: 120, flow: 'paginated' })
  })

  it('survives corrupt json', () => {
    localStorage.setItem('openreader.v1.settings', '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('books', () => {
  beforeEach(async () => {
    localStorage.clear()
    await resetIdb()
  })

  it('stores notes and progress per book', async () => {
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
    expect(await saveBook(record)).toBe(true)
    expect(await loadBook('abc123')).toMatchObject({
      progress: { fraction: 0.4 },
      annotations: [{ text: 'hola' }],
    })
    expect(await loadBook('otro')).toBeNull()
  })

  it('fills missing progress instead of returning undefined', async () => {
    await saveBook({ meta, progress: EMPTY_PROGRESS, annotations: [] })
    expect((await loadBook('abc123'))?.progress).toEqual(EMPTY_PROGRESS)
    expect((await loadBook('abc123'))?.annotations).toEqual([])
  })

  it('migrates a record saved in localStorage', async () => {
    localStorage.setItem(
      'openreader.v1.book.abc123',
      JSON.stringify({ meta, progress: { fraction: 0.7 }, annotations: [] }),
    )
    const record = await loadBook('abc123')
    expect(record?.progress.fraction).toBe(0.7)
    expect(localStorage.getItem('openreader.v1.book.abc123')).toBeNull()
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
  beforeEach(async () => {
    localStorage.clear()
    await resetIdb()
  })

  it('exports and re-imports a book', async () => {
    const record: BookRecord = { meta, progress: EMPTY_PROGRESS, annotations: [] }
    const json = exportBackup([record])
    expect(await importBackup(json)).toBe(1)
    expect((await loadBook('abc123'))?.meta.title).toBe('El libro')
  })

  it('rejects json that is not a backup', async () => {
    expect(await importBackup('{"hello":1}')).toBe(0)
  })
})
