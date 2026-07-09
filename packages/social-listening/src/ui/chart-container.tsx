import type { ReactNode } from 'react'

export type ChartAreaSize = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<ChartAreaSize, string> = {
  sm: 'portal-chart-area-sm',
  md: 'portal-chart-area-md',
  lg: 'portal-chart-area-lg',
}

type ChartContainerProps = {
  label: string
  size?: ChartAreaSize
  className?: string
  children: ReactNode
}

export default function ChartContainer({
  label,
  size = 'md',
  className = '',
  children,
}: ChartContainerProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`w-full transition duration-500 ${SIZE_CLASS[size]} ${className}`}
    >
      {children}
    </div>
  )
}
