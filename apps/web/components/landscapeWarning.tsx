'use client'

import { useEffect, useState } from 'react'

export default function LandscapeWarning() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches
      const shortEdge = Math.min(window.screen.width, window.screen.height)
      const isPhone = shortEdge < 600 // phones top out ~430px, tablets start at 768px
      setShow(isLandscape && isPhone)
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