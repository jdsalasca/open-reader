import type { SVGProps } from 'react'

export type IconName =
  | 'arrow-left'
  | 'book'
  | 'bookmark'
  | 'bookmark-filled'
  | 'highlighter'
  | 'sliders'
  | 'list'
  | 'sun'
  | 'moon'
  | 'expand'
  | 'shrink'
  | 'x'
  | 'trash'
  | 'pencil'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'upload'
  | 'download'
  | 'plus'
  | 'refresh'
  | 'check'
  | 'note'
  | 'heart'
  | 'heart-filled'
  | 'quote'
  | 'gear'

const PATHS: Record<IconName, React.ReactNode> = {
  'arrow-left': <path d="M12 5 5 12l7 7M5 12h14" />,
  book: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 19.5z" />
      <path d="M8 3v18M4 17.5h15" />
    </>
  ),
  bookmark: <path d="M6 3.5h12v17l-6-4.2-6 4.2z" />,
  'bookmark-filled': <path d="M6 3.5h12v17l-6-4.2-6 4.2z" fill="currentColor" />,
  highlighter: (
    <>
      <path d="M15.5 3.5 20.5 8.5 11 18H6v-5z" />
      <path d="M3 21h7" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  shrink: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />,
  pencil: <path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4" />,
  'chevron-left': <path d="M14 6l-6 6 6 6" />,
  'chevron-right': <path d="M10 6l6 6-6 6" />,
  'chevron-down': <path d="M6 10l6 6 6-6" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  download: <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 4v4h-4" />
    </>
  ),
  check: <path d="M5 12.5 10 17l9-10" />,
  note: (
    <>
      <path d="M5 3.5h9l5 5v12H5z" />
      <path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h4" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z" />
  ),
  'heart-filled': (
    <path
      d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z"
      fill="currentColor"
    />
  ),
  quote: (
    <>
      <path d="M9 7H5v6h4v4H5M19 7h-4v6h4v4h-4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
