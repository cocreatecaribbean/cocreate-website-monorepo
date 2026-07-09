'use client'

type ChartSkeletonProps = {
  variant?: 'pie' | 'bar' | 'line' | 'stream' | 'heatmap'
  className?: string
}

export default function ChartSkeleton({
  variant = 'bar',
  className = '',
}: ChartSkeletonProps) {
  const height =
    variant === 'pie' ? 'h-56' : variant === 'heatmap' ? 'h-64' : 'h-48'

  return (
    <div
      className={`animate-pulse rounded-xl bg-linear-to-br from-sanmarino/8 via-chambray/5 to-casablanca/10 ${height} ${className}`}
      role="status"
      aria-label="Loading chart"
    >
      <div className="flex h-full flex-col justify-end gap-2 p-6">
        {variant === 'bar' || variant === 'stream' ? (
          <div className="flex items-end gap-2">
            {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-sanmarino/20"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        ) : variant === 'pie' ? (
          <div className="mx-auto size-32 rounded-full border-[12px] border-sanmarino/15 border-t-sanmarino/35" />
        ) : variant === 'line' ? (
          <div className="h-1/2 w-full rounded bg-sanmarino/15" />
        ) : (
          <div className="grid flex-1 grid-cols-7 grid-rows-4 gap-1">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="rounded-sm bg-sanmarino/12" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
