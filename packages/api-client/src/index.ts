/** Active Nest API version (URI segment). */
export function getApiVersion(): string {
  return process.env.API_VERSION ?? process.env.NEXT_PUBLIC_API_VERSION ?? '1'
}

/** Base URL without version prefix or trailing slash. */
export function getApiBaseUrl(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001'
  ).replace(/\/$/, '')
}

/**
 * Build a versioned Nest API URL.
 * @example nestApiUrl('/admin/admins') → http://localhost:3001/v1/admin/admins
 */
export function nestApiUrl(path: string, version = getApiVersion()): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}/v${version}${normalized}`
}
