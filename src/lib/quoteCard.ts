import { HIGHLIGHT_COLORS } from './reading'
import type { HighlightColor } from './types'

export interface QuoteCardOptions {
  text: string
  author: string
  title: string
  color: HighlightColor
}

const W = 1200
const H = 800
const PAPER = '#f7f2e6'
const INK = '#241f19'
const SOFT = '#5c5548'
const MUTE = '#8b8170'
const RULE = '#d8cfba'

const wrap = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * The shareable card: paper, one accent rule, the quote in the reading serif
 * and the book under it. Drawn on canvas so it can be downloaded as a PNG
 * without any image dependency.
 */
export async function drawQuoteCard(
  canvas: HTMLCanvasElement,
  options: QuoteCardOptions,
): Promise<void> {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  try {
    await document.fonts.ready
    await Promise.all([
      document.fonts.load('italic 46px Literata'),
      document.fonts.load('20px "IBM Plex Mono"'),
      document.fonts.load('24px Literata'),
    ])
  } catch {
    /* fall back to whatever is loaded */
  }

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  // grain, so the card reads like paper and not like a screenshot
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.fillStyle = INK
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    ctx.fillRect(x, y, 1.5, 1.5)
  }
  ctx.restore()

  ctx.strokeStyle = RULE
  ctx.lineWidth = 2
  ctx.strokeRect(44, 44, W - 88, H - 88)

  const accent = HIGHLIGHT_COLORS[options.color]?.hex ?? HIGHLIGHT_COLORS.amber.hex

  const text = options.text.replace(/\s+/g, ' ').trim()
  let size = 46
  let lines: string[] = []
  const maxWidth = 900
  const maxLines = 8
  while (size >= 26) {
    ctx.font = `italic ${size}px Literata, Georgia, serif`
    lines = wrap(ctx, text, maxWidth)
    if (lines.length <= maxLines) break
    size -= 4
  }

  const lineHeight = size * 1.42
  const block = lines.length * lineHeight
  const blockTop = 170 + Math.max(0, (420 - block) / 2)

  ctx.fillStyle = accent
  ctx.fillRect(92, blockTop - 16, 10, Math.min(420, block + 34))

  let y = blockTop + size * 0.85

  ctx.fillStyle = INK
  ctx.textBaseline = 'alphabetic'
  for (const line of lines) {
    ctx.fillText(line, 132, y)
    y += lineHeight
  }

  ctx.fillStyle = accent
  ctx.fillRect(92, 636, 46, 3)

  ctx.fillStyle = INK
  ctx.font = '500 19px "IBM Plex Mono", monospace'
  const author = (options.author || 'Autor desconocido').toUpperCase()
  if ('letterSpacing' in ctx) {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '3px'
  }
  ctx.fillText(author, 92, 690)

  ctx.font = 'italic 23px Literata, Georgia, serif'
  if ('letterSpacing' in ctx) {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'
  }
  ctx.fillStyle = SOFT
  const title =
    options.title.length > 62 ? `${options.title.slice(0, 60)}…` : options.title
  ctx.fillText(title, 92, 728)

  ctx.fillStyle = MUTE
  ctx.font = '13px "IBM Plex Mono", monospace'
  ctx.textAlign = 'right'
  ctx.fillText('OPEN READER', W - 92, 690)
  ctx.fillText('open-reader.eridu.top', W - 92, 712)
  ctx.textAlign = 'left'

  ctx.fillStyle = accent
  ctx.fillRect(W - 92 - 8, 60, 8, 8)
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}
