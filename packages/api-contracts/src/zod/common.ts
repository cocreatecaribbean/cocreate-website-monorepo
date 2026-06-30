import { z } from 'zod'

/** ISO-8601 datetime strings from Nest serializers. */
export const isoDateTimeString = z.string().min(1)

/** Calendar date YYYY-MM-DD (social listening setup). */
export const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Expected YYYY-MM-DD',
})

export const emailString = z.string().email().max(320)

export const uuidString = z.string().uuid()
