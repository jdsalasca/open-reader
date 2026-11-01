import { useCallback, useEffect, useRef, useState } from 'react'
import { ACCEPTED } from '../lib/book'
import { relativeTime, percent } from '../lib/format'
import type { LibraryEntry, Settings } from '../lib/types'
import { Icon } from '../components/Icons'

interface Props {
  library: LibraryEntry[]
  settings: Settings
  patchSettings: (patch: Partial<Settings>) => void
  busy: boolean
  error: string | null
  onDismissError: () => void
  onOpen: (file: File) => void
  onExportAll: () => void
  onImport: (file: File) => void
  onForget: (id: string) => void
}

const FORMATS = ['EPUB', 'MOBI', 'AZW3', 'FB2', 'CBZ', 'PDF']

export default function ShelfScreen({
  library,
  settings,
  patchSettings,
  busy,
  error,
  onDismissError,
  onOpen,
  onExportAll,
  onImport,
  onForget,
}: Props) {
  const input = useRef<HTMLInputElement | null>(null)
  const backup = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const choose = useCallback(() => input.current?.click(), [])

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      event.preventDefault()
      setDragging(true)
    }
    const onDragLeave = (event: DragEvent) => {
      if (event.relatedTarget) return
      setDragging(false)
    }
    const onDrop = (event: DragEvent) => {
      event.preventDefault()
      setDragging(false)
      const file = event.dataTransfer?.files?.[0]
      if (file) onOpen(file)
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [onOpen])

  return (
    <div className={`shelf${dragging ? ' is-dragging' : ''}`}>
      <header className="shelf__bar">
        <div className="wordmark">
          <span className="wordmark__mark" aria-hidden="true" />
          <span className="wordmark__text">
            OPEN<span>READER</span>
          </span>
        </div>
        <div className="shelf__bar-right">
          <span className="stamp">open-library.eridu.top</span>
          <button
            className="icon-btn"
            type="button"
            title={settings.theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            onClick={() =>
              patchSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
          >
            <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      <main className="shelf__main">
        <section className="hero">
          <p className="kicker">Lector local · sin cuentas · sin servidor</p>
          <h1 className="hero__title">
            Abre un libro.
            <br />
            <em>Hazlo tuyo.</em>
          </h1>
          <p className="hero__lead">
            EPUB, MOBI, AZW3, FB2, CBZ y PDF en la misma mesa. Resalta en cinco
            colores, subraya, tacha, deja notas y marca páginas. El archivo nunca
            sale de tu navegador.
          </p>
        </section>

        <section
          className="drop"
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer?.files?.[0]
            if (file) onOpen(file)
          }}
        >
          <div className="drop__inner">
            <Icon name="upload" size={26} />
            <p className="drop__title">Arrastra un libro aquí</p>
            <p className="drop__hint">
              o elige el archivo desde tu equipo. Nada se sube a ningún sitio.
            </p>
            <button className="btn btn--accent" type="button" onClick={choose} disabled={busy}>
              {busy ? 'Leyendo…' : 'Elegir archivo'}
            </button>
            <ul className="chips" aria-label="Formatos compatibles">
              {FORMATS.map((format) => (
                <li key={format} className="chip">
                  {format}
                </li>
              ))}
            </ul>
          </div>
          <input
            ref={input}
            type="file"
            accept={ACCEPTED}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onOpen(file)
              event.target.value = ''
            }}
          />
        </section>

        {error && (
          <div className="notice" role="alert">
            <span>{error}</span>
            <button className="icon-btn" type="button" onClick={onDismissError} title="Cerrar">
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        <section className="shelf__recent">
          <div className="section-head">
            <h2>Estantería</h2>
            <span className="section-head__rule" />
            <span className="section-head__count">
              {library.length === 0 ? 'vacía' : `${library.length} libro${library.length > 1 ? 's' : ''}`}
            </span>
          </div>

          {library.length === 0 ? (
            <ol className="steps">
              <li>
                <span className="steps__num">01</span>
                <div>
                  <h3>Abre el archivo</h3>
                  <p>El lector calcula una huella del libro y busca tus notas.</p>
                </div>
              </li>
              <li>
                <span className="steps__num">02</span>
                <div>
                  <h3>Lee y marca</h3>
                  <p>Selecciona texto para resaltar, o guarda la página actual.</p>
                </div>
              </li>
              <li>
                <span className="steps__num">03</span>
                <div>
                  <h3>Vuelve cuando quieras</h3>
                  <p>Abre el mismo archivo y todo sigue donde lo dejaste.</p>
                </div>
              </li>
            </ol>
          ) : (
            <ul className="cards">
              {library.map((entry) => (
                <li key={entry.id} className="card">
                  <div className="card__top">
                    <span className="card__format">{entry.format}</span>
                    <button
                      className="icon-btn icon-btn--ghost"
                      type="button"
                      title="Quitar de la estantería"
                      onClick={() => onForget(entry.id)}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <h3 className="card__title">{entry.title}</h3>
                  <p className="card__author">{entry.author || 'Autor desconocido'}</p>
                  <div className="card__meter" aria-hidden="true">
                    <span style={{ width: `${Math.round(entry.fraction * 100)}%` }} />
                  </div>
                  <div className="card__foot">
                    <span>{percent(entry.fraction)}</span>
                    <span>{relativeTime(entry.lastOpenedAt)}</span>
                  </div>
                  <button className="card__action" type="button" onClick={choose}>
                    Abrir de nuevo
                    <Icon name="chevron-right" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="shelf__foot">
          <p>
            Tus notas viven en este navegador, asociadas a la huella del archivo.
            Si cambias de equipo, exporta el respaldo y vuelve a importarlo.
          </p>
          <div className="shelf__foot-actions">
            <button className="btn btn--ghost" type="button" onClick={onExportAll}>
              <Icon name="download" size={15} /> Exportar notas
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => backup.current?.click()}
            >
              <Icon name="upload" size={15} /> Importar
            </button>
            <input
              ref={backup}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onImport(file)
                event.target.value = ''
              }}
            />
          </div>
        </footer>
      </main>

      {dragging && (
        <div className="drop-veil" aria-hidden="true">
          <span>Suelta el libro para abrirlo</span>
        </div>
      )}
    </div>
  )
}
