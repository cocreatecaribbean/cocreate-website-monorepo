/** Extract a human-readable message from Nest/API JSON error bodies. */
export function getApiErrorMessage(
  data: unknown,
  fallback = 'Request failed',
): string {
  if (!data || typeof data !== 'object') return fallback

  const body = data as Record<string, unknown>
  const message = body.message

  if (typeof message === 'string' && message.trim()) {
    if (/^Cannot (GET|POST|PATCH|PUT|DELETE) /.test(message)) {
      return `${message} Restart the API (port 3001): stop any old process, then run pnpm dev from the monorepo root.`
    }
    return message
  }

  if (Array.isArray(message)) {
    return message.filter((part) => typeof part === 'string').join(', ')
  }

  if (message && typeof message === 'object') {
    const nested = message as Record<string, unknown>
    if (typeof nested.message === 'string') return nested.message
  }

  if (typeof body.error === 'string' && body.error !== 'Bad Request') {
    return body.error
  }

  return fallback
}
