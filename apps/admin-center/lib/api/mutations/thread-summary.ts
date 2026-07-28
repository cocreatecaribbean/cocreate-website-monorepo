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

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Jamaica'
  } catch {
    return 'America/Jamaica'
  }
}

function withQuery(
  path: string,
  entries: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(entries)) {
    if (value?.trim()) params.set(key, value.trim())
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

async function fetchAdminSummaryResponse(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, cache: 'no-store' })
  if (!response.ok) {
    const json = await response.json().catch(() => null)
    throw new Error(getApiErrorMessage(json, 'Could not complete request.'))
  }
  return response
}

export async function generateAdminProjectThreadSummary(
  requestId: string,
  options?: { force?: boolean },
): Promise<GenerateThreadSummaryResponse> {
  const path = withQuery(`/api/project-requests/${requestId}/summary`, {
    force: options?.force ? 'true' : undefined,
  })
  const json = await fetchAdminBff<unknown>(path, { method: 'POST' })
  return parseSummaryResponse(json)
}

export async function downloadAdminProjectThreadSummaryPdf(
  requestId: string,
  options?: { force?: boolean },
): Promise<void> {
  const path = withQuery(`/api/project-requests/${requestId}/summary/export`, {
    force: options?.force ? 'true' : undefined,
    timeZone: browserTimeZone(),
  })
  const response = await fetchAdminSummaryResponse(path)
  await downloadPdfBlob(response, `thread-summary-${requestId}.pdf`)
}

export async function generateAdminOrgInboxThreadSummary(
  conversationId: string,
  options?: { force?: boolean },
): Promise<GenerateThreadSummaryResponse> {
  const path = withQuery(`/api/messages/conversations/${conversationId}/summary`, {
    force: options?.force ? 'true' : undefined,
  })
  const json = await fetchAdminBff<unknown>(path, { method: 'POST' })
  return parseSummaryResponse(json)
}

export async function downloadAdminOrgInboxThreadSummaryPdf(
  conversationId: string,
  options?: { force?: boolean },
): Promise<void> {
  const path = withQuery(
    `/api/messages/conversations/${conversationId}/summary/export`,
    {
      force: options?.force ? 'true' : undefined,
      timeZone: browserTimeZone(),
    },
  )
  const response = await fetchAdminSummaryResponse(path)
  await downloadPdfBlob(response, `thread-summary-${conversationId}.pdf`)
}

async function downloadPdfBlob(response: Response, fallbackFilename: string) {
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? fallbackFilename
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadAdminProjectThreadTranscriptPdf(
  requestId: string,
  options?: { from?: string; to?: string },
): Promise<void> {
  const path = withQuery(`/api/project-requests/${requestId}/transcript/export`, {
    from: options?.from,
    to: options?.to,
    timeZone: browserTimeZone(),
  })
  const response = await fetchAdminSummaryResponse(path)
  await downloadPdfBlob(response, `thread-transcript-${requestId}.pdf`)
}

export async function downloadAdminOrgInboxThreadTranscriptPdf(
  conversationId: string,
  options?: { from?: string; to?: string },
): Promise<void> {
  const path = withQuery(
    `/api/messages/conversations/${conversationId}/transcript/export`,
    {
      from: options?.from,
      to: options?.to,
      timeZone: browserTimeZone(),
    },
  )
  const response = await fetchAdminSummaryResponse(path)
  await downloadPdfBlob(response, `thread-transcript-${conversationId}.pdf`)
}
