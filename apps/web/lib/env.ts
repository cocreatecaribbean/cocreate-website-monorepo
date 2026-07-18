import { z } from 'zod'
import { CONTACT_INBOX_EMAIL } from '@/site-info/contact-page-data'

const optionalNonEmpty = z.preprocess(
  (value) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined),
  z.string().min(1).optional(),
)

const serverEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL must be a valid email'),
  CONTACT_TO_EMAIL: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : CONTACT_INBOX_EMAIL,
    z.string().email('CONTACT_TO_EMAIL must be a valid email'),
  ),
  TURNSTILE_SECRET_KEY: z.string().min(1, 'TURNSTILE_SECRET_KEY is required'),
  /** Optional — when unset, contact rate limiting is skipped (fail open). */
  UPSTASH_REDIS_REST_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined),
    z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
  ),
  UPSTASH_REDIS_REST_TOKEN: optionalNonEmpty,
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

/** Validated server-only env (Resend, Turnstile, Upstash, etc.). Call from Route Handlers only. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached

  const parsed = serverEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid server environment:\n${message}`)
  }

  const data = parsed.data
  const hasUrl = Boolean(data.UPSTASH_REDIS_REST_URL)
  const hasToken = Boolean(data.UPSTASH_REDIS_REST_TOKEN)
  if (hasUrl !== hasToken) {
    throw new Error(
      'Invalid server environment:\nUPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must both be set, or both omitted',
    )
  }

  cached = data
  return cached
}

export function hasUpstashRateLimitConfig(env: ServerEnv = getServerEnv()): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
}

/** Reset cached env — for tests only. */
export function resetServerEnvCacheForTests(): void {
  cached = null
}
