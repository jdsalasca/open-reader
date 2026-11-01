import type { Annotation, BookRecord } from './types'

const escape = (text: string): string =>
  text.replace(/([\\`*_[\]()#|>~])/g, '\\$1').replace(/\n{2,}/g, '\n')

const quote = (text: string): string =>
  text
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((block) => `> ${escape(block)}`)
    .join('\n>\n')

const byPosition = (a: Annotation, b: Annotation) =>
  a.index - b.index || a.createdAt - b.createdAt

const place = (item: Annotation): string => {
  const chapter = item.chapter || 'Sin capítulo'
  return `*${escape(chapter)}*`
}

/**
 * Markdown a student can paste into a paper: quotes grouped by chapter and a
 * final citations section with the ones saved with "Citar".
 */
export function bookToMarkdown(record: BookRecord): string {
  const { meta, annotations } = record
  const marks = annotations.filter((item) => item.kind === 'highlight').sort(byPosition)
  const quotes = marks.filter((item) => item.quoted)
  const lines: string[] = []

  lines.push(`# ${escape(meta.title)}`, '')
  lines.push(`**Autor:** ${escape(meta.author || 'Sin autor')}  `)
  lines.push(`**Formato:** ${meta.format}  `)
  lines.push(`**Exportado:** ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}  `)
  lines.push(`**Anotaciones:** ${marks.length}`, '')

  if (!marks.length) {
    lines.push('_Todavía no hay resaltados en este libro._', '')
  }

  let chapter = ''
  for (const item of marks) {
    const next = item.chapter || 'Sin capítulo'
    if (next !== chapter) {
      chapter = next
      lines.push(`## ${escape(chapter)}`, '')
    }
    lines.push(quote(item.text), '')
    if (item.note) lines.push(`**Nota:** ${escape(item.note)}`, '')
    lines.push(`— ${place(item)}${item.quoted ? ' · ★ cita' : ''}`, '')
  }

  if (quotes.length) {
    lines.push('## Citas', '')
    lines.push(
      `_${escape(meta.author || 'Sin autor')}, ${escape(meta.title)}_`,
      '',
    )
    for (const item of quotes) {
      lines.push(quote(item.text), '')
      if (item.note) lines.push(`**Nota:** ${escape(item.note)}`, '')
      lines.push(`— ${place(item)}`, '')
    }
  }

  lines.push('---', '', `Generado con Open Reader · ${record.meta.format}`, '')
  return lines.join('\n')
}
