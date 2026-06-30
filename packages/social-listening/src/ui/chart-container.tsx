import type { ReactNode } from 'react'

type ChartContainerProps = {
  label: string
  minHeight?: string
  className?: string
  children: ReactNode
}

export default function ChartContainer({
  label,
  minHeight = 'min-h-[220px] sm:min-h-[280px]',
  className = '',
  children,
}: ChartContainerProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`h-full w-full transition duration-500 ${minHeight} ${className}`}
      style={{ position: 'relative' }}
    >
      {children}
    </div>
  )
}
