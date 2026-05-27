'use client'

import { usePathname } from 'next/navigation'

/**
 * Fade inner routes only.
 * Skip `/`, `/contact`, and all `/work` routes (GSAP headings + ScrollSmoother — stacked fades cause invisible titles).
 */
function shouldSkipPageFade(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/contact' ||
    pathname === '/work' ||
    pathname.startsWith('/work/')
  )
}

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()

  if (shouldSkipPageFade(pathname)) {
    return <>{children}</>
  }

  return (
    <div key={pathname} className="animate-fadein">
      {children}
    </div>
  )
}

export default PageTransition
