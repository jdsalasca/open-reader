import type { HighlightColor, HighlightStyle, Settings, ThemeMode } from './types'

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

const READING_THEME: Record<ThemeMode, { paper: string; ink: string; accent: string; blend: string; opacity: string }> = {
  light: {
    paper: '#f7f2e6',
    ink: '#241f19',
    accent: '#a8492a',
    blend: 'multiply',
    opacity: '0.34',
  },
  dark: {
    paper: '#201d18',
    ink: '#ddd4c2',
    accent: '#e08744',
    blend: 'screen',
    opacity: '0.26',
  },
}

const READING_FONT: Record<Settings['readingFont'], string> = {
  book: '',
  serif: `font-family: 'Literata', 'Iowan Old Style', Georgia, serif !important;`,
  sans: `font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif !important;`,
}

/**
 * CSS injected into the book document. Kept small on purpose: only what the
 * reader owns (theme, rhythm, type scale). Everything else belongs to the book.
 */
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
      color-scheme: ${theme};
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
