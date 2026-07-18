import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createHash } from 'node:crypto'
import { getServerEnv, hasUpstashRateLimitConfig } from '@/lib/env'

let shortWindowLimiter: Ratelimit | null = null
let dailyLimiter: Ratelimit | null = null

function getRedis(): Redis {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = getServerEnv()
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis is not configured')
  }
  return new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  })
}

function resetLimiters(): void {
  shortWindowLimiter = null
  dailyLimiter = null
}

function getLimiters() {
  if (!shortWindowLimiter || !dailyLimiter) {
    const redis = getRedis()
    shortWindowLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'contact:short',
      analytics: false,
    })
    dailyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 d'),
      prefix: 'contact:day',
      analytics: false,
    })
  }
  return { shortWindowLimiter, dailyLimiter }
}

/** Privacy-preserving fingerprint of a client IP. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const cf = request.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf
  return 'unknown'
}

export type ContactRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

/**
 * Enforce short-window (5 / 15m) and daily (20 / day) limits by hashed IP.
 * Skips when Upstash is unset; fail-opens if Redis is unreachable.
 */
export async function enforceContactRateLimit(
  request: Request,
): Promise<ContactRateLimitResult> {
  if (!hasUpstashRateLimitConfig()) {
    console.warn('[contact] Upstash not configured — skipping rate limit')
    return { allowed: true }
  }

  try {
    const ipHash = hashIp(extractClientIp(request))
    const { shortWindowLimiter: short, dailyLimiter: daily } = getLimiters()

    const [shortResult, dailyResult] = await Promise.all([
      short.limit(ipHash),
      daily.limit(ipHash),
    ])

    if (shortResult.success && dailyResult.success) {
      return { allowed: true }
    }

    const retryAfterMs = Math.max(
      shortResult.success ? 0 : shortResult.reset - Date.now(),
      dailyResult.success ? 0 : dailyResult.reset - Date.now(),
    )

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    }
  } catch (error) {
    resetLimiters()
    console.error('[contact] rate limit infrastructure error — failing open', {
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
    })
    return { allowed: true }
  }
}
