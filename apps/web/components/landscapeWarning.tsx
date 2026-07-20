'use client'

import { useEffect, useState } from 'react'

/**
 * Full-screen “rotate your phone” for landscape phones only.
 * Do NOT key off screen short-edge size — Windows laptops with high display
 * scaling can report min(screen) < 600 CSS px and falsely block the site.
 * Do NOT use maxTouchPoints / Boolean(ScrollTrigger.isTouch) either.
 */
export default function LandscapeWarning() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches
      const isTouchPhone =
        window.matchMedia('(pointer: coarse)').matches &&
        window.matchMedia('(hover: none)').matches
      setShow(isLandscape && isTouchPhone)
    }

    check()
    window.addEventListener('orientationchange', check)
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('orientationchange', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-black text-white">
      <div className="text-6xl mb-6">↺</div>
      <p className="text-xl font-semibold">Please rotate your phone</p>
      <p className="text-sm text-gray-400 mt-2">This site works best in portrait mode</p>
    </div>
  )
}
