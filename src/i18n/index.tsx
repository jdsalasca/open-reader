import { createContext, useContext, useEffect, useMemo } from 'react'
import { es, type MessageKey } from './es'
import { en } from './en'
import { zh } from './zh'
import type { LanguageSetting, Locale } from '../core/types'

export const DICTS: Record<Locale, Record<MessageKey, string>> = { es, en, zh }

export const LOCALE_LABEL: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  zh: '简体中文',
}

export const LOCALES: Locale[] = ['es', 'en', 'zh']

/** Device language first, Spanish as the last resort. */
export function detectLocale(): Locale {
  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ].filter(Boolean)
  for (const raw of candidates) {
    const tag = String(raw).toLowerCase()
    if (tag.startsWith('zh')) return 'zh'
    if (tag.startsWith('en')) return 'en'
    if (tag.startsWith('es')) return 'es'
  }
  return 'es'
}

export function resolveLocale(setting: LanguageSetting | undefined): Locale {
  if (!setting || setting === 'auto') return detectLocale()
  return setting
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const text = DICTS[locale]?.[key] ?? es[key] ?? key
  if (!vars) return text
  return Object.entries(vars).reduce(
    (out, [name, value]) => out.replaceAll(`{${name}}`, String(value)),
    text,
  )
}

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string

interface I18nValue {
  locale: Locale
  t: Translate
}

const I18nContext = createContext<I18nValue>({
  locale: 'es',
  t: (key, vars) => translate('es', key, vars),
})

export function I18nProvider({
  setting,
  children,
}: {
  setting: LanguageSetting
  children: React.ReactNode
}) {
  const locale = useMemo(() => resolveLocale(setting), [setting])

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale
  }, [locale])

  const value = useMemo<I18nValue>(
    () => ({ locale, t: (key, vars) => translate(locale, key, vars) }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = (): I18nValue => useContext(I18nContext)
