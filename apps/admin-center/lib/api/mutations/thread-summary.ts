import {
  GenerateThreadSummaryResponseSchema,
  type GenerateThreadSummaryResponse,
} from '@cocreate/api-contracts/v1/shared/thread-summary'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import { getApiErrorMessage } from '@/lib/api-error'

function parseSummaryResponse(json: unknown): GenerateThreadSummaryResponse {
  const parsed = GenerateThreadSummaryResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error('Unexpected summary response from server.')
  }
  return parsed.data
}

async function fetchAdminSummaryResponse(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, cache: 'no-store' })
  if (!response.ok) {
    const json = await response.json().catch(() => null)
    throw new Error(getApiErrorMessage(json, 'Could not complete summary request.'))
  }
  return response
}

export async function generateAdminProjectThreadSummary(
  requestId: string,
  options?: { force?: boolean },
): Promise<GenerateThreadSummaryResponse> {
  const params = options?.force ? '?force=true' : ''
  const json = await fetchAdminBff<unknown>(
    `/api/project-requests/${requestId}/summary${params}`,
    { method: 'POST' },
  )
  return parseSummaryResponse(json)
}

export async function downloadAdminProjectThreadSummaryPdf(
  requestId: string,
  options?: { force?: boolean },
): Promise<void> {
  const params = options?.force ? '?force=true' : ''
  const response = await fetchAdminSummaryResponse(
    `/api/project-requests/${requestId}/summary/export${params}`,
  )
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? `thread-summary-${requestId}.pdf`
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function generateAdminOrgInboxThreadSummary(
  conversationId: string,
  options?: { force?: boolean },
): Promise<GenerateThreadSummaryResponse> {
  const params = options?.force ? '?force=true' : ''
  const json = await fetchAdminBff<unknown>(
    `/api/messages/conversations/${conversationId}/summary${params}`,
    { method: 'POST' },
  )
  return parseSummaryResponse(json)
}

export async function downloadAdminOrgInboxThreadSummaryPdf(
  conversationId: string,
  options?: { force?: boolean },
): Promise<void> {
  const params = options?.force ? '?force=true' : ''
  const response = await fetchAdminSummaryResponse(
    `/api/messages/conversations/${conversationId}/summary/export${params}`,
  )
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? `thread-summary-${conversationId}.pdf`
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
