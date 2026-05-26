import type { ReactNode } from 'react'

type GlassChartTooltipProps = {
  children: ReactNode
  accent?: string
}

export default function GlassChartTooltip({
  children,
  accent,
}: GlassChartTooltipProps) {
  return (
    <div
      className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2.5 text-sm text-app-primary shadow-[0_12px_40px_rgba(57,65,154,0.14)] backdrop-blur-xl ring-1 ring-sanmarino/15 dark:border-white/15 dark:bg-[rgba(24,30,58,0.92)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
      style={
        accent
          ? { boxShadow: `0 12px 32px ${accent}, 0 4px 16px rgba(57,65,154,0.08)` }
          : undefined
      }
    >
      {children}
    </div>
  )
}
