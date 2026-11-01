import type {
  Annotation,
  BookRecord,
  LibraryEntry,
  Settings,
} from './types'

const NS = 'openreader.v1'

export const SETTINGS_KEY = `${NS}.settings`
export const LIBRARY_KEY = `${NS}.library`
export const bookKey = (id: string) => `${NS}.book.${id}`

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  flow: 'paginated',
  fontSize: 100,
  lineHeight: 1.55,
  justify: true,
  hyphens: true,
  columnWidth: 620,
  readingFont: 'book',
  zoom: 'fit-page',
  marginNotes: true,
}

export const EMPTY_PROGRESS = { cfi: '', fraction: 0, chapter: '' }

const storage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function read<T>(key: string): T | null {
  const ls = storage()
  if (!ls) return null
  try {
    const raw = ls.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): boolean {
  const ls = storage()
  if (!ls) return false
  try {
    ls.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn('[open-reader] no se pudo guardar', error)
    return false
  }
}

export function loadSettings(): Settings {
  const saved = read<Partial<Settings>>(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(saved ?? {}) }
}

export function saveSettings(settings: Settings): boolean {
  return write(SETTINGS_KEY, settings)
}

export function emptyBook(meta: BookRecord['meta']): BookRecord {
  return { meta, progress: { ...EMPTY_PROGRESS }, annotations: [] }
}

export function loadBook(id: string): BookRecord | null {
  const record = read<BookRecord>(bookKey(id))
  if (!record?.meta?.id) return null
  return {
    meta: record.meta,
    progress: { ...EMPTY_PROGRESS, ...record.progress },
    annotations: Array.isArray(record.annotations) ? record.annotations : [],
  }
}

export function saveBook(record: BookRecord): boolean {
  return write(bookKey(record.meta.id), record)
}

export function listLibrary(): LibraryEntry[] {
  const list = read<LibraryEntry[]>(LIBRARY_KEY)
  if (!Array.isArray(list)) return []
  return list
    .filter((entry) => Boolean(entry?.id))
    .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))
}

export function touchLibrary(entry: LibraryEntry): void {
  const list = listLibrary().filter((item) => item.id !== entry.id)
  write(LIBRARY_KEY, [entry, ...list].slice(0, 24))
}

export function removeFromLibrary(id: string): void {
  write(
    LIBRARY_KEY,
    listLibrary().filter((entry) => entry.id !== id),
  )
}

export function clearBook(id: string): void {
  storage()?.removeItem(bookKey(id))
  removeFromLibrary(id)
}

export interface Backup {
  app: 'open-reader'
  format: 'eridu'
  version: 1
  exportedAt: string
  books: BookRecord[]
}

export const BACKUP_EXTENSION = '.eridu'

export function exportBackup(records: BookRecord[]): string {
  const backup: Backup = {
    app: 'open-reader',
    format: 'eridu',
    version: 1,
    exportedAt: new Date().toISOString(),
    books: records,
  }
  return JSON.stringify(backup, null, 2)
}

/** Accepts a full backup or a single book record. Returns how many were stored. */
export function importBackup(json: string): number {
  const parsed = JSON.parse(json) as Partial<Backup> | BookRecord
  const books: BookRecord[] =
    'books' in parsed && Array.isArray(parsed.books)
      ? parsed.books
      : 'meta' in parsed && parsed.meta?.id
        ? [parsed as BookRecord]
        : []
  let stored = 0
  for (const record of books) {
    if (!record?.meta?.id) continue
    const merged: BookRecord = {
      meta: record.meta,
      progress: { ...EMPTY_PROGRESS, ...record.progress },
      annotations: (record.annotations ?? []).filter((a: Annotation) => a?.cfi),
    }
    if (saveBook(merged)) {
      touchLibrary({
        id: merged.meta.id,
        title: merged.meta.title,
        author: merged.meta.author,
        format: merged.meta.format,
        fraction: merged.progress.fraction,
        lastOpenedAt: merged.meta.lastOpenedAt ?? Date.now(),
      })
      stored++
    }
  }
  return stored
}
