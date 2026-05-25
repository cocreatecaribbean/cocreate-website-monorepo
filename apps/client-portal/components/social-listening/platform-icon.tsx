import { useId } from 'react'
import type { SocialPlatformId } from '@/lib/social-listening/platform-meta'

type PlatformIconProps = {
  platformId: SocialPlatformId
  size?: number
  className?: string
}

export default function PlatformIcon({
  platformId,
  size = 20,
  className = '',
}: PlatformIconProps) {
  const gradientId = useId()
  const props = {
    width: size,
    height: size,
    className: `shrink-0 ${className}`,
    'aria-hidden': true,
  }

  switch (platformId) {
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.77a4.85 4.85 0 0 1-1-.08z" />
        </svg>
      )
    case 'reddit':
      return (
        <svg viewBox="0 0 24 24" fill="#FF4500" {...props}>
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.03 4.87-6.77 4.87-3.74 0-6.77-2.176-6.77-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.854-3.47a.247.247 0 0 1 .237-.203h.006z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F58529" />
              <stop offset="50%" stopColor="#DD2A7B" />
              <stop offset="100%" stopColor="#8134AF" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#${gradientId})`} />
          <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.8" fill="none" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
        </svg>
      )
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <rect width="24" height="24" rx="6" fill="#1877F2" />
          <path
            fill="#ffffff"
            d="M13.5 12.5h-2.2V11c0-.62.5-1.12 1.12-1.12h1.08V7.75h-2.2c-1.86 0-3.37 1.51-3.37 3.37v1.38H7.5v2.25h1.83v6.5h3.17v-6.5z"
          />
        </svg>
      )
    case 'forums':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v3l-4-3H9a2 2 0 01-2-2v-1M9 8H7a2 2 0 00-2 2v6a2 2 0 002 2h2v3l4-3h2a2 2 0 002-2V10a2 2 0 00-2-2H9z"
          />
        </svg>
      )
    case 'web':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M3 12h18M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18" />
        </svg>
      )
  }
}
