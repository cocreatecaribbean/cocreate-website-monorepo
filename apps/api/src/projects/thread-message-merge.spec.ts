import {
  canRemoveThreadAttachment,
  indexAttachmentsByMessage,
  mergeRequestMessageIntoThread,
} from '@cocreate/app-ui/thread-message-merge'

describe('thread-message-merge', () => {
  it('maps approval send attachments to the new message when explicit links exist', () => {
    const messages = [
      {
        id: 'msg-1',
        createdAt: '2026-06-20T10:00:00.000Z',
      },
      {
        id: 'msg-2',
        createdAt: '2026-06-20T11:00:00.000Z',
        attachments: [
          {
            id: 'att-new',
            fileName: 'poster.png',
            mimeType: 'image/png',
            createdAt: '2026-06-20T10:59:59.000Z',
          },
        ],
      },
    ]

    const map = indexAttachmentsByMessage(messages, [
      {
        id: 'att-new',
        fileName: 'poster.png',
        mimeType: 'image/png',
        createdAt: '2026-06-20T10:59:59.000Z',
      },
    ])

    expect(map.get(1)?.map((attachment) => attachment.id)).toEqual(['att-new'])
  })

  it('merges message attachments into request cache data', () => {
    const merged = mergeRequestMessageIntoThread(
      {
        id: 'req-1',
        messages: [{ id: 'msg-1', body: 'Earlier update' }],
        attachments: [{ id: 'att-old', fileName: 'old.png', mimeType: 'image/png' }],
        messageCount: 1,
      },
      {
        id: 'msg-2',
        body: 'Sent for approval: poster.png',
        attachments: [{ id: 'att-new', fileName: 'poster.png', mimeType: 'image/png' }],
      },
    )

    expect(merged.messages).toHaveLength(2)
    expect(merged.messages?.[1]?.attachments).toHaveLength(1)
    expect(merged.attachments?.map((attachment) => attachment.id)).toEqual([
      'att-old',
      'att-new',
    ])
    expect(merged.messageCount).toBe(2)
  })

  it('updates attachments when the same message id is merged again', () => {
    const merged = mergeRequestMessageIntoThread(
      {
        messages: [{ id: 'msg-2', body: 'Sent for approval: poster.png' }],
        attachments: [],
      },
      {
        id: 'msg-2',
        body: 'Sent for approval: poster.png',
        attachments: [{ id: 'att-new', fileName: 'poster.png', mimeType: 'image/png' }],
      },
    )

    expect(merged.messages).toHaveLength(1)
    expect(merged.messages?.[0]?.attachments).toHaveLength(1)
    expect(merged.attachments).toHaveLength(1)
  })

  it('allows core team admins to remove any thread attachment', () => {
    expect(
      canRemoveThreadAttachment({
        messageId: 'msg-1',
        messageAuthorRole: 'ADMIN',
        attachmentUploadedByUserId: 'client-1',
        currentUserId: 'admin-1',
        viewerRole: 'ADMIN',
        isCoreTeam: true,
      }),
    ).toBe(true)
  })

  it('allows clients to remove only their own uploads', () => {
    expect(
      canRemoveThreadAttachment({
        messageId: 'msg-1',
        messageAuthorRole: 'CLIENT',
        attachmentUploadedByUserId: 'client-1',
        currentUserId: 'client-1',
        viewerRole: 'CLIENT',
      }),
    ).toBe(true)
    expect(
      canRemoveThreadAttachment({
        messageId: 'msg-1',
        messageAuthorRole: 'ADMIN',
        attachmentUploadedByUserId: 'admin-1',
        currentUserId: 'client-1',
        viewerRole: 'CLIENT',
      }),
    ).toBe(false)
  })
})
