'use client'

import { usePathname } from 'next/navigation'

/** Fade inner routes only — home hero pin must measure layout without a fade wrapper. */
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()

  if (pathname === '/') {
    return <>{children}</>
  }

  return (
    <div key={pathname} className="animate-fadein">
      {children}
    </div>
  )
}

export default PageTransition
