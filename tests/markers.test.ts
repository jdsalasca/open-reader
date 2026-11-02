import { describe, expect, it } from 'vitest'
import { fitMarkers, placeMarkers, visibleAnchors } from '../src/core/markers'
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

/** Un comentario es una anotación con texto escrito. */
const comment = (id: string, patch: Partial<Annotation> = {}) =>
  mark(id, { note: 'mi nota', ...patch })

describe('placeMarkers', () => {
  it('un resaltado sin comentario no deja marca en el canto', () => {
    const out = placeMarkers([mark('solo-color')], { 'solo-color': 100 })
    expect(out).toEqual([])
  })

  it('numera los comentarios en orden de lectura', () => {
    const out = placeMarkers([comment('a'), comment('b'), comment('c')], {
      a: 300,
      b: 100,
      c: 200,
    })
    expect(out.map((item) => [item.id, item.label, item.top])).toEqual([
      ['b', '1', 100],
      ['c', '2', 200],
      ['a', '3', 300],
    ])
  })

  it('ordena por altura y, a igual altura, por fecha', () => {
    const out = placeMarkers(
      [comment('nuevo', { createdAt: 20 }), comment('viejo', { createdAt: 10 })],
      { nuevo: 100, viejo: 100 },
    )
    expect(out.map((item) => item.id)).toEqual(['viejo', 'nuevo'])
  })

  it('cambia a «9+» a partir del décimo', () => {
    const list = Array.from({ length: 12 }, (_, i) => comment(`m${i}`))
    const anchors = Object.fromEntries(list.map((item, i) => [item.id, i * 40]))
    const out = placeMarkers(list, anchors)
    expect(out.slice(0, 10).map((item) => item.label)).toEqual([
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '9+',
    ])
    expect(out[11].label).toBe('9+')
  })

  it('un post-it es pestaña y no consume número', () => {
    const out = placeMarkers(
      [comment('nota'), mark('postit', { sticky: 'yellow' }), comment('otra')],
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
    const out = placeMarkers([mark('p', { sticky: 'purple', note: 'hola' })], { p: 50 })
    expect(out[0]).toMatchObject({ kind: 'bubble', label: '1', color: 'purple' })
  })

  it('apila dos burbujas del mismo renglón', () => {
    const out = placeMarkers([comment('a'), comment('b')], { a: 100, b: 104 })
    expect(out[0].top).toBe(100)
    expect(out[1].top - out[0].top).toBeGreaterThanOrEqual(24)
  })

  it('baja la pestaña si taparía una burbuja del mismo renglón', () => {
    const out = placeMarkers([comment('c'), mark('p', { sticky: 'purple' })], {
      c: 200,
      p: 206,
    })
    expect(out[1]).toMatchObject({ id: 'p', kind: 'sticky' })
    expect(out[1].top - out[0].top).toBeGreaterThanOrEqual(20)
  })

  it('separa dos pestañas del mismo renglón', () => {
    const out = placeMarkers(
      [mark('uno', { sticky: 'yellow' }), mark('dos', { sticky: 'purple' })],
      { uno: 100, dos: 102 },
    )
    expect(out[1].top - out[0].top).toBeGreaterThanOrEqual(20)
  })

  it('muestra las notas aunque vengan de otra sección visible', () => {
    // el motor pinta dos secciones en la misma página y reporta solo la primera
    const out = placeMarkers(
      [comment('primera', { index: 3 }), comment('segunda', { index: 4 })],
      { primera: 100, segunda: 400 },
    )
    expect(out.map((item) => item.id)).toEqual(['primera', 'segunda'])
  })

  it('ignora marcadores de página y marcas sin posición', () => {
    const out = placeMarkers(
      [comment('bookmark', { kind: 'bookmark' }), comment('sin-ancla'), comment('buena')],
      { bookmark: 10, buena: 30 },
    )
    expect(out.map((item) => item.id)).toEqual(['buena'])
  })

  it('sin marcas devuelve una lista vacía', () => {
    expect(placeMarkers([], {})).toEqual([])
  })
})

describe('visibleAnchors', () => {
  const drawn = (
    index: number,
    top: number,
    left: number,
  ): [string, { index: number; top: number; left: number }] => [
    `m-${index}-${top}-${left}`,
    { index, top, left },
  ]

  it('conserva las marcas de la página abierta', () => {
    const out = visibleAnchors([drawn(2, 100, 40)], new Set([2]), { from: 0, to: 600 }, 50)
    expect(Object.values(out)).toEqual([150])
  })

  it('descarta las de otra columna del mismo capítulo', () => {
    // el paginador desplaza el iframe: esta página va de 634 a 1024
    const out = visibleAnchors(
      [drawn(2, 100, 29), drawn(2, 300, 700)],
      new Set([2]),
      { from: 634, to: 1024 },
      0,
    )
    expect(Object.values(out)).toEqual([300])
  })

  it('descarta las de una sección que ya no está cargada', () => {
    const out = visibleAnchors([drawn(7, 100, 40)], new Set([2]), { from: 0, to: 600 }, 0)
    expect(out).toEqual({})
  })

  it('sin ventana conocida no filtra por columna', () => {
    const out = visibleAnchors([drawn(2, 100, 900)], new Set([2]), { from: 0, to: 0 }, 0)
    expect(Object.keys(out)).toHaveLength(1)
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
