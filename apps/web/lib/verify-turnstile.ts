import 'server-only'

import { getServerEnv } from '@/lib/env'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

type TurnstileSiteVerifyResponse = {
  success: boolean
  'error-codes'?: string[]
  action?: string
  hostname?: string
  challenge_ts?: string
}

export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'failed' | 'action_mismatch' | 'hostname_mismatch' }

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Expects action `contact` when Cloudflare returns an action.
 */
export async function verifyTurnstileToken(options: {
  token: string
  ip?: string
  expectedHostname?: string
}): Promise<TurnstileVerifyResult> {
  const { TURNSTILE_SECRET_KEY } = getServerEnv()

  const body = new URLSearchParams()
  body.set('secret', TURNSTILE_SECRET_KEY)
  body.set('response', options.token)
  if (options.ip && options.ip !== 'unknown') {
    body.set('remoteip', options.ip)
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(8_000),
  })

  if (!response.ok) {
    return { ok: false, reason: 'failed' }
  }

  const result = (await response.json()) as TurnstileSiteVerifyResponse
  if (!result.success) {
    return { ok: false, reason: 'failed' }
  }

  if (result.action && result.action !== 'contact') {
    return { ok: false, reason: 'action_mismatch' }
  }

  if (
    options.expectedHostname &&
    result.hostname &&
    result.hostname !== options.expectedHostname
  ) {
    return { ok: false, reason: 'hostname_mismatch' }
  }

  return { ok: true }
}
