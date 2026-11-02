import { useState } from 'react'
import { Icon } from './Icons'
import { APP_VERSION } from '../core/version'
import { useI18n } from '../i18n'

/**
 * "Buscar actualización": el service worker guarda la app para usarla sin red,
 * y un móvil puede quedarse semanas con la versión del primer día. Esto borra
 * esa copia (no las notas) y recarga desde el servidor.
 */
export default function AppUpdate() {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    setBusy(true)
    try {
      const registrations = (await navigator.serviceWorker?.getRegistrations?.()) ?? []
      await Promise.all(registrations.map((registration) => registration.unregister()))
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }
    } catch {
      /* sin service worker o sin permiso: recargar ya sirve */
    }
    window.location.reload()
  }

  return (
    <div className="app-update">
      <p className="app-update__version">{t('settings.version', { v: APP_VERSION })}</p>
      <button
        className="btn btn--ghost"
        type="button"
        onClick={() => void refresh()}
        disabled={busy}
      >
        <Icon name="refresh" size={15} /> {t('settings.update')}
      </button>
      <p className="app-update__hint">{t('settings.updateHint')}</p>
    </div>
  )
}
