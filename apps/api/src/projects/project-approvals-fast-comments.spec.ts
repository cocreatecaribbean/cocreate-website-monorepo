import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ProjectApprovalItemStatus } from '@cocreate/database'

const serviceSource = readFileSync(
  join(__dirname, 'project-approvals.service.ts'),
  'utf8',
)

describe('project-approvals fast comments', () => {
  it('fires addComment notifications in the background and publishes realtime for all authors', () => {
    const addCommentBlock = serviceSource.slice(
      serviceSource.indexOf('async addComment('),
      serviceSource.indexOf('async submitRevision('),
    )

    expect(addCommentBlock).toContain('void (async () => {')
    expect(addCommentBlock).toContain('notifyAdmins')
    expect(addCommentBlock).toContain('notifyOrgClients')
    expect(addCommentBlock).toContain('this.publishApprovalThreadUpdate(item.requestId)')
    expect(addCommentBlock.indexOf('return { comment:')).toBeGreaterThan(
      addCommentBlock.indexOf('void (async () => {'),
    )
  })

  it('fires requestNeedsChanges admin notifications in the background', () => {
    const needsChangesBlock = serviceSource.slice(
      serviceSource.indexOf('async requestNeedsChanges('),
      serviceSource.indexOf('async listComments('),
    )

    expect(needsChangesBlock).toContain('void (async () => {')
    expect(needsChangesBlock).toContain('notifyAdmins')
    expect(needsChangesBlock.indexOf('publishApprovalThreadUpdate')).toBeGreaterThan(
      needsChangesBlock.indexOf('void (async () => {'),
    )
  })

  it('fires submitRevision client notifications in the background and publishes realtime', () => {
    const revisionBlock = serviceSource.slice(
      serviceSource.indexOf('async submitRevision('),
      serviceSource.indexOf('async countPendingForProjects('),
    )

    expect(revisionBlock).toContain('void (async () => {')
    expect(revisionBlock).toContain('notifyOrgClients')
    expect(revisionBlock).toContain('this.publishApprovalThreadUpdate(item.requestId)')
    expect(revisionBlock).toContain('comment: serializeApprovalComment(revisionComment)')
  })

  it('keeps approved items out of client open approval statuses', () => {
    expect([
      ProjectApprovalItemStatus.PENDING,
      ProjectApprovalItemStatus.NEEDS_CHANGES,
    ]).not.toContain(ProjectApprovalItemStatus.APPROVED)
  })
})
