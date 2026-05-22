'use client'

import { usePathname } from 'next/navigation'

/**
 * Fade inner routes only.
 * Skip `/` (hero pin measurements) and `/work` (GSAP section reveal — stacking fades looks like a double load).
 */
const ROUTES_WITHOUT_PAGE_FADE = new Set(['/', '/work'])

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()

  if (ROUTES_WITHOUT_PAGE_FADE.has(pathname)) {
    return <>{children}</>
  }

  return (
    <div key={pathname} className="animate-fadein">
      {children}
    </div>
  )
}

export default PageTransition
