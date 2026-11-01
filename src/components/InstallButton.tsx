import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from '../components/Icons'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * "Save it on this device": uses the browser install prompt when it exists and
 * explains the manual step otherwise. The service worker (vite-plugin-pwa)
 * keeps the app working offline after the first visit.
 */
export default function InstallButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const [prompt, setPrompt] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const install = async () => {
    if (!prompt) {
      setHint((value) => !value)
      return
    }
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  return (
    <div className="install">
      <button
        className={compact ? 'icon-btn' : 'btn btn--ghost'}
        type="button"
        onClick={() => void install()}
        title={t('shelf.install')}
      >
        <Icon name="download" size={compact ? 18 : 15} />
        {!compact && <span className="install__label">{t('shelf.install')}</span>}
      </button>
      {hint && <p className="install__hint">{t('shelf.installHint')}</p>}
    </div>
  )
}
