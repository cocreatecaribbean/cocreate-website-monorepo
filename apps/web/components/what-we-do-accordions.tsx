'use client'

import { useEffect, useState } from 'react'
import AccordionDesktop from '@/components/accordion-desktop'
import AccordionMobile from '@/components/accordion-mobile'

/**
 * Base UI generates unstable ids during SSR when desktop + mobile trees both
 * render. Mount after hydration so server HTML and client match.
 */
export default function WhatWeDoAccordions() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <>
        <div className="hidden lg:block min-h-[28rem]" aria-hidden />
        <div className="block lg:hidden min-h-[28rem]" aria-hidden />
      </>
    )
  }

  return (
    <>
      <div className="hidden lg:block">
        <AccordionDesktop />
      </div>
      <div className="block lg:hidden">
        <AccordionMobile />
      </div>
    </>
  )
}
