export function uid(): string {
  const random = globalThis.crypto?.randomUUID
  if (typeof random === 'function') return random.call(globalThis.crypto)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function percent(fraction: number): string {
  if (!Number.isFinite(fraction)) return '0 %'
  return `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)} %`
}

export function relativeTime(timestamp: number, locale = 'es'): string {
  if (!timestamp) return '—'
  const diff = Date.now() - timestamp
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return rtf.format(0, 'minute')
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  const days = Math.round(hours / 24)
  if (days < 30) return rtf.format(-days, 'day')
  return new Date(timestamp).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true })
    input.addEventListener('cancel', () => resolve(null), { once: true })
    input.click()
  })
}
