import { Icon } from '../../components/Icons'
import { wakeLockSupported } from '../../core/wakeLock'
import { useI18n } from '../../i18n'
import { useReader } from '../../viewer/ReaderContext'
import type { ViewerPlugin } from '../../viewer/plugins/types'

/**
 * El ojito: mantiene la pantalla encendida mientras se lee. El bloqueo real lo
 * pide `ReaderScreen` con `keepScreenAwake(settings.keepAwake)`.
 */
function WakeAction() {
  const { t } = useI18n()
  const { settings, patchSettings, flash } = useReader()

  if (!wakeLockSupported()) return null

  return (
    <button
      className={`icon-btn${settings.keepAwake ? ' is-active' : ''}`}
      type="button"
      aria-pressed={settings.keepAwake}
      onClick={() => {
        patchSettings({ keepAwake: !settings.keepAwake })
        flash(t(settings.keepAwake ? 'wake.off' : 'wake.on'))
      }}
      title={t('wake.title')}
    >
      <Icon name={settings.keepAwake ? 'eye' : 'eye-off'} />
    </button>
  )
}

export const wakePlugin: ViewerPlugin = {
  id: 'wake',
  Action: WakeAction,
}
