import { NextResponse } from 'next/server'
import { CONTACT_FIELD_LIMITS, contactRequestSchema } from '@/lib/contact-schema'
import {
  enforceContactRateLimit,
  extractClientIp,
} from '@/lib/contact-rate-limit'
import { getServerEnv } from '@/lib/env'
import { getResend, getResendFromEmail } from '@/lib/resend'
import { verifyTurnstileToken } from '@/lib/verify-turnstile'
import { CONTACT_INBOX_EMAIL } from '@/site-info/contact-page-data'

const GENERIC_SUCCESS = 'Thanks! Your message has been sent.'
const GENERIC_FAILURE = 'Unable to send your message right now. Please try again shortly.'
const GENERIC_VALIDATION = 'Invalid form data'
const GENERIC_RATE_LIMIT = 'Too many messages. Please wait a bit and try again.'
const GENERIC_BOT = 'Please complete the security check and try again.'

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, message }, { status, headers })
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonError('Invalid request body', 400)
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > CONTACT_FIELD_LIMITS.maxBodyBytes) {
    return jsonError('Request too large', 413)
  }

  let rawText: string
  try {
    rawText = await request.text()
  } catch {
    return jsonError('Invalid request body', 400)
  }

  if (rawText.length > CONTACT_FIELD_LIMITS.maxBodyBytes) {
    return jsonError('Request too large', 413)
  }

  let body: unknown
  try {
    body = JSON.parse(rawText) as unknown
  } catch {
    return jsonError('Invalid request body', 400)
  }

  const parsed = contactRequestSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? GENERIC_VALIDATION
    return jsonError(message, 400)
  }

  const { name, email, message, companyFax, turnstileToken, startedAt } = parsed.data

  // Honeypot — reject without sending (no fake success).
  if (companyFax.trim()) {
    console.warn('[contact] rejected', { reason: 'honeypot' })
    return jsonError(GENERIC_FAILURE, 400)
  }

  const elapsed = Date.now() - startedAt
  if (elapsed < CONTACT_FIELD_LIMITS.minCompletionMs) {
    console.warn('[contact] rejected', { reason: 'too_fast', elapsedMs: elapsed })
    return jsonError('Please wait a moment and try sending again.', 400)
  }
  if (elapsed > 1000 * 60 * 60 * 24) {
    console.warn('[contact] rejected', { reason: 'expired' })
    return jsonError('This form has expired. Refresh the page and try again.', 400)
  }

  try {
    const rate = await enforceContactRateLimit(request)
    if (!rate.allowed) {
      return jsonError(GENERIC_RATE_LIMIT, 429, {
        'Retry-After': String(rate.retryAfterSeconds),
      })
    }
  } catch (error) {
    // enforceContactRateLimit already fail-opens; this is a safety net.
    console.error('[contact] rate limit unexpected error', {
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
    })
  }

  const ip = extractClientIp(request)
  let expectedHostname: string | undefined
  try {
    expectedHostname = new URL(request.url).hostname
  } catch {
    expectedHostname = undefined
  }

  try {
    const turnstile = await verifyTurnstileToken({
      token: turnstileToken,
      ip,
      expectedHostname,
    })
    if (!turnstile.ok) {
      return jsonError(GENERIC_BOT, 400)
    }
  } catch (error) {
    console.error('[contact] turnstile verify error', {
      name: error instanceof Error ? error.name : 'Error',
    })
    return jsonError(GENERIC_FAILURE, 503)
  }

  let to: string
  try {
    to = getServerEnv().CONTACT_TO_EMAIL
  } catch {
    return jsonError(GENERIC_FAILURE, 503)
  }

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: getResendFromEmail(),
      to,
      replyTo: email,
      subject: `Website contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    })

    if (error) {
      console.error('[contact] resend error', {
        type: error.name,
        message: error.message,
      })
      return jsonError(GENERIC_FAILURE, 503)
    }

    console.info('[contact] sent', {
      id: data?.id ?? null,
      toInbox: to === CONTACT_INBOX_EMAIL,
    })

    return NextResponse.json({
      ok: true,
      message: GENERIC_SUCCESS,
    })
  } catch (error) {
    console.error('[contact] send failure', {
      name: error instanceof Error ? error.name : 'Error',
    })
    return jsonError(GENERIC_FAILURE, 503)
  }
}
