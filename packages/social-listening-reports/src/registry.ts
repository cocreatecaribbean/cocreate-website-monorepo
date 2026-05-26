import type { ReactElement } from 'react'
import type {
  ReportRenderContext,
  ReportTemplateId,
  ReportTemplateMeta,
} from './types'
import { ExecutiveSummaryDocument } from './templates/executive-summary'
import { FullDashboardDocument } from './templates/full-dashboard'
import { PeriodCompareDocument } from './templates/period-compare'

export const REPORT_TEMPLATES: ReportTemplateMeta[] = [
  {
    id: 'executive-summary',
    label: 'Executive summary',
    description:
      'Short deck: cover, KPIs, and platform breakdown — ideal for client check-ins.',
    pageHint: '2 pages',
    supportsCompare: false,
  },
  {
    id: 'full-dashboard',
    label: 'Full dashboard',
    description:
      'Complete snapshot: KPIs, platforms, sentiment over time, and reach metrics.',
    pageHint: '4 pages',
    supportsCompare: false,
  },
  {
    id: 'period-compare',
    label: 'Period comparison',
    description:
      'Compare a baseline snapshot to the current period with KPI and platform deltas.',
    pageHint: '2 pages',
    supportsCompare: true,
  },
]

const RENDERERS: Record<
  ReportTemplateId,
  (context: ReportRenderContext) => ReactElement
> = {
  'executive-summary': (ctx) => ExecutiveSummaryDocument({ context: ctx }),
  'full-dashboard': (ctx) => FullDashboardDocument({ context: ctx }),
  'period-compare': (ctx) => PeriodCompareDocument({ context: ctx }),
}

export function listReportTemplates(): ReportTemplateMeta[] {
  return REPORT_TEMPLATES
}

export function getReportTemplate(id: string): ReportTemplateMeta | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id)
}

export function buildReportDocument(
  templateId: ReportTemplateId,
  context: ReportRenderContext,
): ReactElement {
  if (templateId === 'period-compare' && !context.compare) {
    throw new Error('period-compare template requires compare data')
  }
  const render = RENDERERS[templateId]
  if (!render) {
    throw new Error(`Unknown report template: ${templateId}`)
  }
  return render(context)
}
