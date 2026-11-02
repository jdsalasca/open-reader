import { useEffect, useState } from 'react'
import { useReader } from '../../viewer/ReaderContext'

/**
 * Posición vertical de cada marca que el motor tiene pintada.
 *
 * El motor avisa con `marksVersion` cada vez que pinta una marca, así que no
 * hay que adivinar cuándo está lista la página: si se pintó, aparece.
 */
export function useMarkAnchors(): Record<string, number> {
  const { marksVersion, markAnchors } = useReader()
  const [anchors, setAnchors] = useState<Record<string, number>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setAnchors(markAnchors()), 0)
    return () => window.clearTimeout(timer)
  }, [marksVersion, markAnchors])

  return anchors
}
