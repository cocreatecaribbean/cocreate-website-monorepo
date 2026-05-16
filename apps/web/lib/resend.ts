import 'server-only'

import { Resend } from 'resend'
import { getServerEnv } from '@/lib/env'

let client: Resend | null = null

/** Server-only Resend client. Requires RESEND_API_KEY in .env.local */
export function getResend(): Resend {
  if (!client) {
    const { RESEND_API_KEY } = getServerEnv()
    client = new Resend(RESEND_API_KEY)
  }
  return client
}

export function getResendFromEmail(): string {
  return getServerEnv().RESEND_FROM_EMAIL
}
