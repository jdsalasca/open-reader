import type { HighlightColor, HighlightStyle, ReadingFont, Settings, ThemeMode } from './types'

export const HIGHLIGHT_COLORS: Record<
  HighlightColor,
  { label: string; hex: string; deep: string }
> = {
  amber: { label: 'Ámbar', hex: '#efc14a', deep: '#8a6414' },
  rust: { label: 'Óxido', hex: '#e0673c', deep: '#8a2f14' },
  sage: { label: 'Salvia', hex: '#8aa96c', deep: '#3f5727' },
  sky: { label: 'Cielo', hex: '#5f9fc4', deep: '#1f4e68' },
  iris: { label: 'Iris', hex: '#9285c9', deep: '#413a75' },
}

export const COLOR_KEYS = Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]

export const HIGHLIGHT_STYLES: Record<HighlightStyle, string> = {
  highlight: 'Resaltado',
  underline: 'Subrayado',
  squiggly: 'Ondulado',
  strike: 'Tachado',
}

export const STYLE_KEYS = Object.keys(HIGHLIGHT_STYLES) as HighlightStyle[]

const READING_THEME: Record<
  ThemeMode,
  { paper: string; ink: string; accent: string; blend: string; opacity: string }
> = {
  paper: {
    paper: '#fbf6ea',
    ink: '#241f19',
    accent: '#a3371c',
    blend: 'multiply',
    opacity: '0.34',
  },
  industrial: {
    paper: '#d9d3b4',
    ink: '#2a271d',
    accent: '#a8332a',
    blend: 'multiply',
    opacity: '0.34',
  },
}

/**
 * Descanso is the default: low stroke contrast, so the text does not shimmer
 * in long sessions. Editorial is Literata (made for screens), Legible is
 * Atkinson Hyperlegible (distinct letterforms, tested for low vision).
 */
const READING_FONT: Record<ReadingFont, string> = {
  book: '',
  descanso: `font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif !important;`,
  editorial: `font-family: 'Literata', Georgia, serif !important;`,
  legible: `font-family: 'Atkinson Hyperlegible', system-ui, -apple-system, sans-serif !important;`,
}

export function bookStyles(
  settings: Settings,
  theme: ThemeMode,
  fixedLayout = false,
): string {
  const t = READING_THEME[theme]
  // PDF and comic pages are white whatever the theme is: multiply keeps the
  // text readable under the mark.
  const blend = fixedLayout ? 'multiply' : t.blend
  const opacity = fixedLayout ? '0.3' : t.opacity
  return `
    :root {
      color-scheme: ${theme === 'paper' ? 'light' : 'dark'};
      --overlayer-highlight-opacity: ${opacity};
      --overlayer-highlight-blend-mode: ${blend};
    }
    html {
      font-size: ${settings.fontSize}% !important;
      background: ${t.paper} !important;
      color: ${t.ink} !important;
    }
    body {
      color: ${t.ink} !important;
      background: ${t.paper} !important;
      ${READING_FONT[settings.readingFont]}
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    p, li, blockquote, dd, dt, figcaption {
      line-height: ${settings.lineHeight} !important;
      text-align: ${settings.justify ? 'justify' : 'start'} !important;
      -webkit-hyphens: ${settings.hyphens ? 'auto' : 'manual'};
      hyphens: ${settings.hyphens ? 'auto' : 'manual'};
    }
    a, a:visited { color: ${t.accent}; text-decoration-color: currentColor; }
    img, svg, video { max-width: 100% !important; height: auto !important; }
    ::selection { background: ${t.accent}44; }
    h1, h2, h3, h4 { color: ${t.ink}; }
  `
}
