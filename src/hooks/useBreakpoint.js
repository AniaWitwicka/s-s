import { useState, useEffect } from 'react'

const BREAKPOINTS = {
  md: 768,   // tablet — side icon rail
  lg: 1200,  // desktop — labeled side nav + 2-col content
}

function query(px) {
  return window.matchMedia(`(min-width: ${px}px)`)
}

export function useBreakpoint() {
  const [bp, setBp] = useState(() => ({
    isMd: query(BREAKPOINTS.md).matches,
    isLg: query(BREAKPOINTS.lg).matches,
  }))

  useEffect(() => {
    const mqMd = query(BREAKPOINTS.md)
    const mqLg = query(BREAKPOINTS.lg)

    const update = () => setBp({
      isMd: mqMd.matches,
      isLg: mqLg.matches,
    })

    mqMd.addEventListener('change', update)
    mqLg.addEventListener('change', update)
    return () => {
      mqMd.removeEventListener('change', update)
      mqLg.removeEventListener('change', update)
    }
  }, [])

  return bp
}
