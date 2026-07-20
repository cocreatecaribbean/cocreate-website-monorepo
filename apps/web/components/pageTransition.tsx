'use client'

import { usePathname } from 'next/navigation'

/**
 * Fade inner routes only.
 * Skip `/` and `/work` (GSAP headings + ScrollSmoother — stacked fades cause invisible titles).
 * Project detail pages (`/work/[slug]`) use the shared fade like About/Contact.
 */
function shouldSkipPageFade(pathname: string) {
  return pathname === '/' || pathname === '/work'
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
