'use client'
import { nestApiUrl } from '@cocreate/api-client'

import { createSupabaseBrowserClient } from '@client-portal/lib/supabase/client'
import type { ReportTemplatesResult } from '@cocreate/social-listening/data-source'

import type { SocialListeningReportTemplateMeta } from '@cocreate/api-contracts/v1/social-listening'

export type ReportTemplateMeta = SocialListeningReportTemplateMeta

let templatesCache: ReportTemplatesResult | null = null
let templatesPromise: Promise<ReportTemplatesResult> | null = null

async function getBrowserAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

function parseApiErrorMessage(json: unknown, fallback: string): string {
  if (typeof json !== 'object' || json === null) return fallback
  const message = (json as { message?: string | string[] }).message
  if (typeof message === 'string') return message
  if (Array.isArray(message)) return message.join(', ')
  return fallback
}

async function fetchReportTemplatesFromApi(): Promise<ReportTemplatesResult> {
  const token = await getBrowserAccessToken()
  if (!token) {
    return {
      ok: false,
      message: 'You must be signed in to load report templates.',
    }
  }

  try {
    const response = await fetch(
      nestApiUrl('/client-portal/social-listening/reports/templates'),
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      let message = 'Could not load report templates. Check that the API is running and refresh.'
      try {
        message = parseApiErrorMessage(await response.json(), message)
      } catch {
        // ignore
      }
      return { ok: false, message }
    }

    const json = (await response.json()) as { templates?: ReportTemplateMeta[] }
    return { ok: true, templates: json.templates ?? [] }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the report API. Check that the API is running and refresh.',
    }
  }
}

export async function fetchReportTemplates(): Promise<ReportTemplatesResult> {
  if (templatesCache?.ok) return templatesCache

  if (!templatesPromise) {
    templatesPromise = fetchReportTemplatesFromApi().then((result) => {
      if (result.ok) {
        templatesCache = result
      } else {
        templatesPromise = null
      }
      return result
    })
  }

  return templatesPromise
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
      message = parseApiErrorMessage(await response.json(), message)
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
