import { getApiErrorMessage } from '@/lib/api-error'

export type AdminApiFetchErrorCode =
  | 'session_expired'
  | 'admin_required'
  | 'admin_suspended'
  | 'api_unavailable'
  | 'network'
  | 'unknown'

export class AdminApiFetchError extends Error {
  readonly code: AdminApiFetchErrorCode
  readonly status: number

  constructor(message: string, code: AdminApiFetchErrorCode, status: number) {
    super(message)
    this.name = 'AdminApiFetchError'
    this.code = code
    this.status = status
  }
}

function classifyAdminError(
  status: number,
  message: string,
): AdminApiFetchErrorCode {
  if (status === 401) return 'session_expired'
  if (status === 403) {
    if (/suspended/i.test(message)) return 'admin_suspended'
    return 'admin_required'
  }
  if (status === 404 || status === 502 || status === 503) return 'api_unavailable'
  return 'unknown'
}

export function adminFetchErrorHint(code: AdminApiFetchErrorCode): string {
  switch (code) {
    case 'session_expired':
      return 'Your session expired. Sign out and request a new magic link.'
    case 'admin_required':
      return 'This account is not on the agency admin roster. Sign in with a seeded or invited admin email, or run seed:admin for your address.'
    case 'admin_suspended':
      return 'This admin account is suspended. Ask another agency admin to restore access.'
    case 'api_unavailable':
      return 'Could not reach the API or the auth endpoint is missing. Stop any stale process on port 3001, then restart pnpm dev from the monorepo root.'
    case 'network':
      return 'Could not reach the API. Ensure apps/api is running on port 3001.'
    default:
      return 'Something went wrong. Try again or sign in again.'
  }
}

/** Fetch Admin Center BFF routes; surfaces Nest error messages and auth hints. */
export async function fetchAdminBff<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { ...init, cache: 'no-store' })
  } catch {
    throw new AdminApiFetchError(
      'Network error while contacting the server.',
      'network',
      0,
    )
  }

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message = getApiErrorMessage(
      data,
      `Request failed (HTTP ${response.status})`,
    )
    throw new AdminApiFetchError(
      message,
      classifyAdminError(response.status, message),
      response.status,
    )
  }

  return data as T
}
