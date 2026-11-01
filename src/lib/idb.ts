// Tiny IndexedDB wrapper: books and file handles live here instead of
// localStorage, which caps at ~5 MB per origin.

const DB_NAME = 'open-reader'
const DB_VERSION = 1

export type StoreName = 'books' | 'handles'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('books')) db.createObjectStore('books')
      if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const request = run(transaction.objectStore(store))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

export const idbGet = <T>(store: StoreName, key: string) =>
  tx<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>)

export const idbSet = (store: StoreName, key: string, value: unknown) =>
  tx(store, 'readwrite', (s) => s.put(value, key))

export const idbDel = (store: StoreName, key: string) =>
  tx(store, 'readwrite', (s) => s.delete(key))

export const idbKeys = (store: StoreName) =>
  tx<IDBValidKey[]>(store, 'readonly', (s) => s.getAllKeys())

/** Only for the test suite: drops the database and the cached connection. */
export async function resetIdb(): Promise<void> {
  const current = dbPromise
  dbPromise = null
  await current?.then((db) => db.close()).catch(() => undefined)
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}
