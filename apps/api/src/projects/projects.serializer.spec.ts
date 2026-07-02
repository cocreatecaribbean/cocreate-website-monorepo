import {
  countPendingCheckpointMessages,
  serializeApprovalRecord,
  serializeMessage,
  serializePendingApprovalFiles,
  serializeProject,
  serializeRequest,
} from './projects.serializer'

describe('projects.serializer overview payloads', () => {
  it('counts pending checkpoints from overview request checkpoint metadata', () => {
    const project = {
      id: 'proj-1',
      organizationId: 'org-1',
      title: 'Test',
      description: 'Desc',
      status: 'ACTIVE',
      phase: 'DISCOVERY',
      createdByUserId: 'user-1',
      approvedByUserId: null,
      completedByUserId: null,
      approvedAt: null,
      completedAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      requests: [
        {
          id: 'req-1',
          projectId: 'proj-1',
          type: 'PROGRESS',
          status: 'OPEN',
          title: 'Progress',
          description: null,
          targetPhase: null,
          createdByUserId: 'user-1',
          resolvedByUserId: null,
          resolvedAt: null,
          cancellationOutcome: null,
          cancellationFeeAmount: null,
          cancellationFeeNotes: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          messages: [
            {
              id: 'msg-1',
              messageKind: 'CHECKPOINT',
              requiresClientApproval: true,
              supersededAt: null,
              clientApprovedAt: null,
            },
          ],
        },
      ],
      attachments: [],
      activities: [],
    }

    const serialized = serializeProject(project)
    expect(serialized.hasPendingCheckpoint).toBe(true)
    expect(serialized.pendingCheckpointCount).toBe(1)
    expect(countPendingCheckpointMessages(project)).toBe(1)
  })

  it('serializes overview requests without message bodies', () => {
    const request = serializeRequest({
      id: 'req-1',
      projectId: 'proj-1',
      type: 'ONBOARDING',
      status: 'OPEN',
      title: 'Onboarding',
      description: 'Initial brief',
      targetPhase: null,
      createdByUserId: 'user-1',
      resolvedByUserId: null,
      resolvedAt: null,
      cancellationOutcome: null,
      cancellationFeeAmount: null,
      cancellationFeeNotes: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      messages: undefined,
      attachments: undefined,
    })

    expect(request.messages).toBeUndefined()
    expect(request.messageCount).toBe(0)
    expect(request.title).toBe('Onboarding')
  })

  it('omits storagePath from portal message attachments', () => {
    const request = serializeRequest(
      {
        id: 'req-1',
        projectId: 'proj-1',
        type: 'PROGRESS',
        status: 'OPEN',
        title: 'Review',
        description: 'Checkpoint',
        targetPhase: null,
        createdByUserId: 'user-1',
        resolvedByUserId: null,
        resolvedAt: null,
        cancellationOutcome: null,
        cancellationFeeAmount: null,
        cancellationFeeNotes: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        messages: [
          {
            id: 'msg-1',
            requestId: 'req-1',
            authorUserId: 'user-1',
            authorRole: 'ADMIN',
            body: '',
            messageKind: 'CHECKPOINT',
            checkpointTargetPhase: null,
            requiresClientApproval: true,
            clientApprovedAt: null,
            supersededAt: null,
            createdAt: new Date('2026-01-02'),
            attachmentLinks: [
              {
                attachment: {
                  id: 'att-1',
                  projectId: 'proj-1',
                  requestId: 'req-1',
                  storagePath: 'secret/path.png',
                  fileName: 'path.png',
                  mimeType: 'image/png',
                  sizeBytes: 100,
                  uploadedByUserId: 'user-1',
                  createdAt: new Date('2026-01-02'),
                },
              },
            ],
          },
        ],
      },
      { omitStoragePath: true },
    )

    const attachment = request.messages?.[0]?.attachments?.[0]
    expect(attachment).toBeDefined()
    expect(attachment).not.toHaveProperty('storagePath')
    expect(attachment).toHaveProperty('uploadedByUserId', 'user-1')
  })

  it('includes clientApprovedAt on message-linked attachments when set', () => {
    const approvedAt = new Date('2026-06-20T12:00:00.000Z')
    const message = serializeMessage({
      id: 'msg-1',
      requestId: 'req-1',
      authorUserId: 'user-1',
      authorRole: 'ADMIN',
      body: 'Review these files',
      messageKind: 'CHECKPOINT',
      checkpointTargetPhase: null,
      requiresClientApproval: true,
      clientApprovedAt: null,
      supersededAt: null,
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
      attachmentLinks: [
        {
          clientApprovedAt: approvedAt,
          attachment: {
            id: 'att-1',
            projectId: 'proj-1',
            requestId: 'req-1',
            storagePath: 'secret/poster.png',
            fileName: 'poster.png',
            mimeType: 'image/png',
            sizeBytes: 100,
            uploadedByUserId: 'user-1',
            createdAt: new Date('2026-06-20T10:00:00.000Z'),
          },
        },
        {
          attachment: {
            id: 'att-2',
            projectId: 'proj-1',
            requestId: 'req-1',
            storagePath: 'secret/billboard.png',
            fileName: 'billboard.png',
            mimeType: 'image/png',
            sizeBytes: 100,
            uploadedByUserId: 'user-1',
            createdAt: new Date('2026-06-20T10:00:00.000Z'),
          },
        },
      ],
    })

    expect(message.attachments).toHaveLength(2)
    expect(message.attachments?.[0]?.clientApprovedAt).toBe(approvedAt.toISOString())
    expect(message.attachments?.[1]?.clientApprovedAt).toBeNull()
  })

  it('returns one pending file row per linked attachment on a checkpoint', () => {
    const attachmentOne = {
      id: 'att-1',
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: 'secret/a.png',
      fileName: 'a.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-01-02'),
    }
    const attachmentTwo = {
      ...attachmentOne,
      id: 'att-2',
      fileName: 'b.png',
      storagePath: 'secret/b.png',
    }

    const files = serializePendingApprovalFiles([
      {
        id: 'msg-1',
        body: 'Two files attached',
        createdAt: new Date('2026-01-02'),
        attachmentLinks: [{ attachment: attachmentOne }, { attachment: attachmentTwo }],
        request: {
          id: 'req-1',
          title: 'Review',
          projectId: 'proj-1',
          project: { title: 'Launch site' },
        },
      },
    ])

    expect(files).toHaveLength(2)
    expect(files.every((file) => file.messageId === 'msg-1')).toBe(true)
  })

  it('returns only unapproved attachment links as pending file rows', () => {
    const makeAttachment = (id: string, fileName: string) => ({
      id,
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: `secret/${fileName}`,
      fileName,
      mimeType: 'image/png',
      sizeBytes: 100,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-01-02'),
    })

    const files = serializePendingApprovalFiles([
      {
        id: 'msg-1',
        body: 'Three creative files',
        createdAt: new Date('2026-01-02'),
        attachmentLinks: [
          {
            clientApprovedAt: new Date('2026-01-03'),
            attachment: makeAttachment('att-1', 'poster.png'),
          },
          { attachment: makeAttachment('att-2', 'billboard.png') },
          { attachment: makeAttachment('att-3', 'social.png') },
        ],
        request: {
          id: 'req-1',
          title: 'Campaign review',
          projectId: 'proj-1',
          project: { title: 'Launch site' },
        },
      },
    ])

    expect(files).toHaveLength(2)
    expect(files.map((file) => file.fileName)).toEqual(['billboard.png', 'social.png'])
  })

  it('serializes standalone approval history from approvalItem when messageId is null', () => {
    const attachment = {
      id: 'att-standalone',
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: 'secret/poster.png',
      fileName: 'poster.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
    }

    const serialized = serializeApprovalRecord(
      {
        id: 'rec-1',
        projectId: 'proj-1',
        requestId: 'req-1',
        messageId: null,
        approvalItemId: 'item-1',
        title: 'Poster review',
        summary: 'Looks good',
        targetPhase: null,
        approvedAt: new Date('2026-06-20T12:00:00.000Z'),
        approvedByUserId: 'client-1',
        attachmentIds: [],
        approvedAttachmentId: null,
        approvalItem: { attachment },
      },
      { omitStoragePath: true },
    )

    expect(serialized.attachments).toHaveLength(1)
    expect(serialized.attachments?.[0]?.fileName).toBe('poster.png')
  })

  it('serializes legacy approval history from approvedAttachmentId when attachmentIds is empty', () => {
    const attachment = {
      id: 'att-legacy',
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: 'secret/billboard.png',
      fileName: 'billboard.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
    }

    const serialized = serializeApprovalRecord(
      {
        id: 'rec-2',
        projectId: 'proj-1',
        requestId: 'req-1',
        messageId: 'msg-1',
        approvalItemId: null,
        title: 'Campaign review — billboard.png',
        summary: null,
        targetPhase: null,
        approvedAt: new Date('2026-06-20T12:00:00.000Z'),
        approvedByUserId: 'client-1',
        attachmentIds: [],
        approvedAttachmentId: 'att-legacy',
        snapshottedAttachments: [attachment],
      },
      { omitStoragePath: true },
    )

    expect(serialized.attachments).toHaveLength(1)
    expect(serialized.attachments?.[0]?.fileName).toBe('billboard.png')
  })

  it('falls back to message attachment links when attachmentIds is empty', () => {
    const attachment = {
      id: 'att-msg',
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: 'secret/graphic.png',
      fileName: 'graphic.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
    }

    const serialized = serializeApprovalRecord(
      {
        id: 'rec-3',
        projectId: 'proj-1',
        requestId: 'req-1',
        messageId: 'msg-1',
        approvalItemId: null,
        title: 'Graphic Approval',
        summary: 'check the new design',
        targetPhase: 'CLIENT_REVIEW',
        approvedAt: new Date('2026-05-27T15:28:34.000Z'),
        approvedByUserId: 'client-1',
        attachmentIds: [],
        approvedAttachmentId: null,
        message: {
          attachmentLinks: [{ attachment }],
        },
      },
      { omitStoragePath: true },
    )

    expect(serialized.attachments).toHaveLength(1)
    expect(serialized.attachments?.[0]?.fileName).toBe('graphic.png')
  })

  it('falls back to all message links when approvedAttachmentId is missing from snapshots', () => {
    const attachment = {
      id: 'att-msg',
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: 'secret/graphic.png',
      fileName: 'graphic.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
    }

    const serialized = serializeApprovalRecord(
      {
        id: 'rec-4',
        projectId: 'proj-1',
        requestId: 'req-1',
        messageId: 'msg-1',
        approvalItemId: null,
        title: 'Graphic Approval',
        summary: null,
        targetPhase: null,
        approvedAt: new Date('2026-05-27T15:28:34.000Z'),
        approvedByUserId: 'client-1',
        attachmentIds: [],
        approvedAttachmentId: 'att-deleted',
        message: {
          attachmentLinks: [{ attachment }],
        },
      },
      { omitStoragePath: true },
    )

    expect(serialized.attachments).toHaveLength(1)
    expect(serialized.attachments?.[0]?.fileName).toBe('graphic.png')
  })

  it('serializes approval send chat message with linked attachments for thread display', () => {
    const attachment = {
      id: 'att-approval',
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: 'secret/poster.png',
      fileName: 'poster.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-06-20T10:59:59.000Z'),
    }

    const sentMessage = serializeMessage(
      {
        id: 'msg-approval',
        requestId: 'req-1',
        authorUserId: 'admin-1',
        authorRole: 'ADMIN',
        body: 'Sent for approval: poster.png',
        messageKind: 'CHAT',
        checkpointTargetPhase: null,
        requiresClientApproval: false,
        clientApprovedAt: null,
        supersededAt: null,
        createdAt: new Date('2026-06-20T11:00:00.000Z'),
        attachmentLinks: [{ attachment }],
      },
      { omitStoragePath: true },
    )

    expect(sentMessage.attachments).toHaveLength(1)
    expect(sentMessage.attachments?.[0]?.fileName).toBe('poster.png')
    expect(sentMessage.attachments?.[0]).not.toHaveProperty('storagePath')

    const thread = serializeRequest(
      {
        id: 'req-1',
        projectId: 'proj-1',
        type: 'PROGRESS',
        status: 'OPEN',
        title: 'Progress updates',
        description: 'Ongoing work',
        targetPhase: null,
        createdByUserId: 'admin-1',
        resolvedByUserId: null,
        resolvedAt: null,
        cancellationOutcome: null,
        cancellationFeeAmount: null,
        cancellationFeeNotes: null,
        createdAt: new Date('2026-06-20T09:00:00.000Z'),
        updatedAt: new Date('2026-06-20T11:00:00.000Z'),
        attachments: [attachment],
        messages: [
          {
            id: 'msg-approval',
            requestId: 'req-1',
            authorUserId: 'admin-1',
            authorRole: 'ADMIN',
            body: 'Sent for approval: poster.png',
            messageKind: 'CHAT',
            checkpointTargetPhase: null,
            requiresClientApproval: false,
            clientApprovedAt: null,
            supersededAt: null,
            createdAt: new Date('2026-06-20T11:00:00.000Z'),
            attachmentLinks: [{ attachment }],
          },
        ],
        project: {
          id: 'proj-1',
          title: 'Launch site',
          organizationId: 'org-1',
          organization: { id: 'org-1', name: 'Acme' },
        },
      },
      { omitStoragePath: true },
    )

    expect(thread.messages).toHaveLength(1)
    expect(thread.messages?.[0]?.attachments).toHaveLength(1)
    expect(thread.attachments).toHaveLength(1)
  })
})
