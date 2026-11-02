/**
 * Pantalla siempre encendida mientras se lee (Screen Wake Lock API).
 *
 * El navegador suelta el bloqueo cuando la pestaña pasa a segundo plano, así
 * que se vuelve a pedir al regresar. Requiere HTTPS y no funciona en todos los
 * navegadores: si no existe, el botón no se muestra.
 */

interface Sentinel {
  release(): Promise<void>
}

interface WakeLockNavigator {
  wakeLock?: { request(kind: 'screen'): Promise<Sentinel> }
}

let sentinel: Sentinel | null = null

export function wakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

async function acquire(): Promise<void> {
  if (sentinel || document.visibilityState !== 'visible') return
  try {
    const api = (navigator as Navigator & WakeLockNavigator).wakeLock
    sentinel = (await api?.request('screen')) ?? null
  } catch {
    sentinel = null
  }
}

async function release(): Promise<void> {
  const current = sentinel
  sentinel = null
  try {
    await current?.release()
  } catch {
    /* ya estaba suelto */
  }
}

/** Keeps the screen awake while mounted. Returns the cleanup. */
export function keepScreenAwake(enabled: boolean): () => void {
  if (!enabled || !wakeLockSupported()) return () => undefined

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void acquire()
  }

  void acquire()
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    void release()
  }
}
