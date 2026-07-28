'use client'

import { nestApiUrl } from '@cocreate/api-client'
import {
  GenerateThreadSummaryResponseSchema,
  type GenerateThreadSummaryResponse,
} from '@cocreate/api-contracts/v1/shared/thread-summary'
import { fetchOrgInboxAttachmentDownloadUrl } from '@/lib/inbox/fetch-inbox-client'
import { parseApiResponseSafe } from '@/lib/api/parse-response'
import { getPortalAccessToken } from '@/lib/api/portal-access-token'
import { fetchAttachmentDownloadUrl } from '@/lib/projects/fetch-projects-client'

export async function fetchProjectAttachmentPreviewUrl(
  attachmentId: string,
): Promise<string | null> {
  const result = await fetchAttachmentDownloadUrl(attachmentId)
  return result.url
}

export { fetchOrgInboxAttachmentDownloadUrl as fetchOrgInboxAttachmentPreviewUrl }

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

async function portalFetch(path: string, init?: RequestInit) {
  const token = await getPortalAccessToken()
  if (!token) throw new Error('You must be signed in.')

  const response = await fetch(nestApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    let message = 'Request failed.'
    try {
      const json = (await response.json()) as { message?: string | string[] }
      if (typeof json.message === 'string') message = json.message
      else if (Array.isArray(json.message)) message = json.message.join(', ')
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return response
}

export async function generateProjectThreadSummary(
  requestId: string,
  options?: { force?: boolean },
): Promise<GenerateThreadSummaryResponse> {
  const path = withQuery(`/client-portal/project-requests/${requestId}/summary`, {
    force: options?.force ? 'true' : undefined,
  })
  const response = await portalFetch(path, { method: 'POST' })
  const json = await response.json()
  const parsed = parseApiResponseSafe(GenerateThreadSummaryResponseSchema, json)
  if (!parsed) throw new Error('Unexpected summary response from server.')
  return parsed
}

export async function downloadProjectThreadSummaryPdf(
  requestId: string,
  options?: { force?: boolean },
): Promise<void> {
  const path = withQuery(
    `/client-portal/project-requests/${requestId}/summary/export`,
    {
      force: options?.force ? 'true' : undefined,
      timeZone: browserTimeZone(),
    },
  )
  const response = await portalFetch(path)
  await downloadPdfFromResponse(response, `thread-summary-${requestId}.pdf`)
}

export async function generateOrgInboxThreadSummary(
  conversationId: string,
  options?: { force?: boolean },
): Promise<GenerateThreadSummaryResponse> {
  const path = withQuery(
    `/client-portal/inbox/conversations/${conversationId}/summary`,
    { force: options?.force ? 'true' : undefined },
  )
  const response = await portalFetch(path, { method: 'POST' })
  const json = await response.json()
  const parsed = parseApiResponseSafe(GenerateThreadSummaryResponseSchema, json)
  if (!parsed) throw new Error('Unexpected summary response from server.')
  return parsed
}

export async function downloadOrgInboxThreadSummaryPdf(
  conversationId: string,
  options?: { force?: boolean },
): Promise<void> {
  const path = withQuery(
    `/client-portal/inbox/conversations/${conversationId}/summary/export`,
    {
      force: options?.force ? 'true' : undefined,
      timeZone: browserTimeZone(),
    },
  )
  const response = await portalFetch(path)
  await downloadPdfFromResponse(response, `thread-summary-${conversationId}.pdf`)
}

async function downloadPdfFromResponse(
  response: Response,
  fallbackFilename: string,
): Promise<void> {
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

export async function downloadProjectThreadTranscriptPdf(
  requestId: string,
  options?: { from?: string; to?: string },
): Promise<void> {
  const path = withQuery(
    `/client-portal/project-requests/${requestId}/transcript/export`,
    {
      from: options?.from,
      to: options?.to,
      timeZone: browserTimeZone(),
    },
  )
  const response = await portalFetch(path)
  await downloadPdfFromResponse(response, `thread-transcript-${requestId}.pdf`)
}

export async function downloadOrgInboxThreadTranscriptPdf(
  conversationId: string,
  options?: { from?: string; to?: string },
): Promise<void> {
  const path = withQuery(
    `/client-portal/inbox/conversations/${conversationId}/transcript/export`,
    {
      from: options?.from,
      to: options?.to,
      timeZone: browserTimeZone(),
    },
  )
  const response = await portalFetch(path)
  await downloadPdfFromResponse(
    response,
    `thread-transcript-${conversationId}.pdf`,
  )
}
