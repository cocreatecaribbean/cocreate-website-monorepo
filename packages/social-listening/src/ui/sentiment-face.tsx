import type { SentimentId } from '@cocreate/social-listening/core'
import { SENTIMENT_GRADIENT_STOPS } from '@cocreate/social-listening/core'

type SentimentFaceProps = {
  sentiment: SentimentId
  size?: number
  className?: string
  /** Animate on mount (CSS) */
  animated?: boolean
}

const gradientId = (sentiment: SentimentId, size: number) =>
  `sentiment-face-grad-${sentiment}-${size}`

export default function SentimentFace({
  sentiment,
  size = 32,
  className = '',
  animated = false,
}: SentimentFaceProps) {
  const stops = SENTIMENT_GRADIENT_STOPS[sentiment]
  const gid = gradientId(sentiment, size)
  const r = size / 2
  const eyeY = r * 0.72
  const eyeOffset = r * 0.28
  const eyeR = Math.max(2, size * 0.06)

  const mouth =
    sentiment === 'positive' ? (
      <path
        d={`M ${r - r * 0.35} ${r * 1.05} Q ${r} ${r * 1.38} ${r + r * 0.35} ${r * 1.05}`}
        fill="none"
        stroke="white"
        strokeWidth={Math.max(2, size * 0.07)}
        strokeLinecap="round"
      />
    ) : sentiment === 'negative' ? (
      <path
        d={`M ${r - r * 0.35} ${r * 1.22} Q ${r} ${r * 0.92} ${r + r * 0.35} ${r * 1.22}`}
        fill="none"
        stroke="white"
        strokeWidth={Math.max(2, size * 0.07)}
        strokeLinecap="round"
      />
    ) : (
      <line
        x1={r - r * 0.3}
        y1={r * 1.12}
        x2={r + r * 0.3}
        y2={r * 1.12}
        stroke="white"
        strokeWidth={Math.max(2, size * 0.06)}
        strokeLinecap="round"
      />
    )

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`shrink-0 ${animated ? 'portal-face-pop' : ''} ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stops.start} />
          <stop offset="100%" stopColor={stops.end} />
        </linearGradient>
        <filter id={`${gid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx={r}
        cy={r}
        r={r - 1}
        fill={`url(#${gid})`}
        filter={`url(#${gid}-glow)`}
        opacity={0.95}
      />
      <circle cx={r - eyeOffset} cy={eyeY} r={eyeR} fill="white" opacity={0.95} />
      <circle cx={r + eyeOffset} cy={eyeY} r={eyeR} fill="white" opacity={0.95} />
      {mouth}
    </svg>
  )
}
