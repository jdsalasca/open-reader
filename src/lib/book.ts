const EXTENSIONS: Record<string, string> = {
  epub: 'EPUB',
  epub3: 'EPUB',
  kepub: 'EPUB',
  mobi: 'MOBI',
  azw: 'MOBI',
  azw3: 'AZW3',
  kf8: 'AZW3',
  pdf: 'PDF',
  fb2: 'FB2',
  fbz: 'FB2',
  cbz: 'CBZ',
}

export const ACCEPTED =
  '.epub,.kepub,.mobi,.azw,.azw3,.kf8,.pdf,.fb2,.fbz,.cbz,application/epub+zip,application/pdf'

export function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim())
  return match ? match[1].toLowerCase() : ''
}

export function formatOf(name: string): string {
  return EXTENSIONS[extensionOf(name)] ?? 'LIBRO'
}

export function titleFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '')
  const spaced = base.replace(/[_]+/g, ' ').replace(/\s*-\s*/g, ' — ').trim()
  return spaced || 'Sin título'
}

const FALLBACK_CHUNK = 4 * 1024 * 1024

function fnv1a(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

async function readBytes(blob: Blob): Promise<Uint8Array<ArrayBuffer>> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer())
  }
  // older Safari / jsdom
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

/**
 * Identity of a book, used as the key for its notes and reading progress.
 * Hashes the first 4 MB so re-opening the same file finds the same marks
 * without reading a 50 MB PDF twice.
 */
export async function fileId(file: File): Promise<string> {
  const bytes = await readBytes(file.slice(0, FALLBACK_CHUNK))
  try {
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const short = new Uint8Array(digest).subarray(0, 8)
    return Array.from(short, (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // insecure context: no SubtleCrypto. Still stable and content-aware.
    let hash = 0x811c9dc5
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i]
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return `${fnv1a(`${file.size}:${file.name}`)}${hash.toString(16).padStart(8, '0')}`
  }
}
