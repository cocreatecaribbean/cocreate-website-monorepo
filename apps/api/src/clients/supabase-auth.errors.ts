export type SupabaseAuthErrorDetails = {
  message: string
  code?: string
  status?: number
}

type AuthErrorLike = {
  message: string
  code?: string
  status?: number
}

export function formatSupabaseAuthError(
  error: AuthErrorLike | null | undefined,
  context?: string,
): SupabaseAuthErrorDetails {
  if (!error) {
    return { message: context ?? 'Unknown Supabase Auth error' }
  }

  const suffix = [
    error.code ? `code=${error.code}` : null,
    error.status ? `status=${error.status}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const message = suffix
    ? `${error.message} (${suffix})`
    : error.message

  return {
    message: context ? `${context}: ${message}` : message,
    code: error.code,
    status: error.status,
  }
}

export function toBadRequestMessage(details: SupabaseAuthErrorDetails): string {
  return details.message
}
