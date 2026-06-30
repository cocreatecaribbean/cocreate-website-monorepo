'use client'

import { useEffect, useState } from 'react'

/** Matches Tailwind `sm` breakpoint — chart layout tweaks below 640px */
export function useIsMobileChart(): boolean {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return mobile
}
