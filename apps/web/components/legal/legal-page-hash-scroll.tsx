'use client'

import { useEffect } from 'react'
import { scrollToInPageHashFromLocation } from '@/lib/scroll/in-page-anchor'

export default function LegalPageHashScroll() {
  useEffect(() => {
    scrollToInPageHashFromLocation()

    const onHashChange = () => scrollToInPageHashFromLocation()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return null
}
