/**
 * Render all Social Listening PDF templates to ./samples for visual QA.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPORT_TEMPLATES } from './registry'
import { buildSampleReportContext } from './fixtures/sample-context'
import { renderReportToBuffer } from './render'
import type { ReportTemplateId } from './types'

async function main() {
  const outDir = join(__dirname, '..', 'samples')
  mkdirSync(outDir, { recursive: true })

  for (const template of REPORT_TEMPLATES) {
    const needsCompare =
      template.id === 'period-compare' || template.id === 'period-compare-deck'
    const context = buildSampleReportContext({ withCompare: needsCompare })
    const buffer = await renderReportToBuffer(template.id as ReportTemplateId, context)
    const filename = `${template.id}.pdf`
    writeFileSync(join(outDir, filename), buffer)
    console.log(`Wrote ${filename} (${buffer.length} bytes)`)
  }

  console.log(`\nDone — ${REPORT_TEMPLATES.length} PDFs in ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
