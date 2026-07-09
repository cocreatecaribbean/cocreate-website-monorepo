import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { ensureReportFontsRegistered } from './fonts'
import { buildReportDocument, getReportTemplate } from './registry'
import type { ReportRenderContext, ReportTemplateId } from './types'

export async function renderReportToBuffer(
  templateId: ReportTemplateId,
  context: ReportRenderContext,
): Promise<Buffer> {
  if (!getReportTemplate(templateId)) {
    throw new Error(`Unknown report template: ${templateId}`)
  }

  ensureReportFontsRegistered()

  const element = buildReportDocument(
    templateId,
    context,
  ) as ReactElement<DocumentProps>
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const buffer = await renderToBuffer(element)
  return Buffer.from(buffer)
}
