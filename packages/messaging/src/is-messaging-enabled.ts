import { getApiBaseUrl } from '@cocreate/api-client'

export function isMessagingEnabled(getAccessToken?: () => Promise<string | null>): boolean {
  if (!getApiBaseUrl()) return false
  return Boolean(getAccessToken)
}
