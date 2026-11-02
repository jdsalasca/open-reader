import { useState } from 'react'
import { Icon } from '../../components/Icons'
import { percent } from '../../core/format'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'

export default function StatusBar() {
  const { t } = useI18n()
  const { location, prev, next, goToFraction } = useReader()
  const [scrub, setScrub] = useState<number | null>(null)

  const commit = () => {
    if (scrub === null) return
    goToFraction(scrub / 1000)
    setScrub(null)
  }

  return (
    <footer className="statusbar">
      <button
        className="icon-btn icon-btn--ghost"
        type="button"
        onClick={prev}
        title={t('reader.prev')}
      >
        <Icon name="chevron-left" />
      </button>
      <input
        className="progress"
        type="range"
        min={0}
        max={1000}
        value={scrub ?? Math.round((location?.fraction ?? 0) * 1000)}
        onChange={(event) => setScrub(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        aria-label={t('reader.progress')}
      />
      <button
        className="icon-btn icon-btn--ghost"
        type="button"
        onClick={next}
        title={t('reader.next')}
      >
        <Icon name="chevron-right" />
      </button>
      <span className="statusbar__readout">
        <strong>{percent(location?.fraction ?? 0)}</strong>
        <span className="statusbar__sep">/</span>
        <span>
          {location?.page
            ? t('reader.page', { n: location.page })
            : location?.chapter || t('reader.nowhere')}
        </span>
      </span>
    </footer>
  )
}
