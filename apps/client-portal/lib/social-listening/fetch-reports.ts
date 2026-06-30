'use client'
import { nestApiUrl } from '@cocreate/api-client'

import { createSupabaseBrowserClient } from '@client-portal/lib/supabase/client'


async function getBrowserAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

import type { SocialListeningReportTemplateMeta } from '@cocreate/api-contracts/v1/social-listening'

export type ReportTemplateMeta = SocialListeningReportTemplateMeta

export async function fetchReportTemplates(): Promise<SocialListeningReportTemplateMeta[]> {
  const token = await getBrowserAccessToken()
  if (!token) return []

  const response = await fetch(
    nestApiUrl('/client-portal/social-listening/reports/templates'),
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )

  if (!response.ok) return []
  const json = (await response.json()) as { templates?: ReportTemplateMeta[] }
  return json.templates ?? []
}

export async function downloadSocialListeningReport(options: {
  templateId: string
  asOf?: string
  baseline?: string
  current?: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = await getBrowserAccessToken()
  if (!token) {
    return { ok: false, message: 'You must be signed in to download reports.' }
  }

  const params = new URLSearchParams({ templateId: options.templateId })
  if (options.asOf) params.set('asOf', options.asOf)
  if (options.baseline) params.set('baseline', options.baseline)
  if (options.current) params.set('current', options.current)

  const response = await fetch(
    nestApiUrl(`/client-portal/social-listening/reports/generate?${params.toString()}`),
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!response.ok) {
    let message = 'Could not generate the report.'
    try {
      const json = (await response.json()) as { message?: string | string[] }
      if (typeof json.message === 'string') message = json.message
      else if (Array.isArray(json.message)) message = json.message.join(', ')
    } catch {
      // ignore
    }
    return { ok: false, message }
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? `social-listening-${options.templateId}.pdf`

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)

  return { ok: true }
}
