'use client'

import { useEffect, useState } from 'react'

/**
 * Full-screen “rotate your phone” for landscape phones only.
 *
 * Require all of:
 * - landscape orientation
 * - touch-primary: (pointer: coarse) && (hover: none) — excludes mice / most laptops
 * - phone viewport: min(innerWidth, innerHeight) < 530 — excludes iPads / tablets
 *   (largest phones are ~430–440 CSS px short edge in landscape).
 *
 * Do NOT use screen.width/height — Windows high-DPI scaling can make min(screen) < 600
 * and falsely block laptops. Do NOT use maxTouchPoints / ScrollTrigger.isTouch alone.
 */
export default function LandscapeWarning() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches
      const isTouchPrimary =
        window.matchMedia('(pointer: coarse)').matches &&
        window.matchMedia('(hover: none)').matches
      const shortEdge = Math.min(window.innerWidth, window.innerHeight)
      const isPhoneViewport = shortEdge < 530
      setShow(isLandscape && isTouchPrimary && isPhoneViewport)
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
