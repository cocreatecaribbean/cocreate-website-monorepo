import { z } from 'zod'

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/

function rejectControlChars(value: string, label: string): string {
  if (CONTROL_CHARS.test(value)) {
    throw new Error(`${label} contains invalid characters`)
  }
  return value
}

/**
 * Shared contact form payload schema (client + server).
 * Strict object: unknown keys are rejected.
 */
export const contactRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(120, 'Name must be 120 characters or fewer')
      .transform((value, ctx) => {
        try {
          return rejectControlChars(value, 'Name')
        } catch (error) {
          ctx.addIssue({
            code: 'custom',
            message: error instanceof Error ? error.message : 'Name is invalid',
          })
          return z.NEVER
        }
      }),
    email: z
      .string()
      .trim()
      .min(1, 'A valid email is required')
      .max(320, 'Email must be 320 characters or fewer')
      .email('A valid email is required')
      .transform((value) => value.toLowerCase()),
    message: z
      .string()
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(5000, 'Message must be 5000 characters or fewer')
      .transform((value, ctx) => {
        try {
          return rejectControlChars(value, 'Message')
        } catch (error) {
          ctx.addIssue({
            code: 'custom',
            message: error instanceof Error ? error.message : 'Message is invalid',
          })
          return z.NEVER
        }
      }),
    /** Honeypot — must stay empty. Named to avoid browser autofill (`website` gets filled). */
    companyFax: z.string().max(200).optional().default(''),
    /** Cloudflare Turnstile token. */
    turnstileToken: z.string().trim().min(1, 'Please complete the security check').max(2048),
    /** Epoch ms when the form was first rendered (anti-bot timing). */
    startedAt: z.number().int().positive(),
  })
  .strict()

export type ContactRequest = z.infer<typeof contactRequestSchema>

export const CONTACT_FIELD_LIMITS = {
  name: 120,
  email: 320,
  message: 5000,
  messageMin: 10,
  companyFax: 200,
  turnstileToken: 2048,
  /** Reject submissions completed faster than this (ms). */
  minCompletionMs: 2500,
  /** Max JSON body size for POST /api/contact. */
  maxBodyBytes: 16_384,
} as const
