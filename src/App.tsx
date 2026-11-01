import { useCallback, useEffect, useMemo, useState } from 'react'
import ReaderScreen from './reader/ReaderScreen'
import ShelfScreen from './shelf/ShelfScreen'
import { ErrorBoundary } from './components/ErrorBoundary'
import { fileId } from './lib/book'
import {
  exportBackup,
  importBackup,
  listLibrary,
  loadBook,
  loadSettings,
  removeFromLibrary,
  saveSettings,
} from './lib/storage'
import { downloadText } from './lib/format'
import { I18nProvider, resolveLocale, translate } from './i18n'
import type { MessageKey } from './i18n/es'
import type { BookRecord, LibraryEntry, Settings } from './lib/types'

interface Session {
  id: string
  file: File
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [session, setSession] = useState<Session | null>(null)
  const [library, setLibrary] = useState<LibraryEntry[]>(() => listLibrary())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<MessageKey | null>(null)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', settings.theme === 'dark' ? '#0f0e0c' : '#e7e0d2')
    saveSettings(settings)
  }, [settings])

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  const openFile = useCallback(async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const id = await fileId(file)
      setSession({ id, file })
    } catch {
      setError('shelf.error.read')
    } finally {
      setBusy(false)
    }
  }, [])

  const exportAll = useCallback(() => {
    const records = listLibrary()
      .map((entry) => loadBook(entry.id))
      .filter((record): record is BookRecord => Boolean(record))
    downloadText('open-reader-notas.eridu', exportBackup(records))
  }, [])

  const importAll = useCallback(async (file: File) => {
    try {
      const count = importBackup(await file.text())
      setLibrary(listLibrary())
      setError(count ? null : 'shelf.error.empty')
    } catch {
      setError('shelf.error.import')
    }
  }, [])

  const forget = useCallback((id: string) => {
    removeFromLibrary(id)
    setLibrary(listLibrary())
  }, [])

  const t = useMemo(() => {
    const locale = resolveLocale(settings.language)
    return (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars)
  }, [settings.language])

  return (
    <I18nProvider setting={settings.language}>
      <div className="app">
        <ErrorBoundary>
          {session ? (
            <ReaderScreen
              key={session.id}
              file={session.file}
              bookId={session.id}
              settings={settings}
              patchSettings={patchSettings}
              onExit={() => {
                setSession(null)
                setLibrary(listLibrary())
              }}
            />
          ) : (
            <ShelfScreen
              library={library}
              settings={settings}
              patchSettings={patchSettings}
              busy={busy}
              error={error ? t(error) : null}
              onDismissError={() => setError(null)}
              onOpen={openFile}
              onExportAll={exportAll}
              onImport={importAll}
              onForget={forget}
            />
          )}
        </ErrorBoundary>
      </div>
    </I18nProvider>
  )
}
