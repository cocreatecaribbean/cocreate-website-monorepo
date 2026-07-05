import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import type { ThreadSummaryPayload } from '../schema'
import { pdfTheme } from './theme'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View>
      <Text style={pdfTheme.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <>
      {items.map((item, index) => (
        <Text key={`${index}-${item.slice(0, 24)}`} style={pdfTheme.bullet}>
          • {item}
        </Text>
      ))}
    </>
  )
}

function formatVisualMeta(file: ThreadSummaryPayload['referencedFiles'][number]): string {
  return [file.sharedBy, file.sharedRole, file.sharedAt].filter(Boolean).join(' · ')
}

export function ThreadSummaryDocument({
  summary,
  imageDataByAttachmentId = {},
}: {
  summary: ThreadSummaryPayload
  imageDataByAttachmentId?: Record<string, string>
}) {
  const generated = new Date(summary.generatedAt).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const deliverableLines = summary.deliverablesPresented.map((item) => {
    const who = item.presentedBy ? ` (${item.presentedBy})` : ''
    const date = item.date ? ` — ${item.date}` : ''
    return `${item.title}: ${item.detail}${who}${date}`
  })

  const feedbackLines = summary.clientFeedback.map((item) => {
    const who = item.requestedBy ? ` — ${item.requestedBy}` : ''
    const related = item.relatedTo ? ` [re: ${item.relatedTo}]` : ''
    const date = item.date ? ` (${item.date})` : ''
    const status = item.status ? ` [${item.status}]` : ''
    return `${item.request}${related}${who}${date}${status}`
  })

  const decisionLines = summary.decisions.map((item) =>
    item.date ? `${item.label}: ${item.detail} (${item.date})` : `${item.label}: ${item.detail}`,
  )
  const actionLines = summary.actionItems.map((item) => {
    const owner = item.owner ? `${item.owner} — ` : ''
    const due = item.dueHint ? ` (${item.dueHint})` : ''
    return `${owner}${item.task}${due}`
  })
  const timelineLines = summary.timeline.map(
    (item) => `${item.date}: ${item.event}`,
  )

  const imageFiles = summary.referencedFiles.filter((file) => file.isImage)
  const otherFiles = summary.referencedFiles.filter((file) => !file.isImage)
  const otherFileLines = otherFiles.map((file) => {
    const caption = file.caption ? ` — ${file.caption}` : ''
    const meta = formatVisualMeta(file)
    return meta ? `${file.fileName}${caption} (${meta})` : `${file.fileName}${caption}`
  })

  return (
    <Document title={`${summary.title} — Thread Summary`}>
      <Page size="A4" style={pdfTheme.coverPage}>
        <Text style={pdfTheme.coverEyebrow}>CoCreate Caribbean</Text>
        <Text style={pdfTheme.coverTitle}>Thread Summary</Text>
        <Text style={pdfTheme.coverSubtitle}>{summary.title}</Text>
        {summary.subtitle ? (
          <Text style={pdfTheme.coverMeta}>{summary.subtitle}</Text>
        ) : null}
        <Text style={[pdfTheme.coverMeta, { marginTop: 16 }]}>
          {summary.messageCount} messages · Generated {generated}
        </Text>
        {summary.truncated ? (
          <Text style={[pdfTheme.coverMeta, { marginTop: 8 }]}>
            Summary based on the most recent 500 messages.
          </Text>
        ) : null}
      </Page>

      <Page size="A4" style={pdfTheme.page} wrap>
        <Section title="Overview">
          <Text style={pdfTheme.bodyLead}>{summary.overview}</Text>
        </Section>

        {deliverableLines.length > 0 ? (
          <Section title="What we presented">
            <BulletList items={deliverableLines} />
          </Section>
        ) : null}

        {feedbackLines.length > 0 ? (
          <Section title="Client feedback and changes">
            <BulletList items={feedbackLines} />
          </Section>
        ) : null}

        {timelineLines.length > 0 ? (
          <Section title="What happened">
            <BulletList items={timelineLines} />
          </Section>
        ) : null}

        {decisionLines.length > 0 ? (
          <Section title="Key decisions">
            <BulletList items={decisionLines} />
          </Section>
        ) : null}

        {actionLines.length > 0 ? (
          <Section title="Action items">
            <BulletList items={actionLines} />
          </Section>
        ) : null}

        {summary.openQuestions.length > 0 ? (
          <Section title="Open questions">
            <BulletList items={summary.openQuestions} />
          </Section>
        ) : null}

        <Text style={pdfTheme.footer} fixed>
          AI-generated summary — verify critical details in the thread. Model:{' '}
          {summary.model}
        </Text>
      </Page>

      {imageFiles.length > 0 ? (
        <Page size="A4" style={pdfTheme.page} wrap>
          <Section title="Conversation visuals">
            {imageFiles.map((file) => {
              const dataUrl = imageDataByAttachmentId[file.attachmentId]
              const meta = formatVisualMeta(file)
              const showCaption =
                file.caption &&
                file.caption.trim() !== (file.messageBody ?? '').trim()

              return (
                <View key={file.attachmentId} style={pdfTheme.visualCard} wrap={false}>
                  {dataUrl ? (
                    <Image src={dataUrl} style={pdfTheme.visualImage} />
                  ) : (
                    <Text style={pdfTheme.fileRow}>{file.fileName} (preview unavailable)</Text>
                  )}
                  {meta ? <Text style={pdfTheme.visualMeta}>{meta}</Text> : null}
                  {file.messageBody ? (
                    <Text style={pdfTheme.visualBody}>{file.messageBody}</Text>
                  ) : null}
                  {showCaption ? (
                    <Text style={pdfTheme.visualCaption}>{file.caption}</Text>
                  ) : null}
                </View>
              )
            })}
          </Section>
        </Page>
      ) : null}

      {otherFileLines.length > 0 ? (
        <Page size="A4" style={pdfTheme.page} wrap>
          <Section title="Other files">
            <BulletList items={otherFileLines} />
          </Section>
        </Page>
      ) : null}
    </Document>
  )
}
