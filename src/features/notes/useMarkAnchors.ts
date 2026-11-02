import { useEffect, useState } from 'react'
import { useReader } from '../../viewer/ReaderContext'

/**
 * Posición vertical de cada marca del capítulo visible.
 *
 * El motor puede tardar en exponer las páginas, así que si la primera medida
 * sale vacía se reintenta unas cuantas veces; sin esto las burbujas no salen
 * al abrir el libro.
 */
export function useMarkAnchors(): Record<string, number> {
  const { ready, location, annotations, markAnchors } = useReader()
  const [anchors, setAnchors] = useState<Record<string, number>>({})

  useEffect(() => {
    let attempt = 0
    let timer = 0

    const run = () => {
      const next = markAnchors()
      setAnchors(next)
      if (!Object.keys(next).length && attempt < 6) {
        attempt += 1
        timer = window.setTimeout(run, 200)
      }
    }

    timer = window.setTimeout(run, 120)
    return () => window.clearTimeout(timer)
  }, [ready, location?.cfi, annotations, markAnchors])

  return anchors
}
