import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { ThreadSummaryPayload } from '../schema'
import { ThreadSummaryDocument } from './thread-summary-document'

export type RenderThreadSummaryPdfOptions = {
  imageDataByAttachmentId?: Record<string, string>
}

export async function renderThreadSummaryPdf(
  summary: ThreadSummaryPayload,
  options?: RenderThreadSummaryPdfOptions,
): Promise<Buffer> {
  const element = ThreadSummaryDocument({
    summary,
    imageDataByAttachmentId: options?.imageDataByAttachmentId ?? {},
  }) as ReactElement<DocumentProps>
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const buffer = await renderToBuffer(element)
  return Buffer.from(buffer)
}

export function threadSummaryPdfFilename(summary: ThreadSummaryPayload): string {
  const slug = summary.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  const date = summary.generatedAt.slice(0, 10)
  return `thread-summary-${slug || summary.sourceId}-${date}.pdf`
}
