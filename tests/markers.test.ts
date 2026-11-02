import { describe, expect, it } from 'vitest'
import { fitMarkers, placeMarkers } from '../src/core/markers'
import type { Annotation } from '../src/core/types'

const mark = (id: string, patch: Partial<Annotation> = {}): Annotation => ({
  id,
  kind: 'highlight',
  cfi: `cfi-${id}`,
  index: 0,
  text: 'texto',
  note: '',
  color: 'amber',
  style: 'highlight',
  chapter: 'Capítulo',
  createdAt: 1,
  ...patch,
})

describe('placeMarkers', () => {
  it('numera los comentarios en orden de lectura', () => {
    const out = placeMarkers([mark('a'), mark('b'), mark('c')], 0, { a: 300, b: 100, c: 200 })
    expect(out.map((item) => [item.id, item.label, item.top])).toEqual([
      ['b', '1', 100],
      ['c', '2', 200],
      ['a', '3', 300],
    ])
  })

  it('ordena por altura y, a igual altura, por fecha', () => {
    const out = placeMarkers(
      [mark('nuevo', { createdAt: 20 }), mark('viejo', { createdAt: 10 })],
      0,
      { nuevo: 100, viejo: 100 },
    )
    expect(out.map((item) => item.id)).toEqual(['viejo', 'nuevo'])
  })

  it('cambia a «9+» a partir del décimo', () => {
    const list = Array.from({ length: 12 }, (_, i) => mark(`m${i}`))
    const anchors = Object.fromEntries(list.map((item, i) => [item.id, i * 10]))
    const out = placeMarkers(list, 0, anchors)
    expect(out.slice(0, 10).map((item) => item.label)).toEqual([
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '9+',
    ])
    expect(out[11].label).toBe('9+')
  })

  it('un post-it es pestaña y no consume número', () => {
    const out = placeMarkers(
      [mark('nota'), mark('postit', { sticky: 'yellow' }), mark('otra')],
      0,
      { nota: 100, postit: 200, otra: 300 },
    )
    expect(out.map((item) => [item.id, item.kind, item.label])).toEqual([
      ['nota', 'bubble', '1'],
      ['postit', 'sticky', ''],
      ['otra', 'bubble', '2'],
    ])
    expect(out[1].color).toBe('yellow')
  })

  it('un post-it con nota escrita cuenta como comentario', () => {
    const out = placeMarkers([mark('p', { sticky: 'purple', note: 'hola' })], 0, { p: 50 })
    expect(out[0]).toMatchObject({ kind: 'bubble', label: '1', color: 'purple' })
  })

  it('apila dos burbujas del mismo renglón', () => {
    const out = placeMarkers([mark('a'), mark('b')], 0, { a: 100, b: 104 })
    expect(out[0].top).toBe(100)
    // la segunda se separa al menos una altura de burbuja
    expect(out[1].top - out[0].top).toBeGreaterThanOrEqual(24)
  })

  it('baja la pestaña si taparía una burbuja del mismo renglón', () => {
    const out = placeMarkers(
      [mark('c'), mark('p', { sticky: 'purple' })],
      0,
      { c: 200, p: 206 },
    )
    expect(out[1]).toMatchObject({ id: 'p', kind: 'sticky' })
    expect(out[1].top - out[0].top).toBeGreaterThanOrEqual(20)
  })

  it('separa dos pestañas del mismo renglón', () => {
    const out = placeMarkers(
      [mark('uno', { sticky: 'yellow' }), mark('dos', { sticky: 'purple' })],
      0,
      { uno: 100, dos: 102 },
    )
    expect(out[1].top - out[0].top).toBeGreaterThanOrEqual(20)
  })

  it('deja la pestaña quieta si no hay burbuja cerca', () => {
    const out = placeMarkers([mark('p', { sticky: 'purple' })], 0, { p: 200 })
    expect(out[0].top).toBe(200)
  })

  it('ignora marcadores de página, otras secciones y marcas sin posición', () => {
    const out = placeMarkers(
      [
        mark('bookmark', { kind: 'bookmark' }),
        mark('otra-seccion', { index: 3 }),
        mark('sin-ancla'),
        mark('buena'),
      ],
      0,
      { bookmark: 10, 'otra-seccion': 20, buena: 30 },
    )
    expect(out.map((item) => item.id)).toEqual(['buena'])
  })

  it('sin marcas devuelve una lista vacía', () => {
    expect(placeMarkers([], 0, {})).toEqual([])
  })
})

describe('fitMarkers', () => {
  const marker = (id: string, top: number) => ({
    id,
    kind: 'bubble' as const,
    top,
    label: '1',
    color: null,
  })

  it('pasa las alturas a coordenadas de la hoja', () => {
    expect(fitMarkers([marker('a', 300)], 100)[0].top).toBe(190)
  })

  it('no deja marcas fuera de la hoja por arriba', () => {
    expect(fitMarkers([marker('a', 50)], 100)[0].top).toBe(6)
  })

  it('separa las que chocan contra el borde superior', () => {
    const out = fitMarkers([marker('a', 50), marker('b', 55), marker('c', 60)], 100)
    expect(out.map((item) => item.top)).toEqual([6, 28, 50])
  })

  it('no toca las que ya estaban separadas', () => {
    const out = fitMarkers([marker('a', 200), marker('b', 400)], 100)
    expect(out.map((item) => item.top)).toEqual([90, 290])
  })
})
