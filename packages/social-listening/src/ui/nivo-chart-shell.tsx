'use client'

import { useCallback, useRef, type ReactNode } from 'react'

type NivoChartShellProps = {
  children: ReactNode
  className?: string
}

/** Dismisses Nivo hover state when the pointer leaves the chart bounds. */
export default function NivoChartShell({ children, className }: NivoChartShellProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  const handlePointerLeave = useCallback(() => {
    const host = hostRef.current
    if (!host) return
    const surface = host.querySelector('.recharts-wrapper, svg')
    surface?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
  }, [])

  return (
    <div
      ref={hostRef}
      className={className}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  )
}
