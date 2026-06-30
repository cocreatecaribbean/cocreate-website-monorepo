'use client'

import type {
  ReportTemplateMeta,
  SocialListeningDataSource,
} from '@cocreate/social-listening/data-source'
import type {
  SocialListeningAnalyticsPayload,
  SocialListeningComparePayload,
} from '@cocreate/api-contracts/v1/social-listening'
import { fetchAdminBff } from '@/lib/admin-api-fetch'

function buildOrgPath(organizationId: string, suffix: string) {
  return `/api/social-listening/organizations/${organizationId}${suffix}`
}

export function createAdminSocialListeningDataSource(
  organizationId: string,
): SocialListeningDataSource {
  return {
    async fetchAnalyticsWithStatus(options) {
      const query = options?.asOf ? `?asOf=${encodeURIComponent(options.asOf)}` : ''
      try {
        const response = await fetch(
          `${buildOrgPath(organizationId, '/analytics')}${query}`,
          { cache: 'no-store' },
        )
        if (response.status === 404) return { status: 'not_found' }
        if (!response.ok) return { status: 'error' }
        const json = (await response.json()) as SocialListeningAnalyticsPayload & {
          ok?: boolean
        }
        if (!json?.data) return { status: 'error' }
        return { status: 'ok', payload: { data: json.data, meta: json.meta } }
      } catch {
        return { status: 'error' }
      }
    },

    async fetchSnapshotDates() {
      try {
        const json = await fetchAdminBff<{ dates?: string[] }>(
          buildOrgPath(organizationId, '/analytics/snapshots'),
        )
        return json.dates ?? []
      } catch {
        return []
      }
    },

    async fetchCompare(options) {
      const params = new URLSearchParams({ baseline: options.baseline })
      if (options.current) params.set('current', options.current)
      try {
        const json = await fetchAdminBff<
          SocialListeningComparePayload & { ok?: boolean }
        >(`${buildOrgPath(organizationId, '/analytics/compare')}?${params.toString()}`)
        if (!json?.baseline?.data || !json?.current?.data) return null
        return {
          baseline: json.baseline,
          current: json.current,
          deltas: json.deltas,
        }
      } catch {
        return null
      }
    },

    async fetchReportTemplates(): Promise<ReportTemplateMeta[]> {
      try {
        const json = await fetchAdminBff<{ templates?: ReportTemplateMeta[] }>(
          buildOrgPath(organizationId, '/reports/templates'),
        )
        return json.templates ?? []
      } catch {
        return []
      }
    },

    async downloadReport(options) {
      const params = new URLSearchParams({ templateId: options.templateId })
      if (options.asOf) params.set('asOf', options.asOf)
      if (options.baseline) params.set('baseline', options.baseline)
      if (options.current) params.set('current', options.current)

      try {
        const response = await fetch(
          `${buildOrgPath(organizationId, '/reports/generate')}?${params.toString()}`,
          { method: 'POST', cache: 'no-store' },
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
      } catch {
        return { ok: false, message: 'Could not generate the report.' }
      }
    },
  }
}
