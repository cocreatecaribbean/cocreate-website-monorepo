import type { ReactElement } from 'react'
import type {
  ReportRenderContext,
  ReportTemplateId,
  ReportTemplateMeta,
} from './types'
import { ExecutiveSummaryDocument } from './templates/executive-summary'
import { ExecutiveSummaryDeckDocument } from './templates/executive-summary-deck'
import { FullDashboardDocument } from './templates/full-dashboard'
import { FullDashboardDeckDocument } from './templates/full-dashboard-deck'
import { PeriodCompareDocument } from './templates/period-compare'
import { PeriodCompareDeckDocument } from './templates/period-compare-deck'

export const REPORT_TEMPLATES: ReportTemplateMeta[] = [
  {
    id: 'executive-summary',
    label: 'Executive summary',
    description:
      'Short letter report: cover, KPIs, and platform breakdown — ideal for client check-ins.',
    pageHint: '2 pages · Letter',
    supportsCompare: false,
    format: 'letter',
  },
  {
    id: 'full-dashboard',
    label: 'Full dashboard',
    description:
      'Complete letter snapshot: KPIs, platforms, sentiment over time, and reach metrics.',
    pageHint: '4 pages · Letter',
    supportsCompare: false,
    format: 'letter',
  },
  {
    id: 'period-compare',
    label: 'Period comparison',
    description:
      'Compare a baseline snapshot to the current period with KPI and platform deltas.',
    pageHint: '2 pages · Letter',
    supportsCompare: true,
    format: 'letter',
  },
  {
    id: 'executive-summary-deck',
    label: 'Executive summary (Presentation)',
    description:
      '16:9 slide deck: premium cover, KPIs, and sentiment + platform charts for screen sharing.',
    pageHint: '3 slides · 16:9',
    supportsCompare: false,
    format: 'deck',
  },
  {
    id: 'full-dashboard-deck',
    label: 'Full dashboard (Presentation)',
    description:
      'Complete 16:9 deck with dedicated slides for KPIs, sentiment, platforms, reach, and trends.',
    pageHint: '6 slides · 16:9',
    supportsCompare: false,
    format: 'deck',
  },
  {
    id: 'period-compare-deck',
    label: 'Period comparison (Presentation)',
    description:
      '16:9 comparison deck with KPI deltas, sentiment shift, and platform movement slides.',
    pageHint: '4 slides · 16:9',
    supportsCompare: true,
    format: 'deck',
  },
]

const RENDERERS: Record<
  ReportTemplateId,
  (context: ReportRenderContext) => ReactElement
> = {
  'executive-summary': (ctx) => ExecutiveSummaryDocument({ context: ctx }),
  'full-dashboard': (ctx) => FullDashboardDocument({ context: ctx }),
  'period-compare': (ctx) => PeriodCompareDocument({ context: ctx }),
  'executive-summary-deck': (ctx) => ExecutiveSummaryDeckDocument({ context: ctx }),
  'full-dashboard-deck': (ctx) => FullDashboardDeckDocument({ context: ctx }),
  'period-compare-deck': (ctx) => PeriodCompareDeckDocument({ context: ctx }),
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
  if (templateId === 'period-compare-deck' && !context.compare) {
    throw new Error('period-compare-deck template requires compare data')
  }
  const render = RENDERERS[templateId]
  if (!render) {
    throw new Error(`Unknown report template: ${templateId}`)
  }
  return render(context)
}
