import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import { formatExportInstant, formatMessageTimestamp } from '../format-date'
import type { ThreadTranscriptPayload } from '../transcript'
import { pdfTheme } from './theme'

function roleLabel(role: string): string {
  const normalized = role.trim().toUpperCase()
  if (normalized === 'ADMIN') return 'CoCreate'
  if (normalized === 'CLIENT') return 'Client'
  return role
}

export function ThreadTranscriptDocument({
  transcript,
  imageDataByAttachmentId = {},
}: {
  transcript: ThreadTranscriptPayload
  imageDataByAttachmentId?: Record<string, string>
}) {
  const timeZone = transcript.timeZone
  const exported = formatExportInstant(transcript.exportedAt, timeZone)

  return (
    <Document title={`${transcript.title} — Thread Transcript`}>
      <Page size="A4" style={pdfTheme.coverPage}>
        <Text style={pdfTheme.coverEyebrow}>CoCreate Caribbean</Text>
        <Text style={pdfTheme.coverTitle}>Thread Transcript</Text>
        <Text style={pdfTheme.coverSubtitle}>{transcript.title}</Text>
        {transcript.subtitle ? (
          <Text style={pdfTheme.coverMeta}>{transcript.subtitle}</Text>
        ) : null}
        <Text style={[pdfTheme.coverMeta, { marginTop: 16 }]}>
          {transcript.messageCount} messages · Range: {transcript.rangeLabel}
        </Text>
        <Text style={[pdfTheme.coverMeta, { marginTop: 8 }]}>
          Exported {exported}
        </Text>
        {transcript.truncated ? (
          <Text style={[pdfTheme.coverMeta, { marginTop: 8 }]}>
            Showing the most recent {transcript.messageCount} messages in range
            (export capped).
          </Text>
        ) : null}
        {transcript.imagesTruncated ? (
          <Text style={[pdfTheme.coverMeta, { marginTop: 8 }]}>
            Some images were omitted to keep this export within size limits.
          </Text>
        ) : null}
      </Page>

      <Page size="A4" style={pdfTheme.page} wrap>
        <Text style={pdfTheme.sectionTitle}>Messages</Text>
        {transcript.messages.length === 0 ? (
          <Text style={pdfTheme.body}>No messages in the selected range.</Text>
        ) : (
          transcript.messages.map((message) => (
            <View
              key={message.id}
              style={{
                marginBottom: 14,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#e2e8f0',
              }}
            >
              <Text style={pdfTheme.visualMeta}>
                {formatMessageTimestamp(message.timestamp, timeZone)} ·{' '}
                {roleLabel(message.role)} · {message.author}
                {message.kind && message.kind !== 'CHAT'
                  ? ` · ${message.kind}`
                  : ''}
              </Text>
              <Text style={pdfTheme.body}>{message.body || '(no text)'}</Text>
              {message.attachments.map((attachment) => {
                if (attachment.isImage) {
                  const dataUrl = imageDataByAttachmentId[attachment.id]
                  return (
                    <View key={attachment.id} style={pdfTheme.visualCard} wrap={false}>
                      {dataUrl ? (
                        <Image src={dataUrl} style={pdfTheme.visualImage} />
                      ) : (
                        <Text style={pdfTheme.fileRow}>
                          {attachment.fileName} (preview unavailable)
                        </Text>
                      )}
                      <Text style={pdfTheme.visualCaption}>{attachment.fileName}</Text>
                    </View>
                  )
                }
                return (
                  <Text key={attachment.id} style={pdfTheme.fileRow}>
                    File: {attachment.fileName}
                  </Text>
                )
              })}
            </View>
          ))
        )}
        <Text
          style={pdfTheme.footer}
          render={({ pageNumber, totalPages }) =>
            `CoCreate Caribbean · Thread transcript · ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
