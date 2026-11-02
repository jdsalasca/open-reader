import { describe, expect, it } from 'vitest'
import { bookmarkFrom, highlightFrom } from '../src/core/annotation'
import { createRegistry } from '../src/viewer/plugins/registry'
import type { ReaderStore } from '../src/viewer/ReaderContext'
import type { ViewerPlugin } from '../src/viewer/plugins/types'

const Panel = () => null
const Button = () => null
const store = {} as ReaderStore
const key = (value: string) => ({ key: value }) as KeyboardEvent

describe('createRegistry', () => {
  const plugins: ViewerPlugin[] = [
    { id: 'toc', tab: { id: 'toc', label: 'tab.toc', Panel } },
    { id: 'marks', Action: Button, tab: { id: 'marks', label: 'tab.marks', count: () => 3, Panel } },
    { id: 'margin', Aside: Button },
    { id: 'pop', Overlay: Button },
    { id: 'keys', onKey: (_, event) => event.key === 'b' },
  ]
  const registry = createRegistry(plugins)

  it('keeps the panel tabs in declaration order', () => {
    expect(registry.tabs.map((tab) => tab.id)).toEqual(['toc', 'marks'])
  })

  it('collects each slot', () => {
    expect(registry.actions).toHaveLength(1)
    expect(registry.asides).toHaveLength(1)
    expect(registry.overlays).toHaveLength(1)
  })

  it('counts only when the plugin asks for it', () => {
    expect(registry.tabs[0].count).toBeUndefined()
    expect(registry.tabs[1].count?.(store)).toBe(3)
  })

  it('stops at the first plugin that handles the key', () => {
    expect(registry.key(store, key('b'))).toBe(true)
    expect(registry.key(store, key('z'))).toBe(false)
  })

  it('works with no plugins', () => {
    const empty = createRegistry([])
    expect(empty.tabs).toEqual([])
    expect(empty.key(store, key('b'))).toBe(false)
  })
})

describe('annotation factories', () => {
  it('builds a highlight from a selection', () => {
    const mark = highlightFrom({ cfi: 'epubcfi(/6/4)', index: 2, text: 'hola' }, 'Capítulo 1')
    expect(mark.kind).toBe('highlight')
    expect(mark.cfi).toBe('epubcfi(/6/4)')
    expect(mark.chapter).toBe('Capítulo 1')
    expect(mark.color).toBe('amber')
    expect(mark.style).toBe('highlight')
    expect(mark.note).toBe('')
    expect(mark.quoted).toBeUndefined()
    expect(mark.id).toBeTruthy()
  })

  it('accepts colour, style and note', () => {
    const mark = highlightFrom({ cfi: 'a', index: 0, text: 't' }, '', {
      color: 'iris',
      style: 'underline',
      note: 'ojo',
      quoted: true,
    })
    expect(mark).toMatchObject({ color: 'iris', style: 'underline', note: 'ojo', quoted: true })
  })

  it('builds a bookmark with the given label', () => {
    const mark = bookmarkFrom({ cfi: 'b', index: 7, chapter: 'Dos' }, 'Dos')
    expect(mark.kind).toBe('bookmark')
    expect(mark.text).toBe('Dos')
    expect(mark.chapter).toBe('Dos')
    expect(mark.note).toBe('')
  })
})
