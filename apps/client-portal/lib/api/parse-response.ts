import { z } from 'zod'

export function parseApiResponse<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
): z.infer<S> {
  return schema.parse(data)
}

export function parseApiResponseSafe<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
): z.infer<S> | null {
  const result = schema.safeParse(data)
  if (!result.success) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[api-contracts] Response parse failed:', result.error.flatten())
    }
    return null
  }
  return result.data
}
