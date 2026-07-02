import {
  approvalItemsForMessage,
  nonApprovalMessageAttachments,
} from '@cocreate/app-ui/thread-approval-match'

describe('thread-approval-match', () => {
  const items = [
    {
      id: 'item-1',
      requestId: 'req-progress',
      messageId: 'msg-approval',
      attachment: { id: 'att-1' },
    },
    {
      id: 'item-2',
      requestId: 'req-progress',
      messageId: '',
      attachment: { id: 'att-2' },
    },
  ]

  it('matches approval items by message id', () => {
    const matched = approvalItemsForMessage('msg-approval', 'req-progress', [], items)
    expect(matched.map((item) => item.id)).toEqual(['item-1'])
  })

  it('falls back to attachment ids when message id is missing', () => {
    const matched = approvalItemsForMessage('msg-other', 'req-progress', ['att-2'], items)
    expect(matched.map((item) => item.id)).toEqual(['item-2'])
  })

  it('excludes approval attachments from generic message attachment lists', () => {
    const attachments = [
      { id: 'att-1', fileName: 'poster.png', mimeType: 'image/png', createdAt: '2026-01-01' },
      { id: 'att-extra', fileName: 'notes.pdf', mimeType: 'application/pdf', createdAt: '2026-01-01' },
    ]
    const filtered = nonApprovalMessageAttachments(attachments, [items[0]!])
    expect(filtered.map((attachment) => attachment.id)).toEqual(['att-extra'])
  })
})
