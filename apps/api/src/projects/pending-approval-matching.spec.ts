import {
  nonApprovalMessageAttachments,
  mapPendingApprovalFilesFromApi,
  pendingApprovalFilesForMessage,
} from '@/lib/projects/pending-approval-files'

describe('pendingApprovalFilesForMessage', () => {
  const baseFiles = mapPendingApprovalFilesFromApi([
    {
      id: 'item-1',
      approvalItemId: 'item-1',
      attachmentId: 'att-1',
      fileName: 'poster.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
      createdAt: '2026-06-20T10:00:00.000Z',
      requestId: 'req-progress',
      messageId: 'msg-approval',
      projectId: 'proj-1',
      projectTitle: 'Website',
      checkpointTitle: 'Homepage hero',
      checkpointBody: 'Please review',
      revisionNumber: 1,
    },
    {
      id: 'item-2',
      approvalItemId: 'item-2',
      attachmentId: 'att-2',
      fileName: 'logo.svg',
      mimeType: 'image/svg+xml',
      sizeBytes: 512,
      createdAt: '2026-06-20T11:00:00.000Z',
      requestId: 'req-progress',
      messageId: '',
      projectId: 'proj-1',
      projectTitle: 'Website',
      checkpointTitle: 'Logo',
      checkpointBody: 'Please review',
      revisionNumber: 1,
    },
  ])

  it('matches pending approvals by message id', () => {
    const matched = pendingApprovalFilesForMessage(
      'msg-approval',
      'req-progress',
      [],
      baseFiles,
    )

    expect(matched).toHaveLength(1)
    expect(matched[0]?.approvalItemId).toBe('item-1')
  })

  it('falls back to attachment ids on the message when message id is missing', () => {
    const matched = pendingApprovalFilesForMessage(
      'msg-other',
      'req-progress',
      ['att-2'],
      baseFiles,
    )

    expect(matched).toHaveLength(1)
    expect(matched[0]?.approvalItemId).toBe('item-2')
  })
})

describe('nonApprovalMessageAttachments', () => {
  const attachments = [
    {
      id: 'att-1',
      fileName: 'poster.png',
      mimeType: 'image/png',
      createdAt: '2026-06-20T10:00:00.000Z',
    },
    {
      id: 'att-extra',
      fileName: 'notes.pdf',
      mimeType: 'application/pdf',
      createdAt: '2026-06-20T10:00:00.000Z',
    },
  ]

  const pendingFiles = mapPendingApprovalFilesFromApi([
    {
      id: 'item-1',
      approvalItemId: 'item-1',
      attachmentId: 'att-1',
      fileName: 'poster.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
      createdAt: '2026-06-20T10:00:00.000Z',
      requestId: 'req-progress',
      messageId: 'msg-approval',
      projectId: 'proj-1',
      projectTitle: 'Website',
      checkpointTitle: 'Homepage hero',
      checkpointBody: 'Please review',
      revisionNumber: 1,
    },
  ])

  it('excludes attachments covered by pending approvals', () => {
    const filtered = nonApprovalMessageAttachments(attachments, pendingFiles)
    expect(filtered.map((attachment) => attachment.id)).toEqual(['att-extra'])
  })

  it('returns an empty array when all attachments are pending approval', () => {
    const filtered = nonApprovalMessageAttachments(
      [attachments[0]!],
      pendingFiles,
    )
    expect(filtered).toEqual([])
  })

  it('handles undefined attachments', () => {
    expect(nonApprovalMessageAttachments(undefined, pendingFiles)).toEqual([])
  })
})
