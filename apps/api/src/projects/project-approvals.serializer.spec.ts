import {
  serializeApprovalComment,
  serializeApprovalItem,
} from './project-approvals.serializer'
import { CLIENT_OPEN_APPROVAL_STATUSES } from './project-approvals.service'
import { ProjectApprovalItemStatus } from '@cocreate/database'

describe('project-approvals.serializer', () => {
  it('serializes approval items with file metadata', () => {
    const sentAt = new Date('2026-06-20T10:00:00.000Z')
    const item = serializeApprovalItem(
      {
        id: 'item-1',
        projectId: 'proj-1',
        requestId: 'req-1',
        attachmentId: 'att-1',
        title: 'Poster review',
        note: 'Please review colors',
        status: 'PENDING',
        revisionNumber: 1,
        sentByUserId: 'admin-1',
        sentAt,
        decidedAt: null,
        decidedByUserId: null,
        createdAt: sentAt,
        updatedAt: sentAt,
        attachment: {
          id: 'att-1',
          projectId: 'proj-1',
          requestId: 'req-1',
          storagePath: 'secret/poster.png',
          fileName: 'poster.png',
          mimeType: 'image/png',
          sizeBytes: 100,
          visibility: 'CLIENT',
          uploadedByUserId: 'admin-1',
          createdAt: sentAt,
        },
        project: { id: 'proj-1', title: 'Launch site', organizationId: 'org-1' },
        request: { id: 'req-1', title: 'Progress updates' },
      },
      { omitStoragePath: true },
    )

    expect(item.id).toBe('item-1')
    expect(item.fileName).toBe('poster.png')
    expect(item.status).toBe('PENDING')
    expect(item.projectTitle).toBe('Launch site')
    expect(item.attachment).not.toHaveProperty('storagePath')
  })

  it('serializes approval comments with author display name', () => {
    const comment = serializeApprovalComment({
      id: 'comment-1',
      approvalItemId: 'item-1',
      authorUserId: 'client-1',
      authorRole: 'CLIENT',
      body: 'Please adjust the headline',
      createdAt: new Date('2026-06-20T11:00:00.000Z'),
      author: {
        id: 'client-1',
        email: 'client@example.com',
        profile: { displayName: 'Alex Client', jobTitle: null, avatarStoragePath: null },
      },
      attachmentLinks: [],
    })

    expect(comment.authorDisplayName).toBe('Alex Client')
    expect(comment.body).toBe('Please adjust the headline')
  })

  it('serializes approval items with nested comments when requested', () => {
    const sentAt = new Date('2026-06-20T10:00:00.000Z')
    const item = serializeApprovalItem(
      {
        id: 'item-1',
        projectId: 'proj-1',
        requestId: 'req-1',
        attachmentId: 'att-1',
        title: 'Poster review',
        note: null,
        status: 'NEEDS_CHANGES',
        revisionNumber: 1,
        sentByUserId: 'admin-1',
        sentAt,
        sentMessageId: 'msg-1',
        decidedAt: sentAt,
        decidedByUserId: 'client-1',
        createdAt: sentAt,
        updatedAt: sentAt,
        attachment: {
          id: 'att-1',
          projectId: 'proj-1',
          requestId: 'req-1',
          storagePath: 'secret/poster.png',
          fileName: 'poster.png',
          mimeType: 'image/png',
          sizeBytes: 100,
          visibility: 'CLIENT',
          uploadedByUserId: 'admin-1',
          createdAt: sentAt,
        },
        project: { id: 'proj-1', title: 'Launch site', organizationId: 'org-1' },
        request: { id: 'req-1', title: 'Progress updates' },
        comments: [
          {
            id: 'comment-1',
            approvalItemId: 'item-1',
            authorUserId: 'client-1',
            authorRole: 'CLIENT',
            body: 'Please adjust the headline',
            createdAt: new Date('2026-06-20T11:00:00.000Z'),
            author: {
              id: 'client-1',
              email: 'client@example.com',
              profile: { displayName: 'Alex Client', jobTitle: null, avatarStoragePath: null },
            },
            attachmentLinks: [],
          },
        ],
      },
      { omitStoragePath: true, includeComments: true },
    )

    expect(item).toHaveProperty('comments')
    expect((item as { comments: Array<{ body: string }> }).comments).toHaveLength(1)
    expect((item as { comments: Array<{ body: string }> }).comments[0]?.body).toBe(
      'Please adjust the headline',
    )
  })

  it('defines client open approvals as PENDING and NEEDS_CHANGES only', () => {
    expect(CLIENT_OPEN_APPROVAL_STATUSES).toEqual([
      ProjectApprovalItemStatus.PENDING,
      ProjectApprovalItemStatus.NEEDS_CHANGES,
    ])
    expect(CLIENT_OPEN_APPROVAL_STATUSES).not.toContain(ProjectApprovalItemStatus.APPROVED)
  })
})
